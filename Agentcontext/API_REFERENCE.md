# VMS API Reference

> Complete API documentation for the Smart Campus Visitor Management System.
> Swagger UI available at: `/api/docs`

---

## 1. POST `/api/visitors/register`
**Register a new visitor and get QR pass + OTP.**

**Request:**
```json
{
  "fullName": "Rahul Verma",
  "email": "rahul@gmail.com",
  "phone": "+91-9123456780",
  "hostId": "uuid-of-host",
  "purpose": "Project Discussion",
  "scheduledAt": "2026-04-20T10:00:00.000Z",
  "expectedDuration": 120
}
```

**Response (201):**
```json
{
  "visitId": "uuid",
  "visitorId": "uuid",
  "qrToken": "uuid",
  "otp": "482913",
  "scheduledAt": "...",
  "expectedOut": "...",
  "hostName": "Dr. Rajesh Sharma",
  "status": "PENDING"
}
```

**Errors:** 403 (blacklisted), 409 (active visit exists), 422 (validation)

**Side effects:**
- Creates Visitor record (if not exists)
- Creates Visit record
- Stores OTP in Redis (5min TTL)
- Writes AuditLog
- Sends OTP via Gmail (async)

---

## 2. POST `/api/visits/checkin`
**Check-in via QR token (UUID) or OTP (6 digits).**

**Request:**
```json
{
  "token": "uuid-or-6-digit-otp"
}
```

**Response (200):**
```json
{
  "visitId": "uuid",
  "visitorName": "Rahul Verma",
  "hostName": "Dr. Rajesh Sharma",
  "hostDepartment": "Computer Science",
  "checkedInAt": "...",
  "expectedOut": "...",
  "status": "CHECKED_IN"
}
```

**Errors:** 403 (blacklisted), 404 (not found), 409 (already checked in), 400 (outside schedule)

---

## 3. POST `/api/visits/checkout`
**Check-out visitor and calculate duration.**

**Request:**
```json
{
  "visitId": "uuid"
}
```

**Response (200):**
```json
{
  "visitId": "uuid",
  "visitorName": "Rahul Verma",
  "hostName": "Dr. Rajesh Sharma",
  "duration": "2h 30m",
  "checkedOutAt": "...",
  "message": "Thank you for visiting, Rahul Verma! Visit duration: 2h 30m."
}
```

---

## 4. GET `/api/visits/active`
**List all currently active (checked-in) visitors.**

**Response (200):**
```json
{
  "activeVisitors": [
    {
      "visitId": "...",
      "visitorName": "...",
      "hostName": "...",
      "checkedInAt": "...",
      "expectedOut": "...",
      "isOverstayed": false
    }
  ],
  "count": 1
}
```

---

## 5. GET `/api/visitors/[id]/pass`
**Get QR pass data for a visit. `id` = visitId.**

**Response (200):**
```json
{
  "visitId": "...",
  "qrToken": "...",
  "qrDataUrl": "data:image/png;base64,...",
  "otp": "482913",
  "otpExpired": false,
  "status": "PENDING",
  "visitorName": "...",
  "hostName": "...",
  "purpose": "...",
  "scheduledAt": "..."
}
```

---

## 6. GET `/api/visitors/[id]/history`
**Paginated visit history. `id` = visitorId.**

**Query params:** `?page=1&limit=10&status=CHECKED_OUT`

**Response (200):**
```json
{
  "visitor": { "id": "...", "fullName": "...", "email": "..." },
  "visits": [...],
  "pagination": { "page": 1, "limit": 10, "total": 5, "totalPages": 1 }
}
```

---

## 7. POST `/api/visitors/[id]/regenerate-otp`
**Regenerate expired OTP. `id` = visitId.**

**Response (200):**
```json
{
  "otp": "591823",
  "message": "OTP regenerated successfully. Valid for 5 minutes."
}
```

---

## 8. POST `/api/blacklist`
**Blacklist a visitor.**

**Request:**
```json
{
  "visitorId": "uuid",
  "reason": "Unauthorized access attempt",
  "addedBy": "security-admin",
  "expiresAt": "2026-12-31T23:59:59Z"  // optional
}
```

---

## 9. GET `/api/health`
**System health check.**

**Response (200):**
```json
{
  "status": "ok",
  "dbConnected": true,
  "redisConnected": true,
  "timestamp": "...",
  "activeVisitorCount": 0,
  "version": "1.0.0"
}
```

---

## 10. GET `/api/hosts`
**List all campus hosts.**

**Response (200):**
```json
{
  "hosts": [
    {
      "id": "uuid",
      "name": "Dr. Rajesh Sharma",
      "department": "Computer Science",
      "email": "dr.sharma@campus.edu",
      "phone": "+91-9876543210"
    }
  ]
}
```

---

## 11. GET `/api/cron/overstay`
**Overstay detection (called by scheduler).**

**Response (200):**
```json
{
  "updated": 2,
  "visitors": [
    { "visitId": "...", "visitorName": "...", "expectedOut": "..." }
  ]
}
```
