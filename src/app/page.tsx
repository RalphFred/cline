import Link from "next/link"
import { ArrowRight, BadgeCheck, ShieldCheck, WalletCards } from "lucide-react"

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

const setupItems = [
  "Next.js App Router with TypeScript",
  "Tailwind tokens wired to the Cline UI context",
  "shadcn/ui baseline components installed",
  "Lucide icons and app-level providers ready",
]

const nextMilestones = [
  {
    icon: ShieldCheck,
    title: "Auth and organization shell",
    description: "Appwrite session helpers, role-aware routes, and onboarding.",
  },
  {
    icon: WalletCards,
    title: "Wallet and request foundation",
    description: "Departments, budgets, request records, uploads, and ledger shape.",
  },
  {
    icon: BadgeCheck,
    title: "Verification pipeline",
    description: "Squad lookup, Gemini extraction, and deterministic Trust Score.",
  },
]

export default async function Home() {
  const account = await getCurrentAppwriteAccount()

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-8">
            <div className="space-y-5">
              <Badge className="bg-brand text-white hover:bg-brand">
                Cline setup
              </Badge>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
                  Spend authorization before money leaves the business.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  The foundation is ready for the Nigerian SME approval flow:
                  evidence, explainable verification, admin decision, Squad
                  transfer, and audit trail.
                </p>
              </div>
            </div>

            <Card className="border-border bg-card shadow-none">
              <CardHeader>
                <CardTitle>Initial scaffold</CardTitle>
                <CardDescription>
                  Basic app setup is in place. Product implementation starts
                  from the context specs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {setupItems.map((item) => (
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
                {account ? "Continue to app shell" : "Sign in to continue"}
                <ArrowRight className="size-4" />
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
              <CardTitle>Next build phases</CardTitle>
              <CardDescription>
                The first usable milestone is auth, org setup, and role shells.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {nextMilestones.map((milestone, index) => (
                <div key={milestone.title}>
                  <div className="flex gap-4">
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
                  {index < nextMilestones.length - 1 ? (
                    <Separator className="mt-5" />
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
