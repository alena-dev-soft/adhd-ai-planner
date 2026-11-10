// Values are inlined at build time by next.config.ts (`env`), so they work in
// the browser, on the server and in the proxy.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
