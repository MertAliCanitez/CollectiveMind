import type { NextConfig } from "next"

const config: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/shared", "@repo/auth", "@repo/billing", "@repo/database"],

  webpack(webpackConfig) {
    // TypeScript workspace packages use .js extensions (NodeNext resolution),
    // but webpack resolves extensions literally. Map .js → .ts/.tsx so
    // transpilePackages can compile them from source.
    webpackConfig.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
    }
    return webpackConfig
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
}

export default config
