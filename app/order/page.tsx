'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Plus,
  Minus,
  ShoppingCart,
  Receipt,
  Coffee,
  UtensilsCrossed,
  GripVertical,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';

interface AddOn {
  name: string;
  price: number;
  allowQuantity?: boolean;
}

interface SelectedAddOn extends AddOn {
  quantity: number;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'drink' | 'food';
  addOns: AddOn[];
}

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  addOns: SelectedAddOn[];
  subtotal: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  timestamp: string;
  date: string;
}

export default function OrderPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [displayOrder, setDisplayOrder] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'drink' | 'food'
  >('all');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [change, setChange] = useState(0);
  const [draggedItem, setDraggedItem] = useState<MenuItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    const savedMenu = localStorage.getItem('cafe-menu');
    if (savedMenu) {
      const items = JSON.parse(savedMenu);
      // Migrate old format to new format if needed
      const migratedItems = items.map((item: any) => ({
        ...item,
        addOns:
          Array.isArray(item.addOns) &&
          item.addOns.length > 0 &&
          typeof item.addOns[0] === 'string'
            ? item.addOns.map((addon: string) => ({
                name: addon,
                price: 0,
                allowQuantity: false,
              }))
            : item.addOns?.map((addon: any) => ({
                name: addon.name || addon,
                price: addon.price || 0,
                allowQuantity: addon.allowQuantity || false,
              })) || [],
      }));
      setMenuItems(migratedItems);

      // Load custom display order or use default
      const savedOrder = localStorage.getItem('cafe-menu-display-order');
      if (savedOrder) {
        const orderIds = JSON.parse(savedOrder);
        const orderedItems = orderIds
          .map((id: string) =>
            migratedItems.find((item: MenuItem) => item.id === id)
          )
          .filter(Boolean);
        const newItems = migratedItems.filter(
          (item: MenuItem) => !orderIds.includes(item.id)
        );
        setDisplayOrder([...orderedItems, ...newItems]);
      } else {
        setDisplayOrder(migratedItems);
      }
    }
  }, []);

  const saveDisplayOrder = (items: MenuItem[]) => {
    const orderIds = items.map((item) => item.id);
    localStorage.setItem('cafe-menu-display-order', JSON.stringify(orderIds));
    setDisplayOrder(items);
  };

  const handleDragStart = (e: React.DragEvent, item: MenuItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetItem: MenuItem) => {
    e.preventDefault();

    if (!draggedItem || draggedItem.id === targetItem.id) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    const draggedIndex = displayOrder.findIndex(
      (item) => item.id === draggedItem.id
    );
    const targetIndex = displayOrder.findIndex(
      (item) => item.id === targetItem.id
    );

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder items
    const reorderedItems = [...displayOrder];
    const [removed] = reorderedItems.splice(draggedIndex, 1);
    reorderedItems.splice(targetIndex, 0, removed);

    saveDisplayOrder(reorderedItems);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const addToCart = (menuItem: MenuItem, addOns: SelectedAddOn[] = []) => {
    const existingItemIndex = cart.findIndex(
      (item) =>
        item.menuItem.id === menuItem.id &&
        JSON.stringify(
          item.addOns.map((a) => ({ name: a.name, quantity: a.quantity }))
        ) ===
          JSON.stringify(
            addOns.map((a) => ({ name: a.name, quantity: a.quantity }))
          )
    );

    const addOnTotal = addOns.reduce(
      (sum, addon) => sum + addon.price * addon.quantity,
      0
    );
    const subtotal = menuItem.price + addOnTotal;

    if (existingItemIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      updatedCart[existingItemIndex].subtotal += subtotal;
      setCart(updatedCart);
    } else {
      const newItem: OrderItem = {
        menuItem,
        quantity: 1,
        addOns,
        subtotal,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (index: number, change: number) => {
    const updatedCart = [...cart];
    const item = updatedCart[index];

    if (item.quantity + change <= 0) {
      updatedCart.splice(index, 1);
    } else {
      item.quantity += change;
      const addOnTotal = item.addOns.reduce(
        (sum, addon) => sum + addon.price * addon.quantity,
        0
      );
      const itemPrice = item.menuItem.price + addOnTotal;
      item.subtotal = itemPrice * item.quantity;
    }

    setCart(updatedCart);
  };

  const removeFromCart = (index: number) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const handlePayment = (useExactAmount = false) => {
    const total = calculateTotal();
    const paid = useExactAmount ? total : Number.parseFloat(paymentAmount);

    if (paid < total) {
      alert('Payment amount is insufficient!');
      return;
    }

    const calculatedChange = paid - total;
    setChange(calculatedChange);

    const order: Order = {
      id: Date.now().toString(),
      items: [...cart],
      total: total,
      timestamp: new Date().toLocaleString(),
      date: new Date().toDateString(),
    };

    // Save to localStorage
    const existingOrders = JSON.parse(
      localStorage.getItem('cafe-orders') || '[]'
    );
    const updatedOrders = [...existingOrders, order];
    localStorage.setItem('cafe-orders', JSON.stringify(updatedOrders));

    setCurrentOrder(order);
    setCart([]);
    setPaymentAmount('');
    setShowReceipt(true);
  };

  const filteredItems =
    selectedCategory === 'all'
      ? displayOrder
      : displayOrder.filter((item) => item.category === selectedCategory);

  const total = calculateTotal();
  const paid = Number.parseFloat(paymentAmount) || 0;
  const calculatedChange = paid - total;

  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto p-6'>
        <div className='flex items-center justify-between gap-4 mb-8'>
          <div className='flex items-center gap-4'>
            <Link href='/'>
              <Button variant='outline' size='icon'>
                <ArrowLeft className='h-4 w-4' />
              </Button>
            </Link>
            <div>
              <h1 className='text-3xl font-bold text-foreground'>New Order</h1>
              <p className='text-muted-foreground'>
                Select items to add to the order
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Menu Items */}
          <div className='lg:col-span-2'>
            <div className='flex justify-between items-center mb-6'>
              <div className='flex gap-2'>
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('all')}
                >
                  All Items
                </Button>
                <Button
                  variant={selectedCategory === 'drink' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('drink')}
                >
                  <Coffee className='h-4 w-4 mr-2' />
                  Drinks
                </Button>
                <Button
                  variant={selectedCategory === 'food' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('food')}
                >
                  <UtensilsCrossed className='h-4 w-4 mr-2' />
                  Food
                </Button>
              </div>
              <p className='text-sm text-muted-foreground'>
                Drag to reorder menu items
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {filteredItems.map((item, index) => (
                <Card
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, item)}
                  onDragEnd={handleDragEnd}
                  className={`cursor-move transition-all touch-pan-y select-none ${
                    draggedItem?.id === item.id ? 'opacity-50 scale-95' : ''
                  } ${
                    dragOverIndex === index
                      ? 'ring-2 ring-blue-400 ring-offset-2'
                      : ''
                  }`}
                  // Add role and aria-grabbed for accessibility
                  role='option'
                  aria-grabbed={draggedItem?.id === item.id}
                  tabIndex={0}
                  // Keyboard reordering for accessibility
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' && index > 0) {
                      // Move item up
                      const reordered = [...filteredItems];
                      [reordered[index - 1], reordered[index]] = [
                        reordered[index],
                        reordered[index - 1],
                      ];
                      saveDisplayOrder(reordered);
                    }
                    if (
                      e.key === 'ArrowDown' &&
                      index < filteredItems.length - 1
                    ) {
                      // Move item down
                      const reordered = [...filteredItems];
                      [reordered[index], reordered[index + 1]] = [
                        reordered[index + 1],
                        reordered[index],
                      ];
                      saveDisplayOrder(reordered);
                    }
                  }}
                >
                  <CardHeader>
                    <div className='flex justify-between items-start'>
                      <div className='flex items-center gap-2'>
                        {/* Show a larger drag handle on mobile/tablet */}
                        <span
                          className='flex items-center justify-center md:hidden touch-none active:scale-125 transition-transform'
                          style={{ touchAction: 'none', cursor: 'grab' }}
                          aria-label='Drag to reorder'
                        >
                          <GripVertical className='h-6 w-6 text-muted-foreground' />
                        </span>
                        <span className='hidden md:flex'>
                          <GripVertical className='h-4 w-4 text-muted-foreground' />
                        </span>
                        <div>
                          <CardTitle className='text-sm'>{item.name}</CardTitle>
                          <CardDescription className='text-base font-bold text-green-600'>
                            ${item.price.toFixed(2)}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant={
                          item.category === 'drink' ? 'default' : 'secondary'
                        }
                      >
                        {item.category === 'drink' ? (
                          <Coffee className='h-3 w-3 mr-1' />
                        ) : (
                          <UtensilsCrossed className='h-3 w-3 mr-1' />
                        )}
                        {item.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <MenuItemActions item={item} onAddToCart={addToCart} />
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className='text-center py-12'>
                <ShoppingCart className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <h3 className='text-lg font-medium text-foreground mb-2'>
                  No items found
                </h3>
                <p className='text-muted-foreground'>
                  Add items to your menu first.
                </p>
                <Link href='/menu'>
                  <Button className='mt-4'>Go to Menu Management</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Cart */}
          <div className='lg:col-span-1'>
            <Card className='sticky top-6'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <ShoppingCart className='h-5 w-5' />
                  Current Order
                </CardTitle>
                <CardDescription>
                  {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className='text-muted-foreground text-center py-4'>
                    Cart is empty
                  </p>
                ) : (
                  <>
                    <div className='space-y-4 mb-4 overflow-y-auto max-h-[275px]'>
                      {cart.map((item, index) => (
                        <div
                          key={index}
                          className='flex justify-between items-start'
                        >
                          <div className='flex-1'>
                            <div className='flex items-center gap-2'>
                              <p className='font-medium'>
                                {item.menuItem.name}
                              </p>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    className='h-4 w-4 text-red-500 hover:text-red-700'
                                  >
                                    <X className='h-3 w-3' />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Remove Item
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove "
                                      {item.menuItem.name}" from your cart?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => removeFromCart(index)}
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                            <p className='text-sm text-muted-foreground'>
                              ${item.menuItem.price.toFixed(2)} base
                              {item.addOns.length > 0 && (
                                <span>
                                  {' '}
                                  + $
                                  {item.addOns
                                    .reduce(
                                      (sum, addon) =>
                                        sum + addon.price * addon.quantity,
                                      0
                                    )
                                    .toFixed(2)}{' '}
                                  add-ons
                                </span>
                              )}
                            </p>
                            {item.addOns.length > 0 && (
                              <div className='flex flex-wrap gap-1 mt-1'>
                                {item.addOns.map((addon, i) => (
                                  <Badge
                                    key={i}
                                    variant='outline'
                                    className='text-xs'
                                  >
                                    {addon.quantity > 1
                                      ? `${addon.quantity}x `
                                      : ''}
                                    {addon.name} +$
                                    {(addon.price * addon.quantity).toFixed(2)}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className='flex items-center gap-2 ml-4'>
                            <Button
                              variant='outline'
                              size='icon'
                              className='h-6 w-6 bg-transparent'
                              onClick={() => updateQuantity(index, -1)}
                            >
                              <Minus className='h-3 w-3' />
                            </Button>
                            <span className='w-8 text-center'>
                              {item.quantity}
                            </span>
                            <Button
                              variant='outline'
                              size='icon'
                              className='h-6 w-6 bg-transparent'
                              onClick={() => updateQuantity(index, 1)}
                            >
                              <Plus className='h-3 w-3' />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className='my-4' />

                    <div className='flex justify-between items-center text-lg font-bold mb-4'>
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>

                    {/* Payment Section - Always Visible */}
                    <div className='space-y-4'>
                      <div className='space-y-2'>
                        <Label
                          htmlFor='payment-amount'
                          className='text-sm font-medium'
                        >
                          Amount Received ($)
                        </Label>
                        <div className='flex gap-2 mb-2'>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => setPaymentAmount('5.00')}
                            className='flex-1 text-xs'
                          >
                            $5
                          </Button>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => setPaymentAmount('10.00')}
                            className='flex-1 text-xs'
                          >
                            $10
                          </Button>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => setPaymentAmount('20.00')}
                            className='flex-1 text-xs'
                          >
                            $20
                          </Button>
                        </div>
                        <Input
                          id='payment-amount'
                          type='number'
                          step='0.01'
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder='0.00'
                          className='text-center'
                        />
                      </div>

                      {paymentAmount && paid >= total && (
                        <div className='text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800'>
                          <p className='text-sm text-muted-foreground mb-1'>
                            Change
                          </p>
                          <p className='text-xl font-bold text-blue-600 dark:text-blue-400'>
                            ${calculatedChange.toFixed(2)}
                          </p>
                        </div>
                      )}

                      {paymentAmount && paid < total && (
                        <div className='text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800'>
                          <p className='text-sm text-red-600 dark:text-red-400'>
                            Insufficient payment. Need $
                            {(total - paid).toFixed(2)} more.
                          </p>
                        </div>
                      )}

                      <div className='flex gap-2'>
                        <Button
                          onClick={() => {
                            if (!paymentAmount || paid < total) {
                              setPaymentAmount(total.toFixed(2)); // Set exact amount if insufficient
                            } else {
                              handlePayment(false); // Complete order if sufficient
                            }
                          }}
                          className={`flex-1 bg-green-600 hover:bg-green-700 ${
                            !paymentAmount || paid < total
                              ? 'bg-yellow-500 hover:bg-yellow-600'
                              : ''
                          }`}
                        >
                          <Receipt className='h-4 w-4 mr-2' />
                          {!paymentAmount || paid < total
                            ? 'Exact'
                            : 'Complete Order'}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Receipt Dialog */}
        <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
          <DialogContent className='sm:max-w-[425px] p-4'>
            <DialogHeader>
              <DialogTitle className='text-base md:text-lg'>
                Order Complete!
              </DialogTitle>
              <DialogDescription className='text-xs md:text-sm'>
                Receipt for Order #{currentOrder?.id.slice(-6)}
              </DialogDescription>
            </DialogHeader>

            {currentOrder && (
              <div className='py-2'>
                <div className='text-center mb-2'>
                  <h3 className='font-bold text-base'>DDAL.licious Receipt</h3>
                  <p className='text-xs text-muted-foreground'>
                    {currentOrder.timestamp}
                  </p>
                </div>

                <Separator className='my-2' />

                {/* Make only the item list scrollable */}
                <div
                  className='space-y-2 overflow-y-auto'
                  style={{
                    maxHeight: '30vh',
                    minHeight: 'unset',
                  }}
                >
                  {currentOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className='flex justify-between items-start'
                    >
                      <div>
                        <p className='font-medium text-xs md:text-sm'>
                          {item.quantity}x {item.menuItem.name}
                        </p>
                        {item.addOns.length > 0 && (
                          <p className='text-[10px] text-muted-foreground'>
                            +{' '}
                            {item.addOns
                              .map((addon) =>
                                addon.quantity > 1
                                  ? `${addon.quantity}x ${addon.name} (+$${(
                                      addon.price * addon.quantity
                                    ).toFixed(2)})`
                                  : `${addon.name} (+$${addon.price.toFixed(
                                      2
                                    )})`
                              )
                              .join(', ')}
                          </p>
                        )}
                      </div>
                      <span className='text-xs md:text-sm'>
                        ${item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className='border-t pt-2 space-y-1 mt-2'>
                  <div className='flex justify-between text-xs md:text-sm'>
                    <span>Subtotal:</span>
                    <span>${currentOrder.total.toFixed(2)}</span>
                  </div>
                  <div className='flex justify-between text-xs md:text-sm'>
                    <span>Amount Paid:</span>
                    <span>${(currentOrder.total + change).toFixed(2)}</span>
                  </div>
                  <div className='flex justify-between font-bold text-xs md:text-base border-t pt-1'>
                    <span>Change:</span>
                    <span className='text-green-600'>${change.toFixed(2)}</span>
                  </div>
                </div>

                <Separator className='my-2' />

                <div className='flex justify-between font-bold text-base md:text-lg'>
                  <span>Total:</span>
                  <span>${currentOrder.total.toFixed(2)}</span>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                onClick={() => setShowReceipt(false)}
                className='w-full text-xs md:text-sm'
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function MenuItemActions({
  item,
  onAddToCart,
}: {
  item: MenuItem;
  onAddToCart: (item: MenuItem, addOns: SelectedAddOn[]) => void;
}) {
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOn[]>([]);
  const [showCustomization, setShowCustomization] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(item, selectedAddOns);
    setSelectedAddOns([]);
    setShowCustomization(false);
  };

  const hasAddOns = item.addOns.length > 0;

  const calculateItemTotal = () => {
    const addOnTotal = selectedAddOns.reduce(
      (sum, addon) => sum + addon.price * addon.quantity,
      0
    );
    return item.price + addOnTotal;
  };

  const handleAddOnChange = (addon: AddOn, checked: boolean) => {
    if (checked) {
      setSelectedAddOns([...selectedAddOns, { ...addon, quantity: 1 }]);
    } else {
      setSelectedAddOns(selectedAddOns.filter((a) => a.name !== addon.name));
    }
  };

  const updateAddOnQuantity = (addonName: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedAddOns(selectedAddOns.filter((a) => a.name !== addonName));
    } else {
      setSelectedAddOns(
        selectedAddOns.map((addon) =>
          addon.name === addonName ? { ...addon, quantity } : addon
        )
      );
    }
  };

  return (
    <>
      {!showCustomization ? (
        <div className='flex gap-2'>
          <Button
            className='flex-1'
            onClick={
              hasAddOns ? () => setShowCustomization(true) : handleAddToCart
            }
          >
            <Plus className='h-4 w-4 mr-2' />
            Add to Cart
          </Button>
          {hasAddOns && (
            <Button variant='outline' onClick={handleAddToCart}>
              Quick Add
            </Button>
          )}
        </div>
      ) : (
        <div className='space-y-4'>
          {item.addOns.length > 0 && (
            <div>
              <Label className='text-sm font-medium'>Add-ons:</Label>
              <div className='grid grid-cols-1 gap-3 mt-2'>
                {item.addOns.map((addon, index) => {
                  const selectedAddon = selectedAddOns.find(
                    (a) => a.name === addon.name
                  );
                  const isSelected = !!selectedAddon;

                  return (
                    <div key={index} className='space-y-2'>
                      <div className='flex items-center space-x-2'>
                        <Checkbox
                          id={`${item.id}-addon-${index}`}
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleAddOnChange(addon, checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={`${item.id}-addon-${index}`}
                          className='text-sm flex-1'
                        >
                          {addon.name}{' '}
                          <span className='text-green-600 font-medium'>
                            +${addon.price.toFixed(2)}
                            {addon.allowQuantity && ' each'}
                          </span>
                        </Label>
                        {addon.allowQuantity && (
                          <Badge variant='outline' className='text-xs'>
                            Qty
                          </Badge>
                        )}
                      </div>

                      {isSelected && addon.allowQuantity && (
                        <div className='ml-6 flex items-center gap-2'>
                          <Label className='text-xs text-muted-foreground'>
                            Quantity:
                          </Label>
                          <div className='flex items-center gap-1'>
                            <Button
                              type='button'
                              variant='outline'
                              size='icon'
                              className='h-6 w-6 bg-transparent'
                              onClick={() =>
                                updateAddOnQuantity(
                                  addon.name,
                                  Math.max(
                                    1,
                                    (selectedAddon?.quantity || 1) - 1
                                  )
                                )
                              }
                            >
                              <Minus className='h-3 w-3' />
                            </Button>
                            <Input
                              type='number'
                              min='1'
                              max='10'
                              value={selectedAddon?.quantity || 1}
                              onChange={(e) =>
                                updateAddOnQuantity(
                                  addon.name,
                                  Number.parseInt(e.target.value) || 1
                                )
                              }
                              className='w-16 h-6 text-center text-xs'
                            />
                            <Button
                              type='button'
                              variant='outline'
                              size='icon'
                              className='h-6 w-6 bg-transparent'
                              onClick={() =>
                                updateAddOnQuantity(
                                  addon.name,
                                  Math.min(
                                    10,
                                    (selectedAddon?.quantity || 1) + 1
                                  )
                                )
                              }
                            >
                              <Plus className='h-3 w-3' />
                            </Button>
                          </div>
                          <span className='text-xs text-muted-foreground'>
                            = $
                            {(
                              (selectedAddon?.quantity || 1) * addon.price
                            ).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedAddOns.length > 0 && (
            <div className='p-2 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800'>
              <p className='text-sm font-medium text-blue-900 dark:text-blue-100'>
                Total: ${calculateItemTotal().toFixed(2)}
              </p>
              <div className='text-xs text-blue-700 dark:text-blue-300 mt-1'>
                {selectedAddOns.map((addon, i) => (
                  <span key={i}>
                    {addon.quantity > 1 ? `${addon.quantity}x ` : ''}
                    {addon.name}
                    {i < selectedAddOns.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className='flex gap-2'>
            <Button onClick={handleAddToCart} className='flex-1'>
              <Plus className='h-4 w-4 mr-2' />
              Add to Cart - ${calculateItemTotal().toFixed(2)}
            </Button>
            <Button
              variant='outline'
              onClick={() => setShowCustomization(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
