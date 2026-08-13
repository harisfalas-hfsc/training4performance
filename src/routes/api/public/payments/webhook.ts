import { createFileRoute } from "@tanstack/react-router";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_SERVICE_ROLE_KEY"]!);
  }
  return _supabase;
}

const isoDay = (unix?: number | null) =>
  unix ? new Date(unix * 1000).toISOString().slice(0, 10) : null;

/** Mirrors a paid Stripe subscription onto the coach's T4P season. */
async function upsertSeason(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId as string | undefined;
  if (!userId) {
    console.error("Subscription webhook without userId metadata", subscription.id);
    return;
  }
  const item = subscription.items?.data?.[0];
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const paid = subscription.status === "active" || subscription.status === "trialing";

  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("team_name")
    .eq("user_id", userId)
    .maybeSingle();

  const teamName =
    (existing?.team_name as string | undefined) ||
    (subscription.metadata?.teamName as string | undefined) ||
    "First team";

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      team_name: teamName,
      status: paid ? "active" : subscription.status === "canceled" ? "canceled" : "pending",
      season_start: isoDay(periodStart) ?? new Date().toISOString().slice(0, 10),
      season_end: isoDay(periodEnd) ?? new Date().toISOString().slice(0, 10),
      price_eur: 699,
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      canceled_at: subscription.cancel_at_period_end ? new Date().toISOString() : null,
      stripe_subscription_id: subscription.id,
      stripe_customer_id:
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (paid) {
    await supabase.from("notifications").insert({
      user_id: userId,
      kind: "success",
      title: "Subscription active",
      body: `Your payment went through. Full editing is unlocked for ${teamName} until ${isoDay(periodEnd) ?? "the end of the season"}.`,
    });
  }
}

async function markCanceled(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertSeason(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await markCanceled(event.data.object, env);
      break;
    default:
      console.log("Unhandled payments event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Payments webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
