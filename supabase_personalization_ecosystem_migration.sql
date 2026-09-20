-- ==============================================================================
-- 🌐 FULL PERSONALIZATION ECOSYSTEM MIGRATION (BEYOND CORE RECOMMENDATIONS)
-- ==============================================================================
-- Database: PostgreSQL (Supabase)
-- 1. Frequently Bought Together (FBT / Cross-sell Bundles)
-- 2. Customer Segmentation Engine (user_segments)
-- 3. Canonical Wishlist with price-at-add for Price-Drop Alerts
-- 4. Abandoned Cart Recovery & Generic Notification Queue
-- 5. Dynamic Homepage Merchandising Rules (segment -> layout/hero)
-- 6. Honest, Auditable Real-Time Urgency & Social Proof (viewers_now, recently_purchased)
-- 7. Loyalty & Gamification System (points, tiers, redemption -> user_events)
-- ==============================================================================

-- 1. FREQUENTLY BOUGHT TOGETHER (Cross-sell / Bundle Engine)
CREATE TABLE IF NOT EXISTS public.frequently_bought_together (
    product_a UUID REFERENCES public.products(id) ON DELETE CASCADE,
    product_b UUID REFERENCES public.products(id) ON DELETE CASCADE,
    co_purchase_count INTEGER NOT NULL DEFAULT 1,
    confidence_score FLOAT8 NOT NULL DEFAULT 0.0,
    bundle_discount_percent NUMERIC(4, 2) DEFAULT 5.0,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (product_a, product_b)
);

CREATE INDEX IF NOT EXISTS idx_fbt_product_a 
ON public.frequently_bought_together(product_a, co_purchase_count DESC);

-- 2. CUSTOMER SEGMENTS TABLE
CREATE TABLE IF NOT EXISTS public.user_segments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    primary_segment TEXT NOT NULL CHECK (
        primary_segment IN (
            'new_visitor',
            'browser_no_purchase',
            'repeat_customer',
            'high_value',
            'at_risk_churn',
            'price_sensitive'
        )
    ),
    secondary_segments TEXT[] DEFAULT '{}'::TEXT[],
    lifetime_spend NUMERIC(12, 2) DEFAULT 0.0,
    total_orders INTEGER DEFAULT 0,
    days_since_last_order INTEGER,
    discount_affinity_score FLOAT8 DEFAULT 0.0, -- ratio of discounted items viewed/purchased
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_segments_user_id 
ON public.user_segments(user_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_segments_session_id 
ON public.user_segments(session_id) 
WHERE session_id IS NOT NULL;

-- 3. WISHLIST TABLE (With price_at_add tracking for price drops)
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    price_at_add NUMERIC(10, 2) NOT NULL,
    notified_price_drop BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_product_wishlist UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_created 
ON public.wishlist_items(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wishlist_product_drop 
ON public.wishlist_items(product_id, price_at_add) 
WHERE notified_price_drop = false;

-- 4. GENERIC NOTIFICATION QUEUE (Vendor-Agnostic: Email, Push, SMS, Webhook)
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('user', 'session', 'email', 'phone')),
    recipient_id TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'webhook')),
    notification_type TEXT NOT NULL CHECK (
        notification_type IN ('abandoned_cart', 'price_drop', 'win_back', 'points_earned', 'order_status')
    ),
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'delivered', 'failed')),
    scheduled_for TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status_time 
ON public.notification_queue(status, scheduled_for ASC);

-- 5. DYNAMIC HOMEPAGE MERCHANDISING RULES TABLE
CREATE TABLE IF NOT EXISTS public.homepage_slot_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    segment TEXT NOT NULL, -- 'new_visitor', 'repeat_customer', 'at_risk_churn', 'price_sensitive', 'all'
    slot_name TEXT NOT NULL, -- 'hero_banner', 'featured_rail', 'middle_promo', 'bottom_feed'
    headline TEXT NOT NULL,
    subtitle TEXT,
    layout_type TEXT NOT NULL CHECK (
        layout_type IN ('curated_picks', 'trending_grid', 'winback_offer', 'discount_carousel', 'category_spotlight')
    ),
    badge_text TEXT,
    cta_text TEXT,
    cta_link TEXT,
    priority INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_slot_rules_segment_slot 
ON public.homepage_slot_rules(segment, slot_name, priority DESC) 
WHERE is_active = true;

-- 6. LOYALTY & GAMIFICATION SYSTEM
CREATE TABLE IF NOT EXISTS public.loyalty_points (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    points_balance INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
    lifetime_points INTEGER NOT NULL DEFAULT 0,
    tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    points_change INTEGER NOT NULL, -- positive for earning, negative for redemption
    event_type TEXT NOT NULL CHECK (
        event_type IN ('purchase_reward', 'points_redeemed', 'referral_bonus', 'tier_upgrade')
    ),
    order_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tx_user 
ON public.loyalty_transactions(user_id, created_at DESC);

-- ==============================================================================
-- 7. AUDITABLE REAL-TIME URGENCY & SOCIAL PROOF RPC
-- ==============================================================================
CREATE OR REPLACE FUNCTION get_product_social_proof(p_product_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_viewers_now INTEGER := 0;
    v_stock_remaining INTEGER := 0;
    v_recently_purchased_24h INTEGER := 0;
BEGIN
    -- 1. Real active viewers in last 15 minutes from user_events
    SELECT COUNT(DISTINCT session_id) INTO v_viewers_now
    FROM public.user_events
    WHERE product_id = p_product_id
      AND event_type = 'view'
      AND created_at >= (now() - interval '15 minutes');

    -- 2. Real current stock level
    SELECT stock INTO v_stock_remaining
    FROM public.products
    WHERE id = p_product_id;

    -- 3. Real purchases in last 24 hours from user_events
    SELECT COUNT(*) INTO v_recently_purchased_24h
    FROM public.user_events
    WHERE product_id = p_product_id
      AND event_type = 'purchase'
      AND created_at >= (now() - interval '24 hours');

    RETURN jsonb_build_object(
        'product_id', p_product_id,
        'viewers_now', COALESCE(v_viewers_now, 0),
        'stock_remaining', COALESCE(v_stock_remaining, 0),
        'recently_purchased_24h', COALESCE(v_recently_purchased_24h, 0),
        'is_low_stock', (COALESCE(v_stock_remaining, 0) > 0 AND COALESCE(v_stock_remaining, 0) <= 5),
        'timestamp', now()
    );
END;
$$;

-- ==============================================================================
-- 8. NIGHTLY REFRESH RPC: FREQUENTLY BOUGHT TOGETHER BUNDLES
-- ==============================================================================
CREATE OR REPLACE FUNCTION refresh_frequently_bought_together()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rows INTEGER := 0;
BEGIN
    -- Refresh co-purchases from orders
    WITH raw_pairs AS (
        SELECT 
            (item_a->>'product_id')::uuid AS p_a,
            (item_b->>'product_id')::uuid AS p_b,
            COUNT(*) AS cnt
        FROM public.orders o,
             jsonb_array_elements(o.items::jsonb) AS item_a,
             jsonb_array_elements(o.items::jsonb) AS item_b
        WHERE (item_a->>'product_id') IS NOT NULL
          AND (item_b->>'product_id') IS NOT NULL
          AND (item_a->>'product_id') <> (item_b->>'product_id')
        GROUP BY p_a, p_b
        HAVING COUNT(*) >= 1
    )
    INSERT INTO public.frequently_bought_together (
        product_a,
        product_b,
        co_purchase_count,
        confidence_score,
        updated_at
    )
    SELECT 
        rp.p_a,
        rp.p_b,
        rp.cnt,
        LEAST(1.0, rp.cnt::float8 / 5.0),
        now()
    FROM raw_pairs rp
    ON CONFLICT (product_a, product_b) DO UPDATE SET
        co_purchase_count = EXCLUDED.co_purchase_count,
        confidence_score = EXCLUDED.confidence_score,
        updated_at = now();

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RETURN v_rows;
END;
$$;

-- ==============================================================================
-- 9. NIGHTLY REFRESH RPC: CUSTOMER SEGMENTS COMPUTATION
-- ==============================================================================
CREATE OR REPLACE FUNCTION refresh_customer_segments()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Process authenticated users
    WITH user_metrics AS (
        SELECT 
            u.id AS user_id,
            COALESCE(SUM(o.total_amount), 0) AS spend,
            COUNT(o.id) AS order_cnt,
            COALESCE(
                EXTRACT(DAY FROM now() - MAX(o.created_at))::int, 
                999
            ) AS days_since_last,
            COUNT(ue.id) FILTER (WHERE ue.created_at >= now() - interval '30 days') AS recent_events,
            AVG(
                CASE WHEN (ue.metadata->>'discount_percentage')::float8 > 0 THEN 1.0 ELSE 0.0 END
            ) AS discount_ratio
        FROM auth.users u
        LEFT JOIN public.orders o ON o.user_id = u.id AND o.status IN ('completed', 'processing', 'delivered')
        LEFT JOIN public.user_events ue ON ue.user_id = u.id
        GROUP BY u.id
    ),
    classified AS (
        SELECT 
            user_id,
            spend,
            order_cnt,
            days_since_last,
            COALESCE(discount_ratio, 0.0) AS discount_affinity,
            CASE 
                WHEN spend >= 10000 OR order_cnt >= 5 THEN 'high_value'
                WHEN order_cnt >= 2 AND days_since_last <= 60 THEN 'repeat_customer'
                WHEN order_cnt >= 1 AND days_since_last > 60 THEN 'at_risk_churn'
                WHEN order_cnt = 0 AND recent_events >= 5 AND discount_ratio >= 0.5 THEN 'price_sensitive'
                WHEN order_cnt = 0 AND recent_events >= 2 THEN 'browser_no_purchase'
                ELSE 'new_visitor'
            END AS primary_seg
        FROM user_metrics
    )
    INSERT INTO public.user_segments (
        user_id,
        primary_segment,
        lifetime_spend,
        total_orders,
        days_since_last_order,
        discount_affinity_score,
        updated_at
    )
    SELECT 
        c.user_id,
        c.primary_seg,
        c.spend,
        c.order_cnt,
        c.days_since_last,
        c.discount_affinity,
        now()
    FROM classified c
    ON CONFLICT (user_id) DO UPDATE SET
        primary_segment = EXCLUDED.primary_segment,
        lifetime_spend = EXCLUDED.lifetime_spend,
        total_orders = EXCLUDED.total_orders,
        days_since_last_order = EXCLUDED.days_since_last_order,
        discount_affinity_score = EXCLUDED.discount_affinity_score,
        updated_at = now();

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- ==============================================================================
-- 10. CRON RPC: ABANDONED CART DETECTION & QUEUE DISPATCH
-- ==============================================================================
CREATE OR REPLACE FUNCTION detect_and_queue_abandoned_carts(p_inactivity_hours INT DEFAULT 2)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_queued INTEGER := 0;
BEGIN
    WITH abandoned_sessions AS (
        SELECT 
            ue.session_id,
            MAX(ue.user_id) AS user_id,
            array_agg(DISTINCT ue.product_id) AS cart_product_ids,
            MAX(ue.created_at) AS last_cart_time
        FROM public.user_events ue
        WHERE ue.event_type = 'add_to_cart'
          AND ue.created_at <= (now() - (p_inactivity_hours || ' hours')::interval)
          AND ue.created_at >= (now() - (p_inactivity_hours + 24 || ' hours')::interval)
          AND NOT EXISTS (
              SELECT 1 FROM public.user_events pur
              WHERE (pur.session_id = ue.session_id OR pur.user_id = ue.user_id)
                AND pur.event_type = 'purchase'
                AND pur.created_at >= ue.created_at
          )
        GROUP BY ue.session_id
    )
    INSERT INTO public.notification_queue (
        recipient_type,
        recipient_id,
        channel,
        notification_type,
        payload,
        status,
        scheduled_for
    )
    SELECT 
        CASE WHEN s.user_id IS NOT NULL THEN 'user' ELSE 'session' END,
        COALESCE(s.user_id::text, s.session_id),
        'email',
        'abandoned_cart',
        jsonb_build_object(
            'session_id', s.session_id,
            'user_id', s.user_id,
            'abandoned_product_ids', s.cart_product_ids,
            'abandoned_at', s.last_cart_time,
            'recovery_discount_code', 'SAVE5',
            'recommended_products_count', 3
        ),
        'pending',
        now()
    FROM abandoned_sessions s
    WHERE NOT EXISTS (
        SELECT 1 FROM public.notification_queue nq
        WHERE nq.notification_type = 'abandoned_cart'
          AND (nq.payload->>'session_id' = s.session_id OR (s.user_id IS NOT NULL AND nq.recipient_id = s.user_id::text))
          AND nq.created_at >= (now() - interval '48 hours')
    );

    GET DIAGNOSTICS v_queued = ROW_COUNT;
    RETURN v_queued;
END;
$$;

-- ==============================================================================
-- 11. CRON RPC: WISHLIST PRICE DROP DETECTION & QUEUE DISPATCH
-- ==============================================================================
CREATE OR REPLACE FUNCTION detect_and_queue_price_drops()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_drops_queued INTEGER := 0;
BEGIN
    WITH price_drops AS (
        SELECT 
            w.id AS wishlist_id,
            w.user_id,
            w.product_id,
            w.price_at_add,
            p.price AS current_price,
            p.title AS product_title,
            p.slug AS product_slug,
            (w.price_at_add - p.price) AS price_diff,
            ROUND(((w.price_at_add - p.price) / w.price_at_add * 100)::numeric, 1) AS drop_percent
        FROM public.wishlist_items w
        JOIN public.products p ON p.id = w.product_id
        WHERE p.price < w.price_at_add
          AND (w.price_at_add - p.price) >= 50 -- Minimum drop of 50 BDT
          AND w.notified_price_drop = false
    )
    INSERT INTO public.notification_queue (
        recipient_type,
        recipient_id,
        channel,
        notification_type,
        payload,
        status,
        scheduled_for
    )
    SELECT 
        'user',
        pd.user_id::text,
        'email',
        'price_drop',
        jsonb_build_object(
            'product_id', pd.product_id,
            'product_title', pd.product_title,
            'product_slug', pd.product_slug,
            'original_price', pd.price_at_add,
            'new_price', pd.current_price,
            'drop_amount', pd.price_diff,
            'drop_percent', pd.drop_percent
        ),
        'pending',
        now()
    FROM price_drops pd
    WHERE pd.user_id IS NOT NULL;

    -- Mark wishlist items as notified
    UPDATE public.wishlist_items w
    SET notified_price_drop = true
    FROM public.products p
    WHERE p.id = w.product_id
      AND p.price < w.price_at_add;

    GET DIAGNOSTICS v_drops_queued = ROW_COUNT;
    RETURN v_drops_queued;
END;
$$;
