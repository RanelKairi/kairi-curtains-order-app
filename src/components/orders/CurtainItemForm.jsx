import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const DEFAULT_ITEM = {
  location: '',
  sewing_type: '',
  width: '',
  height: '',
  hem: '',
  shaityef: '',
  half_split: false,
  fabric_type: '',
  notes: '',
  price: '',
  item_status: 'חדש',
  is_executable: true
};

export default function CurtainItemForm({ open, onClose, onSave, editItem }) {
  const [item, setItem] = useState(DEFAULT_ITEM);

  useEffect(() => {
    if (editItem) {
      setItem({ ...DEFAULT_ITEM, ...editItem });
    } else {
      setItem(DEFAULT_ITEM);
    }
  }, [editItem]);

  const handleSave = () => {
    onSave({
      ...item,
      width: parseFloat(item.width) || 0,
      height: parseFloat(item.height) || 0,
      price: parseFloat(item.price) || 0
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">{editItem ? 'עריכת וילון' : 'הוספת וילון'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>מיקום</Label>
              <Input 
                value={item.location} 
                onChange={(e) => setItem({...item, location: e.target.value})}
                placeholder="סלון, חדר שינה..."
              />
            </div>
            <div>
              <Label>סוג תפירה</Label>
              <Input 
                value={item.sewing_type} 
                onChange={(e) => setItem({...item, sewing_type: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>רוחב (ס"מ)</Label>
              <Input 
                type="number"
                value={item.width} 
                onChange={(e) => setItem({...item, width: e.target.value})}
              />
            </div>
            <div>
              <Label>גובה (ס"מ)</Label>
              <Input 
                type="number"
                value={item.height} 
                onChange={(e) => setItem({...item, height: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>מכפלת</Label>
              <Input 
                value={item.hem} 
                onChange={(e) => setItem({...item, hem: e.target.value})}
              />
            </div>
            <div>
              <Label>שטייף</Label>
              <Input 
                value={item.shaityef} 
                onChange={(e) => setItem({...item, shaityef: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label>סוג בד</Label>
            <Input 
              value={item.fabric_type} 
              onChange={(e) => setItem({...item, fabric_type: e.target.value})}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch 
              checked={item.half_split} 
              onCheckedChange={(checked) => setItem({...item, half_split: checked})}
            />
            <Label>חצוי</Label>
          </div>

          <div className="flex items-center gap-3">
            <Switch 
              checked={item.is_executable} 
              onCheckedChange={(checked) => {
                const updated = { ...item, is_executable: checked };
                if (!checked && updated.item_status !== 'הצעת מחיר') {
                  updated.item_status = 'הצעת מחיר';
                }
                setItem(updated);
              }}
            />
            <Label>לביצוע</Label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>עלות (₪)</Label>
              <Input 
                type="number"
                value={item.price} 
                onChange={(e) => setItem({...item, price: e.target.value})}
              />
            </div>
            <div>
              <Label>סטטוס</Label>
              <Select 
                value={item.item_status} 
                onValueChange={(v) => {
                  const updated = { ...item, item_status: v };
                  if (v === 'הצעת מחיר') {
                    updated.is_executable = false;
                  }
                  setItem(updated);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="חדש">חדש</SelectItem>
                  <SelectItem value="בייצור">בייצור</SelectItem>
                  <SelectItem value="מוכן">מוכן</SelectItem>
                  <SelectItem value="הותקן">הותקן</SelectItem>
                  <SelectItem value="הצעת מחיר">הצעת מחיר</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>הערות</Label>
            <Textarea 
              value={item.notes} 
              onChange={(e) => setItem({...item, notes: e.target.value})}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={handleSave}>שמור</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}