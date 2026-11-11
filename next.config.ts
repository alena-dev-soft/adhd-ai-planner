import type { NextConfig } from "next";

// Supabase public config. Prefer NEXT_PUBLIC_* (see .env.example); fall back to the
// SUPABASE_URL / SUPABASE_ANON_KEY project secrets. Only the origin of the URL is used,
// because the secret may contain a trailing "/rest/v1/".
function origin(url: string | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: origin(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    ),
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
