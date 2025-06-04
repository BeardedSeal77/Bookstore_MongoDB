import { useState } from 'react'

interface Book {
  BookID: number
  BookTitle: string
  AuthorName: string
  BookPrice: number
  BookPublisher: string
  BookPublicationDate: string
  BookQuantity: number
}

interface BookCardProps {
  book: Book
  onAddToCart: (book: Book, quantity: number) => void
  isInCart: boolean
  cartQuantity: number
}

export default function BookCard({ book, onAddToCart, isInCart, cartQuantity }: BookCardProps) {
  const [quantity, setQuantity] = useState(1)
  const [showDetails, setShowDetails] = useState(false)

  const handleAddToCart = () => {
    if (quantity > 0 && quantity <= book.BookQuantity) {
      onAddToCart(book, quantity)
      setQuantity(1) // Reset to 1 after adding
    }
  }

  const availableQuantity = book.BookQuantity - cartQuantity
  const isOutOfStock = book.BookQuantity === 0
  const isMaxedOut = cartQuantity >= book.BookQuantity

  return (
    <div className="bg-base border border-surface rounded-xl p-6 hover:shadow-lg transition-all duration-200">
      {/* Book Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-text mb-2 line-clamp-2">
          {book.BookTitle}
        </h3>
        <p className="text-subtext text-sm mb-1">by {book.AuthorName}</p>
        <p className="text-subtext text-xs">{book.BookPublisher}</p>
      </div>

      {/* Price and Stock */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-2xl font-bold text-text">${book.BookPrice.toFixed(2)}</span>
          <div className="text-right">
            <p className={`text-sm ${book.BookQuantity > 5 ? 'text-green' : book.BookQuantity > 0 ? 'text-yellow-500' : 'text-red-500'}`}>
              {isOutOfStock ? 'Out of Stock' : `${book.BookQuantity} in stock`}
            </p>
            {isInCart && (
              <p className="text-xs text-subtext">
                {cartQuantity} in cart
              </p>
            )}
          </div>
        </div>
        
        {/* Publication Date */}
        <p className="text-xs text-subtext">
          Published: {book.BookPublicationDate}
        </p>
      </div>

      {/* Details Toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-gold text-sm hover:underline mb-4"
      >
        {showDetails ? 'Hide Details' : 'Show Details'}
      </button>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mb-4 p-3 bg-overlay rounded-lg">
          <div className="text-sm text-text space-y-1">
            <p><strong>ID:</strong> {book.BookID}</p>
            <p><strong>Publisher:</strong> {book.BookPublisher}</p>
            <p><strong>Publication Date:</strong> {book.BookPublicationDate}</p>
            <p><strong>Available Stock:</strong> {book.BookQuantity}</p>
            {isInCart && (
              <p><strong>In Your Cart:</strong> {cartQuantity}</p>
            )}
          </div>
        </div>
      )}

      {/* Add to Cart Section */}
      {!isOutOfStock && !isMaxedOut && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-text font-medium">Qty:</label>
            <div className="flex items-center border border-surface rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1 text-text hover:bg-overlay transition-colors"
                disabled={quantity <= 1}
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1
                  setQuantity(Math.min(Math.max(1, val), availableQuantity))
                }}
                className="w-16 px-2 py-1 text-center bg-transparent text-text focus:outline-none"
                min="1"
                max={availableQuantity}
              />
              <button
                onClick={() => setQuantity(Math.min(availableQuantity, quantity + 1))}
                className="px-3 py-1 text-text hover:bg-overlay transition-colors"
                disabled={quantity >= availableQuantity}
              >
                +
              </button>
            </div>
            <span className="text-xs text-subtext">
              (max {availableQuantity})
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={quantity > availableQuantity}
            className="w-full px-4 py-2 rounded-xl bg-gold text-base font-semibold hover:bg-gold/80 disabled:bg-surface disabled:text-subtext transition-colors"
          >
            Add to Cart - ${(book.BookPrice * quantity).toFixed(2)}
          </button>
        </div>
      )}

      {/* Stock Status Messages */}
      {isOutOfStock && (
        <div className="text-center py-4">
          <p className="text-red-500 font-medium">Out of Stock</p>
        </div>
      )}

      {isMaxedOut && !isOutOfStock && (
        <div className="text-center py-4">
          <p className="text-yellow-500 font-medium">Maximum quantity in cart</p>
          <p className="text-xs text-subtext">You have all available copies</p>
        </div>
      )}

      {/* Cart Status */}
      {isInCart && (
        <div className="mt-3 p-2 bg-green/10 border border-green/20 rounded-lg text-center">
          <p className="text-green text-sm font-medium">
            ✓ {cartQuantity} in cart
          </p>
        </div>
      )}
    </div>
  )
}