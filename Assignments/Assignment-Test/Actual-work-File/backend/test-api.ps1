# SkillBridge API Test Results
# =============================
# Date: 2026-01-27

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SKILLBRIDGE API TESTING" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$BASE_URL = "http://localhost:5000/api"

# Function to print test results
function Print-Result {
    param([int]$Pass, [string]$TestName)
    if ($Pass -eq 0) {
        Write-Host "✓ PASS: $TestName" -ForegroundColor Green
    }
    else {
        Write-Host "✗ FAIL: $TestName" -ForegroundColor Red
    }
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "1. AUTHENTICATION ENDPOINTS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1.1 Register Student
Write-Host "--- 1.1 POST /api/auth/register (Student) ---" -ForegroundColor Yellow
$STUDENT_REG = Invoke-RestMethod -Method Post -Uri "$BASE_URL/auth/register" -ContentType "application/json" -Body '{"email":"student@skillbridge.com","password":"student123","name":"John Student","role":"STUDENT"}'
$STUDENT_REG | ConvertTo-Json -Depth 3 | Select-Object -First 5
$STUDENT_PASS = if ($STUDENT_REG.success) { 0 } else { 1 }
Print-Result $STUDENT_PASS "Register Student"
Write-Host ""

# 1.2 Register Tutor
Write-Host "--- 1.2 POST /api/auth/register (Tutor) ---" -ForegroundColor Yellow
$TUTOR_REG = Invoke-RestMethod -Method Post -Uri "$BASE_URL/auth/register" -ContentType "application/json" -Body '{"email":"tutor@skillbridge.com","password":"tutor123","name":"Jane Tutor","role":"TUTOR"}'
$TUTOR_REG | ConvertTo-Json -Depth 3 | Select-Object -First 5
$TUTOR_PASS = if ($TUTOR_REG.success) { 0 } else { 1 }
Print-Result $TUTOR_PASS "Register Tutor"
Write-Host ""

# 1.3 Register Admin (should fail)
Write-Host "--- 1.3 POST /api/auth/register (Admin - should fail) ---" -ForegroundColor Yellow
$ADMIN_REG = Invoke-RestMethod -Method Post -Uri "$BASE_URL/auth/register" -ContentType "application/json" -Body '{"email":"admin2@skillbridge.com","password":"admin123","name":"Admin 2","role":"ADMIN"}'
$ADMIN_REG | ConvertTo-Json -Depth 3 | Select-Object -First 5
$ADMIN_REG_PASS = if ($ADMIN_REG.success) { 1 } else { 0 }
Print-Result $ADMIN_REG_PASS "Register Admin (should fail)"
Write-Host ""

# 1.4 Login as Student
Write-Host "--- 1.4 POST /api/auth/login (Student) ---" -ForegroundColor Yellow
$STUDENT_LOGIN = Invoke-RestMethod -Method Post -Uri "$BASE_URL/auth/login" -ContentType "application/json" -Body '{"email":"student@skillbridge.com","password":"student123"}'
$STUDENT_LOGIN | ConvertTo-Json -Depth 3 | Select-Object -First 5
$STUDENT_TOKEN = $STUDENT_LOGIN.data.token
Write-Host "Token: $($STUDENT_TOKEN.Substring(0, [Math]::Min(30, $STUDENT_TOKEN.Length)))..." -ForegroundColor Gray
$STUDENT_LOGIN_PASS = if ($STUDENT_LOGIN.success) { 0 } else { 1 }
Print-Result $STUDENT_LOGIN_PASS "Login Student"
Write-Host ""

# 1.5 Login as Tutor
Write-Host "--- 1.5 POST /api/auth/login (Tutor) ---" -ForegroundColor Yellow
$TUTOR_LOGIN = Invoke-RestMethod -Method Post -Uri "$BASE_URL/auth/login" -ContentType "application/json" -Body '{"email":"tutor@skillbridge.com","password":"tutor123"}'
$TUTOR_LOGIN | ConvertTo-Json -Depth 3 | Select-Object -First 5
$TUTOR_TOKEN = $TUTOR_LOGIN.data.token
Write-Host "Token: $($TUTOR_TOKEN.Substring(0, [Math]::Min(30, $TUTOR_TOKEN.Length)))..." -ForegroundColor Gray
$TUTOR_LOGIN_PASS = if ($TUTOR_LOGIN.success) { 0 } else { 1 }
Print-Result $TUTOR_LOGIN_PASS "Login Tutor"
Write-Host ""

# 1.6 Login as Admin
Write-Host "--- 1.6 POST /api/auth/login (Admin) ---" -ForegroundColor Yellow
$ADMIN_LOGIN = Invoke-RestMethod -Method Post -Uri "$BASE_URL/auth/login" -ContentType "application/json" -Body '{"email":"admin@skillbridge.com","password":"admin123"}'
$ADMIN_LOGIN | ConvertTo-Json -Depth 3 | Select-Object -First 5
$ADMIN_TOKEN = $ADMIN_LOGIN.data.token
Write-Host "Token: $($ADMIN_TOKEN.Substring(0, [Math]::Min(30, $ADMIN_TOKEN.Length)))..." -ForegroundColor Gray
$ADMIN_LOGIN_PASS = if ($ADMIN_LOGIN.success) { 0 } else { 1 }
Print-Result $ADMIN_LOGIN_PASS "Login Admin"
Write-Host ""

# 1.7 Get Current User (Student)
Write-Host "--- 1.7 GET /api/auth/me (Student) ---" -ForegroundColor Yellow
$STUDENT_ME = Invoke-RestMethod -Method Get -Uri "$BASE_URL/auth/me" -Headers @{"Authorization" = "Bearer $STUDENT_TOKEN" }
$STUDENT_ME | ConvertTo-Json -Depth 3 | Select-Object -First 5
$STUDENT_ME_PASS = if ($STUDENT_ME.success) { 0 } else { 1 }
Print-Result $STUDENT_ME_PASS "Get Current User (Student)"
Write-Host ""

# 1.8 Get Current User (Tutor)
Write-Host "--- 1.8 GET /api/auth/me (Tutor) ---" -ForegroundColor Yellow
$TUTOR_ME = Invoke-RestMethod -Method Get -Uri "$BASE_URL/auth/me" -Headers @{"Authorization" = "Bearer $TUTOR_TOKEN" }
$TUTOR_ME | ConvertTo-Json -Depth 3 | Select-Object -First 5
$TUTOR_ME_PASS = if ($TUTOR_ME.success) { 0 } else { 1 }
Print-Result $TUTOR_ME_PASS "Get Current User (Tutor)"
Write-Host ""

# 1.9 Unauthorized Access
Write-Host "--- 1.9 GET /api/auth/me (No Token - should fail) ---" -ForegroundColor Yellow
try {
    $UNAUTH_ME = Invoke-RestMethod -Method Get -Uri "$BASE_URL/auth/me" -ErrorAction Stop
    $UNAUTH_ME_PASS = 1
}
catch {
    $UNAUTH_ME_PASS = 0
}
Print-Result $UNAUTH_ME_PASS "Unauthorized Access (should fail)"
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "2. PUBLIC ENDPOINTS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 2.1 List all tutors
Write-Host "--- 2.1 GET /api/tutors ---" -ForegroundColor Yellow
$TUTORS = Invoke-RestMethod -Method Get -Uri "$BASE_URL/tutors"
$TUTORS | ConvertTo-Json -Depth 3 | Select-Object -First 5
$TUTORS_PASS = if ($TUTORS.success) { 0 } else { 1 }
Print-Result $TUTORS_PASS "List All Tutors"
Write-Host ""

# 2.2 Get tutor details
Write-Host "--- 2.2 GET /api/tutors/:id ---" -ForegroundColor Yellow
$TUTOR_ID = $TUTORS.data.tutors[0].id
Write-Host "Using Tutor ID: $TUTOR_ID" -ForegroundColor Gray
$TUTOR_DETAILS = Invoke-RestMethod -Method Get -Uri "$BASE_URL/tutors/$TUTOR_ID"
$TUTOR_DETAILS | ConvertTo-Json -Depth 3 | Select-Object -First 5
$TUTOR_DETAILS_PASS = if ($TUTOR_DETAILS.success) { 0 } else { 1 }
Print-Result $TUTOR_DETAILS_PASS "Get Tutor Details"
Write-Host ""

# 2.3 List categories
Write-Host "--- 2.3 GET /api/categories ---" -ForegroundColor Yellow
$CATEGORIES = Invoke-RestMethod -Method Get -Uri "$BASE_URL/categories"
$CATEGORIES | ConvertTo-Json -Depth 3 | Select-Object -First 5
$CATEGORIES_PASS = if ($CATEGORIES.success) { 0 } else { 1 }
Print-Result $CATEGORIES_PASS "List Categories"
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "3. BOOKING ENDPOINTS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 3.1 Create booking (as student)
Write-Host "--- 3.1 POST /api/bookings (Create Booking) ---" -ForegroundColor Yellow
$BOOKING_CREATE = Invoke-RestMethod -Method Post -Uri "$BASE_URL/bookings" -ContentType "application/json" -Headers @{"Authorization" = "Bearer $STUDENT_TOKEN" } -Body "{`"tutorId`":`"$TUTOR_ID`",`"subject`":`"Mathematics`",`"message`":`"I need help with calculus`",`"date`":`"2026-02-01`",`"time`":`"10:00`"}"
$BOOKING_CREATE | ConvertTo-Json -Depth 3 | Select-Object -First 5
$BOOKING_ID = $BOOKING_CREATE.data.booking.id
Write-Host "Booking ID: $BOOKING_ID" -ForegroundColor Gray
$BOOKING_CREATE_PASS = if ($BOOKING_CREATE.success) { 0 } else { 1 }
Print-Result $BOOKING_CREATE_PASS "Create Booking"
Write-Host ""

# 3.2 Get user's bookings (student)
Write-Host "--- 3.2 GET /api/bookings (Student) ---" -ForegroundColor Yellow
$STUDENT_BOOKINGS = Invoke-RestMethod -Method Get -Uri "$BASE_URL/bookings" -Headers @{"Authorization" = "Bearer $STUDENT_TOKEN" }
$STUDENT_BOOKINGS | ConvertTo-Json -Depth 3 | Select-Object -First 5
$STUDENT_BOOKINGS_PASS = if ($STUDENT_BOOKINGS.success) { 0 } else { 1 }
Print-Result $STUDENT_BOOKINGS_PASS "Get Student Bookings"
Write-Host ""

# 3.3 Get user's bookings (tutor)
Write-Host "--- 3.3 GET /api/bookings (Tutor) ---" -ForegroundColor Yellow
$TUTOR_BOOKINGS = Invoke-RestMethod -Method Get -Uri "$BASE_URL/bookings" -Headers @{"Authorization" = "Bearer $TUTOR_TOKEN" }
$TUTOR_BOOKINGS | ConvertTo-Json -Depth 3 | Select-Object -First 5
$TUTOR_BOOKINGS_PASS = if ($TUTOR_BOOKINGS.success) { 0 } else { 1 }
Print-Result $TUTOR_BOOKINGS_PASS "Get Tutor Bookings"
Write-Host ""

# 3.4 Get specific booking
Write-Host "--- 3.4 GET /api/bookings/:id ---" -ForegroundColor Yellow
if ($BOOKING_ID) {
    $SPECIFIC_BOOKING = Invoke-RestMethod -Method Get -Uri "$BASE_URL/bookings/$BOOKING_ID" -Headers @{"Authorization" = "Bearer $STUDENT_TOKEN" }
    $SPECIFIC_BOOKING | ConvertTo-Json -Depth 3 | Select-Object -First 5
    $SPECIFIC_BOOKING_PASS = if ($SPECIFIC_BOOKING.success) { 0 } else { 1 }
    Print-Result $SPECIFIC_BOOKING_PASS "Get Specific Booking"
}
else {
    Write-Host "No booking ID available" -ForegroundColor Red
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "4. TUTOR MANAGEMENT ENDPOINTS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 4.1 Update tutor profile
Write-Host "--- 4.1 PUT /api/tutor/profile ---" -ForegroundColor Yellow
$TUTOR_PROFILE = Invoke-RestMethod -Method Put -Uri "$BASE_URL/tutor/profile" -ContentType "application/json" -Headers @{"Authorization" = "Bearer $TUTOR_TOKEN" } -Body '{"bio":"Experienced math tutor with 5 years of teaching","subjects":["Mathematics","Physics","Calculus"],"hourlyRate":50,"education":"Master of Mathematics"}'
$TUTOR_PROFILE | ConvertTo-Json -Depth 3 | Select-Object -First 5
$TUTOR_PROFILE_PASS = if ($TUTOR_PROFILE.success) { 0 } else { 1 }
Print-Result $TUTOR_PROFILE_PASS "Update Tutor Profile"
Write-Host ""

# 4.2 Set availability
Write-Host "--- 4.2 PUT /api/tutor/availability ---" -ForegroundColor Yellow
$TUTOR_AVAIL = Invoke-RestMethod -Method Put -Uri "$BASE_URL/tutor/availability" -ContentType "application/json" -Headers @{"Authorization" = "Bearer $TUTOR_TOKEN" } -Body '[{"day":"Monday","startTime":"09:00","endTime":"17:00"},{"day":"Wednesday","startTime":"09:00","endTime":"17:00"},{"day":"Friday","startTime":"09:00","endTime":"17:00"}]'
$TUTOR_AVAIL | ConvertTo-Json -Depth 3 | Select-Object -First 5
$TUTOR_AVAIL_PASS = if ($TUTOR_AVAIL.success) { 0 } else { 1 }
Print-Result $TUTOR_AVAIL_PASS "Set Tutor Availability"
Write-Host ""

# 4.3 Get updated tutor details
Write-Host "--- 4.3 GET /api/tutors/:id (After Profile Update) ---" -ForegroundColor Yellow
$UPDATED_TUTOR = Invoke-RestMethod -Method Get -Uri "$BASE_URL/tutors/$TUTOR_ID"
$UPDATED_TUTOR | ConvertTo-Json -Depth 3 | Select-Object -First 5
$UPDATED_TUTOR_PASS = if ($UPDATED_TUTOR.success) { 0 } else { 1 }
Print-Result $UPDATED_TUTOR_PASS "Get Updated Tutor Details"
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "5. REVIEW ENDPOINTS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 5.1 Create review
Write-Host "--- 5.1 POST /api/reviews ---" -ForegroundColor Yellow
$REVIEW_CREATE = Invoke-RestMethod -Method Post -Uri "$BASE_URL/reviews" -ContentType "application/json" -Headers @{"Authorization" = "Bearer $STUDENT_TOKEN" } -Body "{`"bookingId`":`"$BOOKING_ID`",`"rating`":5,`"comment`":`"Excellent tutor! Very helpful and patient.`"}"
$REVIEW_CREATE | ConvertTo-Json -Depth 3 | Select-Object -First 5
$REVIEW_CREATE_PASS = if ($REVIEW_CREATE.success) { 0 } else { 1 }
Print-Result $REVIEW_CREATE_PASS "Create Review"
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "6. ADMIN ENDPOINTS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 6.1 Get all users
Write-Host "--- 6.1 GET /api/admin/users ---" -ForegroundColor Yellow
$ADMIN_USERS = Invoke-RestMethod -Method Get -Uri "$BASE_URL/admin/users" -Headers @{"Authorization" = "Bearer $ADMIN_TOKEN" }
$ADMIN_USERS | ConvertTo-Json -Depth 3 | Select-Object -First 5
$ADMIN_USERS_PASS = if ($ADMIN_USERS.success) { 0 } else { 1 }
Print-Result $ADMIN_USERS_PASS "Get All Users"
Write-Host ""

# 6.2 Update user status (ban user)
Write-Host "--- 6.2 PATCH /api/admin/users/:id (Ban User) ---" -ForegroundColor Yellow
$USER_ID = $ADMIN_USERS.data.users[1].id
Write-Host "Using User ID: $USER_ID" -ForegroundColor Gray
$ADMIN_BAN = Invoke-RestMethod -Method Patch -Uri "$BASE_URL/admin/users/$USER_ID" -ContentType "application/json" -Headers @{"Authorization" = "Bearer $ADMIN_TOKEN" } -Body '{"status":"BANNED"}'
$ADMIN_BAN | ConvertTo-Json -Depth 3 | Select-Object -First 5
$ADMIN_BAN_PASS = if ($ADMIN_BAN.success) { 0 } else { 1 }
Print-Result $ADMIN_BAN_PASS "Ban User"
Write-Host ""

# 6.3 Unban user
Write-Host "--- 6.3 PATCH /api/admin/users/:id (Unban User) ---" -ForegroundColor Yellow
$ADMIN_UNBAN = Invoke-RestMethod -Method Patch -Uri "$BASE_URL/admin/users/$USER_ID" -ContentType "application/json" -Headers @{"Authorization" = "Bearer $ADMIN_TOKEN" } -Body '{"status":"ACTIVE"}'
$ADMIN_UNBAN | ConvertTo-Json -Depth 3 | Select-Object -First 5
$ADMIN_UNBAN_PASS = if ($ADMIN_UNBAN.success) { 0 } else { 1 }
Print-Result $ADMIN_UNBAN_PASS "Unban User"
Write-Host ""

# 6.4 Get all bookings (admin)
Write-Host "--- 6.4 GET /api/admin/bookings ---" -ForegroundColor Yellow
$ADMIN_BOOKINGS = Invoke-RestMethod -Method Get -Uri "$BASE_URL/admin/bookings" -Headers @{"Authorization" = "Bearer $ADMIN_TOKEN" }
$ADMIN_BOOKINGS | ConvertTo-Json -Depth 3 | Select-Object -First 5
$ADMIN_BOOKINGS_PASS = if ($ADMIN_BOOKINGS.success) { 0 } else { 1 }
Print-Result $ADMIN_BOOKINGS_PASS "Get All Bookings (Admin)"
Write-Host ""

# 6.5 Get all categories (admin)
Write-Host "--- 6.5 GET /api/admin/categories ---" -ForegroundColor Yellow
$ADMIN_CATEGORIES = Invoke-RestMethod -Method Get -Uri "$BASE_URL/admin/categories" -Headers @{"Authorization" = "Bearer $ADMIN_TOKEN" }
$ADMIN_CATEGORIES | ConvertTo-Json -Depth 3 | Select-Object -First 5
$ADMIN_CATEGORIES_PASS = if ($ADMIN_CATEGORIES.success) { 0 } else { 1 }
Print-Result $ADMIN_CATEGORIES_PASS "Get All Categories (Admin)"
Write-Host ""

# 6.6 Create category
Write-Host "--- 6.6 POST /api/admin/categories ---" -ForegroundColor Yellow
$ADMIN_CAT_CREATE = Invoke-RestMethod -Method Post -Uri "$BASE_URL/admin/categories" -ContentType "application/json" -Headers @{"Authorization" = "Bearer $ADMIN_TOKEN" } -Body '{"name":"Mathematics","description":"Mathematics tutoring and courses"}'
$ADMIN_CAT_CREATE | ConvertTo-Json -Depth 3 | Select-Object -First 5
$CATEGORY_ID = $ADMIN_CAT_CREATE.data.category.id
$ADMIN_CAT_CREATE_PASS = if ($ADMIN_CAT_CREATE.success) { 0 } else { 1 }
Print-Result $ADMIN_CAT_CREATE_PASS "Create Category"
Write-Host ""

# 6.7 Create another category
Write-Host "--- 6.7 POST /api/admin/categories (Physics) ---" -ForegroundColor Yellow
$ADMIN_CAT_CREATE2 = Invoke-RestMethod -Method Post -Uri "$BASE_URL/admin/categories" -ContentType "application/json" -Headers @{"Authorization" = "Bearer $ADMIN_TOKEN" } -Body '{"name":"Physics","description":"Physics tutoring and courses"}'
$ADMIN_CAT_CREATE2 | ConvertTo-Json -Depth 3 | Select-Object -First 5
$ADMIN_CAT_CREATE2_PASS = if ($ADMIN_CAT_CREATE2.success) { 0 } else { 1 }
Print-Result $ADMIN_CAT_CREATE2_PASS "Create Category (Physics)"
Write-Host ""

# 6.8 Get public categories
Write-Host "--- 6.8 GET /api/categories (After Creating) ---" -ForegroundColor Yellow
$FINAL_CATEGORIES = Invoke-RestMethod -Method Get -Uri "$BASE_URL/categories"
$FINAL_CATEGORIES | ConvertTo-Json -Depth 3 | Select-Object -First 5
$FINAL_CATEGORIES_PASS = if ($FINAL_CATEGORIES.success) { 0 } else { 1 }
Print-Result $FINAL_CATEGORIES_PASS "List Categories (After Creation)"
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "7. ERROR CASES" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 7.1 Invalid login
Write-Host "--- 7.1 POST /api/auth/login (Invalid credentials) ---" -ForegroundColor Yellow
try {
    $INVALID_LOGIN = Invoke-RestMethod -Method Post -Uri "$BASE_URL/auth/login" -ContentType "application/json" -Body '{"email":"invalid@test.com","password":"wrongpassword"}' -ErrorAction Stop
    $INVALID_LOGIN_PASS = 1
}
catch {
    $INVALID_LOGIN_PASS = 0
}
Print-Result $INVALID_LOGIN_PASS "Invalid Login (should fail)"
Write-Host ""

# 7.2 Access admin endpoint as student
Write-Host "--- 7.2 GET /api/admin/users (as Student - should fail) ---" -ForegroundColor Yellow
try {
    $UNAUTH_ADMIN = Invoke-RestMethod -Method Get -Uri "$BASE_URL/admin/users" -Headers @{"Authorization" = "Bearer $STUDENT_TOKEN" } -ErrorAction Stop
    $UNAUTH_ADMIN_PASS = 1
}
catch {
    $UNAUTH_ADMIN_PASS = 0
}
Print-Result $UNAUTH_ADMIN_PASS "Unauthorized Admin Access (should fail)"
Write-Host ""

# 7.3 Access tutor endpoint as student
Write-Host "--- 7.3 PUT /api/tutor/profile (as Student - should fail) ---" -ForegroundColor Yellow
try {
    $UNAUTH_TUTOR = Invoke-RestMethod -Method Put -Uri "$BASE_URL/tutor/profile" -ContentType "application/json" -Headers @{"Authorization" = "Bearer $STUDENT_TOKEN" } -Body '{"bio":"Hacked bio"}' -ErrorAction Stop
    $UNAUTH_TUTOR_PASS = 1
}
catch {
    $UNAUTH_TUTOR_PASS = 0
}
Print-Result $UNAUTH_TUTOR_PASS "Unauthorized Tutor Access (should fail)"
Write-Host ""

# 7.4 Duplicate registration
Write-Host "--- 7.4 POST /api/auth/register (Duplicate email) ---" -ForegroundColor Yellow
try {
    $DUP_REG = Invoke-RestMethod -Method Post -Uri "$BASE_URL/auth/register" -ContentType "application/json" -Body '{"email":"student@skillbridge.com","password":"student123","name":"Duplicate Student","role":"STUDENT"}' -ErrorAction Stop
    $DUP_REG_PASS = 1
}
catch {
    $DUP_REG_PASS = 0
}
Print-Result $DUP_REG_PASS "Duplicate Registration (should fail)"
Write-Host ""

# 7.5 Invalid booking data
Write-Host "--- 7.5 POST /api/bookings (Invalid data) ---" -ForegroundColor Yellow
try {
    $INVALID_BOOKING = Invoke-RestMethod -Method Post -Uri "$BASE_URL/bookings" -ContentType "application/json" -Headers @{"Authorization" = "Bearer $STUDENT_TOKEN" } -Body '{"tutorId":"invalid-id","subject":"","date":""}' -ErrorAction Stop
    $INVALID_BOOKING_PASS = 1
}
catch {
    $INVALID_BOOKING_PASS = 0
}
Print-Result $INVALID_BOOKING_PASS "Invalid Booking Data (should fail)"
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "All API endpoints have been tested." -ForegroundColor White
Write-Host "See individual test results above." -ForegroundColor White
Write-Host ""
Write-Host "Test completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
