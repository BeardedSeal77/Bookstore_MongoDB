from flask import Blueprint, jsonify, session, request
from flask_cors import cross_origin
from pymongo import MongoClient
import os
from datetime import datetime

orders_bp = Blueprint('orders', __name__)

# MongoDB connection (update URI as needed)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["bookstore"]
orders_collection = db["orders"]
books_collection = db["books"]
customers_collection = db["customers"]

@orders_bp.route('/test-db', methods=['GET'])
@cross_origin(origins=['http://localhost:3000'], supports_credentials=True)
def test_database():
    """Test MongoDB write operations"""
    try:
        print("=== TESTING DATABASE WRITE ===", flush=True)
        
        # Test write operation
        test_doc = {
            "test_id": 999999,
            "test_message": "Database write test",
            "timestamp": datetime.now().isoformat()
        }
        
        result = orders_collection.insert_one(test_doc)
        print(f"Test insert result: {result}", flush=True)
        print(f"Test acknowledged: {result.acknowledged}", flush=True)
        
        if result.acknowledged:
            # Verify it was inserted
            found_doc = orders_collection.find_one({"test_id": 999999})
            if found_doc:
                print("[SUCCESS] Test document found in database", flush=True)
                # Clean up test document
                orders_collection.delete_one({"test_id": 999999})
                return jsonify({"status": "success", "message": "Database write test passed"})
            else:
                print("[ERROR] Test document not found after insert", flush=True)
                return jsonify({"status": "error", "message": "Database write test failed - document not found"})
        else:
            print("[ERROR] Test insert not acknowledged", flush=True)
            return jsonify({"status": "error", "message": "Database write test failed - not acknowledged"})
            
    except Exception as e:
        print(f"[ERROR] Database test error: {e}", flush=True)
        return jsonify({"status": "error", "message": f"Database test failed: {str(e)}"})

@orders_bp.route('/create', methods=['POST'])
@cross_origin(origins=['http://localhost:3000'], supports_credentials=True)
def create_order():
    """Create a new order with debugging"""
    try:
        print("=== CREATE ORDER ENDPOINT CALLED ===", flush=True)
        
        # Check if user is logged in
        current_user = session.get('currentUser')
        print(f"Current user from session: {current_user}", flush=True)
        
        if not current_user:
            print("No user in session - unauthorized", flush=True)
            return jsonify({'error': 'Unauthorized - no user in session'}), 403

        data = request.get_json()
        print(f"Order data received: {data}", flush=True)
        
        customer_id = data.get('customerID')
        books_data = data.get('books', [])  # [{'bookID': 1, 'quantity': 2}, ...]

        print(f"Customer ID: {customer_id}, Books: {books_data}", flush=True)

        # Verify the customer ID matches the logged-in user
        if customer_id != current_user['CustomerID']:
            print(f"Customer ID mismatch: {customer_id} vs {current_user['CustomerID']}", flush=True)
            return jsonify({'error': 'Unauthorized - customer ID mismatch'}), 403

        if not books_data:
            print("No books specified in order", flush=True)
            return jsonify({'error': 'No books specified'}), 400

        # Validate and calculate order details
        book_id_quantity = {}
        total_price = 0
        
        for book_item in books_data:
            book_id = book_item.get('bookID')
            quantity = book_item.get('quantity')
            
            print(f"Processing book: ID={book_id}, quantity={quantity}", flush=True)
            
            if not book_id or not quantity or quantity <= 0:
                print(f"Invalid book or quantity: {book_item}", flush=True)
                return jsonify({'error': f'Invalid book or quantity: {book_item}'}), 400
            
            # Get book details and check availability
            book = books_collection.find_one({"BookID": book_id})
            
            if book:
                print(f"[SUCCESS] Book found: {book['BookTitle']} (ID: {book['BookID']})", flush=True)
                print(f"   Available quantity: {book['BookQuantity']}", flush=True)
                print(f"   Book price: ${book['BookPrice']}", flush=True)
            else:
                print(f"[ERROR] Book not found for ID: {book_id}", flush=True)
                
            # Special debugging for BookID 0
            if book_id == 0:
                print(f"[DEBUG] DEBUGGING BookID 0:", flush=True)
                print(f"   Book data: {book}", flush=True)
                print(f"   Requested quantity: {quantity}", flush=True)
                print(f"   Available quantity: {book['BookQuantity'] if book else 'N/A'}", flush=True)
                print(f"   Quantity check: {book['BookQuantity'] >= quantity if book else 'N/A'}", flush=True)
            
            if not book:
                print(f"Book with ID {book_id} not found in database", flush=True)
                return jsonify({'error': f'Book with ID {book_id} not found'}), 404
            
            if book['BookQuantity'] < quantity:
                print(f"Insufficient stock for book {book_id}: available={book['BookQuantity']}, requested={quantity}", flush=True)
                return jsonify({'error': f'Insufficient stock for "{book["BookTitle"]}". Available: {book["BookQuantity"]}, Requested: {quantity}'}), 400
            
            book_id_quantity[str(book_id)] = quantity
            total_price += book['BookPrice'] * quantity
            print(f"Added to order: {book['BookTitle']} x{quantity} = ${book['BookPrice'] * quantity}", flush=True)

        print(f"Order totals: {len(book_id_quantity)} items, ${total_price}", flush=True)

        # Get the next OrderID
        try:
            last_order = orders_collection.find_one(sort=[("OrderID", -1)])
            if last_order:
                next_order_id = last_order['OrderID'] + 1
                print(f"Last order ID: {last_order['OrderID']}, next: {next_order_id}", flush=True)
            else:
                next_order_id = 1
                print("No existing orders, starting with ID 1", flush=True)
        except Exception as id_error:
            print(f"Error getting next order ID: {id_error}", flush=True)
            # Fallback: count existing orders and add 1
            order_count = orders_collection.count_documents({})
            next_order_id = order_count + 1
            print(f"Fallback: order count={order_count}, next ID={next_order_id}", flush=True)

        # Create the order
        order = {
            "OrderID": next_order_id,
            "CustomerID": customer_id,
            "BookIDQuantity": book_id_quantity,
            "OrderPrice": round(total_price, 2),
            "OrderDate": datetime.now().isoformat()
        }

        print(f"Order to be inserted: {order}", flush=True)

        # Insert the order
        print(f"About to insert order into MongoDB...", flush=True)
        try:
            result = orders_collection.insert_one(order)
            print(f"MongoDB insert_one result: {result}", flush=True)
            print(f"Inserted ID: {result.inserted_id}", flush=True)
            print(f"Acknowledged: {result.acknowledged}", flush=True)
            
            # Verify the order was actually inserted
            inserted_order = orders_collection.find_one({"OrderID": next_order_id})
            if inserted_order:
                print(f"[SUCCESS] Order verified in database: {inserted_order}", flush=True)
            else:
                print("[ERROR] Order NOT found in database after insert!", flush=True)
                return jsonify({'error': 'Order creation failed - not saved to database'}), 500
                
        except Exception as insert_error:
            print(f"[ERROR] MongoDB insert failed: {insert_error}", flush=True)
            return jsonify({'error': f'Database insert failed: {str(insert_error)}'}), 500
        
        if result.acknowledged:
            print("[SUCCESS] Order insertion acknowledged by MongoDB", flush=True)
            print("Updating book quantities...", flush=True)
            
            # Update book quantities
            for book_item in books_data:
                book_id = book_item.get('bookID')
                quantity = book_item.get('quantity')
                
                print(f"Updating stock for book {book_id}: reducing by {quantity}", flush=True)
                update_result = books_collection.update_one(
                    {"BookID": book_id},
                    {"$inc": {"BookQuantity": -quantity}}
                )
                print(f"Stock update result for book {book_id}: {update_result.modified_count} documents modified", flush=True)
            
            print(f"Order {next_order_id} created successfully!", flush=True)
            return jsonify({
                'success': True,
                'message': 'Order created successfully',
                'orderID': next_order_id,
                'totalPrice': round(total_price, 2)
            })
        else:
            print("Failed to insert order into database", flush=True)
            return jsonify({'error': 'Failed to create order - database insert failed'}), 500

    except Exception as e:
        print(f"=== ERROR creating order: {e} ===", flush=True)
        import traceback
        print(f"Full traceback: {traceback.format_exc()}", flush=True)
        return jsonify({'error': f'Failed to create order: {str(e)}'}), 500

@orders_bp.route('/customer/<int:customer_id>')
@cross_origin(origins=['http://localhost:3000'], supports_credentials=True)
def get_customer_orders(customer_id):
    """Get all orders for a specific customer with book details"""
    try:
        print(f"=== GET CUSTOMER ORDERS: {customer_id} ===", flush=True)
        
        # Verify the requesting user matches the customer_id (security check)
        current_user = session.get('currentUser')
        if not current_user or current_user['CustomerID'] != customer_id:
            print(f"Unauthorized access to customer {customer_id} orders", flush=True)
            return jsonify({'error': 'Unauthorized'}), 403

        # Find all orders for this customer
        orders = list(orders_collection.find({"CustomerID": customer_id}))
        print(f"Found {len(orders)} orders for customer {customer_id}", flush=True)
        
        if not orders:
            return jsonify([])

        # Enrich orders with book details
        enriched_orders = []
        
        for order in orders:
            # Get book details for each book in the order
            books_in_order = []
            
            for book_id_str, quantity in order.get('BookIDQuantity', {}).items():
                book_id = int(book_id_str)
                book = books_collection.find_one({"BookID": book_id})
                
                if book:
                    books_in_order.append({
                        "BookID": book["BookID"],
                        "BookTitle": book["BookTitle"],
                        "AuthorName": book["AuthorName"],
                        "BookPrice": book["BookPrice"],
                        "BookPublisher": book.get("BookPublisher", "Unknown Publisher"),
                        "BookPublicationDate": book.get("BookPublicationDate", "Unknown Date"),
                        "quantity": quantity
                    })
            
            enriched_order = {
                "OrderID": order["OrderID"],
                "BookIDQuantity": order["BookIDQuantity"],
                "OrderPrice": order["OrderPrice"],
                "OrderDate": order["OrderDate"],
                "CustomerID": order["CustomerID"],
                "books": books_in_order
            }
            
            enriched_orders.append(enriched_order)
        
        # Sort by OrderID descending (newest first)
        enriched_orders.sort(key=lambda x: x["OrderID"], reverse=True)
        
        print(f"Returning {len(enriched_orders)} enriched orders", flush=True)
        return jsonify(enriched_orders)
        
    except Exception as e:
        print(f"Error fetching orders: {e}", flush=True)
        return jsonify({'error': 'Failed to fetch orders'}), 500

@orders_bp.route('/<int:order_id>')
@cross_origin(origins=['http://localhost:3000'], supports_credentials=True)
def get_order_details(order_id):
    """Get detailed information for a specific order"""
    try:
        print(f"=== GET ORDER DETAILS: {order_id} ===", flush=True)
        
        # Verify the requesting user owns this order
        current_user = session.get('currentUser')
        if not current_user:
            return jsonify({'error': 'Unauthorized'}), 403

        order = orders_collection.find_one({"OrderID": order_id})
        
        if not order:
            print(f"Order {order_id} not found", flush=True)
            return jsonify({'error': 'Order not found'}), 404
            
        if order['CustomerID'] != current_user['CustomerID']:
            print(f"Unauthorized access to order {order_id}", flush=True)
            return jsonify({'error': 'Unauthorized'}), 403

        # Get book details for each book in the order
        books_in_order = []
        
        for book_id_str, quantity in order.get('BookIDQuantity', {}).items():
            book_id = int(book_id_str)
            book = books_collection.find_one({"BookID": book_id})
            
            if book:
                books_in_order.append({
                    "BookID": book["BookID"],
                    "BookTitle": book["BookTitle"],
                    "AuthorName": book["AuthorName"],
                    "BookPrice": book["BookPrice"],
                    "BookPublisher": book.get("BookPublisher", "Unknown Publisher"),
                    "BookPublicationDate": book.get("BookPublicationDate", "Unknown Date"),
                    "quantity": quantity
                })
        
        detailed_order = {
            "OrderID": order["OrderID"],
            "BookIDQuantity": order["BookIDQuantity"],
            "OrderPrice": order["OrderPrice"],
            "OrderDate": order["OrderDate"],
            "CustomerID": order["CustomerID"],
            "books": books_in_order
        }
        
        print(f"Returning order details for order {order_id}", flush=True)
        return jsonify(detailed_order)
        
    except Exception as e:
        print(f"Error fetching order details: {e}", flush=True)
        return jsonify({'error': 'Failed to fetch order details'}), 500