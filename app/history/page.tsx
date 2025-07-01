'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Receipt,
  Search,
  Calendar,
  Trash2,
  Archive,
} from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme-toggle';

interface AddOn {
  name: string;
  price: number;
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
  addOns: AddOn[];
  customText: string;
  subtotal: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  timestamp: string;
  date: string;
}

interface SaleSession {
  id: string;
  name?: string;
  date: string;
  closedAt: string;
  orders: Order[];
  totalSales: number;
  totalItems: number;
  orderCount: number;
}

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'total'>('date');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCloseSaleDialog, setShowCloseSaleDialog] = useState(false);
  const [saleSessionName, setSaleSessionName] = useState('');
  const [existingSessions, setExistingSessions] = useState<SaleSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [createNewSession, setCreateNewSession] = useState(true);

  useEffect(() => {
    loadOrders();
    loadExistingSessions();
  }, [sortBy]);

  const loadOrders = () => {
    const savedOrders = localStorage.getItem('cafe-orders');
    if (savedOrders) {
      const orderList: Order[] = JSON.parse(savedOrders);

      // Sort orders
      orderList.sort((a, b) => {
        if (sortBy === 'date') {
          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        } else {
          return b.total - a.total;
        }
      });

      setOrders(orderList);
    }
  };

  const loadExistingSessions = () => {
    const savedArchive = localStorage.getItem('cafe-archive');
    if (savedArchive) {
      const sessions: SaleSession[] = JSON.parse(savedArchive);
      setExistingSessions(sessions);
    }
  };

  const deleteOrder = (orderId: string) => {
    const updatedOrders = orders.filter((order) => order.id !== orderId);
    localStorage.setItem('cafe-orders', JSON.stringify(updatedOrders));
    setOrders(updatedOrders);
  };

  const closeSale = () => {
    if (orders.length === 0) {
      alert('No orders to archive!');
      return;
    }

    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const totalItems = orders.reduce(
      (sum, order) =>
        sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    if (createNewSession) {
      // Create new session
      const newSession: SaleSession = {
        id: Date.now().toString(),
        name: saleSessionName.trim() || undefined,
        date: new Date().toDateString(),
        closedAt: new Date().toLocaleString(),
        orders: [...orders],
        totalSales,
        totalItems,
        orderCount: orders.length,
      };

      const existingArchive = JSON.parse(
        localStorage.getItem('cafe-archive') || '[]'
      );
      const updatedArchive = [...existingArchive, newSession];
      localStorage.setItem('cafe-archive', JSON.stringify(updatedArchive));
    } else {
      // Add to existing session
      const existingArchive = JSON.parse(
        localStorage.getItem('cafe-archive') || '[]'
      );
      const updatedArchive = existingArchive.map((session: SaleSession) => {
        if (session.id === selectedSessionId) {
          return {
            ...session,
            orders: [...session.orders, ...orders],
            totalSales: session.totalSales + totalSales,
            totalItems: session.totalItems + totalItems,
            orderCount: session.orderCount + orders.length,
            lastUpdated: new Date().toLocaleString(),
          };
        }
        return session;
      });
      localStorage.setItem('cafe-archive', JSON.stringify(updatedArchive));
    }

    // Clear current orders
    localStorage.setItem('cafe-orders', '[]');
    setOrders([]);
    setShowCloseSaleDialog(false);
    setSaleSessionName('');
    setSelectedSessionId('');
    setCreateNewSession(true);

    alert('Sale session closed successfully!');
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.menuItem.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const formatTime = (timestamp: string) => {
    try {
      // Handle different timestamp formats
      let date: Date;

      if (timestamp.includes('/')) {
        // Format: "30/04/2025, 21:30:36" or similar
        const parts = timestamp.split(', ');
        if (parts.length === 2) {
          const [datePart, timePart] = parts;
          const [day, month, year] = datePart.split('/');
          date = new Date(`${year}-${month}-${day}T${timePart}`);
        } else {
          date = new Date(timestamp);
        }
      } else {
        date = new Date(timestamp);
      }

      if (isNaN(date.getTime())) {
        return timestamp; // Return original if parsing fails
      }

      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return timestamp; // Return original if any error occurs
    }
  };

  const getTotalItems = (order: Order) => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getAddOnNames = (addOns: any[]): string => {
    if (!Array.isArray(addOns)) return '';

    return addOns
      .map((addon) => {
        if (typeof addon === 'string') {
          return addon;
        } else if (typeof addon === 'object' && addon.name) {
          return `${addon.name} (+$${addon.price?.toFixed(2) || '0.00'})`;
        }
        return String(addon);
      })
      .join(', ');
  };

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
              <h1 className='text-3xl font-bold text-foreground'>
                Receipt History
              </h1>
              <p className='text-muted-foreground'>
                View and manage order history
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Controls */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
          <div className='flex gap-4'>
            <Badge variant='secondary' className='text-sm'>
              <Receipt className='h-4 w-4 mr-1' />
              {orders.length} Orders
            </Badge>
            <Badge variant='secondary' className='text-sm'>
              Total: $
              {orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
            </Badge>
          </div>

          <div className='flex gap-2 w-full sm:w-auto'>
            <div className='relative flex-1 sm:flex-initial'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search orders...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-8 w-full sm:w-[200px]'
              />
            </div>

            <Button
              variant='outline'
              onClick={() => setShowCloseSaleDialog(true)}
              disabled={orders.length === 0}
              className='bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900 border-green-200 dark:border-green-800'
            >
              <Archive className='h-4 w-4 mr-2' />
              Close Sale
            </Button>

            <Select
              value={sortBy}
              onValueChange={(value: 'date' | 'total') => setSortBy(value)}
            >
              <SelectTrigger className='w-[120px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='date'>By Date</SelectItem>
                <SelectItem value='total'>By Total</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className='text-center py-12'>
            <Receipt className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
            <h3 className='text-lg font-medium text-foreground mb-2'>
              {orders.length === 0 ? 'No orders yet' : 'No results found'}
            </h3>
            <p className='text-muted-foreground'>
              {orders.length === 0
                ? 'Orders will appear here after checkout.'
                : 'Try adjusting your search terms.'}
            </p>
          </div>
        ) : (
          <div className='grid gap-4'>
            {filteredOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className='flex justify-between items-start'>
                    <div className='flex items-center gap-3'>
                      <Calendar className='h-5 w-5 text-muted-foreground' />
                      <div>
                        <CardTitle className='text-lg'>
                          Order #{order.id.slice(-6)}
                        </CardTitle>
                        <CardDescription>
                          {formatTime(order.timestamp)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className='flex items-center gap-3'>
                      <div className='text-right'>
                        <div className='text-2xl font-bold text-green-600'>
                          ${order.total.toFixed(2)}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {getTotalItems(order)} items
                        </div>
                      </div>
                      <div className='flex gap-2'>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => setSelectedOrder(order)}
                            >
                              View Receipt
                            </Button>
                          </DialogTrigger>
                          <DialogContent className='sm:max-w-[425px] p-4'>
                            <DialogHeader>
                              <DialogTitle className='text-base md:text-lg'>
                                Receipt Details
                              </DialogTitle>
                              <DialogDescription className='text-xs md:text-sm'>
                                Order #{order.id.slice(-6)} -{' '}
                                {formatTime(order.timestamp)}
                              </DialogDescription>
                            </DialogHeader>

                            <div className='py-2'>
                              <div className='text-center mb-2'>
                                <h3 className='font-bold text-base'>
                                  DDAL.licious Receipt
                                </h3>
                                <p className='text-xs text-muted-foreground'>
                                  {formatTime(order.timestamp)}
                                </p>
                                <p className='text-xs text-muted-foreground'>
                                  Order ID: {order.id}
                                </p>
                              </div>

                              <Separator className='my-2' />

                              {/* Only the item list is scrollable */}
                              <div
                                className='space-y-3 overflow-y-auto'
                                style={{ maxHeight: '30vh' }}
                              >
                                {order.items.map((item, index) => (
                                  <div key={index} className='space-y-1'>
                                    <div className='flex justify-between'>
                                      <span className='font-medium text-xs md:text-sm'>
                                        {item.quantity}x {item.menuItem.name}
                                      </span>
                                      <span className='text-xs md:text-sm'>
                                        ${item.subtotal.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className='text-[10px] text-muted-foreground ml-4'>
                                      ${item.menuItem.price.toFixed(2)} each
                                    </div>
                                    {item.addOns && item.addOns.length > 0 && (
                                      <div className='text-[10px] text-muted-foreground ml-4'>
                                        Add-ons: {getAddOnNames(item.addOns)}
                                      </div>
                                    )}
                                    {item.customText && (
                                      <div className='text-[10px] text-muted-foreground ml-4'>
                                        Note: {item.customText}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              <Separator className='my-2' />

                              <div className='flex justify-between items-center text-base font-bold'>
                                <span>Total:</span>
                                <span>${order.total.toFixed(2)}</span>
                              </div>

                              <div className='text-center mt-2 text-xs text-muted-foreground'>
                                Thank you for choosing DDAL.licious!
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant='outline' size='sm'>
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Order</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete Order #
                                {order.id.slice(-6)}? This action cannot be
                                undone.
                                <br />
                                <br />
                                <strong>Order Details:</strong>
                                <br />• {getTotalItems(order)} items
                                <br />• Total: ${order.total.toFixed(2)}
                                <br />• Time: {formatTime(order.timestamp)}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteOrder(order.id)}
                                className='bg-red-600 hover:bg-red-700'
                              >
                                Delete Order
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-wrap gap-1'>
                    {order.items.slice(0, 4).map((item, index) => (
                      <Badge
                        key={index}
                        variant='secondary'
                        className='text-xs'
                      >
                        {item.quantity}x {item.menuItem.name}
                      </Badge>
                    ))}
                    {order.items.length > 4 && (
                      <Badge variant='secondary' className='text-xs'>
                        +{order.items.length - 4} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Close Sale Dialog */}
        <Dialog
          open={showCloseSaleDialog}
          onOpenChange={setShowCloseSaleDialog}
        >
          <DialogContent className='sm:max-w-[500px]'>
            <DialogHeader>
              <DialogTitle>Close Sale Session</DialogTitle>
              <DialogDescription>
                Archive current orders and close the sale session. You can
                create a new session or add to an existing one.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4 py-4'>
              <div className='p-4 bg-muted rounded-lg'>
                <h4 className='font-medium mb-2'>Session Summary</h4>
                <div className='text-sm text-muted-foreground space-y-1'>
                  <div>Orders: {orders.length}</div>
                  <div>
                    Total Items:{' '}
                    {orders.reduce(
                      (sum, order) => sum + getTotalItems(order),
                      0
                    )}
                  </div>
                  <div className='font-medium text-green-600'>
                    Total Sales: $
                    {orders
                      .reduce((sum, order) => sum + order.total, 0)
                      .toFixed(2)}
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                <div className='flex items-center space-x-2'>
                  <input
                    type='radio'
                    id='new-session'
                    name='session-type'
                    checked={createNewSession}
                    onChange={() => setCreateNewSession(true)}
                    className='w-4 h-4'
                  />
                  <label htmlFor='new-session' className='text-sm font-medium'>
                    Create new session
                  </label>
                </div>

                {createNewSession && (
                  <div className='ml-6 space-y-2'>
                    <label
                      htmlFor='session-name'
                      className='text-sm font-medium'
                    >
                      Session Name (optional)
                    </label>
                    <Input
                      id='session-name'
                      value={saleSessionName}
                      onChange={(e) => setSaleSessionName(e.target.value)}
                      placeholder='e.g., Morning Rush, Evening Shift'
                    />
                  </div>
                )}

                {existingSessions.length > 0 && (
                  <>
                    <div className='flex items-center space-x-2'>
                      <input
                        type='radio'
                        id='existing-session'
                        name='session-type'
                        checked={!createNewSession}
                        onChange={() => setCreateNewSession(false)}
                        className='w-4 h-4'
                      />
                      <label
                        htmlFor='existing-session'
                        className='text-sm font-medium'
                      >
                        Add to existing session
                      </label>
                    </div>

                    {!createNewSession && (
                      <div className='ml-6 space-y-2'>
                        <label
                          htmlFor='existing-session-select'
                          className='text-sm font-medium'
                        >
                          Select Session
                        </label>
                        <Select
                          value={selectedSessionId}
                          onValueChange={setSelectedSessionId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Choose a session' />
                          </SelectTrigger>
                          <SelectContent>
                            {existingSessions.map((session) => (
                              <SelectItem key={session.id} value={session.id}>
                                {session.name ||
                                  `Session - ${new Date(
                                    session.date
                                  ).toLocaleDateString()}`}{' '}
                                ({session.orderCount} orders, $
                                {session.totalSales.toFixed(2)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className='flex justify-end gap-2'>
              <Button
                variant='outline'
                onClick={() => setShowCloseSaleDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={closeSale}
                disabled={!createNewSession && !selectedSessionId}
                className='bg-green-600 hover:bg-green-700'
              >
                Close Sale
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
