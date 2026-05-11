import { Account, Client, Databases } from "appwrite"

const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("cline")

const account = new Account(client)
const databases = new Databases(client)

export { account, client, databases }
