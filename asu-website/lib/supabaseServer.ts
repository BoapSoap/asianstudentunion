import { cookies } from "next/headers";
import {
  createRouteHandlerClient,
  createServerComponentClient,
  type SupabaseClient,
} from "@supabase/auth-helpers-nextjs";

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const store = cookies();
  return createServerComponentClient({
    cookies: () => store,
  });
}

export async function createSupabaseRouteHandlerClient(): Promise<SupabaseClient> {
  const store = cookies();
  return createRouteHandlerClient({
    cookies: () => store,
  });
}
