export function isGoogleAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function isDemoAdminModeEnabled(): boolean {
  if (isGoogleAuthConfigured()) return false;
  if (process.env.ALLOW_DEMO_ADMIN === "1") return true;
  return process.env.NODE_ENV !== "production";
}
