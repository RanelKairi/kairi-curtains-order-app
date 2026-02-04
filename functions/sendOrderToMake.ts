export default async function sendOrderToMake(input) {
  try {
    const MAKE_WEBHOOK_URL = Deno.env.get("MAKE_WEBHOOK_URL");
    
    if (!MAKE_WEBHOOK_URL) {
      throw new Error("MAKE_WEBHOOK_URL secret is not configured");
    }

    const order = input.data || input;
    
    const payload = {
      event: "order_created",
      sentAt: new Date().toISOString(),
      orderId: order.id || order.orderId || order._id,
      order
    };

    console.log("Sending order to Make", payload.orderId);

    const res = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log("Make response status", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      const error = new Error(`Make webhook failed with status ${res.status}: ${errorText}`);
      console.error("Make webhook failed", error);
      throw error;
    }

    return { ok: true };
  } catch (error) {
    console.error("Make webhook failed", error);
    throw error;
  }
}