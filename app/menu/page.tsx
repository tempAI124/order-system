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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Plus,
  Edit,
  Trash2,
  Coffee,
  UtensilsCrossed,
  ArrowLeft,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

interface AddOn {
  name: string;
  price: number;
  allowQuantity?: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'drink' | 'food';
  addOns: AddOn[];
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'drink' as 'drink' | 'food',
    addOns: [] as AddOn[],
  });
  const [newAddOn, setNewAddOn] = useState({
    name: '',
    price: '',
    allowQuantity: false,
  });

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
    }
  }, []);

  const saveToStorage = (items: MenuItem[]) => {
    localStorage.setItem('cafe-menu', JSON.stringify(items));
    setMenuItems(items);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newItem: MenuItem = {
      id: editingItem?.id || Date.now().toString(),
      name: formData.name,
      price: Number.parseFloat(formData.price),
      category: formData.category,
      addOns: formData.addOns,
    };

    let updatedItems;
    if (editingItem) {
      updatedItems = menuItems.map((item) =>
        item.id === editingItem.id ? newItem : item
      );
    } else {
      updatedItems = [...menuItems, newItem];
    }

    saveToStorage(updatedItems);
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      addOns: [...item.addOns],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const updatedItems = menuItems.filter((item) => item.id !== id);
    saveToStorage(updatedItems);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: 'drink',
      addOns: [],
    });
    setNewAddOn({ name: '', price: '', allowQuantity: false });
    setEditingItem(null);
  };

  const addNewAddOn = () => {
    if (newAddOn.name.trim() && newAddOn.price) {
      const addon: AddOn = {
        name: newAddOn.name.trim(),
        price: Number.parseFloat(newAddOn.price),
        allowQuantity: newAddOn.allowQuantity,
      };
      setFormData({
        ...formData,
        addOns: [...formData.addOns, addon],
      });
      setNewAddOn({ name: '', price: '', allowQuantity: false });
    }
  };

  const removeAddOn = (index: number) => {
    const updatedAddOns = formData.addOns.filter((_, i) => i !== index);
    setFormData({ ...formData, addOns: updatedAddOns });
  };

  const drinks = menuItems.filter((item) => item.category === 'drink');
  const foods = menuItems.filter((item) => item.category === 'food');

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
                Menu Management
              </h1>
              <p className='text-muted-foreground'>
                Add, edit, and manage your cafe menu items
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className='flex justify-between items-center mb-6'>
          <div className='flex gap-4'>
            <Badge variant='secondary' className='text-sm'>
              <Coffee className='h-4 w-4 mr-1' />
              {drinks.length} Drinks
            </Badge>
            <Badge variant='secondary' className='text-sm'>
              <UtensilsCrossed className='h-4 w-4 mr-1' />
              {foods.length} Food Items
            </Badge>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className='h-4 w-4 mr-2' />
                Add Menu Item
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[500px]'>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? 'Update the menu item details below.'
                    : 'Add a new item to your cafe menu.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className='grid gap-4 py-4 max-h-[60vh] overflow-y-auto'>
                  <div className='grid gap-2'>
                    <Label htmlFor='name'>Item Name</Label>
                    <Input
                      id='name'
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder='e.g., Cappuccino, Sandwich'
                      required
                    />
                  </div>

                  <div className='grid gap-2'>
                    <Label htmlFor='price'>Price ($)</Label>
                    <Input
                      id='price'
                      type='number'
                      step='0.01'
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder='0.00'
                      required
                    />
                  </div>

                  <div className='grid gap-2'>
                    <Label htmlFor='category'>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: 'drink' | 'food') =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='drink'>Drink</SelectItem>
                        <SelectItem value='food'>Food</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='grid gap-2'>
                    <Label>Add-ons</Label>
                    <div className='space-y-2'>
                      {formData.addOns.map((addon, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between p-2 bg-muted rounded border'
                        >
                          <div className='flex-1'>
                            <div className='flex items-center gap-2'>
                              <span className='font-medium text-foreground'>
                                {addon.name}
                              </span>
                              {addon.allowQuantity && (
                                <Badge variant='outline' className='text-xs'>
                                  Qty
                                </Badge>
                              )}
                            </div>
                            <span className='text-green-600 dark:text-green-400 font-medium text-sm'>
                              +${addon.price.toFixed(2)}
                              {addon.allowQuantity && ' each'}
                            </span>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant='outline'
                                size='icon'
                                className='h-6 w-6 bg-transparent'
                              >
                                <X className='h-3 w-3' />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Remove Add-on
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove "{addon.name}"
                                  from the add-ons list?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => removeAddOn(index)}
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))}
                    </div>

                    <div className='space-y-2 p-3 border rounded-lg bg-muted/50'>
                      <div className='flex gap-2'>
                        <Input
                          placeholder='Add-on name (e.g., Extra Egg)'
                          value={newAddOn.name}
                          onChange={(e) =>
                            setNewAddOn({ ...newAddOn, name: e.target.value })
                          }
                          className='flex-1'
                        />
                        <Input
                          type='number'
                          step='0.01'
                          placeholder='Price'
                          value={newAddOn.price}
                          onChange={(e) =>
                            setNewAddOn({ ...newAddOn, price: e.target.value })
                          }
                          className='w-24'
                        />
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-2'>
                          <Checkbox
                            id='allow-quantity'
                            checked={newAddOn.allowQuantity}
                            onCheckedChange={(checked) =>
                              setNewAddOn({
                                ...newAddOn,
                                allowQuantity: checked as boolean,
                              })
                            }
                          />
                          <Label htmlFor='allow-quantity' className='text-sm'>
                            Allow quantity selection
                          </Label>
                        </div>
                        <Button
                          type='button'
                          variant='outline'
                          onClick={addNewAddOn}
                          disabled={!newAddOn.name.trim() || !newAddOn.price}
                          size='sm'
                        >
                          <Plus className='h-4 w-4 mr-1' />
                          Add
                        </Button>
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        Check "Allow quantity selection" for add-ons like eggs,
                        where customers can specify amounts
                      </p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type='submit'>
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className='mb-8'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl font-semibold flex items-center gap-2'>
              <Coffee className='h-5 w-5' />
              Drinks ({drinks.length})
            </h2>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {drinks.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className='flex justify-between items-start'>
                    <div className='flex items-center gap-2'>
                      <div className='flex flex-col gap-1'>
                        <div className='w-1 h-1 bg-muted-foreground rounded-full'></div>
                        <div className='w-1 h-1 bg-muted-foreground rounded-full'></div>
                        <div className='w-1 h-1 bg-muted-foreground rounded-full'></div>
                      </div>
                      <div>
                        <CardTitle className='text-lg'>{item.name}</CardTitle>
                        <CardDescription className='text-xl font-bold text-green-600'>
                          ${item.price.toFixed(2)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='icon'
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className='h-4 w-4' />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant='outline' size='icon'>
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Menu Item
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{item.name}"?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {item.addOns.length > 0 && (
                    <div className='mb-2'>
                      <p className='text-sm font-medium mb-1'>Add-ons:</p>
                      <div className='flex flex-wrap gap-1'>
                        {item.addOns.map((addon, index) => (
                          <Badge
                            key={index}
                            variant='outline'
                            className='text-xs'
                          >
                            {addon.name} +${addon.price.toFixed(2)}
                            {addon.allowQuantity && ' (qty)'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl font-semibold flex items-center gap-2'>
              <UtensilsCrossed className='h-5 w-5' />
              Food ({foods.length})
            </h2>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {foods.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className='flex justify-between items-start'>
                    <div className='flex items-center gap-2'>
                      <div className='flex flex-col gap-1'>
                        <div className='w-1 h-1 bg-muted-foreground rounded-full'></div>
                        <div className='w-1 h-1 bg-muted-foreground rounded-full'></div>
                        <div className='w-1 h-1 bg-muted-foreground rounded-full'></div>
                      </div>
                      <div>
                        <CardTitle className='text-lg'>{item.name}</CardTitle>
                        <CardDescription className='text-xl font-bold text-green-600'>
                          ${item.price.toFixed(2)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='icon'
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className='h-4 w-4' />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant='outline' size='icon'>
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Menu Item
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{item.name}"?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {item.addOns.length > 0 && (
                    <div className='mb-2'>
                      <p className='text-sm font-medium mb-1'>Add-ons:</p>
                      <div className='flex flex-wrap gap-1'>
                        {item.addOns.map((addon, index) => (
                          <Badge
                            key={index}
                            variant='outline'
                            className='text-xs'
                          >
                            {addon.name} +${addon.price.toFixed(2)}
                            {addon.allowQuantity && ' (qty)'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {menuItems.length === 0 && (
          <div className='text-center py-12'>
            <Coffee className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
            <h3 className='text-lg font-medium text-foreground mb-2'>
              No menu items yet
            </h3>
            <p className='text-muted-foreground mb-4'>
              Get started by adding your first menu item.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className='h-4 w-4 mr-2' />
              Add Menu Item
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
