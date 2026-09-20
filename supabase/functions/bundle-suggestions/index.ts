// Supabase Edge Function: Cross-Sell / Bundle Engine (Frequently Bought Together)
// Runtime: Deno / TypeScript
// Endpoint: POST /functions/v1/bundle-suggestions

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BundleRequest {
  productId: string;
  limit?: number;
  bundleDiscountPercent?: number;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: BundleRequest = await req.json();
    if (!body.productId) {
      return new Response(JSON.stringify({ error: "productId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const limit = Math.min(Math.max(body.limit || 3, 1), 6);
    const discountPercent = body.bundleDiscountPercent ?? 5.0; // 5% bundle discount

    // 1. Fetch Primary Product
    const { data: primaryProduct, error: pErr } = await supabase
      .from("products")
      .select("id, title, slug, price, discount_price, category_id, images, stock")
      .eq("id", body.productId)
      .single();

    if (pErr || !primaryProduct) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Query Frequently Bought Together (FBT) Table
    const { data: fbtRows } = await supabase
      .from("frequently_bought_together")
      .select("product_b, co_purchase_count, confidence_score, products!frequently_bought_together_product_b_fkey(id, title, slug, price, discount_price, category_id, images, stock)")
      .eq("product_a", body.productId)
      .order("co_purchase_count", { ascending: false })
      .limit(limit);

    let bundleItems: any[] = (fbtRows || [])
      .map((row: any) => row.products)
      .filter((p: any) => p && p.stock > 0);

    let isColdStart = false;

    // 3. Cold-Start Fallback: If insufficient co-purchases (< 2 items), use content embedding similarity
    if (bundleItems.length < 2) {
      isColdStart = true;
      const { data: primaryEmbedding } = await supabase
        .from("product_embeddings")
        .select("embedding")
        .eq("product_id", body.productId)
        .maybeSingle();

      if (primaryEmbedding?.embedding) {
        const queryVector = typeof primaryEmbedding.embedding === "string"
          ? JSON.parse(primaryEmbedding.embedding)
          : primaryEmbedding.embedding;

        // Query pgvector for semantic neighbors in complementary categories
        const { data: fallbackCandidates } = await supabase.rpc(
          "match_recommended_products",
          {
            query_embedding: queryVector,
            match_threshold: 0.20,
            match_count: limit + 2,
            filter_category: null,
            exclude_product_ids: [body.productId, ...bundleItems.map((b) => b.id)],
          }
        );

        if (fallbackCandidates && fallbackCandidates.length > 0) {
          const needed = limit - bundleItems.length;
          bundleItems = [...bundleItems, ...fallbackCandidates.slice(0, needed)];
        }
      }
    }

    // 4. Calculate Combined Bundle Pricing with Bundle Discount
    const allProducts = [primaryProduct, ...bundleItems];
    const originalTotalPrice = allProducts.reduce((sum, p) => sum + Number(p.discount_price || p.price), 0);
    const bundleSavings = Math.round(originalTotalPrice * (discountPercent / 100));
    const bundlePrice = originalTotalPrice - bundleSavings;

    return new Response(
      JSON.stringify({
        primaryProduct,
        bundleItems,
        pricing: {
          originalTotalPrice,
          bundlePrice,
          bundleSavings,
          discountPercent,
        },
        isColdStart,
        count: bundleItems.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
