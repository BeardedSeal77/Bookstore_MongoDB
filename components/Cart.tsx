interface CartItem {
  BookID: number
  BookTitle: string
  AuthorName: string
  BookPrice: number
  BookPublisher: string
  BookPublicationDate: string
  BookQuantity: number
  cartQuantity: number
}

interface CartProps {
  cart: CartItem[]
  onClose: () => void
  onUpdateQuantity: (bookId: number, newQuantity: number) => void
  onRemoveItem: (bookId: number) => void
  onPurchase: () => void
  totalPrice: number
  isProcessing: boolean
}

export default function Cart({
  cart,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onPurchase,
  totalPrice,
  isProcessing
}: CartProps) {
  const totalItems = cart.reduce((sum, item) => sum + item.cartQuantity, 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-base rounded-xl max-w-4xl max-h-[90vh] overflow-hidden w-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-surface">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-text">
              Shopping Cart ({totalItems} item{totalItems !== 1 ? 's' : ''})
            </h2>
            <button
              onClick={onClose}
              className="text-subtext hover:text-text text-2xl p-1"
              disabled={isProcessing}
            >
              ×
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-subtext text-lg">Your cart is empty</p>
              <p className="text-subtext text-sm mt-2">Add some books to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.BookID} className="bg-overlay rounded-lg p-4">
                  <div className="flex gap-4">
                    {/* Book Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-text mb-1">{item.BookTitle}</h3>
                      <p className="text-subtext text-sm mb-1">by {item.AuthorName}</p>
                      <p className="text-subtext text-xs mb-2">{item.BookPublisher}</p>
                      <p className="text-text font-medium">${item.BookPrice.toFixed(2)} each</p>
                      <p className="text-subtext text-xs">
                        {item.BookQuantity - item.cartQuantity} remaining in stock
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="flex items-center border border-surface rounded-lg">
                        <button
                          onClick={() => onUpdateQuantity(item.BookID, item.cartQuantity - 1)}
                          className="px-3 py-1 text-text hover:bg-surface transition-colors"
                          disabled={isProcessing}
                        >
                          -
                        </button>
                        <span className="px-4 py-1 text-text font-medium">
                          {item.cartQuantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.BookID, item.cartQuantity + 1)}
                          className="px-3 py-1 text-text hover:bg-surface transition-colors"
                          disabled={item.cartQuantity >= item.BookQuantity || isProcessing}
                        >
                          +
                        </button>
                      </div>
                      <p className="text-xs text-subtext">
                        Max: {item.BookQuantity}
                      </p>
                    </div>

                    {/* Price and Remove */}
                    <div className="text-right flex flex-col justify-between">
                      <div>
                        <p className="text-text font-semibold text-lg">
                          ${(item.BookPrice * item.cartQuantity).toFixed(2)}
                        </p>
                        <p className="text-subtext text-sm">
                          {item.cartQuantity} × ${item.BookPrice.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.BookID)}
                        className="text-red-500 hover:text-red-400 text-sm underline mt-2"
                        disabled={isProcessing}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-surface">
            <div className="flex justify-between items-center mb-4">
              <div className="text-left">
                <p className="text-subtext text-sm">
                  {totalItems} item{totalItems !== 1 ? 's' : ''} in cart
                </p>
                <p className="text-text text-2xl font-bold">
                  Total: ${totalPrice.toFixed(2)}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-overlay text-text hover:bg-surface transition-colors"
                  disabled={isProcessing}
                >
                  Continue Shopping
                </button>
                <button
                  onClick={onPurchase}
                  disabled={isProcessing}
                  className="px-8 py-3 rounded-xl bg-gold text-base font-semibold hover:bg-gold/80 disabled:bg-surface disabled:text-subtext transition-colors flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-base border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    `Purchase - $${totalPrice.toFixed(2)}`
                  )}
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="text-xs text-subtext">
              <p>By purchasing, you agree to our terms and conditions.</p>
              <p className="mt-1">
                Books will be reserved and shipping information will be provided after purchase.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}