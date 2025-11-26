import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, User, Ruler, Grid3X3, CreditCard, Send, ArrowRight, Loader2, Calculator } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import CurtainItemForm from '@/components/orders/CurtainItemForm';
import OtherItemForm from '@/components/orders/OtherItemForm';
import ItemsList from '@/components/orders/ItemsList';

export default function NewOrder() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [orderId, setOrderId] = useState(null);
  
  // Customer state
  const [customer, setCustomer] = useState({
    customer_name: '',
    phone: '',
    agent_name: '',
    address: '',
    auto_order_number: ''
  });

  // Items state
  const [curtainItems, setCurtainItems] = useState([]);
  const [otherItems, setOtherItems] = useState([]);

  // Payment state
  const [payment, setPayment] = useState({
    installation_cost: '',
    total_payment: '',
    paid_amount: '',
    payment_type: '',
    order_notes: '',
    email_for_pdf: '',
    signature: '',
    discount: '',
    is_quote: false
  });

  // Form dialogs
  const [curtainFormOpen, setCurtainFormOpen] = useState(false);
  const [otherFormOpen, setOtherFormOpen] = useState(false);
  const [editingCurtainIndex, setEditingCurtainIndex] = useState(null);
  const [editingOtherIndex, setEditingOtherIndex] = useState(null);

  // Load order for edit mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editOrderId = params.get('edit');
    if (editOrderId) {
      loadOrder(editOrderId);
    } else {
      generateOrderNumber();
    }
  }, []);

  const generateOrderNumber = () => {
    const num = `ORD-${Date.now().toString().slice(-6)}`;
    setCustomer(prev => ({ ...prev, auto_order_number: num }));
  };

  const loadOrder = async (id) => {
    setIsLoadingOrder(true);
    setEditMode(true);
    setOrderId(id);
    
    const orders = await base44.entities.Orders.filter({ id });
    if (orders.length > 0) {
      const order = orders[0];
      
      // Load customer
      if (order.customer_id) {
        const customers = await base44.entities.Customers.filter({ id: order.customer_id });
        if (customers.length > 0) {
          setCustomer(customers[0]);
        }
      }
      
      // Load payment info
      setPayment({
        installation_cost: order.installation_cost || '',
        total_payment: order.total_payment || '',
        paid_amount: order.paid_amount || '',
        payment_type: order.payment_type || '',
        order_notes: order.order_notes || '',
        email_for_pdf: order.email_for_pdf || '',
        signature: order.signature || '',
        discount: order.discount || '',
        is_quote: order.is_quote || false
      });

      // Load curtain items
      const curtains = await base44.entities.CurtainItems.filter({ order_id: id });
      setCurtainItems(curtains);

      // Load other items
      const others = await base44.entities.OtherItems.filter({ order_id: id });
      setOtherItems(others);
    }
    setIsLoadingOrder(false);
  };

  // Calculation logic
  const installationCost = parseFloat(payment.installation_cost) || 0;
  const discountAmount = parseFloat(payment.discount) || 0;

  const allCurtainItems = curtainItems || [];
  const allOtherItems = otherItems || [];
  const allItems = [...allCurtainItems, ...allOtherItems];

  // Quote mode → calculate based on ALL items
  // Normal order → only executable items
  const executableItems = payment.is_quote
    ? allItems
    : allItems.filter(item => item.is_executable !== false);

  const executableItemsTotal = executableItems.reduce(
    (sum, item) => sum + (parseFloat(item.price) || 0),
    0
  );

  // Wall meters (sum of widths)
  const wallWidthTotal = executableItems.reduce(
    (sum, item) => sum + (parseFloat(item.width) || 0),
    0
  );

  // Total payment = executable items - discount
  const calculatedTotalPayment = executableItemsTotal - discountAmount;

  // Remaining amount
  const remainingAmount = (parseFloat(payment.total_payment) || 0) - (parseFloat(payment.paid_amount) || 0);

  // Handle quote mode toggle
  const handleQuoteToggle = (checked) => {
    setPayment({ ...payment, is_quote: checked });
    if (checked) {
      // Set all items to not executable
      setCurtainItems(prev => prev.map(item => ({ ...item, is_executable: false, item_status: 'הצעת מחיר' })));
      setOtherItems(prev => prev.map(item => ({ ...item, is_executable: false, item_status: 'הצעת מחיר' })));
    }
  };

  // Curtain item handlers
  const handleAddCurtain = (item) => {
    if (editingCurtainIndex !== null) {
      const updated = [...curtainItems];
      updated[editingCurtainIndex] = { ...updated[editingCurtainIndex], ...item };
      setCurtainItems(updated);
      setEditingCurtainIndex(null);
    } else {
      setCurtainItems([...curtainItems, item]);
    }
  };

  const handleEditCurtain = (index) => {
    setEditingCurtainIndex(index);
    setCurtainFormOpen(true);
  };

  const handleDeleteCurtain = (index) => {
    setCurtainItems(curtainItems.filter((_, i) => i !== index));
  };

  // Other item handlers
  const handleAddOther = (item) => {
    if (editingOtherIndex !== null) {
      const updated = [...otherItems];
      updated[editingOtherIndex] = { ...updated[editingOtherIndex], ...item };
      setOtherItems(updated);
      setEditingOtherIndex(null);
    } else {
      setOtherItems([...otherItems, item]);
    }
  };

  const handleEditOther = (index) => {
    setEditingOtherIndex(index);
    setOtherFormOpen(true);
  };

  const handleDeleteOther = (index) => {
    setOtherItems(otherItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!customer.customer_name || !customer.phone) {
      toast.error('נא למלא שם לקוח וטלפון');
      return;
    }

    if (curtainItems.length === 0 && otherItems.length === 0) {
      toast.error('יש להוסיף לפחות וילון אחד או פריט אחד להזמנה');
      return;
    }

    if (!payment.total_payment || !payment.paid_amount) {
      toast.error('נא למלא סה"כ לתשלום ושולם על החשבון');
      return;
    }

    setIsSubmitting(true);

    // Create or update customer
    let customerId;
    if (editMode && customer.id) {
      await base44.entities.Customers.update(customer.id, customer);
      customerId = customer.id;
    } else {
      const newCustomer = await base44.entities.Customers.create(customer);
      customerId = newCustomer.id;
    }

    // Create or update order
    const orderData = {
      customer_id: customerId,
      customer_name: customer.customer_name,
      order_number: customer.auto_order_number,
      order_date: new Date().toISOString().split('T')[0],
      installation_cost: parseFloat(payment.installation_cost) || 0,
      total_payment: parseFloat(payment.total_payment) || 0,
      paid_amount: parseFloat(payment.paid_amount) || 0,
      payment_type: payment.payment_type,
      remaining_amount: remainingAmount,
      discount: discountAmount,
      is_quote: payment.is_quote,
      order_notes: payment.order_notes,
      email_for_pdf: payment.email_for_pdf,
      signature: payment.signature
    };

    let newOrderId;
    if (editMode && orderId) {
      await base44.entities.Orders.update(orderId, orderData);
      newOrderId = orderId;
      
      // Delete old items
      const oldCurtains = await base44.entities.CurtainItems.filter({ order_id: orderId });
      for (const item of oldCurtains) {
        await base44.entities.CurtainItems.delete(item.id);
      }
      const oldOthers = await base44.entities.OtherItems.filter({ order_id: orderId });
      for (const item of oldOthers) {
        await base44.entities.OtherItems.delete(item.id);
      }
    } else {
      const newOrder = await base44.entities.Orders.create(orderData);
      newOrderId = newOrder.id;
    }

    // Create curtain items
    for (const item of curtainItems) {
      const { id, created_date, updated_date, created_by, ...itemData } = item;
      await base44.entities.CurtainItems.create({
        ...itemData,
        order_id: newOrderId
      });
    }

    // Create other items
    for (const item of otherItems) {
      const { id, created_date, updated_date, created_by, ...itemData } = item;
      await base44.entities.OtherItems.create({
        ...itemData,
        order_id: newOrderId
      });
    }

    toast.success(editMode ? 'ההזמנה עודכנה בהצלחה!' : 'ההזמנה נשמרה בהצלחה!');
    navigate(createPageUrl('OrdersList'));
    setIsSubmitting(false);
  };

  if (isLoadingOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin ml-2 text-blue-600" />
        <span className="text-lg text-slate-600">טוען הזמנה...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              {editMode ? 'עריכת הזמנה' : 'הזמנה חדשה'}
            </h1>
            <p className="text-slate-500 mt-1">קאירי וילונות</p>
          </div>
          <Link to={createPageUrl('OrdersList')}>
            <Button variant="outline" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              חזרה לרשימה
            </Button>
          </Link>
        </div>

        {/* Section A: Customer Details */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-l from-blue-600 to-blue-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              פרטי לקוח
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>שם לקוח *</Label>
                <Input 
                  value={customer.customer_name}
                  onChange={(e) => setCustomer({...customer, customer_name: e.target.value})}
                  placeholder="שם מלא"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>טלפון *</Label>
                <Input 
                  value={customer.phone}
                  onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                  placeholder="050-0000000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>שם סוכן *</Label>
                <Input 
                  value={customer.agent_name}
                  onChange={(e) => setCustomer({...customer, agent_name: e.target.value})}
                  placeholder="שם הסוכן"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>מספר הזמנה</Label>
                <Input 
                  value={customer.auto_order_number}
                  readOnly
                  className="mt-1 bg-slate-50"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>כתובת *</Label>
                <Input 
                  value={customer.address}
                  onChange={(e) => setCustomer({...customer, address: e.target.value})}
                  placeholder="רחוב, עיר"
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section B: Curtain Measurements */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-l from-purple-600 to-purple-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                מידות וילונות
              </div>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => {
                  setEditingCurtainIndex(null);
                  setCurtainFormOpen(true);
                }}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                הוסף וילון
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ItemsList 
              items={curtainItems}
              type="curtain"
              onEdit={handleEditCurtain}
              onDelete={handleDeleteCurtain}
            />
          </CardContent>
        </Card>

        {/* Section C: Other Items */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-l from-amber-500 to-amber-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                זברות / ונציאני / רומי / גלילה
              </div>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => {
                  setEditingOtherIndex(null);
                  setOtherFormOpen(true);
                }}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                הוסף פריט
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ItemsList 
              items={otherItems}
              type="other"
              onEdit={handleEditOther}
              onDelete={handleDeleteOther}
            />
          </CardContent>
        </Card>

        {/* Section D: Payment */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-l from-green-600 to-green-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              תשלום
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Quote Mode Toggle */}
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Switch 
                  checked={payment.is_quote} 
                  onCheckedChange={handleQuoteToggle}
                />
                <Label className="text-amber-800 font-medium">הזמנה זו היא הצעת מחיר בלבד</Label>
              </div>
              {payment.is_quote && (
                <p className="mt-2 text-sm text-amber-600">כל הפריטים סומנו כ"הצעת מחיר" ולא יחושבו לביצוע.</p>
              )}
            </div>

            {/* Summary Section */}
            <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-xs text-blue-600 mb-1">סה"כ פריטים לביצוע</div>
                <div className="text-lg font-bold text-blue-800">₪{executableItemsTotal.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div className="text-xs text-purple-600 mb-1">סה"כ רוחב (מטר קיר)</div>
                <div className="text-lg font-bold text-purple-800">{wallWidthTotal.toLocaleString()} ס"מ</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="text-xs text-green-600 mb-1">חישוב אוטומטי</div>
                <div className="text-lg font-bold text-green-800">₪{calculatedTotalPayment.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-600 mb-1">נשאר לתשלום</div>
                <div className={`text-lg font-bold ${remainingAmount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  ₪{remainingAmount.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>התקנה (₪)</Label>
                <Input 
                  type="number"
                  value={payment.installation_cost}
                  onChange={(e) => setPayment({...payment, installation_cost: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>הנחה (₪)</Label>
                <Input 
                  type="number"
                  value={payment.discount}
                  onChange={(e) => setPayment({...payment, discount: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>סה"כ לתשלום (₪) *</Label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    type="number"
                    value={payment.total_payment}
                    onChange={(e) => setPayment({...payment, total_payment: e.target.value})}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPayment({...payment, total_payment: calculatedTotalPayment.toString()})}
                    className="shrink-0 gap-1"
                  >
                    <Calculator className="h-4 w-4" />
                    מלא
                  </Button>
                </div>
              </div>
              <div>
                <Label>שולם על החשבון (₪) *</Label>
                <Input 
                  type="number"
                  value={payment.paid_amount}
                  onChange={(e) => setPayment({...payment, paid_amount: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>סוג תשלום</Label>
                <Select 
                  value={payment.payment_type} 
                  onValueChange={(v) => setPayment({...payment, payment_type: v})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר סוג תשלום" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="צ'ק">צ'ק</SelectItem>
                    <SelectItem value="אשראי">אשראי</SelectItem>
                    <SelectItem value="מזומן">מזומן</SelectItem>
                    <SelectItem value="תשלום במכשיר">תשלום במכשיר</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>אימייל לשליחת הטופס</Label>
                <Input 
                  type="email"
                  value={payment.email_for_pdf}
                  onChange={(e) => setPayment({...payment, email_for_pdf: e.target.value})}
                  placeholder="email@example.com"
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <Label>הערות</Label>
                <Textarea 
                  value={payment.order_notes}
                  onChange={(e) => setPayment({...payment, order_notes: e.target.value})}
                  placeholder="הערות להזמנה..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <Label>חתימה</Label>
                <Textarea 
                  value={payment.signature}
                  onChange={(e) => setPayment({...payment, signature: e.target.value})}
                  placeholder="הקלד שם לחתימה או השאר ריק..."
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center pb-8">
          <Button 
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2 px-12 py-6 text-lg bg-gradient-to-l from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            {editMode ? 'עדכן הזמנה' : 'שלח הזמנה'}
          </Button>
        </div>

        {/* Dialogs */}
        <CurtainItemForm 
          open={curtainFormOpen}
          onClose={() => {
            setCurtainFormOpen(false);
            setEditingCurtainIndex(null);
          }}
          onSave={handleAddCurtain}
          editItem={editingCurtainIndex !== null ? curtainItems[editingCurtainIndex] : null}
        />

        <OtherItemForm 
          open={otherFormOpen}
          onClose={() => {
            setOtherFormOpen(false);
            setEditingOtherIndex(null);
          }}
          onSave={handleAddOther}
          editItem={editingOtherIndex !== null ? otherItems[editingOtherIndex] : null}
        />
      </div>
    </div>
  );
}