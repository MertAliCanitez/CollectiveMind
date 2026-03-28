import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import "@repo/ui/globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "Admin — CollectiveMind",
    template: "%s — Admin",
  },
  description: "Internal admin panel",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider signInUrl="/sign-in" afterSignOutUrl="/sign-in">
      <html lang="en" className={inter.variable}>
        <body className="bg-background min-h-screen font-sans antialiased">{children}</body>
      </html>
    </ClerkProvider>
  )
}
