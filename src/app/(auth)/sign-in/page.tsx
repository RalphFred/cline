import {
  ArrowRight,
  PackageCheck,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import {
  demoRoleSignInAction,
  signInAction,
} from "@/app/(auth)/sign-in/actions"
import { SignInFeedbackToast } from "@/app/(auth)/sign-in/sign-in-feedback-toast"
import { getCurrentAppwriteAccount } from "@/lib/appwrite/session"
import { demoAccounts } from "@/lib/demo/accounts"
import type { Role } from "@/lib/permissions/roles"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const errorCopy: Record<string, string> = {
  invalid_form: "Enter a valid work email and password to continue.",
  invalid_credentials: "We could not sign you in with those credentials.",
  session_secret_missing: "Appwrite returned a session without a secret.",
  demo_sign_in_failed: "We could not start that demo session.",
}

const demoRoleIcons: Record<Role, typeof ShieldCheck> = {
  super_admin: ShieldCheck,
  sales_operator: PackageCheck,
  field_employee: UserRoundCheck,
}

type SignInPageProps = {
  searchParams: Promise<{
    error?: string
    next?: string
    signed_out?: string
  }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const [account, params] = await Promise.all([
    getCurrentAppwriteAccount(),
    searchParams,
  ])

  const nextPath = params.next?.startsWith("/") ? params.next : "/admin"

  if (account) {
    redirect(nextPath)
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top,var(--color-soft),transparent_42%),var(--color-background)] px-4 py-8 text-foreground sm:px-6">
      <SignInFeedbackToast
        errorMessage={
          params.error
            ? errorCopy[params.error] ?? "Unable to complete sign-in."
            : undefined
        }
        signedOut={Boolean(params.signed_out)}
      />
      <Card className="w-full max-w-[520px] border-border bg-card/95 shadow-[0_28px_90px_-54px_rgba(15,107,143,0.55)] backdrop-blur">
        <CardHeader className="space-y-2 px-6 pb-5 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_14px_30px_-20px_rgba(15,107,143,0.9)]">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <CardTitle className="text-[1.75rem] leading-tight">
                Sign in to Cline
              </CardTitle>
              <CardDescription className="mt-1">
                Choose a role or use email.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-6 pb-6">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {demoAccounts.map((account) => {
                const Icon = demoRoleIcons[account.role]

                return (
                  <form action={demoRoleSignInAction} key={account.role}>
                    <input name="role" type="hidden" value={account.role} />
                    <Button
                      className="h-16 w-full justify-start rounded-xl border-border bg-background px-4 text-left text-base text-foreground shadow-none hover:border-primary/50 hover:bg-soft"
                      type="submit"
                      variant="outline"
                    >
                      <span className="flex w-full items-center gap-3">
                        <span className="rounded-xl bg-soft p-2.5 text-primary">
                          <Icon className="size-5" />
                        </span>
                        <span className="font-semibold">{account.label}</span>
                      </span>
                    </Button>
                  </form>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            Or
            <div className="h-px flex-1 bg-border" />
          </div>

          <form action={signInAction} className="space-y-5">
            <input name="next" type="hidden" value={nextPath} />

            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                autoComplete="email"
                className="h-12 rounded-xl bg-background px-4 text-base md:text-base"
                id="email"
                name="email"
                placeholder="name@company.ng"
                required
                type="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                autoComplete="current-password"
                className="h-12 rounded-xl bg-background px-4 text-base md:text-base"
                id="password"
                name="password"
                placeholder="Enter your password"
                required
                type="password"
              />
            </div>

            <Button className="h-12 w-full gap-2 rounded-xl text-base font-semibold">
              Continue
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <Link
              className="font-medium text-primary underline-offset-4 hover:underline"
              href="/"
            >
              Back to the project shell
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
