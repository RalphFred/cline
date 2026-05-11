import { FilePlus2, Home, ReceiptText, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const navItems = [
  { label: "Home", icon: Home },
  { label: "Submit", icon: FilePlus2 },
  { label: "Requests", icon: ReceiptText },
  { label: "Profile", icon: UserRound },
]

export default function MobileShellPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-5">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-sm flex-col">
        <div className="flex-1 space-y-4 pb-24">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Express Travels
            </p>
            <h1 className="mt-1 text-2xl font-bold">Mobile request shell</h1>
          </div>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Submit payment request</CardTitle>
              <CardDescription>
                Department Heads and Field Employees will share this consistent
                mobile flow with role-specific fields.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Start request</Button>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Proof tasks</CardTitle>
              <CardDescription>
                Field proof uploads and proof overdue reminders will live here.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto grid max-w-sm grid-cols-4 gap-2">
            {navItems.map(({ label, icon: Icon }) => (
              <button
                key={label}
                className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-xs font-medium text-muted-foreground first:bg-soft first:text-primary"
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
