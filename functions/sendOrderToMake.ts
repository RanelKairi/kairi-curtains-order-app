import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MAKE_WEBHOOK_URL = Deno.env.get("MAKE_WEBHOOK_URL") || "https://hook.eu2.make.com/3oa6nsd49icykzuc2pwdouov6x2eocoo";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Support both user calls and automation calls (no auth required for automations)
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (isAuthenticated) {
      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
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
      const errorText = await response.text();
      throw new Error(`Make webhook failed with status ${response.status}: ${errorText}`);
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});