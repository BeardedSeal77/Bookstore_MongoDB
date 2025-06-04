from flask import Blueprint, jsonify
from pymongo import MongoClient
import os

books_bp = Blueprint('books', __name__)

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["bookstore"]
books_collection = db["books"]

# Enable CORS for direct connections
from flask_cors import cross_origin

@books_bp.route('/')
@books_bp.route('')  # Handle both /api/books/ and /api/books
@cross_origin(origins=['http://localhost:3000'], supports_credentials=True)
def get_all_books():
    """Get books from database with reasonable limit"""
    try:
        print("=== BOOKS ENDPOINT CALLED ===", flush=True)
        
        # Get more books now that direct connection works well
        # Start with 200 books - can increase more if needed
        books = list(books_collection.find({}).sort("BookID", 1).limit(200))
        print(f"Fetched {len(books)} books from database", flush=True)
        
        # Clean up and validate books
        valid_books = []
        for book in books:
            if '_id' in book:
                del book['_id']
                
            # Ensure required fields exist
            if (book.get('BookID') is not None and 
                book.get('BookTitle') and 
                book.get('AuthorName') and 
                book.get('BookPrice') is not None and 
                book.get('BookQuantity') is not None):
                
                # Add default values for optional fields
                book.setdefault('BookPublisher', 'Unknown Publisher')
                book.setdefault('BookPublicationDate', 'Unknown Date')
                valid_books.append(book)
        
        print(f"Returning {len(valid_books)} valid books", flush=True)
        return jsonify(valid_books)
        
    except Exception as e:
        print(f"=== ERROR in get_all_books: {e} ===", flush=True)
        return jsonify({'error': str(e)}), 500

@books_bp.route('/db')
@cross_origin(origins=['http://localhost:3000'], supports_credentials=True)
def get_books_from_db():
    """Test database connection separately"""
    try:
        print("=== DATABASE BOOKS ENDPOINT CALLED ===", flush=True)
        
        # Try to get just one book from database
        book = books_collection.find_one({})
        if book and '_id' in book:
            del book['_id']
            
        if book:
            print(f"Found book from DB: {book['BookTitle']}", flush=True)
            return jsonify([book])
        else:
            print("No books found in DB", flush=True)
            return jsonify([])
        
    except Exception as e:
        print(f"=== DB ERROR: {e} ===", flush=True)
        return jsonify({'error': str(e)}), 500

@books_bp.route('/test')
def test_books():
    """Simple test endpoint"""
    return jsonify({
        'status': 'books blueprint working',
        'message': 'This is from books.py'
    })

@books_bp.route('/debug')
@cross_origin(origins=['http://localhost:3000'], supports_credentials=True)
def debug_books():
    """Debug endpoint"""
    try:
        # Test MongoDB connection
        client.admin.command('ping')
        book_count = books_collection.count_documents({})
        
        return jsonify({
            'mongodb_connected': True,
            'books_count': book_count,
            'status': 'debug working'
        })
        
    except Exception as e:
        return jsonify({
            'mongodb_connected': False,
            'error': str(e)
        }), 500