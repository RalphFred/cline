"use client"

import { useState } from "react"
import { CheckCircle2, XCircle } from "lucide-react"

import {
  approvePaymentRequestAction,
  rejectPaymentRequestAction,
} from "@/app/(admin)/admin/actions"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type Decision = "approved" | "rejected"

export function PaymentRequestDecisionForm({
  requestId,
}: {
  requestId: string
}) {
  const [decision, setDecision] = useState<Decision | "">("")
  const isApproval = decision === "approved"
  const isRejection = decision === "rejected"

  return (
    <div className="mt-4 grid gap-3">
      <div className="grid gap-2">
        <div className="text-sm font-medium">Decision type</div>
        <Select
          onValueChange={(value) => setDecision((value ?? "") as Decision | "")}
          value={decision}
        >
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="Choose approval or rejection" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="approved">Approve payout</SelectItem>
              <SelectItem value="rejected">Reject request</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {decision ? (
        <form
          action={
            isApproval
              ? approvePaymentRequestAction
              : rejectPaymentRequestAction
          }
          className="grid gap-3"
        >
          <input name="requestId" type="hidden" value={requestId} />
          <Textarea
            className="min-h-28 bg-background"
            name="comment"
            placeholder={
              isApproval
                ? "State why this payout is approved"
                : "State why this request is rejected"
            }
          />
          <Button
            className={
              isRejection
                ? "w-full !bg-critical !text-white hover:!bg-critical/90"
                : "w-full"
            }
            type="submit"
            variant="default"
          >
            {isApproval ? (
              <CheckCircle2 data-icon="inline-start" />
            ) : (
              <XCircle data-icon="inline-start" />
            )}
            {isApproval ? "Approve payout" : "Reject request"}
          </Button>
        </form>
      ) : null}
    </div>
  )
}
