import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Calendar, 
  User, 
  CreditCard, 
  Eye, 
  Pencil,
  Loader2,
  FileText,
  Phone,
  FileDown
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import PdfPreviewModal from '@/components/orders/PdfPreviewModal';

export default function OrdersList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(null);

  const handleGeneratePdf = async (order) => {
    setIsGeneratingPdf(order.id);
    try {
      const response = await base44.functions.invoke('generateOrderPdf', { orderId: order.id });
      if (response.data.success) {
        setPdfData(response.data.pdf);
        setSelectedOrder(response.data.order);
        setSelectedCustomer(response.data.customer);
        setPdfModalOpen(true);
      } else {
        toast.error('שגיאה בהפקת ה-PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('שגיאה בהפקת ה-PDF');
    } finally {
      setIsGeneratingPdf(null);
    }
  };

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Orders.list('-created_date'),
  });

  const filteredOrders = orders.filter(order => 
    order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPaymentBadge = (type) => {
    const colors = {
      "צ'ק": "bg-blue-100 text-blue-700",
      "אשראי": "bg-purple-100 text-purple-700",
      "מזומן": "bg-green-100 text-green-700",
      "תשלום במכשיר": "bg-amber-100 text-amber-700"
    };
    return colors[type] || "bg-slate-100 text-slate-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">הזמנות</h1>
            <p className="text-slate-500 mt-1">קאירי וילונות</p>
          </div>
          <Link to={createPageUrl('NewOrder')}>
            <Button className="gap-2 bg-gradient-to-l from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
              <Plus className="h-4 w-4" />
              הזמנה חדשה
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="חיפוש לפי שם לקוח..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 bg-white border-slate-200"
          />
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-16 w-16 text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">
                {searchTerm ? 'לא נמצאו תוצאות' : 'אין הזמנות עדיין'}
              </h3>
              <p className="text-slate-400 mb-6">
                {searchTerm ? 'נסה לחפש במילים אחרות' : 'התחל ביצירת ההזמנה הראשונה שלך'}
              </p>
              {!searchTerm && (
                <Link to={createPageUrl('NewOrder')}>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    הזמנה חדשה
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Main Info */}
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            {order.customer_name || 'לקוח ללא שם'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                            <Calendar className="h-3.5 w-3.5" />
                            {order.order_date ? format(new Date(order.order_date), 'dd/MM/yyyy') : '-'}
                          </div>
                        </div>
                        {order.payment_type && (
                          <Badge className={getPaymentBadge(order.payment_type)}>
                            {order.payment_type}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="text-xs text-slate-500 mb-1">סה"כ לתשלום</div>
                          <div className="text-lg font-bold text-slate-800">
                            ₪{(order.total_payment || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className={`rounded-lg p-3 ${
                          order.remaining_amount > 0 
                            ? 'bg-amber-50' 
                            : 'bg-green-50'
                        }`}>
                          <div className="text-xs text-slate-500 mb-1">נשאר לתשלום</div>
                          <div className={`text-lg font-bold ${
                            order.remaining_amount > 0 
                              ? 'text-amber-600' 
                              : 'text-green-600'
                          }`}>
                            ₪{(order.remaining_amount || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {order.order_notes && (
                        <div className="mt-3 text-sm text-slate-600 bg-slate-50 p-2 rounded">
                          {order.order_notes}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col border-t sm:border-t-0 sm:border-r border-slate-100 bg-slate-50">
                      <Link 
                        to={createPageUrl(`NewOrder?edit=${order.id}`)}
                        className="flex-1 sm:flex-none"
                      >
                        <Button 
                          variant="ghost" 
                          className="w-full h-full sm:h-auto gap-2 rounded-none hover:bg-blue-50 text-blue-600"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sm:hidden lg:inline">צפייה</span>
                        </Button>
                      </Link>
                      <Link 
                        to={createPageUrl(`NewOrder?edit=${order.id}`)}
                        className="flex-1 sm:flex-none border-r sm:border-r-0 sm:border-t border-slate-100"
                      >
                        <Button 
                          variant="ghost" 
                          className="w-full h-full sm:h-auto gap-2 rounded-none hover:bg-amber-50 text-amber-600"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sm:hidden lg:inline">עריכה</span>
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        className="flex-1 sm:flex-none border-r sm:border-r-0 sm:border-t border-slate-100 w-full h-full sm:h-auto gap-2 rounded-none hover:bg-green-50 text-green-600"
                        onClick={() => handleGeneratePdf(order)}
                        disabled={isGeneratingPdf === order.id}
                      >
                        {isGeneratingPdf === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileDown className="h-4 w-4" />
                        )}
                        <span className="sm:hidden lg:inline">PDF</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        {filteredOrders.length > 0 && (
          <div className="mt-8 text-center text-sm text-slate-500">
            מציג {filteredOrders.length} הזמנות
          </div>
        )}
      </div>

      {/* PDF Preview Modal */}
      <PdfPreviewModal
        open={pdfModalOpen}
        onClose={() => {
          setPdfModalOpen(false);
          setPdfData(null);
          setSelectedOrder(null);
          setSelectedCustomer(null);
        }}
        pdfData={pdfData}
        order={selectedOrder}
        customer={selectedCustomer}
      />
    </div>
  );
}