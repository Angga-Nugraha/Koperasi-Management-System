import { withSentryConfig } from "@sentry/nextjs"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  allowedDevOrigins: ["lubricate-wagon-caregiver.ngrok-free.dev"],
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "simko",
  project: process.env.SENTRY_PROJECT || "simko-web",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { disable: true },
  disableLogger: true,
  tunnelRoute: "/monitoring",
  telemetry: false,
})
