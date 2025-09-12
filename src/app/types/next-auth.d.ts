import { Role } from "@prisma/client"
import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      uid?: string
    } & DefaultSession["user"]
  }

  interface User {
    role: Role
    uid?: string
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: Role
    uid?: string
  }
}