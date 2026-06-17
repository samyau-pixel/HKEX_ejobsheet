# API Contract: Authentication Endpoints

**Phase**: 1 (Design) | **Version**: 1.0.0 | **Date**: 2026-06-17

Base URL: `http://localhost:3001/api`

Authentication method: JWT Bearer token in Authorization header.

---

## POST /auth/login

Register an existing user and receive a JWT token.

**Request**:
```json
{
  "email": "operator@company.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "status": 200,
  "data": {
    "user": {
      "id": "user-001",
      "email": "operator@company.com",
      "name": "John Operator",
      "role": "Operator"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "1h"
  },
  "message": "Login successful"
}
```

**Response** (401 Unauthorized - invalid credentials):
```json
{
  "status": 401,
  "code": "INVALID_CREDENTIALS",
  "message": "Email or password is incorrect",
  "requestId": "uuid-correlation-id"
}
```

**Response** (422 Unprocessable Entity - validation error):
```json
{
  "status": 422,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    { "field": "email", "error": "Invalid email format" },
    { "field": "password", "error": "Password is required" }
  ],
  "requestId": "uuid-correlation-id"
}
```

---

## POST /auth/logout

Invalidate the current JWT token (optional; tokens are stateless and expire).

**Request**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "status": 200,
  "message": "Logged out successfully"
}
```

---

## POST /auth/refresh

Exchange an expired access token for a new one using a refresh token (optional for MVP).

**Request**:
```json
{
  "refreshToken": "long-lived-refresh-token"
}
```

**Response** (200 OK):
```json
{
  "status": 200,
  "data": {
    "token": "new-jwt-token",
    "expiresIn": "1h"
  },
  "message": "Token refreshed"
}
```

---

## Token Format (JWT)

**Payload**:
```json
{
  "userId": "user-001",
  "email": "operator@company.com",
  "name": "John Operator",
  "role": "Operator",
  "iat": 1718618445,
  "exp": 1718622045
}
```

**Algorithm**: HS256 (HMAC with SHA-256)  
**Secret**: Environment variable `JWT_SECRET` (must be >32 chars in production)  
**Expiry**: 1 hour for access token, 7 days for refresh token (optional)

---

## Authorization Header

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

**Response** (401 Unauthorized - missing/invalid token):
```json
{
  "status": 401,
  "code": "UNAUTHORIZED",
  "message": "Missing or invalid authorization token",
  "requestId": "uuid-correlation-id"
}
```

---

## Role-Based Access Control (RBAC)

Roles and their permissions:

| Permission | Manager | Operator Leader | Operator |
|------------|---------|-----------------|----------|
| Create Jobsheet Template | ✅ | ✅ | ✅ |
| View Pending Templates | ✅ | ✅ | ❌ (own only) |
| Approve Template | ✅ | ❌ | ❌ |
| Create Execution Jobsheet | ✅ | ✅ | ✅ |
| Check-In Execution Sheet | ✅ | ✅ | ✅ |
| Mark Job Complete | ✅ | ✅ | ✅ |
| Check-Out Execution Sheet | ✅ | ✅ | ✅ |
| View Completed Jobsheets | ✅ | ✅ | ❌ |
| Generate Reports | ✅ | ✅ | ❌ |

**Response** (403 Forbidden - insufficient permission):
```json
{
  "status": 403,
  "code": "FORBIDDEN",
  "message": "Insufficient permission. This action requires Manager role",
  "requestId": "uuid-correlation-id"
}
```

---

**Contract Version**: 1.0.0 | **Status**: Complete
