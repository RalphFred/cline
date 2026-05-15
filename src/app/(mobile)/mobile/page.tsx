import { Boxes, FilePlus2, Home, ReceiptText, UserRound } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { signOutAction } from "@/app/(auth)/sign-in/actions"
import { FieldEmployeeMobileFlow } from "@/components/features/field/field-employee-mobile-flow"
import { getCurrentAppwriteAccount } from "@/lib/appwrite/session"
import { getRoleFromSearchParam } from "@/lib/demo/roles"
import { demoWorkspace, mobileRoleConfigs } from "@/lib/demo/workspace"
import {
  ensureDemoWorkspace,
} from "@/lib/demo/server"
import { listPaymentRequestSummaries } from "@/lib/payments/service"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const navItems = [
  { label: "Home", icon: Home },
  { label: "Action", icon: FilePlus2 },
  { label: "Queue", icon: ReceiptText },
  { label: "Profile", icon: UserRound },
] as const

type MobileShellPageProps = {
  searchParams: Promise<{
    role?: string
  }>
}

export default async function MobileShellPage({
  searchParams,
}: MobileShellPageProps) {
  const account = await getCurrentAppwriteAccount()
  const params = await searchParams

  if (!account) {
    redirect("/sign-in?next=/mobile")
  }

  const role = getRoleFromSearchParam(params.role)
  const config = mobileRoleConfigs[role]
  const primaryActionHref =
    role === "sales_operator" ? "/sales" : undefined

  if (role === "field_employee") {
    const workspace = await ensureDemoWorkspace(account)
    const requests = await listPaymentRequestSummaries({
      organizationId: workspace.organizationId,
      submittedByMemberId: workspace.memberId,
    })

    return (
      <FieldEmployeeMobileFlow
        accountEmail={account.email}
        accountName={account.name || account.email}
        initialRequests={requests}
        organizationName={demoWorkspace.organizationName}
      />
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-sm flex-col">
        <div className="flex-1 space-y-4 pb-24">
          <div>
            <Badge className="bg-primary text-primary-foreground hover:bg-primary">
              {config.badge}
            </Badge>
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              {demoWorkspace.organizationName}
            </p>
            <h1 className="mt-1 text-2xl font-bold">{config.title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {config.description}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Signed in as {account.name || account.email}
            </p>
          </div>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>{config.primaryAction}</CardTitle>
              <CardDescription>
                This mobile shell stays narrow on purpose so the role-specific
                workflow is fast to scan and easy to demo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {primaryActionHref ? (
                <Link className={buttonVariants({ className: "w-full" })} href={primaryActionHref}>
                  {config.primaryAction}
                </Link>
              ) : (
                <Button className="w-full">{config.primaryAction}</Button>
              )}
            </CardContent>
          </Card>

          {role === "sales_operator" ? (
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Inventory control</CardTitle>
                <CardDescription>
                  Add items, edit prices, and restock shelves before opening
                  the sales counter.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  className={buttonVariants({
                    className: "w-full",
                    variant: "outline",
                  })}
                  href="/sales/inventory"
                >
                  <Boxes className="size-4" />
                  Manage inventory
                </Link>
              </CardContent>
            </Card>
          ) : null}

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>{config.taskTitle}</CardTitle>
              <CardDescription>{config.taskDescription}</CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>{config.recentTitle}</CardTitle>
              <CardDescription>
                Seeded demo states keep each mobile role grounded in a single
                operational lane.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {config.recentItems.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-border bg-background px-4 py-3 leading-6"
                >
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Link className={buttonVariants({ variant: "outline" })} href="/">
              Project shell
            </Link>
            <form action={signOutAction}>
              <Button className="w-full" type="submit" variant="outline">
                Sign out
              </Button>
            </form>
          </div>
        </div>

        <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto grid max-w-sm grid-cols-4 gap-2">
            {navItems.map(({ label, icon: Icon }, index) => (
              <button
                key={label}
                className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-xs font-medium ${
                  index === 0 ? "bg-soft text-primary" : "text-muted-foreground"
                }`}
                type="button"
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </main>
  )
}
