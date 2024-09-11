import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // Here you should check the credentials against your database
        // For now, we'll just use a dummy check
        if (credentials?.email === "user@example.com" && credentials?.password === "password") {
          return { id: "1", name: "J Smith", email: "user@example.com" }
        } else {
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
})
