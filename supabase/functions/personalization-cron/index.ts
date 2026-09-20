// Supabase Edge Function: Personalization Ecosystem Cron & Scheduled Automation
// Runtime: Deno / TypeScript
// Endpoint: POST /functions/v1/personalization-cron

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = performance.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const summary: Record<string, any> = {};

    // 1. Refresh Frequently Bought Together Co-occurrence Matrix
    const { data: fbtRows, error: fbtErr } = await supabase.rpc("refresh_frequently_bought_together");
    summary.fbt_pairs_updated = fbtErr ? `error: ${fbtErr.message}` : (fbtRows || 0);

    // 2. Refresh Customer Segments
    const { data: segRows, error: segErr } = await supabase.rpc("refresh_customer_segments");
    summary.segments_updated = segErr ? `error: ${segErr.message}` : (segRows || 0);

    // 3. Detect & Queue Abandoned Carts (inactivity >= 2 hours)
    const { data: abandonedQueued, error: cartErr } = await supabase.rpc("detect_and_queue_abandoned_carts", {
      p_inactivity_hours: 2,
    });
    summary.abandoned_carts_queued = cartErr ? `error: ${cartErr.message}` : (abandonedQueued || 0);

    // 4. Detect & Queue Wishlist Price Drops
    const { data: dropsQueued, error: dropErr } = await supabase.rpc("detect_and_queue_price_drops");
    summary.price_drops_queued = dropErr ? `error: ${dropErr.message}` : (dropsQueued || 0);

    // 5. Dispatch Pending Notification Queue to Generic Webhook (e.g. Klaviyo / SendGrid / Custom Webhook)
    const webhookUrl = Deno.env.get("NOTIFICATION_DISPATCH_WEBHOOK_URL");
    if (webhookUrl) {
      const { data: pendingNotifications } = await supabase
        .from("notification_queue")
        .select("*")
        .eq("status", "pending")
        .lte("scheduled_for", new Date().toISOString())
        .limit(50);

      if (pendingNotifications && pendingNotifications.length > 0) {
        let sentCount = 0;
        for (const item of pendingNotifications) {
          try {
            const res = await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                notification_id: item.id,
                channel: item.channel,
                recipient_type: item.recipient_type,
                recipient_id: item.recipient_id,
                notification_type: item.notification_type,
                payload: item.payload,
                created_at: item.created_at,
              }),
            });

            if (res.ok) {
              await supabase
                .from("notification_queue")
                .update({ status: "delivered", sent_at: new Date().toISOString() })
                .eq("id", item.id);
              sentCount++;
            } else {
              await supabase
                .from("notification_queue")
                .update({ status: "failed", error_message: `Webhook returned ${res.status}` })
                .eq("id", item.id);
            }
          } catch (dispatchErr: any) {
            await supabase
              .from("notification_queue")
              .update({ status: "failed", error_message: dispatchErr.message })
              .eq("id", item.id);
          }
        }
        summary.notifications_dispatched = sentCount;
      }
    }

    const elapsed = performance.now() - startTime;
    summary.execution_time_ms = Number(elapsed.toFixed(2));

    return new Response(JSON.stringify(summary), {
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
