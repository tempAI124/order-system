"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Coffee, UtensilsCrossed, TrendingUp, Receipt, Archive, Plus } from "lucide-react"
import Link from "next/link"

interface MenuItem {
  id: string
  name: string
  price: number
  category: "drink" | "food"
  addOns: string[]
  customField: string
}

interface Order {
  id: string
  items: OrderItem[]
  total: number
  timestamp: string
  date: string
}

interface OrderItem {
  menuItem: MenuItem
  quantity: number
  addOns: string[]
  customText: string
  subtotal: number
}

export default function HomePage() {
  const [todayOrders, setTodayOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [todayStats, setTodayStats] = useState({ totalSales: 0, itemsSold: 0 })

  useEffect(() => {
    // Load data from localStorage
    const savedOrders = localStorage.getItem("cafe-orders")
    const savedMenu = localStorage.getItem("cafe-menu")

    if (savedOrders) {
      const orders = JSON.parse(savedOrders)
      const today = new Date().toDateString()
      const todaysOrders = orders.filter((order: Order) => order.date === today)
      setTodayOrders(todaysOrders)

      // Calculate stats
      const totalSales = todaysOrders.reduce((sum: number, order: Order) => sum + order.total, 0)
      const itemsSold = todaysOrders.reduce(
        (sum: number, order: Order) =>
          sum + order.items.reduce((itemSum: number, item: OrderItem) => itemSum + item.quantity, 0),
        0,
      )
      setTodayStats({ totalSales, itemsSold })
    }

    if (savedMenu) {
      setMenuItems(JSON.parse(savedMenu))
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <img src="/favicon.jpg" alt="DDAL.licious Logo" className="w-12 h-12 rounded-full" />
            <h1 className="text-3xl font-bold text-gray-900">DDAL.licious</h1>
          </div>
          <p className="text-gray-600">Manage your restaurant orders, menu, and analytics</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${todayStats.totalSales.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.itemsSold}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
              <Coffee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{menuItems.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayOrders.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/order">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  New Order
                </CardTitle>
                <CardDescription>Create a new order for customers</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/menu">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coffee className="h-5 w-5" />
                  Manage Menu
                </CardTitle>
                <CardDescription>Add, edit, or remove menu items</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/analytics">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Analytics
                </CardTitle>
                <CardDescription>View sales analytics and reports</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/history">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Receipt History
                </CardTitle>
                <CardDescription>View today's receipt history</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/archive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="h-5 w-5" />
                  Archive
                </CardTitle>
                <CardDescription>View archived receipts from previous days</CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>

        {/* Recent Orders */}
        {todayOrders.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
            <div className="grid gap-4">
              {todayOrders
                .slice(-3)
                .reverse()
                .map((order) => (
                  <Card key={order.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Order #{order.id.slice(-6)}</p>
                          <p className="text-sm text-gray-600">{order.timestamp}</p>
                          <div className="flex gap-2 mt-2">
                            {order.items.map((item, index) => (
                              <Badge key={index} variant="secondary">
                                {item.quantity}x {item.menuItem.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
