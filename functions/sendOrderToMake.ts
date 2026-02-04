import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order, customer, curtainItems, otherItems, eventType } = await req.json();

    const webhookUrl = Deno.env.get("MAKE_WEBHOOK_URL");
    if (!webhookUrl) {
      return Response.json({ error: 'MAKE_WEBHOOK_URL not configured' }, { status: 500 });
    }

    // Prepare payload for Make.com
    const payload = {
      eventType: eventType || 'order_created',
      timestamp: new Date().toISOString(),
      order: order,
      customer: customer,
      curtainItems: curtainItems || [],
      otherItems: otherItems || []
    };

    // Send to Make.com webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Make.com webhook error:', errorText);
      return Response.json({ 
        success: false, 
        error: `Make.com returned status ${response.status}` 
      }, { status: 500 });
    }

    return Response.json({ 
      success: true, 
      message: 'Order sent to Make.com successfully' 
    });

  } catch (error) {
    console.error('Error sending to Make.com:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});