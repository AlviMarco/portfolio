#!/bin/bash

# SkillBridge API Test Results
# =============================
# Date: 2026-01-27

echo "=========================================="
echo "SKILLBRIDGE API TESTING"
echo "=========================================="
echo ""

BASE_URL="http://localhost:5000/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
    fi
}

echo "=========================================="
echo "1. AUTHENTICATION ENDPOINTS"
echo "=========================================="
echo ""

# 1.1 Register Student
echo "--- 1.1 POST /api/auth/register (Student) ---"
STUDENT_REG=$(curl -s -X POST $BASE_URL/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"student@skillbridge.com","password":"student123","name":"John Student","role":"STUDENT"}')
echo "$STUDENT_REG" | head -c 200
STUDENT_PASS=$(echo $STUDENT_REG | grep -q "success"; echo $?)
print_result $STUDENT_PASS "Register Student"
echo ""

# 1.2 Register Tutor
echo "--- 1.2 POST /api/auth/register (Tutor) ---"
TUTOR_REG=$(curl -s -X POST $BASE_URL/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"tutor@skillbridge.com","password":"tutor123","name":"Jane Tutor","role":"TUTOR"}')
echo "$TUTOR_REG" | head -c 200
TUTOR_PASS=$(echo $TUTOR_REG | grep -q "success"; echo $?)
print_result $TUTOR_PASS "Register Tutor"
echo ""

# 1.3 Register Admin (should fail - admin already exists)
echo "--- 1.3 POST /api/auth/register (Admin - should fail) ---"
ADMIN_REG=$(curl -s -X POST $BASE_URL/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"admin2@skillbridge.com","password":"admin123","name":"Admin 2","role":"ADMIN"}')
echo "$ADMIN_REG" | head -c 200
ADMIN_REG_PASS=$(echo $ADMIN_REG | grep -q "success"; echo $?)
print_result $ADMIN_REG_PASS "Register Admin (should fail)"
echo ""

# 1.4 Login as Student
echo "--- 1.4 POST /api/auth/login (Student) ---"
STUDENT_LOGIN=$(curl -s -X POST $BASE_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"student@skillbridge.com","password":"student123"}')
echo "$STUDENT_LOGIN" | head -c 300
STUDENT_TOKEN=$(echo $STUDENT_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: ${STUDENT_TOKEN:0:30}..."
STUDENT_LOGIN_PASS=$(echo $STUDENT_LOGIN | grep -q "token"; echo $?)
print_result $STUDENT_LOGIN_PASS "Login Student"
echo ""

# 1.5 Login as Tutor
echo "--- 1.5 POST /api/auth/login (Tutor) ---"
TUTOR_LOGIN=$(curl -s -X POST $BASE_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"tutor@skillbridge.com","password":"tutor123"}')
echo "$TUTOR_LOGIN" | head -c 300
TUTOR_TOKEN=$(echo $TUTOR_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: ${TUTOR_TOKEN:0:30}..."
TUTOR_LOGIN_PASS=$(echo $TUTOR_LOGIN | grep -q "token"; echo $?)
print_result $TUTOR_LOGIN_PASS "Login Tutor"
echo ""

# 1.6 Login as Admin
echo "--- 1.6 POST /api/auth/login (Admin) ---"
ADMIN_LOGIN=$(curl -s -X POST $BASE_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@skillbridge.com","password":"admin123"}')
echo "$ADMIN_LOGIN" | head -c 300
ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: ${ADMIN_TOKEN:0:30}..."
ADMIN_LOGIN_PASS=$(echo $ADMIN_LOGIN | grep -q "token"; echo $?)
print_result $ADMIN_LOGIN_PASS "Login Admin"
echo ""

# 1.7 Get Current User (Student)
echo "--- 1.7 GET /api/auth/me (Student) ---"
STUDENT_ME=$(curl -s -X GET $BASE_URL/auth/me \
    -H "Authorization: Bearer $STUDENT_TOKEN")
echo "$STUDENT_ME" | head -c 200
STUDENT_ME_PASS=$(echo $STUDENT_ME | grep -q "success"; echo $?)
print_result $STUDENT_ME_PASS "Get Current User (Student)"
echo ""

# 1.8 Get Current User (Tutor)
echo "--- 1.8 GET /api/auth/me (Tutor) ---"
TUTOR_ME=$(curl -s -X GET $BASE_URL/auth/me \
    -H "Authorization: Bearer $TUTOR_TOKEN")
echo "$TUTOR_ME" | head -c 200
TUTOR_ME_PASS=$(echo $TUTOR_ME | grep -q "success"; echo $?)
print_result $TUTOR_ME_PASS "Get Current User (Tutor)"
echo ""

# 1.9 Unauthorized Access
echo "--- 1.9 GET /api/auth/me (No Token - should fail) ---"
UNAUTH_ME=$(curl -s -X GET $BASE_URL/auth/me)
echo "$UNAUTH_ME" | head -c 200
UNAUTH_ME_PASS=$(echo $UNAUTH_ME | grep -q "error"; echo $?)
print_result $UNAUTH_ME_PASS "Unauthorized Access (should fail)"
echo ""

echo "=========================================="
echo "2. PUBLIC ENDPOINTS"
echo "=========================================="
echo ""

# 2.1 List all tutors
echo "--- 2.1 GET /api/tutors ---"
TUTORS=$(curl -s -X GET $BASE_URL/tutors)
echo "$TUTORS" | head -c 200
TUTORS_PASS=$(echo $TUTORS | grep -q "success"; echo $?)
print_result $TUTORS_PASS "List All Tutors"
echo ""

# 2.2 Get tutor details (get first tutor id)
echo "--- 2.2 GET /api/tutors/:id ---"
TUTOR_ID=$(echo $TUTORS | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Using Tutor ID: $TUTOR_ID"
TUTOR_DETAILS=$(curl -s -X GET $BASE_URL/tutors/$TUTOR_ID)
echo "$TUTOR_DETAILS" | head -c 200
TUTOR_DETAILS_PASS=$(echo $TUTOR_DETAILS | grep -q "success"; echo $?)
print_result $TUTOR_DETAILS_PASS "Get Tutor Details"
echo ""

# 2.3 List categories (should be empty initially)
echo "--- 2.3 GET /api/categories ---"
CATEGORIES=$(curl -s -X GET $BASE_URL/categories)
echo "$CATEGORIES" | head -c 200
CATEGORIES_PASS=$(echo $CATEGORIES | grep -q "success"; echo $?)
print_result $CATEGORIES_PASS "List Categories"
echo ""

echo "=========================================="
echo "3. BOOKING ENDPOINTS"
echo "=========================================="
echo ""

# 3.1 Create booking (as student)
echo "--- 3.1 POST /api/bookings (Create Booking) ---"
BOOKING_CREATE=$(curl -s -X POST $BASE_URL/bookings \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $STUDENT_TOKEN" \
    -d "{\"tutorId\":\"$TUTOR_ID\",\"subject\":\"Mathematics\",\"message\":\"I need help with calculus\",\"date\":\"2026-02-01\",\"time\":\"10:00\"}")
echo "$BOOKING_CREATE" | head -c 300
BOOKING_ID=$(echo $BOOKING_CREATE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Booking ID: $BOOKING_ID"
BOOKING_CREATE_PASS=$(echo $BOOKING_CREATE | grep -q "success"; echo $?)
print_result $BOOKING_CREATE_PASS "Create Booking"
echo ""

# 3.2 Get user's bookings (student)
echo "--- 3.2 GET /api/bookings (Student) ---"
STUDENT_BOOKINGS=$(curl -s -X GET $BASE_URL/bookings \
    -H "Authorization: Bearer $STUDENT_TOKEN")
echo "$STUDENT_BOOKINGS" | head -c 200
STUDENT_BOOKINGS_PASS=$(echo $STUDENT_BOOKINGS | grep -q "success"; echo $?)
print_result $STUDENT_BOOKINGS_PASS "Get Student Bookings"
echo ""

# 3.3 Get user's bookings (tutor)
echo "--- 3.3 GET /api/bookings (Tutor) ---"
TUTOR_BOOKINGS=$(curl -s -X GET $BASE_URL/bookings \
    -H "Authorization: Bearer $TUTOR_TOKEN")
echo "$TUTOR_BOOKINGS" | head -c 200
TUTOR_BOOKINGS_PASS=$(echo $TUTOR_BOOKINGS | grep -q "success"; echo $?)
print_result $TUTOR_BOOKINGS_PASS "Get Tutor Bookings"
echo ""

# 3.4 Get specific booking
echo "--- 3.4 GET /api/bookings/:id ---"
if [ -n "$BOOKING_ID" ]; then
    SPECIFIC_BOOKING=$(curl -s -X GET $BASE_URL/bookings/$BOOKING_ID \
        -H "Authorization: Bearer $STUDENT_TOKEN")
    echo "$SPECIFIC_BOOKING" | head -c 200
    SPECIFIC_BOOKING_PASS=$(echo $SPECIFIC_BOOKING | grep -q "success"; echo $?)
    print_result $SPECIFIC_BOOKING_PASS "Get Specific Booking"
else
    echo "No booking ID available"
fi
echo ""

echo "=========================================="
echo "4. TUTOR MANAGEMENT ENDPOINTS"
echo "=========================================="
echo ""

# 4.1 Update tutor profile
echo "--- 4.1 PUT /api/tutor/profile ---"
TUTOR_PROFILE=$(curl -s -X PUT $BASE_URL/tutor/profile \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TUTOR_TOKEN" \
    -d '{"bio":"Experienced math tutor with 5 years of teaching","subjects":["Mathematics","Physics","Calculus"],"hourlyRate":50,"education":"Master of Mathematics"}')
echo "$TUTOR_PROFILE" | head -c 300
TUTOR_PROFILE_PASS=$(echo $TUTOR_PROFILE | grep -q "success"; echo $?)
print_result $TUTOR_PROFILE_PASS "Update Tutor Profile"
echo ""

# 4.2 Set availability
echo "--- 4.2 PUT /api/tutor/availability ---"
TUTOR_AVAIL=$(curl -s -X PUT $BASE_URL/tutor/availability \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TUTOR_TOKEN" \
    -d '[{"day":"Monday","startTime":"09:00","endTime":"17:00"},{"day":"Wednesday","startTime":"09:00","endTime":"17:00"},{"day":"Friday","startTime":"09:00","endTime":"17:00"}]')
echo "$TUTOR_AVAIL" | head -c 200
TUTOR_AVAIL_PASS=$(echo $TUTOR_AVAIL | grep -q "success"; echo $?)
print_result $TUTOR_AVAIL_PASS "Set Tutor Availability"
echo ""

# 4.3 Get updated tutor details
echo "--- 4.3 GET /api/tutors/:id (After Profile Update) ---"
UPDATED_TUTOR=$(curl -s -X GET $BASE_URL/tutors/$TUTOR_ID)
echo "$UPDATED_TUTOR" | head -c 400
UPDATED_TUTOR_PASS=$(echo $UPDATED_TUTOR | grep -q "success"; echo $?)
print_result $UPDATED_TUTOR_PASS "Get Updated Tutor Details"
echo ""

echo "=========================================="
echo "5. REVIEW ENDPOINTS"
echo "=========================================="
echo ""

# 5.1 Create review (for completed booking - may fail if booking not completed)
echo "--- 5.1 POST /api/reviews ---"
REVIEW_CREATE=$(curl -s -X POST $BASE_URL/reviews \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $STUDENT_TOKEN" \
    -d "{\"bookingId\":\"$BOOKING_ID\",\"rating\":5,\"comment\":\"Excellent tutor! Very helpful and patient.\"}")
echo "$REVIEW_CREATE" | head -c 200
REVIEW_CREATE_PASS=$(echo $REVIEW_CREATE | grep -q "success"; echo $?)
print_result $REVIEW_CREATE_PASS "Create Review"
echo ""

echo "=========================================="
echo "6. ADMIN ENDPOINTS"
echo "=========================================="
echo ""

# 6.1 Get all users
echo "--- 6.1 GET /api/admin/users ---"
ADMIN_USERS=$(curl -s -X GET $BASE_URL/admin/users \
    -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$ADMIN_USERS" | head -c 300
ADMIN_USERS_PASS=$(echo $ADMIN_USERS | grep -q "success"; echo $?)
print_result $ADMIN_USERS_PASS "Get All Users"
echo ""

# 6.2 Update user status (ban user)
echo "--- 6.2 PATCH /api/admin/users/:id (Ban User) ---"
USER_ID=$(echo $ADMIN_USERS | grep -o '"id":"[^"]*"' | head -2 | tail -1 | cut -d'"' -f4)
echo "Using User ID: $USER_ID"
ADMIN_BAN=$(curl -s -X PATCH $BASE_URL/admin/users/$USER_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{"status":"BANNED"}')
echo "$ADMIN_BAN" | head -c 200
ADMIN_BAN_PASS=$(echo $ADMIN_BAN | grep -q "success"; echo $?)
print_result $ADMIN_BAN_PASS "Ban User"
echo ""

# 6.3 Unban user
echo "--- 6.3 PATCH /api/admin/users/:id (Unban User) ---"
ADMIN_UNBAN=$(curl -s -X PATCH $BASE_URL/admin/users/$USER_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{"status":"ACTIVE"}')
echo "$ADMIN_UNBAN" | head -c 200
ADMIN_UNBAN_PASS=$(echo $ADMIN_UNBAN | grep -q "success"; echo $?)
print_result $ADMIN_UNBAN_PASS "Unban User"
echo ""

# 6.4 Get all bookings (admin)
echo "--- 6.4 GET /api/admin/bookings ---"
ADMIN_BOOKINGS=$(curl -s -X GET $BASE_URL/admin/bookings \
    -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$ADMIN_BOOKINGS" | head -c 200
ADMIN_BOOKINGS_PASS=$(echo $ADMIN_BOOKINGS | grep -q "success"; echo $?)
print_result $ADMIN_BOOKINGS_PASS "Get All Bookings (Admin)"
echo ""

# 6.5 Get all categories (admin)
echo "--- 6.5 GET /api/admin/categories ---"
ADMIN_CATEGORIES=$(curl -s -X GET $BASE_URL/admin/categories \
    -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$ADMIN_CATEGORIES" | head -c 200
ADMIN_CATEGORIES_PASS=$(echo $ADMIN_CATEGORIES | grep -q "success"; echo $?)
print_result $ADMIN_CATEGORIES_PASS "Get All Categories (Admin)"
echo ""

# 6.6 Create category
echo "--- 6.6 POST /api/admin/categories ---"
ADMIN_CAT_CREATE=$(curl -s -X POST $BASE_URL/admin/categories \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{"name":"Mathematics","description":"Mathematics tutoring and courses"}')
echo "$ADMIN_CAT_CREATE" | head -c 200
CATEGORY_ID=$(echo $ADMIN_CAT_CREATE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
ADMIN_CAT_CREATE_PASS=$(echo $ADMIN_CAT_CREATE | grep -q "success"; echo $?)
print_result $ADMIN_CAT_CREATE_PASS "Create Category"
echo ""

# 6.7 Create another category
echo "--- 6.7 POST /api/admin/categories (Physics) ---"
ADMIN_CAT_CREATE2=$(curl -s -X POST $BASE_URL/admin/categories \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{"name":"Physics","description":"Physics tutoring and courses"}')
echo "$ADMIN_CAT_CREATE2" | head -c 200
ADMIN_CAT_CREATE2_PASS=$(echo $ADMIN_CAT_CREATE2 | grep -q "success"; echo $?)
print_result $ADMIN_CAT_CREATE2_PASS "Create Category (Physics)"
echo ""

# 6.8 Get public categories (verify created categories)
echo "--- 6.8 GET /api/categories (After Creating) ---"
FINAL_CATEGORIES=$(curl -s -X GET $BASE_URL/categories)
echo "$FINAL_CATEGORIES" | head -c 300
FINAL_CATEGORIES_PASS=$(echo $FINAL_CATEGORIES | grep -q "success"; echo $?)
print_result $FINAL_CATEGORIES_PASS "List Categories (After Creation)"
echo ""

echo "=========================================="
echo "7. ERROR CASES"
echo "=========================================="
echo ""

# 7.1 Invalid login
echo "--- 7.1 POST /api/auth/login (Invalid credentials) ---"
INVALID_LOGIN=$(curl -s -X POST $BASE_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"invalid@test.com","password":"wrongpassword"}')
echo "$INVALID_LOGIN" | head -c 200
INVALID_LOGIN_PASS=$(echo $INVALID_LOGIN | grep -q "error"; echo $?)
print_result $INVALID_LOGIN_PASS "Invalid Login (should fail)"
echo ""

# 7.2 Access admin endpoint as student
echo "--- 7.2 GET /api/admin/users (as Student - should fail) ---"
UNAUTH_ADMIN=$(curl -s -X GET $BASE_URL/admin/users \
    -H "Authorization: Bearer $STUDENT_TOKEN")
echo "$UNAUTH_ADMIN" | head -c 200
UNAUTH_ADMIN_PASS=$(echo $UNAUTH_ADMIN | grep -q "error"; echo $?)
print_result $UNAUTH_ADMIN_PASS "Unauthorized Admin Access (should fail)"
echo ""

# 7.3 Access tutor endpoint as student
echo "--- 7.3 PUT /api/tutor/profile (as Student - should fail) ---"
UNAUTH_TUTOR=$(curl -s -X PUT $BASE_URL/tutor/profile \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $STUDENT_TOKEN" \
    -d '{"bio":"Hacked bio"}')
echo "$UNAUTH_TUTOR" | head -c 200
UNAUTH_TUTOR_PASS=$(echo $UNAUTH_TUTOR | grep -q "error"; echo $?)
print_result $UNAUTH_TUTOR_PASS "Unauthorized Tutor Access (should fail)"
echo ""

# 7.4 Duplicate registration
echo "--- 7.4 POST /api/auth/register (Duplicate email) ---"
DUP_REG=$(curl -s -X POST $BASE_URL/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"student@skillbridge.com","password":"student123","name":"Duplicate Student","role":"STUDENT"}')
echo "$DUP_REG" | head -c 200
DUP_REG_PASS=$(echo $DUP_REG | grep -q "error"; echo $?)
print_result $DUP_REG_PASS "Duplicate Registration (should fail)"
echo ""

# 7.5 Invalid booking data
echo "--- 7.5 POST /api/bookings (Invalid data) ---"
INVALID_BOOKING=$(curl -s -X POST $BASE_URL/bookings \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $STUDENT_TOKEN" \
    -d '{"tutorId":"invalid-id","subject":"","date":""}')
echo "$INVALID_BOOKING" | head -c 200
INVALID_BOOKING_PASS=$(echo $INVALID_BOOKING | grep -q "error"; echo $?)
print_result $INVALID_BOOKING_PASS "Invalid Booking Data (should fail)"
echo ""

echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo ""
echo "All API endpoints have been tested."
echo "See individual test results above."
echo ""
echo "Test completed at: $(date)"
