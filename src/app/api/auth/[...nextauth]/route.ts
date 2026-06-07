/**
 * @file src/app/api/auth/[...nextauth]/route.ts
 * @description Route Handler API untuk endpoint /api/auth/[...nextauth]/route.ts
 */

import { handlers } from "@/lib/auth"
export const { GET, POST } = handlers
