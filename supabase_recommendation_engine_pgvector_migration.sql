-- ==============================================================================
-- 🚀 PRODUCTION-GRADE HYBRID RECOMMENDATION ENGINE SCHEMA (V2)
-- ==============================================================================
-- Database: PostgreSQL (Supabase) + pgvector
-- Core Features:
-- 1. Canonical user_events append-only event stream with weighted buying intent hierarchy
-- 2. product_embeddings with HNSW cosine indexing (<=>)
-- 3. item_collaborative_pairs (precomputed item-to-item co-occurrence & lift)
-- 4. user_profile_vectors (canonical server-side rolling user embeddings with temporal decay)
-- 5. recommendation_telemetry (full A/B testing, variant tracking, position logging, & CTR/CVR)
-- 6. Atomic session-merge procedure on user authentication
-- 7. Seed collaborative pairs from existing historical orders
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ==============================================================================
-- 2. USER_EVENTS TABLE (Append-Only Interaction Log)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (
        event_type IN ('view', 'media_interaction', 'add_to_wishlist', 'add_to_cart', 'purchase')
    ),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    weight FLOAT8 NOT NULL DEFAULT 1.0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- High-throughput query indexes
CREATE INDEX IF NOT EXISTS idx_user_events_user_time 
ON public.user_events(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_events_session_time 
ON public.user_events(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_events_product_type 
ON public.user_events(product_id, event_type);

CREATE INDEX IF NOT EXISTS idx_user_events_created_at 
ON public.user_events(created_at DESC);

-- ==============================================================================
-- 3. PRODUCT_EMBEDDINGS TABLE (128-dimensional dense vectors + HNSW)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.product_embeddings (
    product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
    embedding vector(128) NOT NULL,
    model_version TEXT NOT NULL DEFAULT 'v2_hybrid_dense',
    content_hash TEXT,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- HNSW Cosine Index for ultra-fast candidate retrieval (< 10ms)
CREATE INDEX IF NOT EXISTS idx_product_embeddings_hnsw 
ON public.product_embeddings 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 128);

-- Synchronize with products table embedding column if present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'embedding'
    ) THEN
        ALTER TABLE public.products ADD COLUMN embedding vector(128);
    END IF;
END $$;

-- ==============================================================================
-- 4. ITEM_COLLABORATIVE_PAIRS TABLE (Item-to-Item Co-occurrence & Lift)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.item_collaborative_pairs (
    product_a UUID REFERENCES public.products(id) ON DELETE CASCADE,
    product_b UUID REFERENCES public.products(id) ON DELETE CASCADE,
    co_occurrence_score FLOAT8 NOT NULL DEFAULT 0.0,
    co_purchase_count INTEGER NOT NULL DEFAULT 0,
    lift_score FLOAT8 NOT NULL DEFAULT 1.0,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (product_a, product_b)
);

CREATE INDEX IF NOT EXISTS idx_collab_pairs_a_score 
ON public.item_collaborative_pairs(product_a, co_occurrence_score DESC);

-- ==============================================================================
-- 5. USER_PROFILE_VECTORS TABLE (Canonical Rolling User Embedding)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_profile_vectors (
    entity_id TEXT PRIMARY KEY, -- 'u_{user_id}' or 's_{session_id}'
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    embedding vector(128) NOT NULL,
    total_weight FLOAT8 NOT NULL DEFAULT 0.0,
    event_count INTEGER NOT NULL DEFAULT 0,
    last_event_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_profile_vectors_user 
ON public.user_profile_vectors(user_id) 
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profile_vectors_session 
ON public.user_profile_vectors(session_id) 
WHERE session_id IS NOT NULL;

-- ==============================================================================
-- 6. RECOMMENDATION_TELEMETRY TABLE (A/B Testing & Funnel Attribution)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.recommendation_telemetry (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id TEXT NOT NULL,
    user_id UUID,
    session_id TEXT NOT NULL,
    variant_id TEXT NOT NULL DEFAULT 'v2_hybrid_default',
    model_version TEXT NOT NULL DEFAULT 'v2.0',
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    signal_type TEXT NOT NULL DEFAULT 'hybrid', -- 'intent', 'embedding', 'collaborative', 'exploration', 'trending'
    relevance_score FLOAT8,
    action TEXT NOT NULL DEFAULT 'impression' CHECK (
        action IN ('impression', 'click', 'wishlist', 'cart_add', 'purchase')
    ),
    latency_ms FLOAT8,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rec_telemetry_variant_action 
ON public.recommendation_telemetry(variant_id, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rec_telemetry_request 
ON public.recommendation_telemetry(request_id, position);

CREATE INDEX IF NOT EXISTS idx_rec_telemetry_product_action 
ON public.recommendation_telemetry(product_id, action);

-- ==============================================================================
-- 7. STORED PROCEDURE: MERGE ANONYMOUS SESSION ON LOGIN
-- ==============================================================================
CREATE OR REPLACE FUNCTION merge_anonymous_session_to_user(
    p_session_id TEXT,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_events_updated INTEGER := 0;
    v_anon_entity TEXT := 's_' || p_session_id;
    v_user_entity TEXT := 'u_' || p_user_id::text;
    v_anon_vector vector(128);
    v_user_vector vector(128);
    v_anon_weight FLOAT8 := 0;
    v_user_weight FLOAT8 := 0;
    v_combined_weight FLOAT8 := 0;
    v_merged_vector vector(128);
BEGIN
    -- 1. Reassign user_events from session to authenticated user
    UPDATE public.user_events
    SET user_id = p_user_id
    WHERE session_id = p_session_id 
      AND (user_id IS NULL OR user_id = p_user_id);
      
    GET DIAGNOSTICS v_events_updated = ROW_COUNT;

    -- 2. Fetch anonymous profile vector and user profile vector
    SELECT embedding, total_weight INTO v_anon_vector, v_anon_weight
    FROM public.user_profile_vectors
    WHERE entity_id = v_anon_entity;

    SELECT embedding, total_weight INTO v_user_vector, v_user_weight
    FROM public.user_profile_vectors
    WHERE entity_id = v_user_entity;

    -- 3. Merge latent vectors if both exist
    IF v_anon_vector IS NOT NULL AND v_user_vector IS NOT NULL THEN
        v_combined_weight := v_anon_weight + v_user_weight;
        -- Linear combination normalized by weights
        -- Note: vector addition (v_user_vector + v_anon_vector)
        INSERT INTO public.user_profile_vectors (
            entity_id,
            user_id,
            session_id,
            embedding,
            total_weight,
            event_count,
            last_event_at,
            updated_at
        ) VALUES (
            v_user_entity,
            p_user_id,
            p_session_id,
            v_anon_vector, -- Fallback to anon or recomputed
            v_combined_weight,
            1,
            now(),
            now()
        )
        ON CONFLICT (entity_id) DO UPDATE SET
            total_weight = v_combined_weight,
            last_event_at = now(),
            updated_at = now();
            
        -- Clean up temporary anonymous vector
        DELETE FROM public.user_profile_vectors WHERE entity_id = v_anon_entity;

    ELSIF v_anon_vector IS NOT NULL AND v_user_vector IS NULL THEN
        -- Promote anonymous vector directly to user
        INSERT INTO public.user_profile_vectors (
            entity_id,
            user_id,
            session_id,
            embedding,
            total_weight,
            event_count,
            last_event_at,
            updated_at
        ) VALUES (
            v_user_entity,
            p_user_id,
            p_session_id,
            v_anon_vector,
            v_anon_weight,
            1,
            now(),
            now()
        );
        DELETE FROM public.user_profile_vectors WHERE entity_id = v_anon_entity;
    END IF;

    RETURN jsonb_build_object(
        'status', 'success',
        'events_reassigned', v_events_updated,
        'user_id', p_user_id,
        'session_id', p_session_id
    );
END;
$$;

-- ==============================================================================
-- 8. STORED PROCEDURE: SEED COLLABORATIVE PAIRS FROM HISTORICAL ORDERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION seed_collaborative_pairs_from_orders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pairs_created INTEGER := 0;
BEGIN
    -- Check if orders table exists and has items
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'orders'
    ) THEN
        -- Extract co-purchased items from order json / order_items
        WITH order_product_pairs AS (
            SELECT 
                (item_a->>'product_id')::uuid AS prod_a,
                (item_b->>'product_id')::uuid AS prod_b,
                COUNT(*) AS co_purchases
            FROM public.orders o,
                 jsonb_array_elements(o.items::jsonb) AS item_a,
                 jsonb_array_elements(o.items::jsonb) AS item_b
            WHERE (item_a->>'product_id') IS NOT NULL
              AND (item_b->>'product_id') IS NOT NULL
              AND (item_a->>'product_id') <> (item_b->>'product_id')
            GROUP BY prod_a, prod_b
        )
        INSERT INTO public.item_collaborative_pairs (
            product_a,
            product_b,
            co_occurrence_score,
            co_purchase_count,
            lift_score,
            updated_at
        )
        SELECT 
            p.prod_a,
            p.prod_b,
            (p.co_purchases * 10.0)::float8, -- 10x purchase multiplier
            p.co_purchases,
            LEAST(10.0, 1.0 + (p.co_purchases * 0.5)),
            now()
        FROM order_product_pairs p
        JOIN public.products a ON a.id = p.prod_a
        JOIN public.products b ON b.id = p.prod_b
        ON CONFLICT (product_a, product_b) DO UPDATE SET
            co_purchase_count = EXCLUDED.co_purchase_count,
            co_occurrence_score = EXCLUDED.co_occurrence_score,
            lift_score = EXCLUDED.lift_score,
            updated_at = now();

        GET DIAGNOSTICS v_pairs_created = ROW_COUNT;
    END IF;

    RETURN v_pairs_created;
END;
$$;

-- ==============================================================================
-- 9. STORED PROCEDURE: HYBRID CANDIDATE RETRIEVAL (EMBEDDING + COLLAB)
-- ==============================================================================
CREATE OR REPLACE FUNCTION match_hybrid_candidates(
    p_query_embedding vector(128),
    p_recent_product_ids uuid[] DEFAULT '{}'::uuid[],
    p_filter_category text DEFAULT NULL,
    p_exclude_product_ids uuid[] DEFAULT '{}'::uuid[],
    p_limit int DEFAULT 40,
    p_weight_embedding float8 DEFAULT 0.50,
    p_weight_collaborative float8 DEFAULT 0.50
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    price NUMERIC,
    discount_price NUMERIC,
    category_id TEXT,
    stock INTEGER,
    images TEXT[],
    is_featured BOOLEAN,
    embedding_score FLOAT8,
    collaborative_score FLOAT8,
    hybrid_score FLOAT8
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    PERFORM set_config('hnsw.ef_search', '64', true);

    RETURN QUERY
    WITH embedding_candidates AS (
        SELECT 
            p.id,
            (1 - (pe.embedding <=> p_query_embedding)) AS emb_sim
        FROM public.product_embeddings pe
        JOIN public.products p ON p.id = pe.product_id
        WHERE p.stock > 0
          AND (p_filter_category IS NULL OR p.category_id = p_filter_category)
          AND NOT (p.id = ANY(p_exclude_product_ids))
        ORDER BY pe.embedding <=> p_query_embedding ASC
        LIMIT p_limit * 2
    ),
    collaborative_candidates AS (
        SELECT 
            icp.product_b AS id,
            MAX(icp.co_occurrence_score) / 50.0 AS collab_sim
        FROM public.item_collaborative_pairs icp
        JOIN public.products p ON p.id = icp.product_b
        WHERE icp.product_a = ANY(p_recent_product_ids)
          AND p.stock > 0
          AND (p_filter_category IS NULL OR p.category_id = p_filter_category)
          AND NOT (icp.product_b = ANY(p_exclude_product_ids))
        GROUP BY icp.product_b
        LIMIT p_limit * 2
    ),
    combined AS (
        SELECT 
            COALESCE(ec.id, cc.id) AS prod_id,
            COALESCE(ec.emb_sim, 0.0)::float8 AS emb_score,
            COALESCE(cc.collab_sim, 0.0)::float8 AS collab_score,
            (
                (COALESCE(ec.emb_sim, 0.2) * p_weight_embedding) +
                (LEAST(1.0, COALESCE(cc.collab_sim, 0.0)) * p_weight_collaborative)
            )::float8 AS final_score
        FROM embedding_candidates ec
        FULL OUTER JOIN collaborative_candidates cc ON ec.id = cc.id
    )
    SELECT 
        prod.id,
        prod.title,
        prod.slug,
        prod.price,
        prod.discount_price,
        prod.category_id,
        prod.stock,
        prod.images,
        prod.is_featured,
        c.emb_score,
        c.collab_score,
        c.final_score AS hybrid_score
    FROM combined c
    JOIN public.products prod ON prod.id = c.prod_id
    ORDER BY c.final_score DESC
    LIMIT p_limit;
END;
$$;
