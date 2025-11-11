import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        // this redirects to login page rather than default login page of next-auth
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) { // auth for user's session and request for incoming request
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
            if (isOnDashboard) {
                if (isLoggedIn) {
                    return true
                }
                return false // redirect aunauthenticated user to login page
            } else if (isLoggedIn) {
                return Response.redirect(new URL("/dashboard", nextUrl))
            }
            return true
        },
    },
    providers: [], // providers empty for now since we only use credentials 
} satisfies NextAuthConfig
