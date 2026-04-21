import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus, Search, Calendar, User, Loader2, FileText, FileDown, Pencil, Play
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import PdfPreviewModal from '@/components/orders/PdfPreviewModal';
import StartExecutionModal from '@/components/orders/StartExecutionModal';

const TABS = [
  { value: 'all', label: 'כל ההזמנות' },
  { value: 'הצעת מחיר', label: 'הצעות מחיר' },
  { value: 'ממתין לגבייה', label: 'ממתין לגבייה' },
  { value: 'בייצור', label: 'בייצור' },
  { value: 'הושלם', label: 'הושלמו' },
];

const STATUS_BADGE = {
  'הצעת מחיר': 'bg-slate-100 text-slate-700',
  'ממתין לגבייה': 'bg-amber-100 text-amber-700',
  'חדש לביצוע': 'bg-blue-100 text-blue-700',
  'בייצור': 'bg-purple-100 text-purple-700',
  'הושלם': 'bg-green-100 text-green-700',
};

export default function OrdersList() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('חדש לביצוע');
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(null);
  const [executionOrder, setExecutionOrder] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Orders.list('-created_date'),
  });

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
      toast.error('שגיאה בהפקת ה-PDF');
    } finally {
      setIsGeneratingPdf(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || order.order_status === activeTab;
    return matchesSearch && matchesTab;
  });

  const tabCount = (status) =>
    status === 'all' ? orders.length : orders.filter(o => o.order_status === status).length;

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
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="חיפוש לפי שם לקוח..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 bg-white border-slate-200"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex overflow-x-auto mb-4 h-auto bg-white border border-slate-200 rounded-xl p-1 gap-1">
            {TABS.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 text-xs sm:text-sm whitespace-nowrap rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                {tab.label}
                {tabCount(tab.value) > 0 && (
                  <span className="mr-1.5 bg-slate-200 data-[state=active]:bg-blue-500 text-slate-700 data-[state=active]:text-white rounded-full px-1.5 py-0.5 text-xs">
                    {tabCount(tab.value)}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map(tab => (
            <TabsContent key={tab.value} value={tab.value}>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <Card className="border-0 shadow-lg">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <FileText className="h-16 w-16 text-slate-300 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-600 mb-2">
                      {searchTerm ? 'לא נמצאו תוצאות' : 'אין הזמנות בסטטוס זה'}
                    </h3>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onGeneratePdf={handleGeneratePdf}
                      isGeneratingPdf={isGeneratingPdf}
                      showStartExecution={activeTab === 'ממתין לגבייה'}
                      onStartExecution={() => setExecutionOrder(order)}
                    />
                  ))}
                  <div className="text-center text-sm text-slate-500 pt-2">
                    {filteredOrders.length} הזמנות
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <PdfPreviewModal
        open={pdfModalOpen}
        onClose={() => { setPdfModalOpen(false); setPdfData(null); setSelectedOrder(null); setSelectedCustomer(null); }}
        pdfData={pdfData}
        order={selectedOrder}
        customer={selectedCustomer}
      />

      <StartExecutionModal
        open={!!executionOrder}
        onClose={() => setExecutionOrder(null)}
        order={executionOrder}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['orders'] })}
      />
    </div>
  );
}

function OrderCard({ order, onGeneratePdf, isGeneratingPdf, showStartExecution, onStartExecution }) {
  const statusClass = STATUS_BADGE[order.order_status] || 'bg-slate-100 text-slate-700';

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
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
              <div className="flex flex-col items-end gap-1">
                {order.order_status && (
                  <Badge className={statusClass}>{order.order_status}</Badge>
                )}
                {order.order_number && (
                  <span className="text-xs text-slate-400">{order.order_number}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">סה"כ לתשלום</div>
                <div className="text-lg font-bold text-slate-800">
                  ₪{(order.total_payment || 0).toLocaleString()}
                </div>
              </div>
              <div className={`rounded-lg p-3 ${order.remaining_amount > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                <div className="text-xs text-slate-500 mb-1">נשאר לתשלום</div>
                <div className={`text-lg font-bold ${order.remaining_amount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
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
            {showStartExecution && (
              <Button
                variant="ghost"
                className="flex-1 sm:flex-none gap-2 rounded-none hover:bg-blue-50 text-blue-700 font-semibold"
                onClick={onStartExecution}
              >
                <Play className="h-4 w-4" />
                <span className="sm:hidden lg:inline">התחל ביצוע</span>
              </Button>
            )}
            <Link to={createPageUrl(`NewOrder?edit=${order.id}`)} className="flex-1 sm:flex-none border-r sm:border-r-0 sm:border-t border-slate-100">
              <Button variant="ghost" className="w-full h-full sm:h-auto gap-2 rounded-none hover:bg-amber-50 text-amber-600">
                <Pencil className="h-4 w-4" />
                <span className="sm:hidden lg:inline">עריכה</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="flex-1 sm:flex-none border-r sm:border-r-0 sm:border-t border-slate-100 w-full h-full sm:h-auto gap-2 rounded-none hover:bg-green-50 text-green-600"
              onClick={() => onGeneratePdf(order)}
              disabled={isGeneratingPdf === order.id}
            >
              {isGeneratingPdf === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              <span className="sm:hidden lg:inline">PDF</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}