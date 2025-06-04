'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BookCard from '@/components/BookCard'
import Cart from '@/components/Cart'

interface Book {
  BookID: number
  BookTitle: string
  AuthorName: string
  BookPrice: number
  BookPublisher: string
  BookPublicationDate: string
  BookQuantity: number
}

interface CartItem extends Book {
  cartQuantity: number
}

export default function NewOrderPage() {
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [displayedBooks, setDisplayedBooks] = useState<Book[]>([]) // Books currently shown
  const [booksPerPage] = useState(20) // Show 20 books at a time
  const [currentPage, setCurrentPage] = useState(1)
  const [totalBooks, setTotalBooks] = useState(0)
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'price' | 'date'>('title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
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
          fetchBooks()
        }
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

  const fetchBooks = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Fetching books via direct Flask connection...')
      
      // Direct Flask connection - no proxy nonsense!
      const response = await fetch('http://localhost:5000/api/books', {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('Response status:', response.status)
      
      if (response.ok) {
        const booksData = await response.json()
        console.log('Books fetched successfully:', booksData.length, 'books')
        
        // Ensure all books have required fields
        const validBooks = booksData.filter((book: Book) => {
          return book.BookID !== undefined && 
                 book.BookTitle && 
                 book.AuthorName && 
                 book.BookPrice !== undefined &&
                 book.BookQuantity !== undefined
        })
        
        setBooks(validBooks)
        setFilteredBooks(validBooks)
        setTotalBooks(validBooks.length)
        
        // Show first page of books
        const firstPageBooks = validBooks.slice(0, booksPerPage)
        setDisplayedBooks(firstPageBooks)
        setCurrentPage(1)
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch books:', response.status, errorText)
        setError(`Failed to fetch books: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching books:', error)
      setError('Failed to connect to Flask server')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    filterAndSortBooks(value, sortBy, sortOrder)
  }

  const handleSort = (newSortBy: typeof sortBy, newSortOrder: typeof sortOrder) => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    filterAndSortBooks(searchTerm, newSortBy, newSortOrder)
  }

  const filterAndSortBooks = (search: string, sort: typeof sortBy, order: typeof sortOrder) => {
    let filtered = books

    if (search.trim()) {
      filtered = books.filter(book =>
        book.BookTitle.toLowerCase().includes(search.toLowerCase()) ||
        book.AuthorName.toLowerCase().includes(search.toLowerCase()) ||
        (book.BookPublisher && book.BookPublisher.toLowerCase().includes(search.toLowerCase()))
      )
    }

    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sort) {
        case 'title':
          aValue = a.BookTitle.toLowerCase()
          bValue = b.BookTitle.toLowerCase()
          break
        case 'author':
          aValue = a.AuthorName.toLowerCase()
          bValue = b.AuthorName.toLowerCase()
          break
        case 'price':
          aValue = a.BookPrice
          bValue = b.BookPrice
          break
        case 'date':
          aValue = new Date(a.BookPublicationDate || '1900-01-01').getTime()
          bValue = new Date(b.BookPublicationDate || '1900-01-01').getTime()
          break
        default:
          aValue = a.BookTitle.toLowerCase()
          bValue = b.BookTitle.toLowerCase()
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      } else {
        return order === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
      }
    })

    setFilteredBooks(filtered)
    setTotalBooks(filtered.length)
    
    // Reset to first page when filtering/sorting
    const firstPageBooks = filtered.slice(0, booksPerPage)
    setDisplayedBooks(firstPageBooks)
    setCurrentPage(1)
  }

  const loadMoreBooks = () => {
    const nextPage = currentPage + 1
    const startIndex = (nextPage - 1) * booksPerPage
    const endIndex = startIndex + booksPerPage
    
    const newBooks = filteredBooks.slice(startIndex, endIndex)
    setDisplayedBooks(prev => [...prev, ...newBooks])
    setCurrentPage(nextPage)
  }

  const hasMoreBooks = currentPage * booksPerPage < filteredBooks.length

  const addToCart = (book: Book, quantity: number) => {
    if (quantity <= 0 || quantity > book.BookQuantity) return

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.BookID === book.BookID)
      if (existingItem) {
        const newQuantity = existingItem.cartQuantity + quantity
        if (newQuantity > book.BookQuantity) {
          alert(`Cannot add more than ${book.BookQuantity} copies of "${book.BookTitle}"`)
          return prevCart
        }
        return prevCart.map(item =>
          item.BookID === book.BookID
            ? { ...item, cartQuantity: newQuantity }
            : item
        )
      } else {
        return [...prevCart, { ...book, cartQuantity: quantity }]
      }
    })
  }

  const updateCartQuantity = (bookId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(bookId)
      return
    }

    const book = books.find(b => b.BookID === bookId)
    if (book && newQuantity > book.BookQuantity) {
      alert(`Cannot add more than ${book.BookQuantity} copies`)
      return
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.BookID === bookId
          ? { ...item, cartQuantity: newQuantity }
          : item
      )
    )
  }

  const removeFromCart = (bookId: number) => {
    setCart(prevCart => prevCart.filter(item => item.BookID !== bookId))
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.BookPrice * item.cartQuantity), 0)
  }

  const handlePurchase = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty!')
      return
    }

    setPurchasing(true)
    try {
      const orderData = {
        customerID: currentUser.CustomerID,
        books: cart.map(item => ({
          bookID: item.BookID,
          quantity: item.cartQuantity
        }))
      }

      // Direct Flask connection - no proxy complications!
      const response = await fetch('http://localhost:5000/api/orders/create', {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Order #${result.orderID} created successfully!`)
        setCart([])
        setIsCartOpen(false)
        fetchBooks()
      } else {
        const error = await response.json()
        alert(`Failed to create order: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order. Please try again.')
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-text">Loading books...</div>
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
              fetchBooks()
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-text">Create New Order</h1>
          <p className="text-subtext mt-1">
            Showing {displayedBooks.length} of {totalBooks} books
            {totalBooks !== books.length && ` (filtered from ${books.length} total)`}
          </p>
        </div>
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative px-6 py-3 rounded-xl bg-gold text-base font-semibold hover:bg-gold/80 transition-colors"
        >
          View Cart ({cart.length})
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
              {cart.reduce((sum, item) => sum + item.cartQuantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Search and Sort Controls */}
      <div className="bg-base rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-text font-medium mb-2">Search Books</label>
            <input
              type="text"
              placeholder="Search by title, author, or publisher..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-overlay border border-surface text-text placeholder-subtext focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
          <div>
            <label className="block text-text font-medium mb-2">Sort By</label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value as typeof sortBy, sortOrder)}
                className="flex-1 px-4 py-3 rounded-xl bg-overlay border border-surface text-text focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="price">Price</option>
                <option value="date">Publication Date</option>
              </select>
              <button
                onClick={() => handleSort(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-3 rounded-xl bg-overlay border border-surface text-text hover:bg-surface transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayedBooks.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-subtext text-lg">
              {searchTerm ? 'No books found matching your search.' : 'No books available.'}
            </p>
          </div>
        ) : (
          displayedBooks.map((book, index) => (
            <BookCard
              key={`book-${book.BookID}-${index}`}
              book={book}
              onAddToCart={addToCart}
              isInCart={cart.some(item => item.BookID === book.BookID)}
              cartQuantity={cart.find(item => item.BookID === book.BookID)?.cartQuantity || 0}
            />
          ))
        )}
      </div>

      {/* Load More Button */}
      {hasMoreBooks && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMoreBooks}
            className="px-8 py-3 rounded-xl bg-gold text-base font-semibold hover:bg-gold/80 transition-colors"
          >
            Load More Books ({filteredBooks.length - displayedBooks.length} remaining)
          </button>
        </div>
      )}

      {/* Cart Modal */}
      {isCartOpen && (
        <Cart
          cart={cart}
          onClose={() => setIsCartOpen(false)}
          onUpdateQuantity={updateCartQuantity}
          onRemoveItem={removeFromCart}
          onPurchase={handlePurchase}
          totalPrice={getTotalPrice()}
          isProcessing={purchasing}
        />
      )}
    </div>
  )
}