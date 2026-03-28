import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@repo/ui/globals.css"
import { SiteNav } from "@/components/layout/site-nav"
import { SiteFooter } from "@/components/layout/site-footer"

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
    default: "CollectiveMind — The operating stack for modern B2B teams",
    template: "%s — CollectiveMind",
  },
  description:
    "Analytics, API integrations, and team collaboration — unified under one platform. Built for modern B2B teams.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName: "CollectiveMind",
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
      <body className="min-h-screen bg-white font-sans antialiased">
        <SiteNav />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
