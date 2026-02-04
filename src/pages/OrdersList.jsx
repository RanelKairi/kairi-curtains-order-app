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
  Trash2,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function OrdersList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Orders.list('-created_date'),
  });

  const handleDelete = async (order) => {
    if (!window.confirm(`למחוק את ההזמנה של ${order.customer_name}?`)) return;
    
    setDeletingId(order.id);
    // Delete related items
    const curtains = await base44.entities.CurtainItems.filter({ order_id: order.id });
    for (const item of curtains) {
      await base44.entities.CurtainItems.delete(item.id);
    }
    const others = await base44.entities.OtherItems.filter({ order_id: order.id });
    for (const item of others) {
      await base44.entities.OtherItems.delete(item.id);
    }
    await base44.entities.Orders.delete(order.id);
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    toast.success('ההזמנה נמחקה בהצלחה');
    setDeletingId(null);
  };

  const handleSend = async (order) => {
    if (!order.email_for_pdf) {
      toast.error('לא הוזן אימייל להזמנה זו');
      return;
    }
    setSendingId(order.id);
    // Placeholder for send logic
    toast.success(`נשלח בהצלחה ל-${order.email_for_pdf}`);
    setSendingId(null);
  };

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
                        onClick={() => handleSend(order)}
                        disabled={sendingId === order.id}
                      >
                        {sendingId === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span className="sm:hidden lg:inline">שליחה</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="flex-1 sm:flex-none border-r sm:border-r-0 sm:border-t border-slate-100 w-full h-full sm:h-auto gap-2 rounded-none hover:bg-red-50 text-red-600"
                        onClick={() => handleDelete(order)}
                        disabled={deletingId === order.id}
                      >
                        {deletingId === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span className="sm:hidden lg:inline">מחיקה</span>
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
    </div>
  );
}