from flask import Blueprint, request, jsonify, session
from pymongo import MongoClient
import os

auth_bp = Blueprint('auth', __name__)

# MongoDB connection - Fixed the URI format
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["bookstore"]
customers = db["customers"]

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    identifier = data.get('username', '').strip()
    password = data.get('password', '').strip()

    print("LOGIN ATTEMPT:", identifier, password, flush=True)

    if not identifier or not password:
        return jsonify({'success': False, 'error': 'Missing username or password'}), 400

    # Try matching email or name
    if '@' in identifier:
        query = {"CustomerEmail": {"$regex": identifier, "$options": "i"}}
    else:
        query = {"CustomerName": {"$regex": identifier, "$options": "i"}}
    print("Query:", query, flush=True)

    user = customers.find_one(query)
    print("Found user:", user, flush=True)

    if user and user['CustomerPassword'] == password:
        # Save minimal session data
        session['currentUser'] = {
            "CustomerID": user['CustomerID'],
            "CustomerName": user['CustomerName'],
            "CustomerEmail": user['CustomerEmail']
        }
        print("Session saved:", session.get('currentUser'), flush=True)
        return jsonify({'success': True, 'message': 'Login successful'})
    else:
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.pop('currentUser', None)
    return jsonify({'success': True, 'message': 'Logout successful'})