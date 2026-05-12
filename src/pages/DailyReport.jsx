import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, Package, Scissors, ShoppingBag, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function DailyReport() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);

  const { data: allOrders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['orders-report'],
    queryFn: () => base44.entities.Orders.list('-created_date'),
  });

  const { data: curtainItems = [], isLoading: loadingCurtains } = useQuery({
    queryKey: ['curtain-items-report'],
    queryFn: () => base44.entities.CurtainItems.list(),
  });

  const { data: otherItems = [], isLoading: loadingOther } = useQuery({
    queryKey: ['other-items-report'],
    queryFn: () => base44.entities.OtherItems.list(),
  });

  const isLoading = loadingOrders || loadingCurtains || loadingOther;

  // Orders created today
  const todayOrders = allOrders.filter(o => {
    const created = o.created_date ? o.created_date.slice(0, 10) : null;
    return created === selectedDate;
  });

  // Orders that moved to בייצור today (updated_date = today AND status = בייצור)
  const inProductionToday = allOrders.filter(o => {
    const updated = o.updated_date ? o.updated_date.slice(0, 10) : null;
    return updated === selectedDate && o.order_status === 'בייצור';
  });

  // Completed orders (הושלם) updated today
  const completedToday = allOrders.filter(o => {
    const updated = o.updated_date ? o.updated_date.slice(0, 10) : null;
    return updated === selectedDate && o.order_status === 'הושלם';
  });

  const completedRevenue = completedToday.reduce((sum, o) => sum + (o.total_payment || 0), 0);

  // Curtain items that entered production today
  const curtainsInProduction = curtainItems.filter(i => {
    const updated = i.updated_date ? i.updated_date.slice(0, 10) : null;
    return updated === selectedDate && i.is_executable === true;
  });

  // Other items that entered production today
  const otherInProduction = otherItems.filter(i => {
    const updated = i.updated_date ? i.updated_date.slice(0, 10) : null;
    return updated === selectedDate && i.is_executable === true;
  });

  // Count by type for other items
  const otherByType = otherInProduction.reduce((acc, item) => {
    const t = item.item_type || 'אחר';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to={createPageUrl('OrdersList')}>
            <Button variant="ghost" size="icon" className="rotate-180">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">דוח יומי</h1>
            <p className="text-slate-500 text-sm">קאירי וילונות</p>
          </div>
          <div className="mr-auto">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="text-xs text-slate-500 mb-1">הזמנות חדשות היום</div>
                  <div className="text-3xl font-bold text-blue-600">{todayOrders.length}</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="text-xs text-slate-500 mb-1">נכנסו לייצור היום</div>
                  <div className="text-3xl font-bold text-purple-600">{inProductionToday.length}</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md col-span-2 sm:col-span-1">
                <CardContent className="p-4">
                  <div className="text-xs text-slate-500 mb-1">הושלמו היום</div>
                  <div className="text-3xl font-bold text-green-600">{completedToday.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue */}
            <Card className="border-0 shadow-md bg-green-50">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">סך הכנסות מהזמנות שהושלמו היום</div>
                  <div className="text-2xl font-bold text-green-700">₪{completedRevenue.toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>

            {/* Items in production */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-purple-600" />
                  פריטים שנכנסו לייצור היום
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <div className="text-xs text-slate-500 mb-1">וילונות</div>
                    <div className="text-3xl font-bold text-purple-700">{curtainsInProduction.length}</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 text-center">
                    <div className="text-xs text-slate-500 mb-1">פריטים נוספים</div>
                    <div className="text-3xl font-bold text-amber-700">{otherInProduction.length}</div>
                  </div>
                </div>

                {Object.keys(otherByType).length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 mb-2">פירוט פריטים נוספים:</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(otherByType).map(([type, count]) => (
                        <Badge key={type} className="bg-amber-100 text-amber-800 text-sm px-3 py-1">
                          {type}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {curtainsInProduction.length === 0 && otherInProduction.length === 0 && (
                  <p className="text-center text-slate-400 py-4 text-sm">אין פריטים שנכנסו לייצור בתאריך זה</p>
                )}
              </CardContent>
            </Card>

            {/* Orders that entered production */}
            {inProductionToday.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    הזמנות שנכנסו לייצור
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {inProductionToday.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <div className="font-medium text-slate-800">{order.customer_name}</div>
                        <div className="text-xs text-slate-500">{order.order_number}</div>
                      </div>
                      <div className="text-sm font-semibold text-slate-700">₪{(order.total_payment || 0).toLocaleString()}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Completed orders */}
            {completedToday.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    הזמנות שהושלמו
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {completedToday.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <div className="font-medium text-slate-800">{order.customer_name}</div>
                        <div className="text-xs text-slate-500">{order.order_number}</div>
                      </div>
                      <div className="text-sm font-semibold text-green-700">₪{(order.total_payment || 0).toLocaleString()}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}