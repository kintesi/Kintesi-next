// Supabase Edge Function: Personalized Search Re-Ranking
// Runtime: Deno / TypeScript
// Endpoint: POST /functions/v1/search-rerank

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchRequest {
  query: string;
  userId?: string;
  sessionId?: string;
  limit?: number;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: SearchRequest = await req.json();
    const query = (body.query || "").trim();
    if (!query) {
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const limit = Math.min(Math.max(body.limit || 24, 1), 60);
    const cleanQuery = query.toLowerCase();

    // 1. Fetch Candidate Products via Text Search & Category Match
    const { data: candidates } = await supabase
      .from("products")
      .select("id, title, slug, price, discount_price, category_id, stock, images, is_featured")
      .or(`title.ilike.%${cleanQuery}%,slug.ilike.%${cleanQuery}%,category_id.ilike.%${cleanQuery}%`)
      .gt("stock", 0)
      .limit(limit * 2);

    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({ data: [], count: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Exact-Match Protection: If user searched exact title or slug, lock at top!
    const exactMatches: any[] = [];
    const regularCandidates: any[] = [];

    candidates.forEach((prod) => {
      const titleLower = prod.title.toLowerCase();
      const slugLower = prod.slug.toLowerCase();
      if (titleLower === cleanQuery || slugLower === cleanQuery || titleLower.startsWith(cleanQuery + " ")) {
        exactMatches.push(prod);
      } else {
        regularCandidates.push(prod);
      }
    });

    // 3. Fetch User Profile Vector if available
    let userVector: number[] | null = null;
    const entityId = body.userId ? `u_${body.userId}` : body.sessionId ? `s_${body.sessionId}` : null;

    if (entityId) {
      const { data: userProf } = await supabase
        .from("user_profile_vectors")
        .select("embedding")
        .eq("entity_id", entityId)
        .maybeSingle();

      if (userProf?.embedding) {
        userVector = typeof userProf.embedding === "string" ? JSON.parse(userProf.embedding) : userProf.embedding;
      }
    }

    // 4. Score and Re-rank Regular Candidates
    let reRanked: any[] = [];

    if (userVector && regularCandidates.length > 0) {
      const candIds = regularCandidates.map((c) => c.id);
      const { data: embeddings } = await supabase
        .from("product_embeddings")
        .select("product_id, embedding")
        .in("product_id", candIds);

      const embMap = new Map(
        (embeddings || []).map((e: any) => [
          e.product_id,
          typeof e.embedding === "string" ? JSON.parse(e.embedding) : e.embedding,
        ])
      );

      const scored = regularCandidates.map((prod) => {
        let textScore = 1.0;
        if (prod.title.toLowerCase().includes(cleanQuery)) textScore += 2.0;

        let cosineSim = 0.5;
        const prodEmb = embMap.get(prod.id);
        if (prodEmb && Array.isArray(prodEmb)) {
          let dot = 0;
          for (let i = 0; i < 128; i++) dot += (userVector![i] || 0) * (prodEmb[i] || 0);
          cosineSim = Math.max(0, dot);
        }

        // Blend 60% text match score with 40% user personalization vector
        const finalScore = textScore * 0.6 + cosineSim * 0.4;
        return { prod, score: finalScore };
      });

      scored.sort((a, b) => b.score - a.score);
      reRanked = scored.map((s) => s.prod);
    } else {
      reRanked = regularCandidates;
    }

    // Combine exact matches first + re-ranked candidates
    const finalResults = [...exactMatches, ...reRanked].slice(0, limit);

    return new Response(JSON.stringify({ data: finalResults, count: finalResults.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
