Deno.serve(async (req) => {
  try {
    const MAKE_WEBHOOK_URL = Deno.env.get("MAKE_WEBHOOK_URL");
    
    if (!MAKE_WEBHOOK_URL) {
      throw new Error("MAKE_WEBHOOK_URL secret is not configured");
    }

    const payload = await req.json();

    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Make webhook failed with status ${response.status}`);
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});