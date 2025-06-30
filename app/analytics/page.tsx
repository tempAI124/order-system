"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Clock,
  Coffee,
  UtensilsCrossed,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

interface OrderItem {
  menuItem: {
    id: string
    name: string
    price: number
    category: "drink" | "food"
  }
  quantity: number
  subtotal: number
}

interface Order {
  id: string
  items: OrderItem[]
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

interface Analytics {
  totalRevenue: number
  totalOrders: number
  totalItems: number
  averageOrderValue: number
  topSellingItems: Array<{ name: string; quantity: number; revenue: number; category: string }>
  revenueByCategory: { drinks: number; food: number }
  ordersByHour: Array<{ hour: number; count: number }>
  dailyRevenue: Array<{ date: string; revenue: number; orders: number }>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "all">("all")
  const [showAllItems, setShowAllItems] = useState(false)

  useEffect(() => {
    calculateAnalytics()
  }, [timeRange])

  const calculateAnalytics = () => {
    // Get current orders
    const currentOrders: Order[] = JSON.parse(localStorage.getItem("cafe-orders") || "[]")

    // Get archived orders
    const archivedSessions: SaleSession[] = JSON.parse(localStorage.getItem("cafe-archive") || "[]")
    const archivedOrders: Order[] = archivedSessions.flatMap((session) => session.orders)

    // Combine all orders
    let allOrders = [...currentOrders, ...archivedOrders]

    // Filter by time range
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    if (timeRange !== "all") {
      allOrders = allOrders.filter((order) => {
        const orderDate = new Date(order.timestamp)
        switch (timeRange) {
          case "today":
            return orderDate >= today
          case "week":
            return orderDate >= weekAgo
          case "month":
            return orderDate >= monthAgo
          default:
            return true
        }
      })
    }

    // Calculate basic metrics
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = allOrders.length
    const totalItems = allOrders.reduce(
      (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    )
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Calculate top selling items
    const itemSales: { [key: string]: { name: string; quantity: number; revenue: number; category: string } } = {}

    allOrders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.menuItem.name
        if (!itemSales[key]) {
          itemSales[key] = {
            name: item.menuItem.name,
            quantity: 0,
            revenue: 0,
            category: item.menuItem.category,
          }
        }
        itemSales[key].quantity += item.quantity
        itemSales[key].revenue += item.subtotal
      })
    })

    const topSellingItems = Object.values(itemSales).sort((a, b) => b.quantity - a.quantity)

    // Calculate revenue by category
    const revenueByCategory = allOrders.reduce(
      (acc, order) => {
        order.items.forEach((item) => {
          if (item.menuItem.category === "drink") {
            acc.drinks += item.subtotal
          } else {
            acc.food += item.subtotal
          }
        })
        return acc
      },
      { drinks: 0, food: 0 },
    )

    // Calculate orders by hour - fix the undefined error
    const ordersByHour = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }))
    allOrders.forEach((order) => {
      try {
        const orderDate = new Date(order.timestamp)
        if (!isNaN(orderDate.getTime())) {
          const hour = orderDate.getHours()
          if (hour >= 0 && hour < 24 && ordersByHour[hour]) {
            ordersByHour[hour].count++
          }
        }
      } catch (error) {
        console.warn("Invalid timestamp format:", order.timestamp)
      }
    })

    // Calculate daily revenue
    const dailyRevenueMap: { [key: string]: { revenue: number; orders: number } } = {}
    allOrders.forEach((order) => {
      const date = new Date(order.timestamp).toDateString()
      if (!dailyRevenueMap[date]) {
        dailyRevenueMap[date] = { revenue: 0, orders: 0 }
      }
      dailyRevenueMap[date].revenue += order.total
      dailyRevenueMap[date].orders++
    })

    const dailyRevenue = Object.entries(dailyRevenueMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30) // Last 30 days

    setAnalytics({
      totalRevenue,
      totalOrders,
      totalItems,
      averageOrderValue,
      topSellingItems,
      revenueByCategory,
      ordersByHour,
      dailyRevenue,
    })
  }

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`

  const getPeakHour = () => {
    if (!analytics || !analytics.ordersByHour || analytics.ordersByHour.length === 0) return "N/A"
    const peak = analytics.ordersByHour.reduce(
      (max, current) => (current && current.count > (max?.count || 0) ? current : max),
      { hour: 0, count: 0 },
    )
    return peak && peak.count > 0 ? `${peak.hour}:00 - ${peak.hour + 1}:00` : "N/A"
  }

  if (!analytics) {
    return <div>Loading...</div>
  }

  const displayedItems = showAllItems ? analytics.topSellingItems : analytics.topSellingItems.slice(0, 5)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
              <p className="text-muted-foreground">Sales insights and performance metrics</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Time Range Selector */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <Badge variant="secondary" className="text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} View
            </Badge>
          </div>
          <Select value={timeRange} onValueChange={(value: "today" | "week" | "month" | "all") => setTimeRange(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(analytics.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">{analytics.totalOrders} orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.averageOrderValue)}</div>
              <p className="text-xs text-muted-foreground">{analytics.totalItems} items sold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getPeakHour()}</div>
              <p className="text-xs text-muted-foreground">Busiest time period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Items per Order</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.totalOrders > 0 ? (analytics.totalItems / analytics.totalOrders).toFixed(1) : "0"}
              </div>
              <p className="text-xs text-muted-foreground">Average items</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Category</CardTitle>
              <CardDescription>Sales breakdown by item type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coffee className="h-4 w-4" />
                    <span>Drinks</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(analytics.revenueByCategory.drinks)}</div>
                    <div className="text-xs text-muted-foreground">
                      {analytics.totalRevenue > 0
                        ? ((analytics.revenueByCategory.drinks / analytics.totalRevenue) * 100).toFixed(1)
                        : 0}
                      %
                    </div>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width:
                        analytics.totalRevenue > 0
                          ? `${(analytics.revenueByCategory.drinks / analytics.totalRevenue) * 100}%`
                          : "0%",
                    }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="h-4 w-4" />
                    <span>Food</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(analytics.revenueByCategory.food)}</div>
                    <div className="text-xs text-muted-foreground">
                      {analytics.totalRevenue > 0
                        ? ((analytics.revenueByCategory.food / analytics.totalRevenue) * 100).toFixed(1)
                        : 0}
                      %
                    </div>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width:
                        analytics.totalRevenue > 0
                          ? `${(analytics.revenueByCategory.food / analytics.totalRevenue) * 100}%`
                          : "0%",
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Selling Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top Selling Items</CardTitle>
                  <CardDescription>
                    Most popular menu items by quantity
                    {analytics.topSellingItems.length > 5 && (
                      <span className="ml-2 text-xs">
                        ({showAllItems ? analytics.topSellingItems.length : 5} of {analytics.topSellingItems.length})
                      </span>
                    )}
                  </CardDescription>
                </div>
                {analytics.topSellingItems.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllItems(!showAllItems)}
                    className="flex items-center gap-1"
                  >
                    {showAllItems ? (
                      <>
                        Show Less <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Show All <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {displayedItems.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          {item.category === "drink" ? (
                            <Coffee className="h-3 w-3" />
                          ) : (
                            <UtensilsCrossed className="h-3 w-3" />
                          )}
                          {item.category}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{item.quantity}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(item.revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
              {analytics.topSellingItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No items sold yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
