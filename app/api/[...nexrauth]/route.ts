// app/api/auth/[...nextauth]/route.ts

// This file exports the HTTP request handlers that power NextAuth.js.
// When a user tries to sign in, sign out, or when an OAuth provider
// redirects back to your app, the request will be handled by these exports.

// We are importing the 'handlers' object from our main auth configuration file.
import { handlers } from "@/auth";

// The 'handlers' object contains a GET and a POST handler.
// We are re-exporting them here using the route segment's naming convention.
// - Any GET request to /api/auth/* will be handled by handlers.GET.
// - Any POST request to /api/auth/* will be handled by handlers.POST.
export const { GET, POST } = handlers;

// You can also write it like this, which is functionally identical:
// export { handlers as GET, handlers as POST }
