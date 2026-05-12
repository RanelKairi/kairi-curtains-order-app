import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, FileText } from 'lucide-react';

const OPTIONS = [
  {
    label: 'בקשה לגבייה + העברה לביצוע',
    description: 'ההזמנה תועבר לסטטוס "ממתין לגבייה"',
    status: 'ממתין לגבייה',
    icon: Clock,
    color: 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-800',
    iconColor: 'text-amber-600'
  },
  {
    label: 'הצעת מחיר (לא לביצוע)',
    description: 'ההזמנה תישמר כהצעת מחיר בלבד',
    status: 'הצעת מחיר',
    icon: FileText,
    color: 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800',
    iconColor: 'text-slate-600'
  }
];

export default function OrderStatusDialog({ open, onClose, onSelect }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-lg">בחר סוג הזמנה</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.status}
                onClick={() => onSelect(opt.status)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right ${opt.color}`}
              >
                <Icon className={`h-6 w-6 shrink-0 ${opt.iconColor}`} />
                <div>
                  <div className="font-semibold text-base">{opt.label}</div>
                  <div className="text-sm opacity-70 mt-0.5">{opt.description}</div>
                </div>
              </button>
            );
          })}
        </div>
        <Button variant="outline" onClick={onClose} className="w-full mt-2">ביטול</Button>
      </DialogContent>
    </Dialog>
  );
}