from flask import Flask, session, jsonify
from flask_cors import CORS
import sys
import os

# Add the parent directory to the path so we can import from api/
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from auth.login import auth_bp
from orders import orders_bp
from books import books_bp

# Create Flask app
app = Flask(__name__)
app.secret_key = 'your_secret_key_change_in_production'  # Change this to a secure key in production

# Configure CORS - allow direct connections from frontend
CORS(app, 
     supports_credentials=True, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Origin"],
     expose_headers=["Content-Type"],
     max_age=86400)

# Register blueprints without proxy complications
print("Registering blueprints...")
try:
    app.register_blueprint(auth_bp, url_prefix='/api/auth', strict_slashes=False)
    app.register_blueprint(orders_bp, url_prefix='/api/orders', strict_slashes=False)
    app.register_blueprint(books_bp, url_prefix='/api/books', strict_slashes=False)
    print("Blueprints registered successfully!")
except Exception as e:
    print(f"Error registering blueprints: {e}")

# Get current user session
@app.route('/api/auth/session')
def get_session():
    print("Session check requested", flush=True)
    print("Current session:", dict(session), flush=True)
    
    user = session.get('currentUser')
    if user:
        print("User found in session:", user, flush=True)
        return jsonify({
            'user': {
                'CustomerID': user['CustomerID'],
                'CustomerName': user['CustomerName'],
                'CustomerEmail': user['CustomerEmail']
            }
        })
    
    print("No user in session", flush=True)
    return jsonify({'user': None})

# Add a test endpoint to check if the API is working
@app.route('/api/test')
def test_api():
    print("Test API endpoint called", flush=True)
    return jsonify({
        'status': 'success',
        'message': 'API is working correctly - direct connection',
        'port': 5000,
        'registered_routes': [str(rule) for rule in app.url_map.iter_rules()]
    })

# Root endpoint
@app.route('/')
def index():
    return jsonify({
        'message': 'Bookstore API is running! Direct connections enabled.',
        'port': 5000,
        'endpoints': [
            '/api/test',
            '/api/auth/session',
            '/api/auth/login',
            '/api/auth/logout',
            '/api/books',
            '/api/orders/create'
        ]
    })

if __name__ == '__main__':
    print("Starting Flask server on http://localhost:5000")
    print("Direct connections enabled - no proxy needed!")
    print("Make sure MongoDB is running on localhost:27017")
    
    # Force port 5000
    port = int(os.environ.get('PORT', 5000))
    print(f"Flask server will run on port: {port}")
    
    app.run(debug=True, port=port, host='0.0.0.0')  # Allow connections from any IP