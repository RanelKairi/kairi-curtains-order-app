import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

// Google Drive direct download URL
const FONT_URL = 'https://drive.google.com/uc?export=download&id=1w-YmsjZ5ZrfQAVSXjbX7J8HvQJKBIo_C';

async function loadHeeboFont() {
  try {
    const response = await fetch(FONT_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch font');
    }
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error('Error loading font:', error);
    return null;
  }
}

// Helper function for RTL text with BiDi support
// Keeps numbers, English text, and special characters in correct order
function rtlText(text) {
  if (!text) return '';
  const str = text.toString();
  
  // Split text into segments: Hebrew vs non-Hebrew (numbers, English, symbols)
  // Hebrew Unicode range: \u0590-\u05FF
  const segments = [];
  let currentSegment = '';
  let currentIsHebrew = null;
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const isHebrew = /[\u0590-\u05FF]/.test(char);
    
    if (currentIsHebrew === null) {
      currentIsHebrew = isHebrew;
      currentSegment = char;
    } else if (isHebrew === currentIsHebrew) {
      currentSegment += char;
    } else {
      segments.push({ text: currentSegment, isHebrew: currentIsHebrew });
      currentSegment = char;
      currentIsHebrew = isHebrew;
    }
  }
  
  if (currentSegment) {
    segments.push({ text: currentSegment, isHebrew: currentIsHebrew });
  }
  
  // Reverse the order of segments for RTL, and reverse Hebrew segments internally
  const result = segments
    .reverse()
    .map(segment => {
      if (segment.isHebrew) {
        // Reverse Hebrew characters
        return segment.text.split('').reverse().join('');
      } else {
        // Keep non-Hebrew (numbers, English, symbols) as-is
        return segment.text;
      }
    })
    .join('');
  
  return result;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return Response.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Load Heebo font
    const heeboFontBase64 = await loadHeeboFont();

    // Fetch order data
    const orders = await base44.asServiceRole.entities.Orders.filter({ id: orderId });
    if (orders.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    const order = orders[0];

    // Fetch customer data
    let customer = null;
    if (order.customer_id) {
      const customers = await base44.asServiceRole.entities.Customers.filter({ id: order.customer_id });
      if (customers.length > 0) {
        customer = customers[0];
      }
    }

    // Fetch curtain items
    const curtainItems = await base44.asServiceRole.entities.CurtainItems.filter({ order_id: orderId });

    // Fetch other items
    const otherItems = await base44.asServiceRole.entities.OtherItems.filter({ order_id: orderId });

    // Create PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add Heebo font if loaded successfully
    if (heeboFontBase64) {
      doc.addFileToVFS('Heebo-Regular.ttf', heeboFontBase64);
      doc.addFont('Heebo-Regular.ttf', 'Heebo', 'normal');
      doc.setFont('Heebo');
    }

    // Set font size and colors
    const primaryColor = [37, 99, 235]; // Blue
    const textColor = [51, 65, 85]; // Slate

    let y = 20;
    const marginRight = 190;
    const marginLeft = 20;

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text(rtlText('קאירי וילונות'), marginRight, 20, { align: 'right' });
    doc.setFontSize(12);
    doc.text(rtlText(order.is_quote ? 'הצעת מחיר' : 'הזמנה'), marginRight, 28, { align: 'right' });

    y = 45;

    // Order info box
    doc.setTextColor(...textColor);
    doc.setFillColor(248, 250, 252);
    doc.rect(marginLeft, y - 5, 170, 25, 'F');
    doc.setFontSize(10);
    doc.text(rtlText(`מספר הזמנה: ${order.order_number || 'N/A'}`), marginRight - 5, y + 3, { align: 'right' });
    doc.text(rtlText(`תאריך: ${order.order_date || new Date().toLocaleDateString('he-IL')}`), marginRight - 5, y + 12, { align: 'right' });

    y += 30;

    // Customer details section
    doc.setFillColor(...primaryColor);
    doc.rect(marginLeft, y, 170, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(rtlText('פרטי לקוח'), marginRight - 5, y + 6, { align: 'right' });
    y += 12;

    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    if (customer) {
      doc.text(rtlText(`שם: ${customer.customer_name || ''}`), marginRight - 5, y, { align: 'right' });
      y += 6;
      doc.text(rtlText(`טלפון: ${customer.phone || ''}`), marginRight - 5, y, { align: 'right' });
      y += 6;
      doc.text(rtlText(`כתובת: ${customer.address || ''}`), marginRight - 5, y, { align: 'right' });
      y += 6;
      doc.text(rtlText(`סוכן: ${customer.agent_name || ''}`), marginRight - 5, y, { align: 'right' });
    }
    y += 10;

    // Curtain items section
    if (curtainItems.length > 0) {
      doc.setFillColor(147, 51, 234); // Purple
      doc.rect(marginLeft, y, 170, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text(rtlText('וילונות'), marginRight - 5, y + 6, { align: 'right' });
      y += 12;

      doc.setTextColor(...textColor);
      doc.setFontSize(9);

      curtainItems.forEach((item, index) => {
        if (y > 260) {
          doc.addPage();
          if (heeboFontBase64) {
            doc.setFont('Heebo');
          }
          y = 20;
        }

        doc.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252);
        doc.rect(marginLeft, y - 3, 170, 18, 'F');

        doc.text(rtlText(`${index + 1}. ${item.location || ''}`), marginRight - 5, y, { align: 'right' });
        doc.text(rtlText(`רוחב: ${item.width || 0} ס"מ | גובה: ${item.height || 0} ס"מ`), marginRight - 5, y + 5, { align: 'right' });
        doc.text(rtlText(`סוג בד: ${item.fabric_type || ''} | תפירה: ${item.sewing_type || ''}`), marginRight - 5, y + 10, { align: 'right' });
        
        doc.text(rtlText(`₪${(item.price || 0).toLocaleString()}`), marginLeft + 10, y + 5, { align: 'left' });

        y += 20;
      });
    }
    y += 5;

    // Other items section
    if (otherItems.length > 0) {
      if (y > 240) {
        doc.addPage();
        if (heeboFontBase64) {
          doc.setFont('Heebo');
        }
        y = 20;
      }

      doc.setFillColor(245, 158, 11); // Amber
      doc.rect(marginLeft, y, 170, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text(rtlText('פריטים נוספים'), marginRight - 5, y + 6, { align: 'right' });
      y += 12;

      doc.setTextColor(...textColor);
      doc.setFontSize(9);

      otherItems.forEach((item, index) => {
        if (y > 260) {
          doc.addPage();
          if (heeboFontBase64) {
            doc.setFont('Heebo');
          }
          y = 20;
        }

        doc.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252);
        doc.rect(marginLeft, y - 3, 170, 18, 'F');

        doc.text(rtlText(`${index + 1}. ${item.item_location || ''} - ${item.item_type || ''}`), marginRight - 5, y, { align: 'right' });
        doc.text(rtlText(`רוחב: ${item.width || 0} ס"מ | גובה: ${item.height || 0} ס"מ`), marginRight - 5, y + 5, { align: 'right' });
        doc.text(rtlText(`צבע/בד: ${item.color_or_fabric || ''}`), marginRight - 5, y + 10, { align: 'right' });
        
        doc.text(rtlText(`₪${(item.price || 0).toLocaleString()}`), marginLeft + 10, y + 5, { align: 'left' });

        y += 20;
      });
    }
    y += 10;

    // Payment section
    if (y > 220) {
      doc.addPage();
      if (heeboFontBase64) {
        doc.setFont('Heebo');
      }
      y = 20;
    }

    doc.setFillColor(22, 163, 74); // Green
    doc.rect(marginLeft, y, 170, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(rtlText('פרטי תשלום'), marginRight - 5, y + 6, { align: 'right' });
    y += 15;

    doc.setTextColor(...textColor);
    doc.setFontSize(10);

    // Payment summary box
    doc.setFillColor(240, 253, 244);
    doc.rect(marginLeft, y - 3, 170, 35, 'F');

    doc.text(rtlText(`סה"כ לתשלום: ₪${(order.total_payment || 0).toLocaleString()}`), marginRight - 5, y + 3, { align: 'right' });
    doc.text(rtlText(`שולם: ₪${(order.paid_amount || 0).toLocaleString()}`), marginRight - 5, y + 11, { align: 'right' });
    doc.text(rtlText(`נשאר לתשלום: ₪${(order.remaining_amount || 0).toLocaleString()}`), marginRight - 5, y + 19, { align: 'right' });
    if (order.discount) {
      doc.text(rtlText(`הנחה: ₪${order.discount.toLocaleString()}`), marginRight - 5, y + 27, { align: 'right' });
    }
    if (order.payment_type) {
      doc.text(rtlText(`אמצעי תשלום: ${order.payment_type}`), marginLeft + 60, y + 3, { align: 'left' });
    }
    if (order.installation_cost) {
      doc.text(rtlText(`עלות התקנה: ₪${order.installation_cost.toLocaleString()}`), marginLeft + 60, y + 11, { align: 'left' });
    }

    y += 45;

    // Notes section
    if (order.order_notes) {
      if (y > 250) {
        doc.addPage();
        if (heeboFontBase64) {
          doc.setFont('Heebo');
        }
        y = 20;
      }

      doc.setFillColor(241, 245, 249);
      doc.rect(marginLeft, y, 170, 8, 'F');
      doc.setTextColor(...textColor);
      doc.setFontSize(11);
      doc.text(rtlText('הערות'), marginRight - 5, y + 6, { align: 'right' });
      y += 12;

      doc.setFontSize(9);
      const notes = order.order_notes.substring(0, 200);
      doc.text(rtlText(notes), marginRight - 5, y, { align: 'right', maxWidth: 160 });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      if (heeboFontBase64) {
        doc.setFont('Heebo');
      }
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 282, 210, 15, 'F');
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text(rtlText('קאירי וילונות - כל הזכויות שמורות'), 105, 290, { align: 'center' });
      doc.text(`${i} / ${pageCount}`, 105, 295, { align: 'center' });
    }

    // Convert to base64
    const pdfBase64 = doc.output('datauristring');

    return Response.json({
      success: true,
      pdf: pdfBase64,
      order: order,
      customer: customer
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});