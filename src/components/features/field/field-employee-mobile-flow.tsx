"use client"

import { useActionState, useEffect, useMemo, useRef, useState } from "react"
import {
  Banknote,
  Building2,
  ChevronLeft,
  CircleAlert,
  Clock3,
  FileCheck2,
  FilePlus2,
  Home,
  LogOut,
  MapPin,
  Phone,
  Receipt,
  ReceiptText,
  Upload,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

import {
  createFieldPaymentRequestAction,
  uploadFieldPaymentProofAction,
  type PaymentRequestActionState,
} from "@/app/(mobile)/mobile/actions"
import { signOutAction } from "@/app/(auth)/sign-in/actions"
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
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import type {
  PaymentRequestStatus,
  PaymentRequestSummary,
  PaymentRequestType,
} from "@/lib/payments/types"
import { cn } from "@/lib/utils"

type FieldEmployeeMobileFlowProps = {
  accountEmail: string
  accountName: string
  initialRequests: PaymentRequestSummary[]
  organizationName: string
}

type FieldRequest = PaymentRequestSummary

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
})

const navItems = [
  { value: "home", label: "Home", icon: Home },
  { value: "request", label: "Request", icon: FilePlus2 },
  { value: "queue", label: "Queue", icon: ReceiptText },
  { value: "proof", label: "Proof", icon: Upload },
] as const

const requestTypeOptions = [
  {
    value: "vendor_payment",
    label: "Vendor invoice",
    description: "Pay a supplier from an invoice or delivery bill.",
    icon: Building2,
  },
  {
    value: "staff_cash_request",
    label: "Field cash",
    description: "Ask for cash before a business errand or field job.",
    icon: Banknote,
  },
  {
    value: "airtime_data_request",
    label: "Airtime/data",
    description: "Buy airtime or data for a work phone line.",
    icon: Phone,
  },
  {
    value: "utility_payment",
    label: "Electricity bill",
    description: "Pay power, internet, water, or another utility account.",
    icon: Zap,
  },
  {
    value: "manual_business_expense",
    label: "Reimbursement",
    description: "Claim money after you already spent it.",
    icon: Receipt,
  },
] as const

const statusMeta: Record<
  PaymentRequestStatus,
  {
    label: string
    className: string
    icon: typeof Clock3
  }
> = {
  submitted: {
    label: "Submitted",
    className: "border-border bg-secondary text-secondary-foreground",
    icon: Clock3,
  },
  approved: {
    label: "Approved",
    className:
      "border-[color:color-mix(in_srgb,var(--color-success)_32%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-success)_10%,var(--color-card))] text-[color:var(--color-success)]",
    icon: FileCheck2,
  },
  rejected: {
    label: "Rejected",
    className:
      "border-[color:color-mix(in_srgb,var(--color-critical)_28%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-critical)_10%,var(--color-card))] text-[color:var(--color-critical)]",
    icon: CircleAlert,
  },
}

const requestTypeLabels: Record<PaymentRequestType, string> = {
  vendor_payment: "Vendor invoice",
  staff_cash_request: "Field cash",
  airtime_data_request: "Airtime/data",
  utility_payment: "Electricity bill",
  manual_business_expense: "Reimbursement",
}

function formatCurrency(amountKobo: number) {
  return currencyFormatter.format(amountKobo / 100)
}

function getRequestsNeedingProof(requests: FieldRequest[]) {
  return requests.filter(
    (request) =>
      request.status === "approved" &&
      request.proofRequired &&
      !request.proofFileName,
  )
}

function StatusBadge({ status }: { status: PaymentRequestStatus }) {
  const meta = statusMeta[status]
  const Icon = meta.icon

  return (
    <Badge className={cn("border", meta.className)} variant="outline">
      <Icon data-icon="inline-start" />
      {meta.label}
    </Badge>
  )
}

function RequestCard({
  request,
  onOpen,
}: {
  request: FieldRequest
  onOpen: (request: FieldRequest) => void
}) {
  return (
    <button
      className="group flex w-full flex-col gap-3 rounded-lg border border-border bg-card px-3 py-3 text-left transition hover:border-primary/35 hover:bg-secondary/45"
      onClick={() => onOpen(request)}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-medium">{request.title}</div>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin />
            <span className="truncate">{request.location}</span>
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="font-mono text-2xl font-semibold">
            {formatCurrency(request.amountKobo)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {requestTypeLabels[request.requestType]}
          </div>
        </div>
      </div>
    </button>
  )
}

export function FieldEmployeeMobileFlow({
  accountEmail,
  accountName,
  initialRequests,
  organizationName,
}: FieldEmployeeMobileFlowProps) {
  const emptyActionState: PaymentRequestActionState = {
    status: "idle",
    message: "",
  }
  const [createState, createAction, createPending] = useActionState(
    createFieldPaymentRequestAction,
    emptyActionState,
  )
  const [proofState, proofAction, proofPending] = useActionState(
    uploadFieldPaymentProofAction,
    emptyActionState,
  )
  const lastCreateRequestId = useRef<string | null>(null)
  const lastProofRequestId = useRef<string | null>(null)
  const [activeScreen, setActiveScreen] =
    useState<(typeof navItems)[number]["value"]>("home")
  const [requestStep, setRequestStep] = useState<"type" | "details">("type")
  const [requests, setRequests] = useState<FieldRequest[]>(initialRequests)
  const [selectedRequest, setSelectedRequest] = useState<FieldRequest | null>(
    initialRequests[0] ?? null,
  )
  const [detailOpen, setDetailOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [requestType, setRequestType] =
    useState<PaymentRequestType>("vendor_payment")
  const urgency = "Today"
  const [purpose, setPurpose] = useState("")
  const [vendorName, setVendorName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [utilityReference, setUtilityReference] = useState("")
  const [proofTargetId, setProofTargetId] = useState(initialRequests[0]?.id ?? "")
  const [proofNote, setProofNote] = useState("")

  const proofRequests = useMemo(() => getRequestsNeedingProof(requests), [requests])
  const selectedRequestType =
    requestTypeOptions.find((option) => option.value === requestType) ??
    requestTypeOptions[1]
  const requestTitle =
    requestType === "vendor_payment"
      ? `${vendorName || "Vendor"} invoice`
      : requestType === "airtime_data_request"
        ? `Airtime/data for ${phoneNumber || "work line"}`
        : requestType === "utility_payment"
          ? `Utility bill ${utilityReference || "payment"}`
          : requestType === "manual_business_expense"
            ? "Business expense reimbursement"
            : "Field cash request"
  const recipientOrLocation =
    requestType === "vendor_payment"
      ? vendorName || "Vendor"
      : requestType === "airtime_data_request"
        ? phoneNumber || "Work phone line"
        : requestType === "utility_payment"
          ? utilityReference || "Utility account"
          : "Field operations"
  const amountLabel =
    requestType === "airtime_data_request"
      ? "Recharge amount"
      : requestType === "manual_business_expense"
        ? "Amount spent"
        : "Amount"
  const purposeLabel =
    requestType === "vendor_payment"
      ? "Description"
      : requestType === "staff_cash_request"
        ? "What is the cash for?"
        : requestType === "airtime_data_request"
          ? "Reason"
          : requestType === "utility_payment"
            ? "Reason for payment"
            : "Business justification"
  const evidenceLabel =
    requestType === "vendor_payment"
      ? "Invoice photo"
      : requestType === "utility_payment"
        ? "Bill photo"
        : requestType === "manual_business_expense"
          ? "Receipt photo"
          : "Supporting photo"
  const showEvidence =
    requestType === "vendor_payment" ||
    requestType === "utility_payment" ||
    requestType === "manual_business_expense"
  const evidenceRequired =
    requestType === "vendor_payment" ||
    requestType === "manual_business_expense"
  const selectedProofTargetId = proofTargetId || proofRequests[0]?.id || ""
  const activeProofTarget =
    requests.find((request) => request.id === selectedProofTargetId) ??
    proofRequests[0]

  function openRequest(request: FieldRequest) {
    setSelectedRequest(request)
    setDetailOpen(true)
  }

  function updateAmount(value: string) {
    setAmount(value.replace(/\D/g, ""))
  }

  useEffect(() => {
    if (createState.status === "error" && createState.message) {
      toast.error(createState.message)
    }

    if (
      createState.status === "success" &&
      createState.request &&
      lastCreateRequestId.current !== createState.request.id
    ) {
      lastCreateRequestId.current = createState.request.id
      setRequests((current) => [
        createState.request!,
        ...current.filter((request) => request.id !== createState.request!.id),
      ])
      setSelectedRequest(createState.request)
      setDetailOpen(true)
      setAmount("")
      setPurpose("")
      setVendorName("")
      setPhoneNumber("")
      setUtilityReference("")
      setRequestStep("type")
      toast.success(createState.message)
    }
  }, [createState])

  useEffect(() => {
    if (proofState.status === "error" && proofState.message) {
      toast.error(proofState.message)
    }

    if (
      proofState.status === "success" &&
      proofState.request &&
      lastProofRequestId.current !== `${proofState.request.id}:${proofState.request.proofFileName}`
    ) {
      lastProofRequestId.current = `${proofState.request.id}:${proofState.request.proofFileName}`
      setRequests((current) =>
        current.map((request) =>
          request.id === proofState.request!.id ? proofState.request! : request,
        ),
      )
      setSelectedRequest(proofState.request)
      setProofNote("")
      toast.success(proofState.message)
    }
  }, [proofState])

  const latestRequest = requests[0]

  return (
    <main className="min-h-screen bg-white px-4 py-4">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-sm flex-col">
        <div className="flex flex-1 flex-col gap-4 pb-24">
          <header className="rounded-lg border border-border bg-card px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">Field Employee</Badge>
                  <Badge variant="outline">{organizationName}</Badge>
                </div>
                <h1 className="mt-4 text-2xl font-bold leading-tight tracking-normal">
                  Requests
                </h1>
                <div className="mt-1 truncate text-sm text-muted-foreground">
                  {accountName}
                </div>
              </div>
              <form action={signOutAction}>
                <Button
                  aria-label={`Sign out ${accountEmail}`}
                  size="icon"
                  type="submit"
                  variant="outline"
                >
                  <LogOut />
                </Button>
              </form>
            </div>
          </header>

          {activeScreen === "home" ? (
            <section className="flex flex-col gap-4">
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Start</CardTitle>
                  <CardDescription>
                    Create a request or close an approved one with proof.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Button onClick={() => setActiveScreen("request")} size="lg">
                    <FilePlus2 data-icon="inline-start" />
                    New request
                  </Button>
                  {proofRequests.length > 0 ? (
                    <Button
                      onClick={() => setActiveScreen("proof")}
                      size="lg"
                      variant="outline"
                    >
                      <Upload data-icon="inline-start" />
                      Upload proof
                    </Button>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Recent requests</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {latestRequest ? (
                    <RequestCard request={latestRequest} onOpen={openRequest} />
                  ) : (
                    <div className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center">
                      <FilePlus2 />
                      <div>
                        <div className="font-medium">No requests yet</div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          New requests will appear here.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          ) : null}

          {activeScreen === "request" ? (
            <section className="flex flex-col gap-4">
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Create request</CardTitle>
                  <CardDescription>
                    Pick what you need first. The next step only asks for the
                    fields finance needs for that request.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {requestStep === "type" ? (
                    <div className="flex flex-col gap-3">
                      {requestTypeOptions.map((option) => {
                        const Icon = option.icon
                        const active = requestType === option.value

                        return (
                          <button
                            className={cn(
                              "flex min-h-20 items-center gap-3 rounded-lg border bg-background px-4 py-3 text-left transition",
                              active
                                ? "border-primary bg-secondary text-foreground"
                                : "border-border hover:border-primary/35",
                            )}
                            key={option.value}
                            onClick={() =>
                              setRequestType(option.value as PaymentRequestType)
                            }
                            type="button"
                          >
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-card text-primary">
                              <Icon />
                            </span>
                            <span className="min-w-0">
                              <span className="block font-medium">
                                {option.label}
                              </span>
                              <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                                {option.description}
                              </span>
                            </span>
                          </button>
                        )
                      })}

                      <Button
                        className="min-h-12"
                        onClick={() => setRequestStep("details")}
                        size="lg"
                        type="button"
                      >
                        Continue
                      </Button>
                    </div>
                  ) : (
                    <form action={createAction} className="flex flex-col gap-5">
                      <input name="requestType" type="hidden" value={requestType} />
                      <input name="urgency" type="hidden" value={urgency} />
                      <input name="neededBy" type="hidden" value={urgency} />
                      <input name="title" type="hidden" value={requestTitle} />
                      <input
                        name="recipientOrLocation"
                        type="hidden"
                        value={recipientOrLocation}
                      />
                      <input name="invoiceReference" type="hidden" value="" />
                      <input name="bankName" type="hidden" value="" />
                      <input name="accountNumber" type="hidden" value="" />

                      <button
                        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-primary"
                        onClick={() => setRequestStep("type")}
                        type="button"
                      >
                        <ChevronLeft />
                        {selectedRequestType.label}
                      </button>

                      {requestType === "vendor_payment" ? (
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="vendor-name">Vendor</Label>
                          <Input
                            className="min-h-12 bg-background px-4 text-base"
                            id="vendor-name"
                            name="vendorName"
                            onChange={(event) => setVendorName(event.target.value)}
                            required
                            value={vendorName}
                          />
                        </div>
                      ) : null}

                      {requestType === "airtime_data_request" ? (
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="phone-number">Phone number</Label>
                          <Input
                            className="min-h-12 bg-background px-4 text-base"
                            id="phone-number"
                            inputMode="tel"
                            onChange={(event) => setPhoneNumber(event.target.value)}
                            required
                            value={phoneNumber}
                          />
                        </div>
                      ) : null}

                      {requestType === "utility_payment" ? (
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="utility-reference">
                            Meter or account number
                          </Label>
                          <Input
                            className="min-h-12 bg-background px-4 text-base"
                            id="utility-reference"
                            onChange={(event) =>
                              setUtilityReference(event.target.value)
                            }
                            required
                            value={utilityReference}
                          />
                        </div>
                      ) : null}

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="field-amount">{amountLabel}</Label>
                        <Input
                          className="min-h-12 bg-background px-4 text-base"
                          id="field-amount"
                          inputMode="numeric"
                          name="amountNaira"
                          onChange={(event) => updateAmount(event.target.value)}
                          pattern="[0-9]*"
                          required
                          type="text"
                          value={amount}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="field-purpose">{purposeLabel}</Label>
                        <Textarea
                          className="min-h-32 bg-background px-4 py-3 text-base"
                          id="field-purpose"
                          name="purpose"
                          onChange={(event) => setPurpose(event.target.value)}
                          required
                          rows={4}
                          value={purpose}
                        />
                      </div>

                      {showEvidence ? (
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="request-evidence">{evidenceLabel}</Label>
                          <Input
                            accept="image/*,.pdf"
                            className="min-h-12 bg-background px-4 py-2 text-base"
                            id="request-evidence"
                            name="evidenceFile"
                            required={evidenceRequired}
                            type="file"
                          />
                        </div>
                      ) : null}

                      <Button
                        className="min-h-12"
                        disabled={createPending}
                        size="lg"
                        type="submit"
                      >
                        <FilePlus2 data-icon="inline-start" />
                        {createPending ? "Submitting..." : "Submit for approval"}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </section>
          ) : null}

          {activeScreen === "queue" ? (
            <section className="flex flex-col gap-3">
              {requests.length > 0 ? (
                requests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onOpen={openRequest}
                  />
                ))
              ) : (
                <Card className="shadow-none">
                  <CardContent className="flex min-h-44 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
                    <ReceiptText />
                    <div>
                      <div className="font-medium">No queue yet</div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Submitted requests will appear here.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>
          ) : null}

          {activeScreen === "proof" ? (
            <section className="flex flex-col gap-4">
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Upload proof</CardTitle>
                  <CardDescription>
                    Attach receipt evidence after payout so finance can close the request.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {proofRequests.length > 0 ? (
                    <form action={proofAction} className="flex flex-col gap-4">
                      <input
                        name="requestId"
                        type="hidden"
                        value={activeProofTarget?.id ?? selectedProofTargetId}
                      />
                      <div className="flex flex-col gap-2">
                        <Label>Request</Label>
                        <Select
                          onValueChange={(value) => {
                            if (value) {
                              setProofTargetId(value)
                            }
                          }}
                          value={selectedProofTargetId}
                        >
                          <SelectTrigger className="min-h-12 w-full bg-background px-4 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {proofRequests.map((request) => (
                                <SelectItem key={request.id} value={request.id}>
                                  {request.title}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      {activeProofTarget ? (
                        <div className="rounded-lg border border-border bg-secondary/60 px-3 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium">{activeProofTarget.title}</div>
                              <div className="mt-1 text-sm text-muted-foreground">
                                {formatCurrency(activeProofTarget.amountKobo)} · {activeProofTarget.location}
                              </div>
                            </div>
                            <StatusBadge status={activeProofTarget.status} />
                          </div>
                        </div>
                      ) : null}

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="proof-file">Proof file</Label>
                        <Input
                          className="min-h-12 bg-background px-4 py-2 text-base"
                          id="proof-file"
                          name="proofFile"
                          type="file"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="proof-note">Proof note</Label>
                        <Textarea
                          className="min-h-24 bg-background px-4 py-3 text-base"
                          id="proof-note"
                          name="proofNote"
                          onChange={(event) => setProofNote(event.target.value)}
                          rows={3}
                          value={proofNote}
                        />
                      </div>

                      <Button
                        className="min-h-12"
                        disabled={proofPending}
                        size="lg"
                        type="submit"
                      >
                        <Upload data-icon="inline-start" />
                        {proofPending ? "Attaching..." : "Attach proof"}
                      </Button>
                    </form>
                  ) : (
                    <div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-background px-4 py-8 text-center">
                      <FileCheck2 className="text-primary" />
                      <div>
                        <div className="font-medium">No proof due</div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Every approved request that needs proof already has it attached.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          ) : null}

        </div>

        <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 px-3 py-3 backdrop-blur">
          <div className="mx-auto grid max-w-sm grid-cols-4 gap-1">
            {navItems.map(({ value, label, icon: Icon }) => {
              const active = activeScreen === value

              return (
                <button
                  className={cn(
                    "flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[0.68rem] font-medium transition",
                    active
                      ? "bg-primary text-primary-foreground shadow-[0_10px_30px_-20px_rgba(15,107,143,0.9)]"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                  key={value}
                  onClick={() => setActiveScreen(value)}
                  type="button"
                >
                  <Icon />
                  {label}
                </button>
              )
            })}
          </div>
        </nav>
      </div>

      <Sheet onOpenChange={setDetailOpen} open={detailOpen}>
        <SheetContent className="w-[92vw] max-w-sm overflow-y-auto" side="right">
          {selectedRequest ? (
            <>
              <SheetHeader>
                <SheetTitle>{selectedRequest.title}</SheetTitle>
                <SheetDescription>
                  {selectedRequest.id} · {selectedRequest.location}
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-4 px-4">
                <div className="rounded-lg border border-border bg-secondary/55 px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-2xl font-semibold">
                        {formatCurrency(selectedRequest.amountKobo)}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Submitted {selectedRequest.submittedAt}
                      </div>
                    </div>
                    <StatusBadge status={selectedRequest.status} />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="text-sm font-medium">Purpose</div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {selectedRequest.purpose}
                  </p>
                </div>

                <Separator />

                <div className="flex flex-col gap-3">
                  <div className="text-sm font-medium">Approval timeline</div>
                  {selectedRequest.timeline.map((item) => (
                    <div className="flex items-center gap-3" key={item.label}>
                      <div
                        className={cn(
                          "size-3 rounded-full border",
                          item.state === "done" &&
                            "border-[color:var(--color-success)] bg-[color:var(--color-success)]",
                          item.state === "current" &&
                            "border-[color:var(--color-brand)] bg-[color:var(--color-brand)]",
                          item.state === "waiting" && "border-border bg-card",
                        )}
                      />
                      <div
                        className={cn(
                          "text-sm",
                          item.state === "waiting"
                            ? "text-muted-foreground"
                            : "text-foreground",
                        )}
                      >
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedRequest.proofFileName ? (
                  <>
                    <Separator />
                    <div className="rounded-lg border border-border bg-card px-3 py-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileCheck2 />
                        {selectedRequest.proofFileName}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              <SheetFooter>
                {selectedRequest.status === "approved" &&
                selectedRequest.proofRequired &&
                !selectedRequest.proofFileName ? (
                  <Button
                    onClick={() => {
                      setProofTargetId(selectedRequest.id)
                      setDetailOpen(false)
                      setActiveScreen("proof")
                    }}
                    type="button"
                  >
                    <Upload data-icon="inline-start" />
                    Upload proof
                  </Button>
                ) : (
                  <Button onClick={() => setDetailOpen(false)} type="button">
                    Done
                  </Button>
                )}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </main>
  )
}
