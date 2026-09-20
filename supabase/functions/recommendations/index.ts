// Supabase Edge Function: Hybrid Recommendation Engine (v2.0)
// Runtime: Deno / TypeScript
// Endpoint: POST /functions/v1/recommendations

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configurable Tuning Parameters & Default Variants
interface ExperimentConfig {
  variantId: string;
  weightEmbedding: number;
  weightCollaborative: number;
  weightPopularity: number;
  explorationBudget: number; // e.g. 0.12 = 12% slots
  maxConsecutiveCategory: number;
  maxConsecutiveBrand: number;
}

const EXPERIMENT_VARIANTS: Record<string, ExperimentConfig> = {
  variant_hybrid_balanced: {
    variantId: "variant_hybrid_balanced",
    weightEmbedding: 0.40,
    weightCollaborative: 0.40,
    weightPopularity: 0.20,
    explorationBudget: 0.12,
    maxConsecutiveCategory: 2,
    maxConsecutiveBrand: 2,
  },
  variant_embedding_heavy: {
    variantId: "variant_embedding_heavy",
    weightEmbedding: 0.65,
    weightCollaborative: 0.20,
    weightPopularity: 0.15,
    explorationBudget: 0.10,
    maxConsecutiveCategory: 2,
    maxConsecutiveBrand: 2,
  },
  variant_collab_heavy: {
    variantId: "variant_collab_heavy",
    weightEmbedding: 0.20,
    weightCollaborative: 0.60,
    weightPopularity: 0.20,
    explorationBudget: 0.15,
    maxConsecutiveCategory: 2,
    maxConsecutiveBrand: 2,
  },
};

// Buying Intent Event Weights Hierarchy
const EVENT_WEIGHTS: Record<string, number> = {
  view: 1.0,
  media_interaction: 1.5,
  add_to_wishlist: 3.0,
  add_to_cart: 5.0,
  purchase: 10.0,
};

interface RecommendationPayload {
  userId?: string;
  sessionId: string;
  categoryId?: string;
  searchQuery?: string;
  utmTerm?: string;
  excludeProductIds?: string[];
  limit?: number;
  variantId?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = performance.now();
  const requestId = crypto.randomUUID();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: RecommendationPayload = await req.json();
    const limit = Math.min(Math.max(body.limit || 24, 4), 60);
    const sessionId = body.sessionId || "anon_" + crypto.randomUUID();
    const userId = body.userId || null;

    // 1. A/B Testing Variant Determination (Deterministic Murmur-style Hash)
    const assignedVariantKey =
      body.variantId && EXPERIMENT_VARIANTS[body.variantId]
        ? body.variantId
        : getDeterministicVariant(userId || sessionId);

    const config = EXPERIMENT_VARIANTS[assignedVariantKey] || EXPERIMENT_VARIANTS.variant_hybrid_balanced;

    // 2. Fetch Recent Interactions from user_events table
    let recentProductIds: string[] = [];
    let userVector: number[] | null = null;
    let isColdStart = false;

    // Check user_profile_vectors first (Canonical Server-Side User State)
    const entityId = userId ? `u_${userId}` : `s_${sessionId}`;
    const { data: profileRecord } = await supabase
      .from("user_profile_vectors")
      .select("embedding, last_event_at")
      .eq("entity_id", entityId)
      .maybeSingle();

    if (profileRecord?.embedding) {
      userVector = typeof profileRecord.embedding === "string"
        ? JSON.parse(profileRecord.embedding)
        : profileRecord.embedding;
    }

    // Query recent weighted events
    const { data: recentEvents } = await supabase
      .from("user_events")
      .select("product_id, event_type, weight, created_at")
      .or(userId ? `user_id.eq.${userId},session_id.eq.${sessionId}` : `session_id.eq.${sessionId}`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (recentEvents && recentEvents.length > 0) {
      recentProductIds = Array.from(new Set(recentEvents.map((e) => e.product_id)));

      // If user vector was missing, compute real-time in-session weighted centroid
      if (!userVector) {
        const { data: eventProductEmbeddings } = await supabase
          .from("product_embeddings")
          .select("product_id, embedding")
          .in("product_id", recentProductIds);

        if (eventProductEmbeddings && eventProductEmbeddings.length > 0) {
          const embMap = new Map(
            eventProductEmbeddings.map((item) => [
              item.product_id,
              typeof item.embedding === "string" ? JSON.parse(item.embedding) : item.embedding,
            ])
          );

          const dim = 128;
          const centroid = new Array(dim).fill(0);
          let totalWeight = 0;

          recentEvents.forEach((evt) => {
            const emb = embMap.get(evt.product_id);
            if (emb && Array.isArray(emb)) {
              // Calculate temporal decay: purchases decay slowly (30d), views decay faster (3d)
              const eventAgeDays =
                (Date.now() - new Date(evt.created_at).getTime()) / (1000 * 60 * 60 * 24);
              const halfLife = evt.event_type === "purchase" ? 30.0 : 3.0;
              const decay = Math.pow(0.5, eventAgeDays / halfLife);

              const w = (evt.weight || EVENT_WEIGHTS[evt.event_type] || 1.0) * decay;
              totalWeight += w;
              for (let i = 0; i < dim; i++) {
                centroid[i] += (emb[i] || 0) * w;
              }
            }
          });

          if (totalWeight > 0) {
            let norm = 0;
            for (let i = 0; i < dim; i++) {
              centroid[i] /= totalWeight;
              norm += centroid[i] * centroid[i];
            }
            norm = Math.sqrt(norm);
            if (norm > 0) {
              userVector = centroid.map((v) => v / norm);
            }
          }
        }
      }
    }

    // Cold-Start Fallback: If no vector could be established
    if (!userVector) {
      isColdStart = true;
      // Default to deterministic anchor or trending category
      userVector = new Array(128).fill(1 / Math.sqrt(128));
    }

    // 3. Execute Hybrid Candidate Retrieval RPC
    const candidatePoolSize = Math.min(limit * 3, 100);
    const { data: candidates, error: rpcError } = await supabase.rpc(
      "match_hybrid_candidates",
      {
        p_query_embedding: userVector,
        p_recent_product_ids: recentProductIds,
        p_filter_category: body.categoryId || null,
        p_exclude_product_ids: body.excludeProductIds || [],
        p_limit: candidatePoolSize,
        p_weight_embedding: config.weightEmbedding,
        p_weight_collaborative: config.weightCollaborative,
      }
    );

    let candidateList = candidates || [];

    // Progressive Fallback: If no vector candidates matched
    if (!candidateList || candidateList.length === 0) {
      const { data: fallbackProducts } = await supabase
        .from("products")
        .select("id, title, slug, price, discount_price, category_id, stock, images, is_featured")
        .eq("stock", 10)
        .limit(limit);

      candidateList = (fallbackProducts || []).map((p: any) => ({
        ...p,
        embedding_score: 0.5,
        collaborative_score: 0.5,
        hybrid_score: 0.5,
      }));
    }

    // 4. Intent Match Surface (Search Query / Landing UTM)
    const activeSearchTerms = [
      ...(body.searchQuery ? body.searchQuery.toLowerCase().split(/\s+/) : []),
      ...(body.utmTerm ? body.utmTerm.toLowerCase().split(/\s+/) : []),
    ].filter((t) => t.length > 1);

    if (activeSearchTerms.length > 0) {
      candidateList.forEach((item: any) => {
        const text = `${item.title} ${item.category_id || ""}`.toLowerCase();
        let matchScore = 0;
        activeSearchTerms.forEach((term) => {
          if (text.includes(term)) matchScore += 10.0;
        });
        if (matchScore > 0) {
          item.hybrid_score += matchScore;
          item.signal_type = "intent";
        }
      });
      // Sort to ensure explicit intent matches rise to the top
      candidateList.sort((a: any, b: any) => b.hybrid_score - a.hybrid_score);
    }

    // 5. Exploration Budget Selection (Bandit / Epsilon-Greedy)
    const explorationCount = Math.floor(limit * config.explorationBudget);
    let explorationItems: any[] = [];

    if (explorationCount > 0) {
      // Find underexposed items (e.g. stock > 0 but low recommendation telemetry)
      const { data: underExposed } = await supabase
        .from("products")
        .select("id, title, slug, price, discount_price, category_id, stock, images, is_featured")
        .gt("stock", 0)
        .order("created_at", { ascending: false })
        .limit(explorationCount * 2);

      if (underExposed && underExposed.length > 0) {
        explorationItems = underExposed.slice(0, explorationCount).map((p) => ({
          ...p,
          hybrid_score: 0.88,
          signal_type: "exploration",
        }));
      }
    }

    // 6. Apply Diversity & Anti-Filter Bubble Capping
    const finalRanked = applyDiversityAndExploration(
      candidateList,
      explorationItems,
      limit,
      config.maxConsecutiveCategory,
      config.maxConsecutiveBrand
    );

    const elapsedMs = performance.now() - startTime;

    // 7. Telemetry & A/B Variant Logging (Asynchronous)
    if (finalRanked.length > 0) {
      const telemetryRows = finalRanked.map((item, idx) => ({
        request_id: requestId,
        user_id: userId,
        session_id: sessionId,
        variant_id: config.variantId,
        model_version: "v2.0",
        product_id: item.id,
        position: idx + 1,
        signal_type: item.signal_type || "hybrid",
        relevance_score: Number((item.hybrid_score || 0).toFixed(4)),
        action: "impression",
        latency_ms: Number(elapsedMs.toFixed(2)),
      }));

      // Fire-and-forget logging
      supabase
        .from("recommendation_telemetry")
        .insert(telemetryRows)
        .then(() => {})
        .catch((err) => console.error("[Telemetry] insert error:", err));
    }

    return new Response(
      JSON.stringify({
        data: finalRanked,
        requestId,
        variantId: config.variantId,
        modelVersion: "v2.0",
        latencyMs: Number(elapsedMs.toFixed(2)),
        isColdStart,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Server-Timing": `rec-engine;dur=${elapsedMs.toFixed(1)}`,
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message, requestId }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Deterministic variant assignment based on user/session ID
function getDeterministicVariant(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const buckets = Object.keys(EXPERIMENT_VARIANTS);
  const index = Math.abs(hash) % buckets.length;
  return buckets[index];
}

// Diversity Capping (e.g. max 2 consecutive from same category) & Exploration Injection
function applyDiversityAndExploration(
  candidates: any[],
  explorationItems: any[],
  limit: number,
  maxConsecutiveCat: number,
  maxConsecutiveBrand: number
): any[] {
  const result: any[] = [];
  const pool = [...candidates];

  // Interleave exploration items
  if (explorationItems.length > 0) {
    const interval = Math.max(3, Math.floor(limit / explorationItems.length));
    explorationItems.forEach((item, i) => {
      const idx = (i + 1) * interval;
      if (idx < pool.length) {
        pool.splice(idx, 0, item);
      } else {
        pool.push(item);
      }
    });
  }

  let consecutiveCatCount = 0;
  let lastCategory = "";

  while (result.length < limit && pool.length > 0) {
    let chosenIndex = -1;

    for (let i = 0; i < pool.length; i++) {
      const cat = pool[i].category_id || "";
      if (cat === lastCategory && consecutiveCatCount >= maxConsecutiveCat) {
        // Skip this item for now to break consecutive cluster
        continue;
      }
      chosenIndex = i;
      break;
    }

    // If all candidates in pool violate the cap, pick the next available
    if (chosenIndex === -1) {
      chosenIndex = 0;
    }

    const item = pool.splice(chosenIndex, 1)[0];
    const cat = item.category_id || "";

    if (cat === lastCategory) {
      consecutiveCatCount++;
    } else {
      lastCategory = cat;
      consecutiveCatCount = 1;
    }

    result.push(item);
  }

  return result;
}
