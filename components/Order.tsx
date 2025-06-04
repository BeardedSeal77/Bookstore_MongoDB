interface OrderProps {
  order: {
    OrderID: number
    BookIDQuantity: { [key: string]: number }
    OrderPrice: number
    OrderDate: string
    CustomerID: number
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
  onDoubleClick: () => void
}

export default function Order({ order, onDoubleClick }: OrderProps) {
  const totalItems = order.books.reduce((sum, book) => sum + book.quantity, 0)
  const firstThreeBooks = order.books.slice(0, 3)
  const remainingBooksCount = order.books.length - 3

  return (
    <div
      className="bg-base border border-surface rounded-xl p-6 hover:bg-overlay cursor-pointer transition-all duration-200 hover:shadow-lg"
      onDoubleClick={onDoubleClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text">Order #{order.OrderID}</h3>
          <p className="text-subtext text-sm">
            {new Date(order.OrderDate).toLocaleDateString()} • {totalItems} item{totalItems !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-text">${order.OrderPrice.toFixed(2)}</p>
          <p className="text-subtext text-sm">Total</p>
        </div>
      </div>

      <div className="space-y-2">
        {firstThreeBooks.map(book => (
          <div key={book.BookID} className="flex justify-between items-center py-1">
            <div className="flex-1">
              <p className="text-text font-medium truncate">{book.BookTitle}</p>
              <p className="text-subtext text-sm">by {book.AuthorName}</p>
            </div>
            <div className="text-right ml-4">
              <p className="text-text">×{book.quantity}</p>
              <p className="text-subtext text-sm">${book.BookPrice.toFixed(2)}</p>
            </div>
          </div>
        ))}
        
        {remainingBooksCount > 0 && (
          <div className="pt-2 border-t border-surface">
            <p className="text-subtext text-sm italic">
              + {remainingBooksCount} more book{remainingBooksCount !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-surface">
        <p className="text-subtext text-sm italic">Double-click to view full details</p>
      </div>
    </div>
  )
}