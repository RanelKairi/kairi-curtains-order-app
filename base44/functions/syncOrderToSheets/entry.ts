import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const HEADERS = [
  'מספר הזמנה', 'שם לקוח', 'תאריך הזמנה', 'סוכן',
  'סה"כ לתשלום', 'שולם', 'נשאר לתשלום', 'סוג תשלום',
  'סוג מסמך', 'הערות', 'מזהה הזמנה'
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const order = payload.data;

    if (!order) {
      return Response.json({ error: 'No order data' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Fetch customer for agent name
    let agentName = '';
    if (order.customer_id) {
      const customers = await base44.asServiceRole.entities.Customers.filter({ id: order.customer_id });
      if (customers.length > 0) agentName = customers[0].agent_name || '';
    }

    // Get or create spreadsheet
    let spreadsheetId = Deno.env.get('GOOGLE_SHEETS_ID');

    if (!spreadsheetId) {
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties: { title: 'קאירי וילונות - הזמנות' } })
      });
      const newSheet = await createRes.json();
      spreadsheetId = newSheet.spreadsheetId;
      console.log(`✅ Created new spreadsheet. Set GOOGLE_SHEETS_ID=${spreadsheetId}`);
      console.log(`🔗 https://docs.google.com/spreadsheets/d/${spreadsheetId}`);

      // Add headers row
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=RAW`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [HEADERS] })
      });
    }

    // Append order row
    const rowData = [
      order.order_number || '',
      order.customer_name || '',
      order.order_date || new Date().toISOString().split('T')[0],
      agentName,
      order.total_payment || 0,
      order.paid_amount || 0,
      order.remaining_amount || 0,
      order.payment_type || '',
      order.is_quote ? 'הצעת מחיר' : 'הזמנה',
      order.order_notes || '',
      order.id || ''
    ];

    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [rowData] })
      }
    );

    if (!appendRes.ok) {
      const errText = await appendRes.text();
      throw new Error(`Sheets API error: ${errText}`);
    }

    console.log(`✅ Order ${order.order_number} synced to Google Sheets`);
    return Response.json({ success: true, spreadsheetId });

  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});