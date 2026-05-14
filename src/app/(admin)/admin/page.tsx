import { AlertTriangle, Brain, Clock, LogOut, Wallet } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { signOutAction } from "@/app/(auth)/sign-in/actions"
import { getCurrentAppwriteAccount } from "@/lib/appwrite/session"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const queuePreview = [
  {
    title: "Mainland Motors vehicle invoice",
    department: "Procurement",
    amount: "₦8,500,000",
    score: "58/100",
    level: "High concern",
  },
  {
    title: "Fuel request for Lagos-Ibadan route",
    department: "Logistics",
    amount: "₦30,000",
    score: "82/100",
    level: "Low concern",
  },
]

const stats = [
  { label: "Pending", value: "12", icon: Clock },
  { label: "Month spend", value: "₦4.8m", icon: Wallet },
  { label: "Critical alerts", value: "3", icon: AlertTriangle },
  { label: "Frank notes", value: "7", icon: Brain },
]

export default async function AdminPage() {
  const account = await getCurrentAppwriteAccount()

  if (!account) {
    redirect("/sign-in?next=/admin")
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge className="bg-primary text-primary-foreground hover:bg-primary">
              Super Admin
            </Badge>
            <h1 className="mt-4 text-3xl font-bold">Approval dashboard</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              This shell will become the desktop-first command center for
              pending approvals, Frank, wallet health, and budget tracking.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Signed in as {account.name || account.email}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
              <span className="text-muted-foreground">Wallet balance</span>
              <div className="mt-1 font-mono text-xl font-semibold">
                ₦12,450,000
              </div>
            </div>
            <div className="flex gap-2">
              <Link className={buttonVariants({ variant: "outline" })} href="/">
                Project shell
              </Link>
              <form action={signOutAction}>
                <Button className="gap-2" type="submit" variant="outline">
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-mono text-2xl font-semibold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Pending approvals</CardTitle>
              <CardDescription>
                Rows will link to the request detail page before any money can
                move.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {queuePreview.map((item, index) => (
                <div key={item.title}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-semibold">{item.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        {item.department} · {item.amount}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.score}</Badge>
                      <Badge className="bg-warning text-white hover:bg-warning">
                        {item.level}
                      </Badge>
                    </div>
                  </div>
                  {index < queuePreview.length - 1 ? (
                    <Separator className="mt-5" />
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Frank</CardTitle>
              <CardDescription>
                Read-only AI CFO assistant and alert feed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-soft p-4 text-sm leading-6">
                Logistics is projected to cross 90% of its monthly budget before
                the 20th if the pending fuel request is approved.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
