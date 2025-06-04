// MongoDB Performance Testing Commands
// Run these in MongoDB Compass or MongoDB Shell

// 1. QUERY PERFORMANCE ANALYSIS
// Test book retrieval performance
db.books.find({}).limit(200).explain("executionStats")

// Results will show:
// - executionTimeMillis: Actual query time
// - totalDocsExamined: Documents scanned
// - totalDocsReturned: Documents returned
// - indexesUsed: Which indexes were utilized

// 2. SPECIFIC OPERATIONS TESTING

// Book search by title (with timing)
var start = new Date()
db.books.find({ "BookTitle": /Attack/i }).toArray()
var end = new Date()
print("Search time: " + (end - start) + "ms")

// Order lookup by customer
var start = new Date()
db.orders.find({ "CustomerID": 1003 }).toArray()
var end = new Date()
print("Order lookup time: " + (end - start) + "ms")

// Book catalog with sorting
var start = new Date()
db.books.find({}).sort({ "BookTitle": 1 }).limit(50).toArray()
var end = new Date()
print("Sorted catalog time: " + (end - start) + "ms")

// 3. INDEX PERFORMANCE TESTING

// Check if indexes are being used
db.books.find({ "BookTitle": /Harry/i }).explain("executionStats")

// Compare with and without index
db.books.dropIndex({ "BookTitle": "text" })  // Remove index
var start = new Date()
db.books.find({ "BookTitle": /Harry/i }).toArray()
var end = new Date()
print("Without index: " + (end - start) + "ms")

// Recreate index
db.books.createIndex({ "BookTitle": "text", "AuthorName": "text" })
var start = new Date()
db.books.find({ $text: { $search: "Harry" } }).toArray()
var end = new Date()
print("With index: " + (end - start) + "ms")

// 4. AGGREGATION PERFORMANCE

// Complex query performance (order statistics)
var start = new Date()
db.orders.aggregate([
  { $group: { _id: "$CustomerID", totalSpent: { $sum: "$OrderPrice" } } },
  { $sort: { totalSpent: -1 } }
]).toArray()
var end = new Date()
print("Aggregation time: " + (end - start) + "ms")

// 5. CONCURRENT OPERATIONS SIMULATION

// Function to simulate concurrent reads
function simulateConcurrentReads(numThreads, queriesPerThread) {
  var threads = []
  var results = []
  
  for (var i = 0; i < numThreads; i++) {
    threads.push(new Thread(function() {
      var times = []
      for (var j = 0; j < queriesPerThread; j++) {
        var start = new Date()
        db.books.find({}).limit(20).toArray()
        var end = new Date()
        times.push(end - start)
      }
      return times
    }))
  }
  
  // Start all threads
  threads.forEach(t => t.start())
  
  // Wait for completion and collect results
  threads.forEach(t => {
    results = results.concat(t.returnData())
  })
  
  return results
}

// Run concurrent test
var concurrentResults = simulateConcurrentReads(5, 10)
var avgTime = concurrentResults.reduce((a, b) => a + b) / concurrentResults.length
print("Average concurrent query time: " + avgTime + "ms")

// 6. DATABASE STATISTICS

// Get collection statistics
db.books.stats()
db.orders.stats()
db.customers.stats()

// Get database statistics
db.stats()

// Index statistics
db.books.getIndexes()
db.books.totalIndexSize()

// 7. COMPREHENSIVE PERFORMANCE TEST SUITE

function runPerformanceTests() {
  print("=== MongoDB Performance Test Results ===")
  
  // Test 1: Single document retrieval
  var start = new Date()
  db.books.findOne({ "BookID": 0 })
  var singleDocTime = new Date() - start
  print("Single document lookup: " + singleDocTime + "ms")
  
  // Test 2: Range query
  var start = new Date()
  db.books.find({ "BookPrice": { $gte: 20, $lte: 50 } }).toArray()
  var rangeQueryTime = new Date() - start
  print("Price range query: " + rangeQueryTime + "ms")
  
  // Test 3: Text search
  var start = new Date()
  db.books.find({ $text: { $search: "Harry" } }).toArray()
  var textSearchTime = new Date() - start
  print("Text search: " + textSearchTime + "ms")
  
  // Test 4: Order creation simulation
  var start = new Date()
  db.orders.insertOne({
    "OrderID": 99999,
    "CustomerID": 1003,
    "BookIDQuantity": { "0": 1 },
    "OrderPrice": 43.28,
    "OrderDate": new ISODate()
  })
  var insertTime = new Date() - start
  print("Order insertion: " + insertTime + "ms")
  
  // Clean up test order
  db.orders.deleteOne({ "OrderID": 99999 })
  
  // Test 5: Complex join-like operation
  var start = new Date()
  db.orders.aggregate([
    { $lookup: {
        from: "customers",
        localField: "CustomerID",
        foreignField: "CustomerID",
        as: "customer"
    }},
    { $limit: 10 }
  ]).toArray()
  var joinTime = new Date() - start
  print("Complex aggregation: " + joinTime + "ms")
  
  print("=== Test Complete ===")
}

// Run the comprehensive test
runPerformanceTests()

// 8. MONITORING QUERIES (for ongoing performance tracking)

// Current operations
db.currentOp()

// Server status
db.serverStatus()

// Profiler (enable to track slow queries)
db.setProfilingLevel(2, { slowms: 100 })  // Profile queries slower than 100ms
db.system.profile.find().sort({ ts: -1 }).limit(5)  // View recent slow queries