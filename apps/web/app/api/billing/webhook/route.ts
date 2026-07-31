import {verifyWebhook, WebhookEventType, type WebhookEventData} from "@waffo/pancake-ts";
import {createAdminClient, isSupabaseAdminConfigured} from "../../../../lib/supabase/admin";
import {getWaffoEnvironment, getWaffoStoreId} from "../../../../lib/waffo";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-waffo-signature");

  let event;
  try {
    event = verifyWebhook<WebhookEventData>(rawBody, signature, {environment: getWaffoEnvironment()});
  } catch {
    return new Response("Invalid Waffo signature", {status: 401});
  }

  if (event.storeId !== getWaffoStoreId() || event.mode !== getWaffoEnvironment()) {
    return new Response("Waffo event does not match this environment", {status: 400});
  }

  const handledEvents = new Set<string>([
    WebhookEventType.OrderCompleted,
    WebhookEventType.RefundSucceeded,
  ]);
  if (!handledEvents.has(event.eventType)) return new Response("OK");
  if (!isSupabaseAdminConfigured()) return new Response("Server billing is not configured", {status: 503});

  const {error} = await createAdminClient().rpc("process_waffo_event", {
    p_event_id: event.id,
    p_event_type: event.eventType,
    p_business_event_id: event.eventId,
    p_mode: event.mode,
    p_payload: event,
  });
  if (error) {
    console.error("Failed to process Waffo event", error);
    return new Response("Webhook processing failed", {status: 500});
  }

  return new Response("OK");
}
