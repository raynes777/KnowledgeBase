#!/bin/bash

# Test API Script for Clinical Trial Documentation Backend

BASE_URL="http://localhost:8080/api"

echo "=== Clinical Trial Documentation - API Testing ==="
echo ""

# Test 1: Register User
echo "1. Registering new SPONSOR user..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sponsor@test.com",
    "password": "password123",
    "name": "Test Sponsor",
    "role": "SPONSOR",
    "organization": "Pharma Inc"
  }')

echo "Response: $REGISTER_RESPONSE"
echo ""

# Test 2: Login
echo "2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sponsor@test.com",
    "password": "password123"
  }')

echo "Response: $LOGIN_RESPONSE"

# Extract JWT token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "JWT Token: $TOKEN"
echo ""

# Test 3: Create Document (requires Xanadu integration - Sprint 3)
# Uncomment when Sprint 3 is complete
# echo "3. Creating document..."
# curl -X POST "$BASE_URL/documents" \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer $TOKEN" \
#   -d '{
#     "title": "Protocol XYZ-2026",
#     "docType": "PROTOCOL",
#     "initialContent": "Study objectives: Evaluate efficacy..."
#   }'
# echo ""

echo "=== Testing Complete ==="
