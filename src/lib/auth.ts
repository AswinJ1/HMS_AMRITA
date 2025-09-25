import NextAuth, { NextAuthOptions } from "next-auth"
import { getServerSession } from "next-auth/next"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { loginSchema } from "@/lib/validations/auth"
import { Role } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        uid: { label: "UID", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials, request) {
        try {
          const { email, uid, password, role } = credentials as {
            email?: string
            uid?: string
            password: string
            role: Role
          }

          // Find user based on role and credentials
          let user = null

          if (role === "ADMIN" || role === "STUDENT") {
            // Admin and Student login with email
            if (!email) throw new Error("Email is required")
            
            user = await prisma.user.findUnique({
              where: { email },
              include: {
                admin: true,
                student: true,
              },
            })
          } else if (role === "STAFF" || role === "HOSTEL" || role === "TEAM_LEAD" || role === "SECURITY") {
            // Staff, Hostel, Team Lead, and Security login with UID
            if (!uid) throw new Error("UID is required")
            
            user = await prisma.user.findUnique({
              where: { uid },
              include: {
                staff: role === "STAFF" ? true : undefined,
                teamLead: role === "TEAM_LEAD" ? true : undefined,
                hostel: role === "HOSTEL" ? true : undefined,
                security: role === "SECURITY" ? true : undefined,
                // Only include what we need for each role
              },
            })
          }

          if (!user) {
            throw new Error("Invalid credentials")
          }

          // Verify role matches
          if (user.role !== role) {
            throw new Error("Invalid role")
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.password)
          if (!isValidPassword) {
            throw new Error("Invalid password")
          }

          return {
            id: user.id,
            email: user.email,
            uid: user.uid || undefined,
            role: user.role,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.uid = user.uid
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.uid = token.uid as string | undefined
      }
      return session
    },
  },
}

export default NextAuth(authOptions)

// Helper function for server components
export const auth = () => getServerSession(authOptions)