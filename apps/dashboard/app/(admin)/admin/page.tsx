import { redirect } from "next/navigation"
import { requirePlatformStaff } from "../../../lib/auth"

export default async function AdminRootPage() {
  await requirePlatformStaff()
  redirect("/admin/products")
}
