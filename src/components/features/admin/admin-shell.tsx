import type { ReactNode } from "react"
import {
  Activity,
  BanknoteArrowDown,
  ClipboardCheck,
  Home,
  LayoutDashboard,
  LogOut,
  ShoppingCart,
} from "lucide-react"
import Link from "next/link"

import { signOutAction } from "@/app/(auth)/sign-in/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { demoWorkspace } from "@/lib/demo/workspace"
import type { StaticVirtualAccount } from "@/lib/squad/virtual-accounts"
import { cn } from "@/lib/utils"

type AdminNavKey = "overview" | "money-in" | "approvals" | "activity"

const primaryNav = [
  {
    key: "overview",
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    key: "money-in",
    label: "Money in",
    href: "/admin/money-in",
    icon: BanknoteArrowDown,
  },
  {
    key: "approvals",
    label: "Approvals",
    href: "/admin/approvals",
    icon: ClipboardCheck,
  },
  {
    key: "activity",
    label: "Activity",
    href: "/admin/activity",
    icon: Activity,
  },
] satisfies Array<{
  key: AdminNavKey
  label: string
  href: string
  icon: typeof LayoutDashboard
}>

const secondaryNav = [
  {
    label: "Sales workspace",
    href: "/sales",
    icon: ShoppingCart,
  },
  {
    label: "Project shell",
    href: "/",
    icon: Home,
  },
] as const

export function AdminShell({
  active,
  accountLabel,
  staticVirtualAccount,
  children,
}: {
  active: AdminNavKey
  accountLabel: string
  staticVirtualAccount?: StaticVirtualAccount
  children: ReactNode
}) {
  return (
    <main className="h-screen min-w-[1180px] overflow-hidden bg-background">
      <div className="grid h-screen grid-cols-[264px_minmax(0,1fr)]">
        <aside className="sticky top-0 flex h-screen flex-col border-r border-border bg-card px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LayoutDashboard className="size-5" />
            </div>
            <div>
              <div className="font-heading text-lg font-semibold">Cline</div>
              <div className="text-xs text-muted-foreground">
                {demoWorkspace.organizationName}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-border bg-background px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <Badge variant="secondary">Super Admin</Badge>
              {staticVirtualAccount ? (
                <Badge
                  className={cn(
                    staticVirtualAccount.mode === "live"
                      ? "bg-success text-white hover:bg-success"
                      : "bg-warning text-white hover:bg-warning",
                  )}
                >
                  {staticVirtualAccount.mode}
                </Badge>
              ) : null}
            </div>
            <div className="mt-2 truncate text-sm text-muted-foreground">
              {accountLabel}
            </div>
            {staticVirtualAccount ? (
              <div className="mt-4 rounded-lg border border-border bg-card px-3 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Cline account
                </div>
                <div className="mt-2 text-sm font-medium">
                  {staticVirtualAccount.bankName}
                </div>
                <div className="mt-1 font-mono text-xl font-semibold">
                  {staticVirtualAccount.accountNumber}
                </div>
                <div className="mt-1 truncate text-xs text-muted-foreground">
                  {staticVirtualAccount.accountName}
                </div>
              </div>
            ) : null}
          </div>

          <nav className="mt-6 grid gap-1 text-sm">
            {primaryNav.map((item) => {
              const Icon = item.icon
              const isActive = item.key === active

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition",
                    isActive
                      ? "bg-secondary font-medium text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                  href={item.href}
                  key={item.key}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-6 border-t border-border pt-5">
            <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Workspaces
            </div>
            <nav className="grid gap-1 text-sm">
              {secondaryNav.map((item) => {
                const Icon = item.icon

                return (
                  <Link
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                    href={item.href}
                    key={item.href}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <form action={signOutAction} className="mt-auto">
            <Button className="w-full justify-start" type="submit" variant="outline">
              <LogOut data-icon="inline-start" />
              Sign out
            </Button>
          </form>
        </aside>

        <section className="h-screen min-w-0 overflow-y-auto px-6 py-5">
          {children}
        </section>
      </div>
    </main>
  )
}
