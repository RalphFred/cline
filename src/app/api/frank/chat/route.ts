import { NextResponse } from "next/server"
import { z } from "zod"

import { getCurrentAppwriteAccount } from "@/lib/appwrite/session"
import { ensureDemoWorkspace } from "@/lib/demo/server"
import { answerFrankQuestion } from "@/lib/frank/service"

export const runtime = "nodejs"

const frankChatRequestSchema = z.object({
  question: z.string().trim().min(1).max(700),
  threadId: z.string().trim().min(1).max(80).optional(),
})

export async function POST(request: Request) {
  const account = await getCurrentAppwriteAccount()

  if (!account) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: z.infer<typeof frankChatRequestSchema>

  try {
    payload = frankChatRequestSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: "Invalid Frank question." }, { status: 400 })
  }

  const workspace = await ensureDemoWorkspace(account)

  if (workspace.memberRole !== "super_admin") {
    return NextResponse.json(
      { error: "Frank is only available to Super Admin in this demo." },
      { status: 403 },
    )
  }

  try {
    const response = await answerFrankQuestion({
      organizationId: workspace.organizationId,
      userProfileId: workspace.userProfileId,
      question: payload.question,
      threadId: payload.threadId,
    })

    return NextResponse.json(response)
  } catch {
    return NextResponse.json(
      { error: "Frank could not answer that question yet." },
      { status: 500 },
    )
  }
}
