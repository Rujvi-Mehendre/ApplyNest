import { createBrowserClient } from "@supabase/ssr"

// We use an untyped client here so mutations don't conflict with our
// hand-written Database type before the real Supabase project is connected.
// After connecting Supabase, run `npx supabase gen types` to replace types.ts.
export function createClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
