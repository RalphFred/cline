import { getAppwriteIds } from "@/lib/appwrite/ids"
import {
  financeOsCollections,
  type AppwriteAttributeDefinition,
  type AppwriteCollectionDefinition,
  type AppwriteCollectionKey,
  type AppwriteIndexDefinition,
} from "@/lib/appwrite/schema"
import { getServerEnv } from "@/lib/env"

type SyncOptions = {
  includeIndexes?: boolean
  includeRelationships?: boolean
}

type AppwriteHttpError = Error & {
  code: number
  responseText: string
}

export async function syncAppwriteSchema(options: SyncOptions = {}) {
  const env = getServerEnv()
  const ids = getAppwriteIds()
  const includeIndexes = options.includeIndexes ?? true
  const includeRelationships = options.includeRelationships ?? true

  if (!env.APPWRITE_API_KEY) {
    throw new Error("APPWRITE_API_KEY is required for schema sync.")
  }

  const appwriteRequest = createAppwriteRequester({
    apiKey: env.APPWRITE_API_KEY,
    endpoint: env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    projectId: env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  })

  await createBucketIfMissing(appwriteRequest, ids.buckets.requestEvidence, {
    name: "Request Evidence",
    maximumFileSize: 10 * 1024 * 1024,
  })
  await createBucketIfMissing(appwriteRequest, ids.buckets.orgDocuments, {
    name: "Organization Documents",
    maximumFileSize: 10 * 1024 * 1024,
  })
  await createBucketIfMissing(appwriteRequest, ids.buckets.trainingArtifacts, {
    name: "Training Artifacts",
    maximumFileSize: 25 * 1024 * 1024,
  })

  for (const collection of financeOsCollections) {
    const collectionId = ids.collections[collection.key]

    await createCollectionIfMissing(
      appwriteRequest,
      ids.databaseId,
      collection,
      collectionId,
    )
  }

  for (const collection of financeOsCollections) {
    const collectionId = ids.collections[collection.key]

    for (const attribute of collection.attributes) {
      if (attribute.type === "relationship" && !includeRelationships) {
        continue
      }

      await createAttributeIfMissing(
        appwriteRequest,
        ids.databaseId,
        collectionId,
        attribute,
      )
    }
  }

  if (!includeIndexes) {
    return
  }

  for (const collection of financeOsCollections) {
    const collectionId = ids.collections[collection.key]
    const relationshipAttributeKeys = new Set(
      collection.attributes
        .filter((attribute) => attribute.type === "relationship")
        .map((attribute) => attribute.key),
    )

    for (const index of collection.indexes ?? []) {
      if (index.attributes.some((attribute) => relationshipAttributeKeys.has(attribute))) {
        continue
      }

      await createIndexIfMissing(
        appwriteRequest,
        ids.databaseId,
        collectionId,
        index,
      )
    }
  }
}

async function createBucketIfMissing(
  appwriteRequest: AppwriteRequester,
  bucketId: string,
  options: {
    name: string
    maximumFileSize: number
  },
) {
  await callIgnoringAlreadyExists("create bucket", async () => {
    await appwriteRequest("/storage/buckets", {
      bucketId,
      name: options.name,
      permissions: [],
      fileSecurity: false,
      enabled: true,
      maximumFileSize: options.maximumFileSize,
      allowedFileExtensions: [],
      compression: "none",
      encryption: true,
      antivirus: true,
    })
  })
}

type AppwriteRequester = ReturnType<typeof createAppwriteRequester>

function createAppwriteRequester(config: {
  apiKey: string
  endpoint: string
  projectId: string
}) {
  const normalizedEndpoint = config.endpoint.endsWith("/")
    ? config.endpoint
    : `${config.endpoint}/`

  return async function appwriteRequest(
    path: string,
    body?: Record<string, unknown>,
    method: "POST" | "GET" = "POST",
  ) {
    const normalizedPath = path.startsWith("/") ? path.slice(1) : path

    const response = await fetch(new URL(normalizedPath, normalizedEndpoint), {
      method,
      headers: {
        "content-type": "application/json",
        "x-appwrite-project": config.projectId,
        "x-appwrite-key": config.apiKey,
        "x-appwrite-response-format": "1.9.2",
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (response.ok) {
      return response.status === 204 ? null : await response.json()
    }

    const responseText = await response.text()
    const error = new Error(`Appwrite request failed with status ${response.status}.`) as AppwriteHttpError
    error.code = response.status
    error.responseText = responseText
    throw error
  }
}

async function createCollectionIfMissing(
  appwriteRequest: AppwriteRequester,
  databaseId: string,
  definition: AppwriteCollectionDefinition,
  collectionId: string,
) {
  await callIgnoringAlreadyExists("create collection", async () => {
    await appwriteRequest(`/databases/${databaseId}/collections`, {
      collectionId,
      name: definition.name,
      documentSecurity: definition.documentSecurity ?? true,
    })
  })
}

async function createAttributeIfMissing(
  appwriteRequest: AppwriteRequester,
  databaseId: string,
  collectionId: string,
  attribute: AppwriteAttributeDefinition,
) {
  const basePath = `/databases/${databaseId}/collections/${collectionId}/attributes`
  const collectionDetails = await getCollectionDetails(
    appwriteRequest,
    databaseId,
    collectionId,
  )

  if (collectionDetails.attributes.some((existingAttribute) => existingAttribute.key === attribute.key)) {
    return
  }

  await callIgnoringAlreadyExists(`create attribute ${attribute.key}`, async () => {
    if (attribute.type === "relationship") {
      const ids = getAppwriteIds()

      await appwriteRequest(`${basePath}/relationship`, {
        relatedCollectionId: ids.collections[attribute.relatedCollection],
        type: attribute.relationType,
        twoWay: attribute.twoWay ?? false,
        key: attribute.key,
        twoWayKey: attribute.twoWay ? attribute.twoWayKey : undefined,
        onDelete: attribute.onDelete ?? "restrict",
      })

      return
    }

    await appwriteRequest(
      `${basePath}/${attribute.type}`,
      buildAttributePayload(attribute),
    )
  })
}

async function createIndexIfMissing(
  appwriteRequest: AppwriteRequester,
  databaseId: string,
  collectionId: string,
  index: AppwriteIndexDefinition,
) {
  const collectionDetails = await getCollectionDetails(
    appwriteRequest,
    databaseId,
    collectionId,
  )

  if (collectionDetails.indexes.some((existingIndex) => existingIndex.key === index.key)) {
    return
  }

  await callIgnoringAlreadyExists(`create index ${index.key}`, async () => {
    await appwriteRequest(`/databases/${databaseId}/collections/${collectionId}/indexes`, {
      key: index.key,
      type: index.type,
      attributes: index.attributes,
      orders: index.orders,
    })
  })
}

async function getCollectionDetails(
  appwriteRequest: AppwriteRequester,
  databaseId: string,
  collectionId: string,
) {
  const response = await appwriteRequest(
    `/databases/${databaseId}/collections/${collectionId}`,
    undefined,
    "GET",
  )

  return response as {
    attributes: Array<{ key: string }>
    indexes: Array<{ key: string }>
  }
}

function buildAttributePayload(
  attribute: Exclude<AppwriteAttributeDefinition, { type: "relationship" }>,
) {
  const defaultValue =
    attribute.required && "default" in attribute ? undefined : attribute.default

  switch (attribute.type) {
    case "string":
      return {
        key: attribute.key,
        size: attribute.size,
        required: attribute.required ?? false,
        default: defaultValue,
        array: attribute.array ?? false,
      }
    case "integer":
    case "float":
      return {
        key: attribute.key,
        required: attribute.required ?? false,
        min: attribute.min,
        max: attribute.max,
        default: defaultValue,
        array: attribute.array ?? false,
      }
    case "boolean":
      return {
        key: attribute.key,
        required: attribute.required ?? false,
        default: defaultValue,
        array: attribute.array ?? false,
      }
    case "datetime":
    case "email":
    case "url":
      return {
        key: attribute.key,
        required: attribute.required ?? false,
        default: defaultValue,
        array: attribute.array ?? false,
      }
    case "enum":
      return {
        key: attribute.key,
        required: attribute.required ?? false,
        default: defaultValue,
        array: attribute.array ?? false,
        elements: [...attribute.elements],
      }
  }
}

async function callIgnoringAlreadyExists(
  label: string,
  operation: () => Promise<void>,
) {
  try {
    await operation()
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      return
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unknown Appwrite schema sync error."

    throw new Error(`Appwrite schema sync failed while trying to ${label}: ${message}`, {
      cause: error,
    })
  }
}

function isAlreadyExistsError(error: unknown) {
  if (!isAppwriteHttpError(error)) {
    return false
  }

  const message = error.responseText.toLowerCase()

  return (
    error.code === 409 ||
    message.includes("already exists") ||
    message.includes("duplicate")
  )
}

function isAppwriteHttpError(error: unknown): error is AppwriteHttpError {
  return (
    error instanceof Error &&
    typeof (error as AppwriteHttpError).code === "number" &&
    typeof (error as AppwriteHttpError).responseText === "string"
  )
}

export function getResolvedCollectionId(collection: AppwriteCollectionKey) {
  return getAppwriteIds().collections[collection]
}
