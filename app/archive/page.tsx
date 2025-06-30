"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { ArrowLeft, Archive, Search, Receipt, ChevronDown, ChevronRight, Calendar, Trash2 } from "lucide-react"
import Link from "next/link"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"

interface AddOn {
  name: string
  price: number
  allowQuantity?: boolean
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

interface SaleSession {
  id: string
  name?: string
  date: string
  closedAt: string
  lastUpdated?: string
  orders: Order[]
  totalSales: number
  totalItems: number
  orderCount: number
}

export default function ArchivePage() {
  const [salesSessions, setSalesSessions] = useState<SaleSession[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "sales">("date")
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importData, setImportData] = useState("")
  const [importPreview, setImportPreview] = useState<SaleSession[]>([])

  useEffect(() => {
    loadSalesSessions()
  }, [sortBy])

  // Enhanced smart categorization function
  const categorizeItem = (itemName: string): "drink" | "food" => {
    const name = itemName.toLowerCase().trim()

    // Drink keywords and patterns
    const drinkKeywords = [
      "iced",
      "latte",
      "coffee",
      "americano",
      "macchiato",
      "mocha",
      "chocolate",
      "strawberry",
      "caramel",
      "vanilla",
      "spanish",
    ]

    // Food keywords and patterns
    const foodKeywords = [
      "cookie",
      "cookies",
      "cake",
      "wrap",
      "cheese",
      "indomie",
      "maggi",
      "moist",
      "chip",
      "assorted",
      "big cookie",
      "loaded",
      "chicken",
    ]

    // Drink add-ons (milk alternatives, syrups, coffee enhancers)
    const drinkAddonKeywords = [
      "oatmilk",
      "oat milk",
      "almond milk",
      "soy milk",
      "coconut milk",
      "milk",
      "syrup",
      "vanilla syrup",
      "caramel syrup",
      "hazelnut syrup",
      "extra shot",
      "shot",
      "espresso shot",
      "decaf",
      "sugar",
      "sweetener",
      "stevia",
      "honey",
    ]

    // Food add-ons (eggs, proteins, solid ingredients)
    const foodAddonKeywords = [
      "telur",
      "egg",
      "eggs",
      "cheese",
      "bacon",
      "ham",
      "chicken",
      "beef",
      "mushroom",
      "tomato",
      "lettuce",
      "onion",
      "avocado",
      "mayo",
      "sauce",
      "butter",
      "cream cheese",
      "extra cheese",
      "protein",
    ]

    // Check for drink add-ons first
    if (drinkAddonKeywords.some((keyword) => name.includes(keyword))) {
      return "drink"
    }

    // Check for food add-ons
    if (foodAddonKeywords.some((keyword) => name.includes(keyword))) {
      return "food"
    }

    // Check for main drink items
    if (drinkKeywords.some((keyword) => name.includes(keyword))) {
      return "drink"
    }

    // Check for main food items
    if (foodKeywords.some((keyword) => name.includes(keyword))) {
      return "food"
    }

    // Special cases for common patterns
    if (name.includes("iced") || name.includes("latte") || name.includes("coffee")) {
      return "drink"
    }

    // Default to food for unknown items (safer assumption for add-ons)
    return "food"
  }

  const loadSalesSessions = () => {
    const savedArchive = localStorage.getItem("cafe-archive")
    if (savedArchive) {
      const sessions: SaleSession[] = JSON.parse(savedArchive)

      // Sort sessions
      sessions.sort((a, b) => {
        if (sortBy === "date") {
          return new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime()
        } else {
          return b.totalSales - a.totalSales
        }
      })

      setSalesSessions(sessions)
    }
  }

  const deleteSaleSession = (sessionId: string) => {
    const updatedSessions = salesSessions.filter((session) => session.id !== sessionId)
    localStorage.setItem("cafe-archive", JSON.stringify(updatedSessions))
    setSalesSessions(updatedSessions)

    // Close expanded session if it was deleted
    const newExpanded = new Set(expandedSessions)
    newExpanded.delete(sessionId)
    setExpandedSessions(newExpanded)
  }

  const deleteOrderFromSession = (sessionId: string, orderId: string) => {
    const updatedSessions = salesSessions.map((session) => {
      if (session.id === sessionId) {
        const orderToDelete = session.orders.find((order) => order.id === orderId)
        if (orderToDelete) {
          const updatedOrders = session.orders.filter((order) => order.id !== orderId)
          const orderTotal = orderToDelete.total
          const orderItems = orderToDelete.items.reduce((sum, item) => sum + item.quantity, 0)

          return {
            ...session,
            orders: updatedOrders,
            orderCount: session.orderCount - 1,
            totalSales: session.totalSales - orderTotal,
            totalItems: session.totalItems - orderItems,
            lastUpdated: new Date().toLocaleString(),
          }
        }
      }
      return session
    })

    localStorage.setItem("cafe-archive", JSON.stringify(updatedSessions))
    setSalesSessions(updatedSessions)
  }

  const handleImportData = () => {
    try {
      const parsedData = JSON.parse(importData)
      const convertedSessions: SaleSession[] = []

      Object.entries(parsedData).forEach(([dateKey, orders]: [string, any[]]) => {
        const sessionDate = new Date(dateKey).toDateString()

        const convertedOrders: Order[] = orders.map((order: any) => {
          const orderItems: OrderItem[] = []
          let orderTotal = 0

          Object.entries(order.details).forEach(([itemName, itemData]: [string, any]) => {
            const cleanItemName = itemName.trim()
            const itemCategory = categorizeItem(cleanItemName)

            const menuItem: MenuItem = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              name: cleanItemName,
              price: itemData.price || 0,
              category: itemCategory,
              addOns: [],
            }

            const orderItem: OrderItem = {
              menuItem,
              quantity: itemData.quantity || 1,
              addOns: [],
              customText: "",
              subtotal: (itemData.price || 0) * (itemData.quantity || 1),
            }

            orderItems.push(orderItem)
            orderTotal += orderItem.subtotal
          })

          return {
            id: order.id?.toString() || Date.now().toString(),
            items: orderItems,
            total: orderTotal,
            timestamp: order.timestamp || new Date().toLocaleString(),
            date: sessionDate,
          }
        })

        const totalSales = convertedOrders.reduce((sum, order) => sum + order.total, 0)
        const totalItems = convertedOrders.reduce(
          (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
          0,
        )

        const session: SaleSession = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: `Imported Session - ${new Date(dateKey).toLocaleDateString()}`,
          date: sessionDate,
          closedAt: new Date().toLocaleString(),
          orders: convertedOrders,
          totalSales,
          totalItems,
          orderCount: convertedOrders.length,
        }

        convertedSessions.push(session)
      })

      setImportPreview(convertedSessions)
    } catch (error) {
      alert("Invalid JSON format. Please check your data and try again.")
    }
  }

  const confirmImport = () => {
    if (importPreview.length === 0) return

    const existingArchive = JSON.parse(localStorage.getItem("cafe-archive") || "[]")
    const updatedArchive = [...existingArchive, ...importPreview]
    localStorage.setItem("cafe-archive", JSON.stringify(updatedArchive))

    // Refresh the display
    loadSalesSessions()

    // Reset import state
    setShowImportDialog(false)
    setImportData("")
    setImportPreview([])

    alert(`Successfully imported ${importPreview.length} sale session(s) with smart categorization!`)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      alert("Please select a valid JSON file.")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setImportData(content)
    }
    reader.onerror = () => {
      alert("Error reading file. Please try again.")
    }
    reader.readAsText(file)
  }

  const filteredSessions = salesSessions.filter(
    (session) =>
      session.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.name && session.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      session.orders.some(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.items.some((item) => item.menuItem.name.toLowerCase().includes(searchTerm.toLowerCase())),
      ),
  )

  const toggleSessionExpansion = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions)
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId)
    } else {
      newExpanded.add(sessionId)
    }
    setExpandedSessions(newExpanded)
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

  const getCategoryBadgeColor = (category: "drink" | "food") => {
    return category === "drink"
      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
  }

  const getCategoryIcon = (category: "drink" | "food") => {
    return category === "drink" ? "🥤" : "🍪"
  }

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
              <h1 className="text-3xl font-bold text-foreground">Archive</h1>
              <p className="text-muted-foreground">View archived sale sessions with smart categorization</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-4">
            <Badge variant="secondary" className="text-sm">
              <Archive className="h-4 w-4 mr-1" />
              {salesSessions.length} Sessions
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <Receipt className="h-4 w-4 mr-1" />
              {salesSessions.reduce((sum, session) => sum + session.orderCount, 0)} Orders
            </Badge>
            <Badge variant="secondary" className="text-sm">
              Total: ${salesSessions.reduce((sum, session) => sum + session.totalSales, 0).toFixed(2)}
            </Badge>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search archive..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full sm:w-[200px]"
              />
            </div>

            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Archive className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Import Archive Data with Enhanced Categorization</DialogTitle>
                  <DialogDescription>
                    Upload a JSON file to import it into the archive system. Items will be automatically categorized as
                    drinks or food, including proper add-on categorization.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="import-file">JSON File</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                      <input
                        id="import-file"
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label htmlFor="import-file" className="cursor-pointer flex flex-col items-center gap-2">
                        <Archive className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm font-medium">Click to upload JSON file</span>
                        <span className="text-xs text-muted-foreground">or drag and drop</span>
                      </label>
                    </div>
                    {importData && (
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        <strong>File loaded:</strong> {Math.round(importData.length / 1024)}KB
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleImportData} variant="outline" disabled={!importData.trim()}>
                      Preview Import
                    </Button>
                    {importPreview.length > 0 && (
                      <Button onClick={confirmImport} className="bg-green-600 hover:bg-green-700">
                        Confirm Import ({importPreview.length} sessions)
                      </Button>
                    )}
                  </div>

                  {importPreview.length > 0 && (
                    <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-3 bg-muted">
                      <h4 className="font-medium text-sm">Import Preview with Enhanced Categorization:</h4>
                      {importPreview.map((session, index) => (
                        <div key={index} className="p-2 bg-background rounded border text-sm">
                          <div className="font-medium">{session.name}</div>
                          <div className="text-muted-foreground text-xs">
                            {session.orderCount} orders • {session.totalItems} items • ${session.totalSales.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 space-y-1">
                            {session.orders.slice(0, 2).map((order, orderIndex) => (
                              <div key={orderIndex} className="flex flex-wrap gap-1">
                                {order.items.map((item, itemIndex) => (
                                  <span key={itemIndex} className="inline-flex items-center gap-1">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${getCategoryBadgeColor(item.menuItem.category)}`}
                                    >
                                      {getCategoryIcon(item.menuItem.category)} {item.quantity}x {item.menuItem.name}
                                    </Badge>
                                  </span>
                                ))}
                              </div>
                            ))}
                            {session.orders.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{session.orders.length - 2} more orders...
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm border border-blue-200 dark:border-blue-800">
                    <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">Enhanced Smart Categorization:</p>
                    <div className="space-y-2 text-blue-700 dark:text-blue-300 text-xs">
                      <div>
                        <strong>🥤 Drinks:</strong> Coffee items, lattes, iced drinks + drink add-ons (oatmilk, syrup,
                        extra shot)
                      </div>
                      <div>
                        <strong>🍪 Food:</strong> Cookies, cakes, wraps, solid items + food add-ons (eggs/telur, cheese,
                        proteins)
                      </div>
                      <div>
                        <strong>🎯 Smart Add-ons:</strong> Milk alternatives & syrups → drinks, Eggs & proteins → food
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-lg text-sm border border-gray-200 dark:border-gray-800">
                    <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">Expected JSON Format:</p>
                    <code className="text-xs text-gray-700 dark:text-gray-300 block">
                      {`{"Date String": [{"id": number, "details": {"Item Name": {"price": number, "quantity": number}}, "timestamp": "string"}]}`}
                    </code>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowImportDialog(false)
                      setImportData("")
                      setImportPreview([])
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Select value={sortBy} onValueChange={(value: "date" | "sales") => setSortBy(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">By Date</SelectItem>
                <SelectItem value="sales">By Sales</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Archive List */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {salesSessions.length === 0 ? "No archived sessions" : "No results found"}
            </h3>
            <p className="text-muted-foreground">
              {salesSessions.length === 0
                ? "Closed sale sessions will appear here."
                : "Try adjusting your search terms."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <Card key={session.id}>
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleSessionExpansion(session.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedSessions.has(session.id) ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {session.name || `Sale Session - ${formatDate(session.date)}`}
                        </CardTitle>
                        <CardDescription>
                          Closed at {formatTime(session.closedAt)}
                          {session.lastUpdated && session.lastUpdated !== session.closedAt && (
                            <span> • Last updated: {formatTime(session.lastUpdated)}</span>
                          )}
                          <br />
                          {session.orderCount} orders • {session.totalItems} items sold
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">${session.totalSales.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          ${(session.totalSales / session.orderCount).toFixed(2)} avg
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" onClick={(e) => e.stopPropagation()}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Sale Session</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "
                              {session.name || `Sale Session - ${formatDate(session.date)}`}"? This will permanently
                              remove the entire session and all its orders. This action cannot be undone.
                              <br />
                              <br />
                              <strong>Session Details:</strong>
                              <br />• {session.orderCount} orders
                              <br />• {session.totalItems} items sold
                              <br />• Total sales: ${session.totalSales.toFixed(2)}
                              <br />• Date: {formatDate(session.date)}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteSaleSession(session.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Session
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>

                {expandedSessions.has(session.id) && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {session.orders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">Order #{order.id.slice(-6)}</span>
                              <Badge variant="outline" className="text-xs">
                                {formatTime(order.timestamp)}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-2">
                              {order.items.slice(0, 3).map((item, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className={`text-xs ${getCategoryBadgeColor(item.menuItem.category)}`}
                                >
                                  {getCategoryIcon(item.menuItem.category)} {item.quantity}x {item.menuItem.name}
                                </Badge>
                              ))}
                              {order.items.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{order.items.length - 3} more
                                </Badge>
                              )}
                            </div>

                            <div className="text-xs text-muted-foreground">{getTotalItems(order)} items total</div>
                          </div>

                          <div className="flex items-center gap-3 ml-4">
                            <div className="text-right">
                              <div className="font-bold">${order.total.toFixed(2)}</div>
                            </div>

                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                                    View
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
                                      <p className="text-sm text-muted-foreground">{formatTime(order.timestamp)}</p>
                                      <p className="text-xs text-muted-foreground">Order ID: {order.id}</p>
                                    </div>

                                    <div className="border-t border-b py-4 space-y-3">
                                      {order.items.map((item, index) => (
                                        <div key={index} className="space-y-1">
                                          <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                              <Badge
                                                variant="outline"
                                                className={`text-xs ${getCategoryBadgeColor(item.menuItem.category)}`}
                                              >
                                                {getCategoryIcon(item.menuItem.category)}
                                              </Badge>
                                              <span className="font-medium">
                                                {item.quantity}x {item.menuItem.name}
                                              </span>
                                            </div>
                                            <span>${item.subtotal.toFixed(2)}</span>
                                          </div>
                                          <div className="text-xs text-muted-foreground ml-8">
                                            ${item.menuItem.price.toFixed(2)} each
                                          </div>
                                          {item.addOns && item.addOns.length > 0 && (
                                            <div className="text-xs text-muted-foreground ml-8">
                                              Add-ons: {getAddOnNames(item.addOns)}
                                            </div>
                                          )}
                                          {item.customText && (
                                            <div className="text-xs text-muted-foreground ml-8">
                                              Note: {item.customText}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>

                                    <div className="pt-4">
                                      <div className="flex justify-between items-center text-lg font-bold">
                                        <span>Total:</span>
                                        <span>${order.total.toFixed(2)}</span>
                                      </div>
                                      <div className="text-center mt-4 text-xs text-muted-foreground">
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
                                    <AlertDialogTitle>Delete Order from Session</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete Order #{order.id.slice(-6)} from this session?
                                      This will permanently remove the order and update the session totals. This action
                                      cannot be undone.
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
                                      onClick={() => deleteOrderFromSession(session.id, order.id)}
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
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
