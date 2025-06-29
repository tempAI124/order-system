"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, DollarSign, ShoppingCart, Calendar } from "lucide-react"
import Link from "next/link"

interface MenuItem {
  id: string
  name: string
  price: number
  category: "drink" | "food"
  addOns: string[]
  customField: string
}

interface OrderItem {
  menuItem: MenuItem
  quantity: number
  addOns: string[]
  customText: string
  subtotal: number
}

interface Order {
  id: string
  items: OrderItem[]
  total: number
  timestamp: string
  date: string
}

interface DayStats {
  date: string
  totalSales: number
  itemsSold: number
  orderCount: number
}

interface ItemStats {
  item: MenuItem
  quantitySold: number
  revenue: number
}

export default function AnalyticsPage() {
  const [todayStats, setTodayStats] = useState<DayStats>({ date: "", totalSales: 0, itemsSold: 0, orderCount: 0 })
  const [weekStats, setWeekStats] = useState<DayStats[]>([])
  const [topItems, setTopItems] = useState<ItemStats[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const savedOrders = localStorage.getItem("cafe-orders")
    if (savedOrders) {
      const allOrders: Order[] = JSON.parse(savedOrders)
      setOrders(allOrders)

      const today = new Date().toDateString()
      const todaysOrders = allOrders.filter((order) => order.date === today)

      // Calculate today's stats
      const totalSales = todaysOrders.reduce((sum, order) => sum + order.total, 0)
      const itemsSold = todaysOrders.reduce(
        (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0,
      )

      setTodayStats({
        date: today,
        totalSales,
        itemsSold,
        orderCount: todaysOrders.length,
      })

      // Calculate week stats
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return date.toDateString()
      }).reverse()

      const weeklyStats = last7Days.map((date) => {
        const dayOrders = allOrders.filter((order) => order.date === date)
        return {
          date,
          totalSales: dayOrders.reduce((sum, order) => sum + order.total, 0),
          itemsSold: dayOrders.reduce(
            (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
            0,
          ),
          orderCount: dayOrders.length,
        }
      })

      setWeekStats(weeklyStats)

      // Calculate top items
      const itemMap = new Map<string, ItemStats>()

      allOrders.forEach((order) => {
        order.items.forEach((orderItem) => {
          const key = orderItem.menuItem.id
          if (itemMap.has(key)) {
            const existing = itemMap.get(key)!
            existing.quantitySold += orderItem.quantity
            existing.revenue += orderItem.subtotal
          } else {
            itemMap.set(key, {
              item: orderItem.menuItem,
              quantitySold: orderItem.quantity,
              revenue: orderItem.subtotal,
            })
          }
        })
      })

      const sortedItems = Array.from(itemMap.values())
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 10)

      setTopItems(sortedItems)
    }
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const isToday = (dateString: string) => {
    return dateString === new Date().toDateString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600">View your DDAL.licious sales analytics and performance</p>
          </div>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${todayStats.totalSales.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">From {todayStats.orderCount} orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Items Sold Today</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.itemsSold}</div>
              <p className="text-xs text-muted-foreground">Across all menu items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${todayStats.orderCount > 0 ? (todayStats.totalSales / todayStats.orderCount).toFixed(2) : "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">Per order today</p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Last 7 Days Overview
            </CardTitle>
            <CardDescription>Daily sales and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weekStats.map((day, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg border ${isToday(day.date) ? "bg-blue-50 border-blue-200" : "bg-gray-50"}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium min-w-[80px]">
                      {isToday(day.date) ? "Today" : formatDate(day.date)}
                    </div>
                    <div className="flex gap-6 text-sm">
                      <span className="text-gray-600">
                        <span className="font-medium">{day.orderCount}</span> orders
                      </span>
                      <span className="text-gray-600">
                        <span className="font-medium">{day.itemsSold}</span> items
                      </span>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-green-600">${day.totalSales.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Items */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
            <CardDescription>Most popular items across all time</CardDescription>
          </CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sales data yet</h3>
                <p className="text-gray-600">Start taking orders to see analytics here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topItems.map((itemStat, index) => (
                  <div key={itemStat.item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium">{itemStat.item.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={itemStat.item.category === "drink" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {itemStat.item.category}
                          </Badge>
                          <span className="text-sm text-gray-600">${itemStat.item.price.toFixed(2)} each</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{itemStat.quantitySold}</div>
                      <div className="text-sm text-gray-600">sold</div>
                      <div className="text-sm font-medium text-green-600">${itemStat.revenue.toFixed(2)} revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
