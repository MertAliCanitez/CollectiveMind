import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@repo/ui/globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env["NEXT_PUBLIC_APP_URL"] ?? "https://collectivemind.com",
  ),
  title: {
    default: "CollectiveMind — B2B SaaS Platform",
    template: "%s — CollectiveMind",
  },
  description:
    "One platform for every product your B2B team needs. Unified authentication, billing, and access management.",
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
