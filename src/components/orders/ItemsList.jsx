import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pencil, Trash2 } from 'lucide-react';

export default function ItemsList({ items, type, onEdit, onDelete }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed">
        {type === 'curtain' ? 'לא נוספו וילונות עדיין' : 'לא נוספו פריטים עדיין'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <Card key={index} className="p-4 bg-white border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-semibold text-slate-800">
                  {type === 'curtain' ? item.location : item.item_location}
                </span>
                {type === 'other' && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {item.item_type}
                  </span>
                )}
                {type === 'curtain' && item.fabric_type && (
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                    {item.fabric_type}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-slate-600">
                <div>
                  <span className="text-slate-400">רוחב: </span>
                  {item.width} ס"מ
                </div>
                <div>
                  <span className="text-slate-400">גובה: </span>
                  {item.height} ס"מ
                </div>
                {type === 'curtain' && item.sewing_type && (
                  <div>
                    <span className="text-slate-400">תפירה: </span>
                    {item.sewing_type}
                  </div>
                )}
                {type === 'curtain' && item.half_split && (
                  <div className="text-amber-600">חצוי</div>
                )}
                {type === 'other' && item.color_or_fabric && (
                  <div>
                    <span className="text-slate-400">צבע/בד: </span>
                    {item.color_or_fabric}
                  </div>
                )}
              </div>
              {item.notes && (
                <div className="mt-2 text-sm text-slate-500 bg-slate-50 p-2 rounded">
                  {item.notes}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 mr-4">
              <div className="text-lg font-bold text-green-600">
                ₪{item.price?.toLocaleString() || 0}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => onEdit(index)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(index)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}