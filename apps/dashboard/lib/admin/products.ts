/**
 * Admin data layer — Products.
 *
 * No business logic here. Pure DB queries and mutations.
 * Auth is enforced by the calling page/action via requirePlatformAdmin().
 */
import { db, type Product, type ProductStatus } from "@repo/database"

export interface AdminProduct {
  id: string
  slug: string
  name: string
  description: string | null
  status: ProductStatus
  sortOrder: number
  planCount: number
  createdAt: Date
  updatedAt: Date
}

export async function listProducts(): Promise<AdminProduct[]> {
  const products = await db.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { plans: true } },
    },
  })

  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    status: p.status,
    sortOrder: p.sortOrder,
    planCount: p._count.plans,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }))
}

export async function getProduct(id: string): Promise<Product | null> {
  return db.product.findUnique({ where: { id } })
}

export interface CreateProductInput {
  slug: string
  name: string
  description?: string
  status: ProductStatus
  sortOrder?: number
}

export async function createProduct(data: CreateProductInput): Promise<Product> {
  return db.product.create({
    data: {
      slug: data.slug,
      name: data.name,
      description: data.description ?? null,
      status: data.status,
      sortOrder: data.sortOrder ?? 0,
    },
  })
}

export interface UpdateProductInput {
  name?: string
  description?: string | null
  status?: ProductStatus
  sortOrder?: number
}

export async function updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
  return db.product.update({
    where: { id },
    data,
  })
}
