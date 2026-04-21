import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { base44 } from '@/api/base44Client';
import { Loader2, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function StartExecutionModal({ open, onClose, order, onSaved }) {
  const [curtainItems, setCurtainItems] = useState([]);
  const [otherItems, setOtherItems] = useState([]);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && order) {
      loadItems();
    }
  }, [open, order]);

  const loadItems = async () => {
    setIsLoading(true);
    setPaymentConfirmed(false);
    const [curtains, others] = await Promise.all([
      base44.entities.CurtainItems.filter({ order_id: order.id }),
      base44.entities.OtherItems.filter({ order_id: order.id })
    ]);
    setCurtainItems(curtains.map(i => ({ ...i, _executable: i.is_executable !== false })));
    setOtherItems(others.map(i => ({ ...i, _executable: i.is_executable !== false })));
    setIsLoading(false);
  };

  const toggleCurtain = (id) => {
    setCurtainItems(prev => prev.map(i => i.id === id ? { ...i, _executable: !i._executable } : i));
  };

  const toggleOther = (id) => {
    setOtherItems(prev => prev.map(i => i.id === id ? { ...i, _executable: !i._executable } : i));
  };

  const selectAll = () => {
    setCurtainItems(prev => prev.map(i => ({ ...i, _executable: true })));
    setOtherItems(prev => prev.map(i => ({ ...i, _executable: true })));
  };

  const handleSave = async () => {
    if (!paymentConfirmed) {
      toast.error('יש לאשר וידוי גבייה לפני המשך');
      return;
    }

    setIsSaving(true);

    await Promise.all([
      ...curtainItems.map(item =>
        base44.entities.CurtainItems.update(item.id, { is_executable: item._executable })
      ),
      ...otherItems.map(item =>
        base44.entities.OtherItems.update(item.id, { is_executable: item._executable })
      )
    ]);

    await base44.entities.Orders.update(order.id, { order_status: 'חדש לביצוע' });

    toast.success('ההזמנה הועברה לבייצור!');
    setIsSaving(false);
    onSaved();
    onClose();
  };

  const allItems = [...curtainItems, ...otherItems];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">התחלת ביצוע - {order?.customer_name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Select All */}
            <Button variant="outline" size="sm" onClick={selectAll} className="gap-2 w-full">
              <CheckSquare className="h-4 w-4" />
              בחר הכל לביצוע
            </Button>

            {/* Curtain Items */}
            {curtainItems.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-700 mb-2 text-sm">וילונות</h4>
                <div className="space-y-2">
                  {curtainItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="text-sm">
                        <div className="font-medium text-slate-800">{item.location}</div>
                        <div className="text-slate-500 text-xs">{item.fabric_type} | {item.width}×{item.height} ס"מ</div>
                      </div>
                      <Switch checked={item._executable} onCheckedChange={() => toggleCurtain(item.id)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Items */}
            {otherItems.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-700 mb-2 text-sm">פריטים נוספים</h4>
                <div className="space-y-2">
                  {otherItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="text-sm">
                        <div className="font-medium text-slate-800">{item.item_location} - {item.item_type}</div>
                        <div className="text-slate-500 text-xs">{item.width}×{item.height} ס"מ</div>
                      </div>
                      <Switch checked={item._executable} onCheckedChange={() => toggleOther(item.id)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {allItems.length === 0 && (
              <p className="text-center text-slate-500 py-4">אין פריטים בהזמנה זו</p>
            )}

            {/* Payment Confirmation */}
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <Checkbox
                id="payment-confirmed"
                checked={paymentConfirmed}
                onCheckedChange={setPaymentConfirmed}
                className="mt-0.5"
              />
              <label htmlFor="payment-confirmed" className="text-sm font-medium text-red-800 cursor-pointer leading-snug">
                וידאתי גביית תשלום / מקדמה כנדרש
              </label>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            שמור והעבר ל"חדש לביצוע"
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}