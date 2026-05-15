import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  CircleAlert,
  Package2,
  ShieldCheck,
} from "lucide-react"

import { signOutAction } from "@/app/(auth)/sign-in/actions"
import { getCurrentAppwriteAccount } from "@/lib/appwrite/session"
import {
  demoFlows,
  demoSetupItems,
  demoWorkspace,
} from "@/lib/demo/workspace"
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

const nextMilestones = [
  {
    icon: ShieldCheck,
    title: "Role-aware shells",
    description: "Admin and mobile surfaces now map to the four demo roles.",
  },
  {
    icon: Package2,
    title: "Inventory and sales",
    description: "Inventory-backed sales and expected money-in are the next build spine.",
  },
  {
    icon: Brain,
    title: "Reconciliation and Frank",
    description: "Flagged records, rules, and finance Q&A will build on the live Appwrite schema.",
  },
] as const

export default async function Home() {
  const account = await getCurrentAppwriteAccount()

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-8">
            <div className="space-y-5">
              <Badge className="bg-brand text-white hover:bg-brand">
                Demo-first finance OS
              </Badge>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
                  Every naira in is traceable. Every naira out is controlled.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  {demoWorkspace.organizationName} is the live demo workspace for
                  Cline&apos;s finance operating system: sales create expected
                  revenue, Squad confirms or questions money-in, outgoing
                  requests wait for human approval, and Frank explains what
                  needs attention.
                </p>
              </div>
            </div>

            <Card className="border-border bg-card shadow-none">
              <CardHeader>
                <CardTitle>What is ready</CardTitle>
                <CardDescription>
                  The foundation is now aligned to the new finance operating
                  system story instead of the older spend-only shape.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {demoSetupItems.map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm">
                    <span className="flex size-6 items-center justify-center rounded-full bg-success/10 text-success">
                      <BadgeCheck className="size-4" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                className={buttonVariants({
                  className: "gap-2",
                })}
                href={account ? "/admin" : "/sign-in"}
              >
                {account ? "Open admin command center" : "Sign in to continue"}
                <ArrowRight className="size-4" />
              </Link>

              <Link
                className={buttonVariants({
                  variant: "outline",
                  className: "gap-2",
                })}
                href={
                  account
                    ? "/sales"
                    : "/sign-in?next=/sales"
                }
              >
                Open sales overview
              </Link>

              {account ? (
                <form action={signOutAction}>
                  <Button type="submit" variant="outline">
                    Sign out
                  </Button>
                </form>
              ) : null}
            </div>
          </div>

          <Card className="border-border bg-card shadow-none">
            <CardHeader>
              <CardTitle>Locked demo flows</CardTitle>
              <CardDescription>
                The shell now points directly at the six stories this demo must
                prove.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {demoFlows.map((flow, index) => (
                <div key={flow.slug}>
                  <div className="flex gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-soft text-primary">
                      <CircleAlert className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-base font-semibold">{flow.title}</h2>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {flow.summary}
                      </p>
                    </div>
                  </div>
                  {index < demoFlows.length - 1 ? (
                    <Separator className="mt-5" />
                  ) : null}
                </div>
              ))}

              <Separator />

              {nextMilestones.map((milestone) => (
                <div key={milestone.title} className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-soft text-primary">
                    <milestone.icon className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-base font-semibold">
                      {milestone.title}
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
