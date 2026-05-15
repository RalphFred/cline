"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowUpDown, Search, SlidersHorizontal } from "lucide-react"

import {
  formatCurrency,
  requestTypeLabels,
  riskBadgeClass,
  statusBadgeClass,
} from "@/components/features/admin/admin-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { PaymentRequestSummary } from "@/lib/payments/types"

type FilterValue = "all" | string
type SortValue = "newest" | "amount-high" | "risk-high"

function normalized(value: string | undefined) {
  return value?.toLowerCase().trim() ?? ""
}

export function ApprovalsTable({
  requests,
}: {
  requests: PaymentRequestSummary[]
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<FilterValue>("all")
  const [risk, setRisk] = useState<FilterValue>("all")
  const [type, setType] = useState<FilterValue>("all")
  const [sort, setSort] = useState<SortValue>("newest")

  const visibleRequests = useMemo(() => {
    const search = normalized(query)

    return requests
      .filter((request) => {
        const matchesSearch =
          !search ||
          [
            request.title,
            request.purpose,
            request.location,
            request.submitterName,
            request.departmentName,
            request.topFlag,
          ]
            .map(normalized)
            .some((value) => value.includes(search))

        return (
          matchesSearch &&
          (status === "all" || request.status === status) &&
          (risk === "all" || request.riskBand === risk) &&
          (type === "all" || request.requestType === type)
        )
      })
      .sort((a, b) => {
        if (sort === "amount-high") {
          return b.amountKobo - a.amountKobo
        }

        if (sort === "risk-high") {
          return b.riskScore - a.riskScore
        }

        return (
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        )
      })
  }, [query, requests, risk, sort, status, type])

  const openRequest = (requestId: string) => {
    router.push(`/admin/approvals/${requestId}`)
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Requests</h2>
          </div>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative min-w-0 lg:w-72">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search requests"
                value={query}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
              <Select
                onValueChange={(value) => setStatus(value ?? "all")}
                value={status}
              >
                <SelectTrigger className="w-full lg:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                onValueChange={(value) => setRisk(value ?? "all")}
                value={risk}
              >
                <SelectTrigger className="w-full lg:w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All risk</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                onValueChange={(value) => setType(value ?? "all")}
                value={type}
              >
                <SelectTrigger className="w-full lg:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All types</SelectItem>
                    {Object.entries(requestTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                onValueChange={(value) =>
                  setSort((value ?? "newest") as SortValue)
                }
                value={sort}
              >
                <SelectTrigger className="w-full lg:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="amount-high">Amount high</SelectItem>
                    <SelectItem value="risk-high">Risk high</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/45 hover:bg-secondary/45">
              <TableHead className="px-4">Request</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">
                <span className="inline-flex items-center gap-1">
                  Amount
                  <ArrowUpDown className="size-3" />
                </span>
              </TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRequests.length > 0 ? (
              visibleRequests.map((request) => (
                <TableRow
                  className="cursor-pointer"
                  key={request.id}
                  onClick={() => openRequest(request.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      openRequest(request.id)
                    }
                  }}
                  role="link"
                  tabIndex={0}
                >
                  <TableCell className="min-w-72 px-4">
                    <span className="font-medium">{request.title}</span>
                  </TableCell>
                  <TableCell>{requestTypeLabels[request.requestType]}</TableCell>
                  <TableCell>
                    <Badge className={riskBadgeClass(request.riskBand)}>
                      {request.riskBand}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusBadgeClass(request.status)}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {formatCurrency(request.amountKobo)}
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={(event) => {
                        event.stopPropagation()
                        openRequest(request.id)
                      }}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="px-4 py-10 text-center text-muted-foreground"
                  colSpan={6}
                >
                  <SlidersHorizontal className="mx-auto mb-3 size-5" />
                  No requests match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
