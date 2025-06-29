"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Receipt, Search, Calendar, Clock, Archive, Trash2 } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface AddOn {
  name: string
  price: number
}

interface MenuItem {
  id: string
  name: string
  price: number
  category: "drink" | "food"
  addOns: AddOn[]
}

interface OrderItem {
  menuItem: MenuItem
  quantity: number
  addOns: AddOn[]
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

export default function HistoryPage() {
  const [todayOrders, setTodayOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showCloseSaleDialog, setShowCloseSaleDialog] = useState(false)
  const [saleOption, setSaleOption] = useState<"new" | "existing">("new")
  const [selectedExistingSession, setSelectedExistingSession] = useState("")
  const [newSessionName, setNewSessionName] = useState("")
  const [existingSessions, setExistingSessions] = useState<any[]>([])

  useEffect(() => {
    loadTodayOrders()
    loadExistingSessions()
  }, [])

  const loadExistingSessions = () => {
    const savedArchive = localStorage.getItem("cafe-archive")
    if (savedArchive) {
      const sessions = JSON.parse(savedArchive)
      const today = new Date().toDateString()
      const todaySessions = sessions.filter((session: any) => session.date === today)
      setExistingSessions(todaySessions)
    }
  }

  const loadTodayOrders = () => {
    const savedOrders = localStorage.getItem("cafe-orders")
    if (savedOrders) {
      const orders = JSON.parse(savedOrders)
      const today = new Date().toDateString()
      const todaysOrders = orders
        .filter((order: Order) => order.date === today)
        .sort((a: Order, b: Order) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setTodayOrders(todaysOrders)
    }
  }

  const deleteOrder = (orderId: string) => {
    const allOrders = JSON.parse(localStorage.getItem("cafe-orders") || "[]")
    const updatedOrders = allOrders.filter((order: Order) => order.id !== orderId)
    localStorage.setItem("cafe-orders", JSON.stringify(updatedOrders))

    // Refresh today's orders
    loadTodayOrders()
  }

  const closeSale = () => {
    if (todayOrders.length === 0) {
      alert("No orders to archive!")
      return
    }

    const today = new Date().toDateString()
    const totalSales = todayOrders.reduce((sum, order) => sum + order.total, 0)
    const totalItems = todayOrders.reduce(
      (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    )

    if (saleOption === "new") {
      // Create new sale session
      const saleSession = {
        id: Date.now().toString(),
        name: newSessionName || `Sale Session ${new Date().toLocaleTimeString()}`,
        date: today,
        closedAt: new Date().toLocaleString(),
        orders: todayOrders,
        totalSales,
        totalItems,
        orderCount: todayOrders.length,
      }

      const existingArchive = JSON.parse(localStorage.getItem("cafe-archive") || "[]")
      const updatedArchive = [...existingArchive, saleSession]
      localStorage.setItem("cafe-archive", JSON.stringify(updatedArchive))

      alert(
        `New sale session "${saleSession.name}" created! ${saleSession.orderCount} orders archived with total sales of $${saleSession.totalSales.toFixed(2)}`,
      )
    } else {
      // Add to existing session
      const existingArchive = JSON.parse(localStorage.getItem("cafe-archive") || "[]")
      const sessionIndex = existingArchive.findIndex((session: any) => session.id === selectedExistingSession)

      if (sessionIndex !== -1) {
        const existingSession = existingArchive[sessionIndex]
        existingSession.orders = [...existingSession.orders, ...todayOrders]
        existingSession.totalSales += totalSales
        existingSession.totalItems += totalItems
        existingSession.orderCount += todayOrders.length
        existingSession.lastUpdated = new Date().toLocaleString()

        localStorage.setItem("cafe-archive", JSON.stringify(existingArchive))

        alert(
          `Added ${todayOrders.length} orders to "${existingSession.name}"! Session now has ${existingSession.orderCount} total orders with $${existingSession.totalSales.toFixed(2)} in sales.`,
        )
      }
    }

    // Clear today's orders
    const allOrders = JSON.parse(localStorage.getItem("cafe-orders") || "[]")
    const remainingOrders = allOrders.filter((order: Order) => order.date !== today)
    localStorage.setItem("cafe-orders", JSON.stringify(remainingOrders))

    // Reset and refresh
    setTodayOrders([])
    setShowCloseSaleDialog(false)
    setSaleOption("new")
    setSelectedExistingSession("")
    setNewSessionName("")
  }

  const filteredOrders = todayOrders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) => item.menuItem.name.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const formatTime = (timestamp: string) => {
    try {
      // Handle different timestamp formats
      let date: Date

      if (timestamp.includes("/")) {
        // Format: "30/04/2025, 21:30:36" or similar
        const parts = timestamp.split(", ")
        if (parts.length === 2) {
          const [datePart, timePart] = parts
          const [day, month, year] = datePart.split("/")
          date = new Date(`${year}-${month}-${day}T${timePart}`)
        } else {
          date = new Date(timestamp)
        }
      } else {
        date = new Date(timestamp)
      }

      if (isNaN(date.getTime())) {
        return timestamp // Return original if parsing fails
      }

      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return timestamp // Return original if any error occurs
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString // Return original if invalid
      }
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (error) {
      return dateString
    }
  }

  const getTotalItems = (order: Order) => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0)
  }

  const getAddOnNames = (addOns: any[]): string => {
    if (!Array.isArray(addOns)) return ""

    return addOns
      .map((addon) => {
        if (typeof addon === "string") {
          return addon
        } else if (typeof addon === "object" && addon.name) {
          return `${addon.name} (+$${addon.price?.toFixed(2) || "0.00"})`
        }
        return String(addon)
      })
      .join(", ")
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
            <h1 className="text-3xl font-bold text-gray-900">Receipt History</h1>
            <p className="text-gray-600">Today's order history and receipts</p>
          </div>
        </div>

        {/* Stats and Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-4">
            <Badge variant="secondary" className="text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(new Date().toDateString())}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <Receipt className="h-4 w-4 mr-1" />
              {todayOrders.length} Orders
            </Badge>
            <Badge variant="secondary" className="text-sm">
              Total: ${todayOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
            </Badge>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full sm:w-[200px]"
              />
            </div>

            <Dialog open={showCloseSaleDialog} onOpenChange={setShowCloseSaleDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={todayOrders.length === 0}>
                  <Archive className="h-4 w-4 mr-2" />
                  Close Sale
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Close Sale Session</DialogTitle>
                  <DialogDescription>
                    Choose how to archive {todayOrders.length} orders (total: $
                    {todayOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2)})
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="new-session"
                        name="sale-option"
                        value="new"
                        checked={saleOption === "new"}
                        onChange={(e) => setSaleOption(e.target.value as "new" | "existing")}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="new-session" className="font-medium">
                        Create New Sale Session
                      </Label>
                    </div>

                    {saleOption === "new" && (
                      <div className="ml-6 space-y-2">
                        <Label htmlFor="session-name" className="text-sm">
                          Session Name (optional)
                        </Label>
                        <Input
                          id="session-name"
                          value={newSessionName}
                          onChange={(e) => setNewSessionName(e.target.value)}
                          placeholder={`Sale Session ${new Date().toLocaleTimeString()}`}
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="existing-session"
                        name="sale-option"
                        value="existing"
                        checked={saleOption === "existing"}
                        onChange={(e) => setSaleOption(e.target.value as "new" | "existing")}
                        disabled={existingSessions.length === 0}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="existing-session" className="font-medium">
                        Add to Existing Session
                        {existingSessions.length === 0 && (
                          <span className="text-gray-500 text-sm ml-2">(No existing sessions today)</span>
                        )}
                      </Label>
                    </div>

                    {saleOption === "existing" && existingSessions.length > 0 && (
                      <div className="ml-6 space-y-2">
                        <Label htmlFor="existing-select" className="text-sm">
                          Select Session
                        </Label>
                        <Select value={selectedExistingSession} onValueChange={setSelectedExistingSession}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose existing session..." />
                          </SelectTrigger>
                          <SelectContent>
                            {existingSessions.map((session) => (
                              <SelectItem key={session.id} value={session.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{session.name}</span>
                                  <span className="text-xs text-gray-500">
                                    {session.orderCount} orders • ${session.totalSales.toFixed(2)}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> This will clear today's receipt history and move all orders to the archive.
                      This action cannot be undone.
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCloseSaleDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={closeSale}
                    disabled={saleOption === "existing" && (!selectedExistingSession || existingSessions.length === 0)}
                  >
                    {saleOption === "new" ? "Create New Session" : "Add to Session"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {todayOrders.length === 0 ? "No orders today" : "No orders found"}
            </h3>
            <p className="text-gray-600">
              {todayOrders.length === 0 ? "Start taking orders to see them here." : "Try adjusting your search terms."}
            </p>
            {todayOrders.length === 0 && (
              <Link href="/order">
                <Button className="mt-4">Create New Order</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">Order #{order.id.slice(-6)}</h3>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(order.timestamp)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {order.items.map((item, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {item.quantity}x {item.menuItem.name}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{getTotalItems(order)} items</span>
                        <span>•</span>
                        <span>{order.items.length} different products</span>
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-green-600 mb-2">${order.total.toFixed(2)}</div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                              View Receipt
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Receipt Details</DialogTitle>
                              <DialogDescription>
                                Order #{order.id.slice(-6)} - {formatTime(order.timestamp)}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="py-4">
                              <div className="text-center mb-4">
                                <h3 className="font-bold text-lg">DDAL.licious Receipt</h3>
                                <p className="text-sm text-gray-600">{formatTime(order.timestamp)}</p>
                                <p className="text-xs text-gray-500">Order ID: {order.id}</p>
                              </div>

                              <div className="border-t border-b py-4 space-y-3">
                                {order.items.map((item, index) => (
                                  <div key={index} className="space-y-1">
                                    <div className="flex justify-between">
                                      <span className="font-medium">
                                        {item.quantity}x {item.menuItem.name}
                                      </span>
                                      <span>${item.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="text-xs text-gray-600 ml-4">
                                      ${item.menuItem.price.toFixed(2)} each
                                    </div>
                                    {item.addOns && item.addOns.length > 0 && (
                                      <div className="text-xs text-gray-600 ml-4">
                                        Add-ons: {getAddOnNames(item.addOns)}
                                      </div>
                                    )}
                                    {item.customText && (
                                      <div className="text-xs text-gray-600 ml-4">Note: {item.customText}</div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              <div className="pt-4">
                                <div className="flex justify-between items-center text-lg font-bold">
                                  <span>Total:</span>
                                  <span>${order.total.toFixed(2)}</span>
                                </div>
                                <div className="text-center mt-4 text-xs text-gray-500">
                                  Thank you for choosing DDAL.licious!
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Order</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete Order #{order.id.slice(-6)}? This will permanently
                                remove the order and cannot be undone.
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
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Order
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
