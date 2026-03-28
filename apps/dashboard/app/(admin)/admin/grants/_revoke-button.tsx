"use client"

import { useTransition } from "react"
import { revokeGrantAction } from "./_actions"

interface Props {
  grantId: string
}

export function RevokeGrantButton({ grantId }: Props) {
  const [pending, startTransition] = useTransition()

  function handleRevoke() {
    if (!confirm("Revoke this access grant? The organization will lose access immediately.")) return
    startTransition(async () => {
      await revokeGrantAction(grantId)
      // Page will revalidate on next navigation; force refresh
      window.location.reload()
    })
  }

  return (
    <button
      onClick={handleRevoke}
      disabled={pending}
      className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      {pending ? "Revoking…" : "Revoke"}
    </button>
  )
}
