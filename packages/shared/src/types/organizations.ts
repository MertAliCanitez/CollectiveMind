import { z } from "zod"

export const OrgRoleSchema = z.enum(["ADMIN", "BILLING_MANAGER", "MEMBER"])
export type OrgRole = z.infer<typeof OrgRoleSchema>

export const CreateOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens"),
})
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial()
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>

export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: OrgRoleSchema.default("MEMBER"),
})
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>
