// Supabase Edge Function: Dropshipping BD Proxy
// Runtime: Deno / TypeScript
// Endpoint: GET /functions/v1/dropshipping-proxy?page=1

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, api-key, secret-key",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const page = url.searchParams.get("page") || "1";
    const upstreamUrl = `https://mohasagor.com.bd/api/reseller/product?page=${page}`;

    const res = await fetch(upstreamUrl, {
      headers: {
        "api-key": "A8niclztH9JtzS4t",
        "secret-key": "2ff380917a11d3a7c97bcf6dddfb8adf38194c7d6b726ab12c4d0d5fb136fef8",
        "Accept": "application/json",
      },
    });

    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
