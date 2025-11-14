import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        // define routes for signIn, signOut and Error also, but here we will only use signIn
        // this will also prevent from redirecting to default login page of next-auth
        signIn: "/login",
    },
    // authorized callback is used to verfity if the request is authorized to access a page with Next.js Proxy. It is called before a request is completed. 
    callbacks: {
        // auth for user's session and request for incoming request
        authorized({ auth, request: { nextUrl } }) { 
            // check for user's session
            const isLoggedIn = !!auth?.user
            // check the requet is coming from /dashbaord or not since it needs user to login to access
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
            if (isOnDashboard) {
                if (isLoggedIn) {
                    return true
                }
                return false // redirect unauthenticated user to login page
            } else if (isLoggedIn) {
                return Response.redirect(new URL("/dashboard", nextUrl))
            }
            return true
        },
    },
    providers: [], // providers empty for now we will set up is auth.ts file
} satisfies NextAuthConfig
