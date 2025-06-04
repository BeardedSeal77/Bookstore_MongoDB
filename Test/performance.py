import time
import statistics
from pymongo import MongoClient
import json
from datetime import datetime

class SimpleMongoPerformanceTester:
    def __init__(self, connection_string="mongodb://localhost:27017/"):
        try:
            self.client = MongoClient(connection_string)
            self.db = self.client["bookstore"]
            self.books = self.db["books"]
            self.orders = self.db["orders"]
            self.customers = self.db["customers"]
            
            # Test connection
            self.client.admin.command('ping')
            print(" Connected to MongoDB successfully")
        except Exception as e:
            print(f" Failed to connect to MongoDB: {e}")
            raise
    

    # Time a database operation multiple times and return statistics
    def time_operation(self, operation_name, operation_func, iterations=5):
        print(f"Testing {operation_name}...")
        times = []
        
        for i in range(iterations):
            try:
                start_time = time.time()
                result = operation_func()
                end_time = time.time()
                operation_time = (end_time - start_time) * 1000  # Convert to milliseconds
                times.append(operation_time)
                print(f"  Iteration {i+1}: {operation_time:.2f}ms")
            except Exception as e:
                print(f" Error in iteration {i+1}: {e}")
                continue
        
        if not times:
            return {"error": "All iterations failed"}
        
        return {
            'avg_ms': round(statistics.mean(times), 2),
            'min_ms': round(min(times), 2),
            'max_ms': round(max(times), 2),
            'iterations_completed': len(times),
            'raw_times': [round(t, 2) for t in times]
        }
    

    # Test basic CRUD operations
    def test_basic_operations(self):
        print("\n--- BASIC OPERATIONS TEST ---")
        results = {}
        
        # Test 1: Single document lookup by BookID
        def single_book_lookup():
            return self.books.find_one({"BookID": 0})
        
        results['single_book_lookup'] = self.time_operation(
            "Single Book Lookup (BookID=0)", 
            single_book_lookup
        )
        
        # Test 2: Get first 20 books
        def get_20_books():
            return list(self.books.find({}).limit(20))
        
        results['get_20_books'] = self.time_operation(
            "Get 20 Books", 
            get_20_books
        )
        
        # Test 3: Get all books (up to 200)
        def get_all_books():
            return list(self.books.find({}).limit(200))
        
        results['get_all_books'] = self.time_operation(
            "Get All Books (limit 200)", 
            get_all_books
        )
        
        # Test 4: Count documents
        def count_books():
            return self.books.count_documents({})
        
        results['count_books'] = self.time_operation(
            "Count All Books", 
            count_books
        )
        
        return results
    
    # Test search operations (without requiring text indexes)
    def test_search_operations(self):
        print("\n--- SEARCH OPERATIONS TEST ---")
        results = {}
        
        # Test 1: Search by price range
        def price_range_search():
            return list(self.books.find({"BookPrice": {"$gte": 20, "$lte": 50}}))
        
        results['price_range_search'] = self.time_operation(
            "Price Range Search ($20-$50)", 
            price_range_search
        )
        
        # Test 2: Search by author (case-insensitive regex)
        def author_search():
            return list(self.books.find({"AuthorName": {"$regex": "^H", "$options": "i"}}))
        
        results['author_search'] = self.time_operation(
            "Author Search (starts with 'H')", 
            author_search
        )
        
        # Test 3: Search by title (partial match)
        def title_search():
            return list(self.books.find({"BookTitle": {"$regex": "Attack", "$options": "i"}}))
        
        results['title_search'] = self.time_operation(
            "Title Search (contains 'Attack')", 
            title_search
        )
        
        # Test 4: Books with stock > 10
        def high_stock_books():
            return list(self.books.find({"BookQuantity": {"$gt": 10}}))
        
        results['high_stock_books'] = self.time_operation(
            "High Stock Books (>10)", 
            high_stock_books
        )
        
        return results
    
    # Test order-related operations
    def test_order_operations(self):
        print("\n--- ORDER OPERATIONS TEST ---")
        results = {}
        
        # Test 1: Get all orders
        def get_all_orders():
            return list(self.orders.find({}))
        
        results['get_all_orders'] = self.time_operation(
            "Get All Orders", 
            get_all_orders
        )
        
        # Test 2: Get orders for specific customer (if any exist)
        def get_customer_orders():
            return list(self.orders.find({"CustomerID": 1003}))
        
        results['get_customer_orders'] = self.time_operation(
            "Get Customer Orders (ID=1003)", 
            get_customer_orders
        )
        
        # Test 3: Insert and delete test order
        def insert_test_order():
            test_order = {
                "OrderID": 99999,
                "CustomerID": 1003,
                "BookIDQuantity": {"0": 1},
                "OrderPrice": 43.28,
                "OrderDate": datetime.now().isoformat()
            }
            # Insert
            result = self.orders.insert_one(test_order)
            # Immediately delete to clean up
            self.orders.delete_one({"OrderID": 99999})
            return result.inserted_id
        
        results['insert_delete_order'] = self.time_operation(
            "Insert + Delete Test Order", 
            insert_test_order
        )
        
        return results
    
    # Test sorting performance
    def test_sorting_operations(self):
        print("\n--- SORTING OPERATIONS TEST ---")
        results = {}
        
        # Test 1: Sort by title
        def sort_by_title():
            return list(self.books.find({}).sort("BookTitle", 1).limit(50))
        
        results['sort_by_title'] = self.time_operation(
            "Sort by Title (50 books)", 
            sort_by_title
        )
        
        # Test 2: Sort by price
        def sort_by_price():
            return list(self.books.find({}).sort("BookPrice", -1).limit(50))
        
        results['sort_by_price'] = self.time_operation(
            "Sort by Price DESC (50 books)", 
            sort_by_price
        )
        
        # Test 3: Sort orders by date
        def sort_orders_by_date():
            return list(self.orders.find({}).sort("OrderDate", -1))
        
        results['sort_orders_by_date'] = self.time_operation(
            "Sort Orders by Date DESC", 
            sort_orders_by_date
        )
        
        return results
    
    # Get basic collection statistics
    def get_collection_stats(self):
        print("\n--- COLLECTION STATISTICS ---")
        stats = {}
        
        try:
            # Books collection
            books_count = self.books.count_documents({})
            sample_book = self.books.find_one({})
            if sample_book and '_id' in sample_book:
                del sample_book['_id']  # Remove ObjectId for JSON serialization
            
            stats['books'] = {
                'count': books_count,
                'sample_document': sample_book if books_count > 0 else None
            }
            print(f"Books collection: {books_count} documents")
            
            # Orders collection  
            orders_count = self.orders.count_documents({})
            sample_order = self.orders.find_one({})
            if sample_order and '_id' in sample_order:
                del sample_order['_id']  # Remove ObjectId for JSON serialization
                
            stats['orders'] = {
                'count': orders_count,
                'sample_document': sample_order if orders_count > 0 else None
            }
            print(f"Orders collection: {orders_count} documents")
            
            # Customers collection
            customers_count = self.customers.count_documents({})
            sample_customer = self.customers.find_one({})
            if sample_customer:
                # Remove sensitive data and ObjectId
                if '_id' in sample_customer:
                    del sample_customer['_id']
                if 'CustomerPassword' in sample_customer:
                    del sample_customer['CustomerPassword']
            
            stats['customers'] = {
                'count': customers_count,
                'sample_document_structure': list(sample_customer.keys()) if sample_customer else None
            }
            print(f"Customers collection: {customers_count} documents")
            
        except Exception as e:
            print(f"Error getting collection stats: {e}")
            stats['error'] = str(e)
        
        return stats
    
    # Run all performance tests
    def run_performance_test(self):
        print("Starting MongoDB Performance Test")
        print("=" * 60)
        
        start_time = time.time()
        
        results = {
            'test_timestamp': datetime.now().isoformat(),
            'collection_stats': self.get_collection_stats(),
            'basic_operations': self.test_basic_operations(),
            'search_operations': self.test_search_operations(),
            'order_operations': self.test_order_operations(),
            'sorting_operations': self.test_sorting_operations()
        }
        
        total_time = time.time() - start_time
        results['total_test_time_seconds'] = round(total_time, 2)
        
        # Print summary
        self.print_summary(results)
        
        # Save results to file
        filename = f"mongodb_performance_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n Detailed results saved to: {filename}")
        print(f" Total test time: {total_time:.2f} seconds")
        
        return results
    
    # Print a summary of test results
    def print_summary(self, results):
        print("\n" + "=" * 60)
        print(" PERFORMANCE TEST SUMMARY")
        print("=" * 60)
        
        def print_operation_result(name, result):
            if 'error' in result:
                print(f" {name}: {result['error']}")
            else:
                print(f" {name}: {result['avg_ms']}ms avg")
        
        # Collection Stats
        stats = results['collection_stats']
        print(f"\n DATABASE STATISTICS:")
        print(f"  Books: {stats.get('books', {}).get('count', 'Error')} documents")
        print(f"  Orders: {stats.get('orders', {}).get('count', 'Error')} documents")
        print(f"  Customers: {stats.get('customers', {}).get('count', 'Error')} documents")
        
        # Basic Operations
        print(f"\n BASIC OPERATIONS:")
        basic_ops = results['basic_operations']
        for op_name, op_result in basic_ops.items():
            print_operation_result(op_name.replace('_', ' ').title(), op_result)
        
        # Search Operations
        print(f"\n SEARCH OPERATIONS:")
        search_ops = results['search_operations']
        for op_name, op_result in search_ops.items():
            print_operation_result(op_name.replace('_', ' ').title(), op_result)
        
        # Order Operations
        print(f"\n ORDER OPERATIONS:")
        order_ops = results['order_operations']
        for op_name, op_result in order_ops.items():
            print_operation_result(op_name.replace('_', ' ').title(), op_result)
        
        # Sorting Operations
        print(f"\n SORTING OPERATIONS:")
        sort_ops = results['sorting_operations']
        for op_name, op_result in sort_ops.items():
            print_operation_result(op_name.replace('_', ' ').title(), op_result)


# Usage
if __name__ == "__main__":
    try:
        tester = SimpleMongoPerformanceTester()
        results = tester.run_performance_test()
    except Exception as e:
        print(f" Test failed: {e}")
        print("Make sure MongoDB is running and the 'bookstore' database exists.")