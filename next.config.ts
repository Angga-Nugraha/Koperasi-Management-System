import { withSentryConfig } from "@sentry/nextjs"
import type { NextConfig } from "next"

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://app.sandbox.midtrans.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "frame-src https://app.sandbox.midtrans.com https://challenges.cloudflare.com",
  "connect-src 'self' https://*.sentry.io https://*.upstash.io https://*.midtrans.com https://challenges.cloudflare.com",
  "manifest-src 'self'",
].join("; ")

const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "simko",
  project: process.env.SENTRY_PROJECT || "simko-web",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { disable: true },
  tunnelRoute: "/monitoring",
  telemetry: false,
})
