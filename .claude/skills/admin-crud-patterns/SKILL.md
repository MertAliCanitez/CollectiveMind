# Skill: admin-crud-patterns

## Purpose

Build consistent, production-quality CRUD interfaces for `apps/admin`. Covers the list view, detail view, edit form, confirmation dialogs, and audit log integration patterns used throughout the admin panel.

## When to Use

Invoke this skill when:
- Adding a new admin section (e.g., organizations, plans, subscriptions)
- Building a data table with search, filter, and pagination
- Implementing an admin edit form with audit trail
- Adding a bulk action (e.g., cancel multiple subscriptions)
- Building any admin detail page with action buttons

## Design Principles

- **Read-heavy, write-careful.** Most admin interactions are reads. Mutations require explicit confirmation.
- **Context over raw data.** Show computed values and business context (e.g., "3 active products" not just a FK ID).
- **Audit everything.** Every admin mutation writes to `AuditLog` with `actorType: "ADMIN"`.
- **No shortcuts on authorization.** Every admin route verifies `isPlatformStaff()` at the server level — not just in middleware.
- **Destructive actions are always destructive-styled.** Cancel buttons use `variant="outline"`. Delete/cancel/remove use `variant="destructive"`.

## Route Structure for an Admin Section

```
apps/admin/app/(admin)/[resource]/
  page.tsx          ← list view (RSC, paginated)
  [id]/
    page.tsx        ← detail view (RSC)
    edit/
      page.tsx      ← edit form (Client Component shell + RSC data)
  _components/
    [resource]-table.tsx      ← data table
    [resource]-filters.tsx    ← search + filter bar
    [resource]-detail.tsx     ← detail card sections
    [resource]-actions.tsx    ← action buttons / dropdowns
  actions.ts        ← Server Actions for mutations
```

## Step-by-Step Working Instructions

### 1. List Page Pattern

```tsx
// apps/admin/app/(admin)/organizations/page.tsx
import { auth } from "@clerk/nextjs/server"
import { isPlatformStaff } from "@repo/auth"
import { db } from "@repo/db"
import { OrganizationsTable } from "./_components/organizations-table"
import { OrgFilters } from "./_components/org-filters"

interface PageProps {
  searchParams: { q?: string; page?: string; status?: string }
}

export default async function OrganizationsPage({ searchParams }: PageProps) {
  const { sessionClaims } = await auth()
  if (!isPlatformStaff(sessionClaims)) return notFound()

  const page = parseInt(searchParams.page ?? "1")
  const pageSize = 25
  const query = searchParams.q?.trim()

  const [organizations, total] = await Promise.all([
    db.organization.findMany({
      where: {
        deletedAt: null,
        ...(query && {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        _count: { select: { members: true, subscriptions: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.organization.count({ where: { deletedAt: null } }),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Organizations</h1>
        <span className="text-sm text-muted-foreground">{total} total</span>
      </div>
      <OrgFilters />
      <OrganizationsTable
        organizations={organizations}
        pagination={{ page, pageSize, total }}
      />
    </div>
  )
}
```

### 2. Data Table Pattern

```tsx
// _components/organizations-table.tsx
"use client"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@repo/ui"
import { Badge } from "@repo/ui"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export function OrganizationsTable({ organizations, pagination }) {
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organization</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Subscriptions</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No organizations found
              </TableCell>
            </TableRow>
          ) : (
            organizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell>
                  <Link href={`/organizations/${org.id}`} className="font-medium hover:underline">
                    {org.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{org.slug}</p>
                </TableCell>
                <TableCell>{org._count.members}</TableCell>
                <TableCell>{org._count.subscriptions}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(org.createdAt, { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <Link href={`/organizations/${org.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pagination page={pagination.page} pageSize={pagination.pageSize} total={pagination.total} />
    </>
  )
}
```

### 3. Detail Page Pattern

```tsx
// apps/admin/app/(admin)/organizations/[id]/page.tsx
import { notFound } from "next/navigation"
import { db } from "@repo/db"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui"

export default async function OrgDetailPage({ params }: { params: { id: string } }) {
  const org = await db.organization.findUnique({
    where: { id: params.id, deletedAt: null },
    include: {
      members: { include: { user: true } },
      subscriptions: { include: { plan: { include: { product: true } } } },
    },
  })

  if (!org) notFound()

  return (
    <div className="space-y-6">
      <OrgDetailHeader org={org} />

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members ({org.members.length})</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions ({org.subscriptions.length})</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>
        <TabsContent value="members">
          <MembersTable members={org.members} orgId={org.id} />
        </TabsContent>
        <TabsContent value="subscriptions">
          <SubscriptionsTable subscriptions={org.subscriptions} orgId={org.id} />
        </TabsContent>
        <TabsContent value="audit">
          <Suspense fallback={<AuditLogSkeleton />}>
            <AuditLogTable orgId={org.id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### 4. Admin Actions Pattern (Server Actions)

```ts
// apps/admin/app/(admin)/organizations/[id]/actions.ts
"use server"
import { auth } from "@clerk/nextjs/server"
import { isPlatformAdmin } from "@repo/auth"
import { cancelSubscription } from "@repo/billing"
import { db } from "@repo/db"
import { revalidatePath } from "next/cache"

export async function adminCancelSubscription(subscriptionId: string, reason: string) {
  const { userId, sessionClaims } = await auth()

  // Re-verify platform admin on every action — never trust middleware alone
  if (!isPlatformAdmin(sessionClaims)) {
    throw new Error("Insufficient permissions")
  }

  const subscription = await db.subscription.findUniqueOrThrow({
    where: { id: subscriptionId },
    include: { plan: { include: { product: true } } },
  })

  await cancelSubscription({ subscriptionId, atPeriodEnd: false })

  // Audit log every admin mutation
  await db.auditLog.create({
    data: {
      actorUserId: userId!,
      actorType: "ADMIN",
      organizationId: subscription.organizationId,
      action: "subscription.canceled",
      resourceType: "Subscription",
      resourceId: subscriptionId,
      metadata: {
        planSlug: subscription.plan.slug,
        productSlug: subscription.plan.product.slug,
        reason,
      },
    },
  })

  revalidatePath(`/organizations/${subscription.organizationId}`)
}
```

### 5. Destructive Confirmation Pattern

```tsx
// _components/cancel-subscription-dialog.tsx
"use client"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@repo/ui"
import { useState } from "react"
import { adminCancelSubscription } from "../actions"

export function CancelSubscriptionDialog({ subscriptionId, planName, orgName }) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    await adminCancelSubscription(subscriptionId, reason)
    setLoading(false)
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">Cancel subscription</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel {planName} for {orgName}?</AlertDialogTitle>
          <AlertDialogDescription>
            The organization will immediately lose access. This cannot be undone automatically.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          placeholder="Reason for cancellation (required)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Keep subscription</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!reason.trim() || loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Canceling..." : "Cancel subscription"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### 6. Search and Filter Pattern

URL-based state for filters (enables shareable links and back-button support):

```tsx
// _components/org-filters.tsx
"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

export function OrgFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page") // reset pagination on filter change
    router.push(`?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Search by name or slug..."
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => updateFilter("q", e.target.value)}
        className="max-w-sm"
      />
    </div>
  )
}
```

## Project-Specific Conventions

### Admin sections and their primary identifiers

| Section | Route | Primary data source |
|---------|-------|---------------------|
| Organizations | `/organizations` | `db.organization` |
| Users | `/users` | `db.user` |
| Products | `/products` | `db.product` |
| Plans | `/plans` | `db.plan` (with product) |
| Subscriptions | `/subscriptions` | `db.subscription` (with org + plan) |
| Audit | `/audit` | `db.auditLog` |

### Pagination standard

- Page size: 25 records per page (not configurable by user at v1)
- URL param: `?page=1`
- Display: "Showing 1–25 of 142" + prev/next buttons

### Date display in admin

Use `date-fns` `formatDistanceToNow` for relative times in list views ("3 days ago"). Use full date format for detail views and audit logs ("March 28, 2026 at 14:32 UTC").

### Re-verifying authorization in Server Actions

Every Server Action in admin must call `auth()` and check `isPlatformAdmin()` / `isPlatformStaff()`. Middleware provides the first line of defense; Server Actions provide the second. Never skip this.
