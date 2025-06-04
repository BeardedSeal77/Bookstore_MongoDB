'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Order from '@/components/Order'

interface OrderItem {
  OrderID: number
  BookIDQuantity: { [key: string]: number }
  OrderPrice: number
  OrderDate: string
  CustomerID: number
}

interface OrderWithBooks extends OrderItem {
  books: Array<{
    BookID: number
    BookTitle: string
    AuthorName: string
    BookPrice: number
    BookPublisher: string
    BookPublicationDate: string
    quantity: number
  }>
}

export default function ViewOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderWithBooks[]>([])
  const [filteredOrders, setFilteredOrders] = useState<OrderWithBooks[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderWithBooks | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  

  useEffect(() => {
    // Check if user is logged in - direct Flask connection
    fetch('http://localhost:5000/api/auth/session', {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.push('/login')
        } else {
          setCurrentUser(data.user)
          fetchOrders(data.user.CustomerID)
        }
      })
      .catch(err => {
        console.error('Failed to fetch session:', err)
        router.push('/login')
      })
  }, [router])

  const fetchOrders = async (customerID: number) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log(`Fetching orders for customer ${customerID}...`)
      
      // Direct Flask connection - no proxy nonsense!
      const response = await fetch(`http://localhost:5000/api/orders/customer/${customerID}`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('Orders response status:', response.status)
      
      if (response.ok) {
        const ordersData = await response.json()
        console.log('Orders fetched successfully:', ordersData.length, 'orders')
        
        // Sort orders by OrderID descending (newest first)
        const sortedOrders = ordersData.sort((a: OrderWithBooks, b: OrderWithBooks) => 
          b.OrderID - a.OrderID
        )
        
        setOrders(sortedOrders)
        setFilteredOrders(sortedOrders)
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch orders:', response.status, errorText)
        setError(`Failed to fetch orders: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    if (!value.trim()) {
      setFilteredOrders(orders)
      return
    }

    const filtered = orders.filter(order => 
      order.OrderID.toString().includes(value) ||
      order.books.some(book => 
        book.BookTitle.toLowerCase().includes(value.toLowerCase()) ||
        book.AuthorName.toLowerCase().includes(value.toLowerCase())
      ) ||
      new Date(order.OrderDate).toLocaleDateString().includes(value)
    )
    setFilteredOrders(filtered)
  }

  const handleOrderDoubleClick = (order: OrderWithBooks) => {
    setSelectedOrder(order)
  }

  const closeOverlay = () => {
    setSelectedOrder(null)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-text">Loading orders...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-red-500 mb-4">{error}</div>
          <button
            onClick={() => {
              setError(null)
              if (currentUser) {
                fetchOrders(currentUser.CustomerID)
              }
            }}
            className="px-4 py-2 bg-gold text-base rounded-lg hover:bg-gold/80"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-text">Your Orders</h1>
            <p className="text-subtext mt-1">
              {orders.length === 0 
                ? 'No orders found' 
                : `${filteredOrders.length} of ${orders.length} orders`
              }
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
          {orders.length > 0 && (
            <button
              onClick={() => {
                setError(null)
                fetchOrders(currentUser.CustomerID)
              }}
              className="px-4 py-2 bg-surface text-text rounded-lg hover:bg-surface transition-colors text-sm"
            >
              Refresh Orders
            </button>
          )}
        </div>
        
        {/* Search Bar */}
        {orders.length > 0 && (
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search orders by ID, book title, author, or date..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-surface text-text placeholder-subtext focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-subtext text-lg">
              {searchTerm 
                ? 'No orders found matching your search.' 
                : orders.length === 0 
                  ? 'You have no orders yet.' 
                  : 'No orders to display.'
              }
            </p>
            {orders.length === 0 && (
              <button
                onClick={() => router.push('/new-order')}
                className="mt-4 px-6 py-3 bg-gold text-base font-semibold rounded-xl hover:bg-gold/80 transition-colors"
              >
                Create Your First Order
              </button>
            )}
          </div>
        ) : (
          filteredOrders.map(order => (
            <Order
              key={order.OrderID}
              order={order}
              onDoubleClick={() => handleOrderDoubleClick(order)}
            />
          ))
        )}
      </div>

      {/* Order Detail Overlay */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-base rounded-xl max-w-4xl max-h-[90vh] overflow-y-auto w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-semibold text-text">
                  Order Details - #{selectedOrder.OrderID}
                </h2>
                <button
                  onClick={closeOverlay}
                  className="text-subtext hover:text-text text-2xl p-1"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-text mb-2">Order Information</h3>
                  <p className="text-subtext">Order ID: #{selectedOrder.OrderID}</p>
                  <p className="text-subtext">
                    Date: {new Date(selectedOrder.OrderDate).toLocaleDateString()} at{' '}
                    {new Date(selectedOrder.OrderDate).toLocaleTimeString()}
                  </p>
                  <p className="text-subtext">Items: {selectedOrder.books.length}</p>
                  <p className="text-text font-semibold text-lg">Total: ${selectedOrder.OrderPrice.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-text mb-2">Customer</h3>
                  <p className="text-subtext">{currentUser?.CustomerName}</p>
                  <p className="text-subtext">{currentUser?.CustomerEmail}</p>
                  <p className="text-subtext">Customer ID: {currentUser?.CustomerID}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-text mb-4">Items ({selectedOrder.books.length})</h3>
                <div className="space-y-3">
                  {selectedOrder.books.map(book => (
                    <div key={book.BookID} className="bg-overlay rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-text">{book.BookTitle}</h4>
                          <p className="text-subtext text-sm">by {book.AuthorName}</p>
                          <p className="text-subtext text-sm">{book.BookPublisher}</p>
                          <p className="text-subtext text-sm">Published: {book.BookPublicationDate}</p>
                          <p className="text-subtext text-sm">Book ID: {book.BookID}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-text font-medium">${book.BookPrice.toFixed(2)} each</p>
                          <p className="text-subtext text-sm">Quantity: {book.quantity}</p>
                          <p className="text-text font-semibold text-lg">
                            ${(book.BookPrice * book.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="mt-6 pt-4 border-t border-surface">
                  <div className="flex justify-between items-center">
                    <span className="text-text font-semibold">Order Total:</span>
                    <span className="text-text font-bold text-xl">${selectedOrder.OrderPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}