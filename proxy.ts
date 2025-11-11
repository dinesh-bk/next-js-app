import NextAuth from "next-auth";
import { authConfig } from "./auth.config";


// initialize NextAuth.js with authConfig and export auth property
export default NextAuth(authConfig).auth

export const config = {
    // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
    //matcher so that it should run on specific paths only 
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}