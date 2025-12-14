import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

// Server components (read-only cookies API, so wrap writes defensively)
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      get(name) {
        const value = cookieStore.get(name);
        return typeof value === "string" ? value : value?.value;
      },
      set(name, value, options) {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // ignore write errors in RSC context
        }
      },
      remove(name, options) {
        try {
          cookieStore.set(name, "", { ...options, maxAge: 0 });
        } catch {
          // ignore write errors in RSC context
        }
      },
    },
  });
}

// Route handlers (cookies() is mutable here)
export async function createSupabaseRouteHandlerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      get(name) {
        const value = cookieStore.get(name);
        return typeof value === "string" ? value : value?.value;
      },
      set(name, value, options) {
        cookieStore.set(name, value, options);
      },
      remove(name, options) {
        cookieStore.set(name, "", { ...options, maxAge: 0 });
      },
    },
  });
}

// Middleware helper so we can write cookies to the response
export function createSupabaseMiddlewareClient(
  req: NextRequest,
  res: NextResponse
): SupabaseClient {
  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      get(name) {
        const value = req.cookies.get(name);
        return typeof value === "string" ? value : value?.value;
      },
      set(name, value, options) {
        res.cookies.set(name, value, options);
      },
      remove(name, options) {
        res.cookies.set(name, "", { ...options, maxAge: 0 });
      },
    },
  });
}
