import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

// Thils file will run before request is completed so here we verfies authentication before rendering the protected routes.
// Where are procted routes? It is defined in the matcher

// initialize NextAuth.js with authConfig and export auth property
export default NextAuth(authConfig).auth

export const config = {
    // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
    // matcher allows you to target specific paths for the proxy to run on
    // here run proxy on all the paths excepts on the path that starts with api, _next/static, _next/image or end with .png
    // negative lookahead (?!...) is used for this
    matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
}
