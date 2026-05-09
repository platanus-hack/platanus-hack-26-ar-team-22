// NextAuth route handlers — sirve /api/auth/signin, /api/auth/callback/google,
// /api/auth/session, /api/auth/signout, etc.
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
