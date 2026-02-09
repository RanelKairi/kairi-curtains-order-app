import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Mail, Loader2, FileText, Check, X, Printer, MessageCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PdfPreviewModal({ open, onClose, pdfData, order, customer }) {
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [customEmail, setCustomEmail] = useState('');

  const defaultEmail = order?.email_for_pdf || customer?.email || '';

  const handleDownload = () => {
    if (!pdfData) return;
    
    const link = document.createElement('a');
    link.href = pdfData;
    link.download = `הזמנה-${order?.order_number || 'document'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('הקובץ הורד בהצלחה');
  };

  const handlePrint = () => {
    if (!pdfData) return;
    
    const printWindow = window.open(pdfData, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    }
  };

  const handleWhatsApp = () => {
    const phone = customer?.phone;
    if (!phone) {
      toast.error('לא נמצא מספר טלפון ללקוח');
      return;
    }
    
    // Format phone number for WhatsApp (remove dashes, spaces, and add country code if needed)
    let formattedPhone = phone.replace(/[-\s]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '972' + formattedPhone.substring(1);
    }
    
    const orderType = order?.is_quote ? 'הצעת מחיר' : 'הזמנה';
    const message = encodeURIComponent(
      `שלום ${customer?.customer_name || ''},\n` +
      `מצורף ${orderType} מספר ${order?.order_number || ''} מקאירי וילונות.\n\n` +
      `סה"כ לתשלום: ₪${(order?.total_payment || 0).toLocaleString()}\n` +
      `שולם: ₪${(order?.paid_amount || 0).toLocaleString()}\n` +
      `נשאר לתשלום: ₪${(order?.remaining_amount || 0).toLocaleString()}\n\n` +
      `תודה שבחרתם בקאירי וילונות!`
    );
    
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
  };

  const handleSendEmail = async () => {
    const emailTo = customEmail || defaultEmail;
    
    if (!emailTo) {
      toast.error('נא להזין כתובת אימייל');
      return;
    }

    if (!pdfData) {
      toast.error('אין קובץ PDF לשליחה');
      return;
    }

    setIsSending(true);

    try {
      // Create email body with order details
      const orderType = order?.is_quote ? 'הצעת מחיר' : 'הזמנה';
      const emailBody = `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>שלום ${customer?.customer_name || ''},</h2>
          <p>מצורף ${orderType} מספר ${order?.order_number || ''} מקאירי וילונות.</p>
          <br/>
          <p><strong>סיכום:</strong></p>
          <ul>
            <li>סה"כ לתשלום: ₪${(order?.total_payment || 0).toLocaleString()}</li>
            <li>שולם: ₪${(order?.paid_amount || 0).toLocaleString()}</li>
            <li>נשאר לתשלום: ₪${(order?.remaining_amount || 0).toLocaleString()}</li>
          </ul>
          <br/>
          <p>תודה שבחרתם בקאירי וילונות!</p>
          <p>לשאלות ובירורים אנחנו כאן לשירותכם.</p>
        </div>
      `;

      await base44.integrations.Core.SendEmail({
        to: emailTo,
        subject: `${orderType} ${order?.order_number || ''} - קאירי וילונות`,
        body: emailBody
      });

      setEmailSent(true);
      toast.success('האימייל נשלח בהצלחה!');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('שגיאה בשליחת האימייל');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setEmailSent(false);
    setCustomEmail('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            תצוגה מקדימה - {order?.is_quote ? 'הצעת מחיר' : 'הזמנה'} {order?.order_number}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* PDF Preview */}
          <div className="flex-1 min-h-[400px] border rounded-lg overflow-hidden bg-gray-100">
            {pdfData ? (
              <iframe 
                src={pdfData} 
                className="w-full h-full"
                title="PDF Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin ml-2" />
                טוען...
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t pt-4 space-y-4">
            {/* Email Section */}
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label className="text-sm text-gray-600 mb-1 block">שלח למייל</Label>
                <Input
                  type="email"
                  placeholder={defaultEmail || 'הזן כתובת אימייל'}
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="text-right"
                />
              </div>
              <Button
                onClick={handleSendEmail}
                disabled={isSending || emailSent}
                className={`gap-2 min-w-[140px] ${emailSent ? 'bg-green-600 hover:bg-green-600' : ''}`}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    שולח...
                  </>
                ) : emailSent ? (
                  <>
                    <Check className="h-4 w-4" />
                    נשלח!
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    שלח במייל
                  </>
                )}
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={handleClose}>
                <X className="h-4 w-4 ml-2" />
                סגור
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleWhatsApp}
                  className="gap-2 text-green-600 border-green-600 hover:bg-green-50"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
                <Button variant="outline" onClick={handlePrint} className="gap-2">
                  <Printer className="h-4 w-4" />
                  הדפס
                </Button>
                <Button onClick={handleDownload} className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Download className="h-4 w-4" />
                  הורד PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}