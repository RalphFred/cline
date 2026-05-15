import "server-only"

import { redirect } from "next/navigation"

import { getCurrentAppwriteAccount } from "@/lib/appwrite/session"
import { ensureDemoWorkspace } from "@/lib/demo/server"
import { demoWorkspace } from "@/lib/demo/workspace"
import { getStaticAdminVirtualAccount } from "@/lib/squad/virtual-accounts"

export async function getSuperAdminWorkspace(nextPath = "/admin") {
  const account = await getCurrentAppwriteAccount()

  if (!account) {
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`)
  }

  const workspace = await ensureDemoWorkspace(account)

  if (workspace.memberRole !== "super_admin") {
    redirect(
      workspace.memberRole === "sales_operator"
        ? "/sales"
        : "/mobile?role=field_employee",
    )
  }

  const staticVirtualAccount = await getStaticAdminVirtualAccount({
    organizationId: workspace.organizationId,
    businessName: demoWorkspace.organizationName,
  })

  return { account, workspace, staticVirtualAccount }
}
