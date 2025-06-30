"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coffee, UtensilsCrossed, Receipt, BarChart3, Archive, Plus, ShoppingCart, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

interface Order {
  id: string
  items: any[]
  total: number
  timestamp: string
  date: string
}

interface SaleSession {
  id: string
  name?: string
  date: string
  closedAt: string
  orders: Order[]
  totalSales: number
  totalItems: number
  orderCount: number
}

export default function HomePage() {
  const [todaysOrders, setTodaysOrders] = useState<Order[]>([])
  const [menuItemsCount, setMenuItemsCount] = useState(0)
  const [archivedSessions, setArchivedSessions] = useState<SaleSession[]>([])

  useEffect(() => {
    // Load today's orders
    const orders = JSON.parse(localStorage.getItem("cafe-orders") || "[]")
    const today = new Date().toDateString()
    const todayOrders = orders.filter((order: Order) => order.date === today)
    setTodaysOrders(todayOrders)

    // Load menu items count
    const menuItems = JSON.parse(localStorage.getItem("cafe-menu") || "[]")
    setMenuItemsCount(menuItems.length)

    // Load archived sessions
    const archive = JSON.parse(localStorage.getItem("cafe-archive") || "[]")
    setArchivedSessions(archive)
  }, [])

  const todaysRevenue = todaysOrders.reduce((sum, order) => sum + order.total, 0)
  const totalArchivedRevenue = archivedSessions.reduce((sum, session) => sum + session.totalSales, 0)
  const totalRevenue = todaysRevenue + totalArchivedRevenue

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">DDAL.licious</h1>
            <p className="text-muted-foreground">Cafe Ordering & Management System</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${todaysRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todaysOrders.reduce(
                  (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
                  0,
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
              <Coffee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{menuItemsCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaysOrders.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/order">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  New Order
                </CardTitle>
                <CardDescription>Start taking a new customer order</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Order
                </Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/menu">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coffee className="h-5 w-5" />
                  Menu Management
                </CardTitle>
                <CardDescription>Add, edit, and organize menu items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Coffee className="h-3 w-3 mr-1" />
                    Drinks
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <UtensilsCrossed className="h-3 w-3 mr-1" />
                    Food
                  </Badge>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/analytics">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics
                </CardTitle>
                <CardDescription>View sales analytics and reports</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Track performance and trends</p>
              </CardContent>
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
              <CardContent>
                <p className="text-sm text-muted-foreground">{todaysOrders.length} orders today</p>
              </CardContent>
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
              <CardContent>
                <p className="text-sm text-muted-foreground">{archivedSessions.length} archived sessions</p>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Recent Orders */}
        {todaysOrders.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Recent Orders</h2>
            <div className="grid gap-4">
              {todaysOrders
                .slice(-3)
                .reverse()
                .map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">Order #{order.id.slice(-6)}</CardTitle>
                          <CardDescription>{order.timestamp}</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-green-600">
                          ${order.total.toFixed(2)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {order.items.slice(0, 3).map((item, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {item.quantity}x {item.menuItem.name}
                          </Badge>
                        ))}
                        {order.items.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{order.items.length - 3} more
                          </Badge>
                        )}
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
