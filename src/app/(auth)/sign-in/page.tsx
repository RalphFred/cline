import { ArrowRight, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { signInAction } from "@/app/(auth)/sign-in/actions"
import { getCurrentAppwriteAccount } from "@/lib/appwrite/session"
import { Badge } from "@/components/ui/badge"
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
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="space-y-8">
          <div className="space-y-5">
            <Badge className="bg-primary text-primary-foreground hover:bg-primary">
              Appwrite session shell
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
                Sign in to keep the approval flow moving.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                This foundation uses Appwrite email sessions and a server-set
                cookie so the admin and mobile shells can be protected before we
                layer in organization membership and role routing.
              </p>
            </div>
          </div>

          <Card className="border-border bg-card shadow-none">
            <CardHeader>
              <CardTitle>What is ready</CardTitle>
              <CardDescription>
                Enough auth groundwork to support the next onboarding and role
                work cleanly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 text-success" />
                <span>Server-set Appwrite session cookie</span>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 text-success" />
                <span>Server-side auth guard on admin and mobile shells</span>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 text-success" />
                <span>Safe handoff into the next onboarding phase</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Use an Appwrite email/password account for this project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {params.signed_out ? (
              <div className="rounded-lg border border-border bg-soft px-4 py-3 text-sm text-foreground">
                Signed out successfully.
              </div>
            ) : null}

            {params.error ? (
              <div className="rounded-lg border border-[color:var(--color-critical)]/15 bg-[color:var(--color-critical)]/5 px-4 py-3 text-sm text-[color:var(--color-critical)]">
                {errorCopy[params.error] ?? "Unable to complete sign-in."}
              </div>
            ) : null}

            <form action={signInAction} className="space-y-4">
              <input name="next" type="hidden" value={nextPath} />

              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  autoComplete="email"
                  id="email"
                  name="email"
                  placeholder="finance@expresstravels.ng"
                  required
                  type="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  autoComplete="current-password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  required
                  type="password"
                />
              </div>

              <Button className="w-full gap-2">
                Continue
                <ArrowRight className="size-4" />
              </Button>
            </form>

            <div className="text-sm text-muted-foreground">
              Need a starting point first?{" "}
              <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/">
                Back to the project shell
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
