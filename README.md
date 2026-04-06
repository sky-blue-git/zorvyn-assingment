# Finance Data Processing & Access Control Backend

A robust, production-ready backend built with Node.js, Express, and MongoDB. This system provides APIs for robust User Management, role-based access control (RBAC), financial record CRUD operations, and high-performance Dashboard analytical aggregations.

## 🚀 System Architecture & Stack

- **Runtime & Framework**: Node.js, Express.js 5.x
- **Database**: MongoDB (via Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs (password hashing)
- **Validation**: Zod (Rigorous payload, query, and parameter checks)
- **Security**: express-rate-limit

## 📦 Setup & Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Duplicate the `.env.example` file and rename it to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your actual `MONGO_URI` and a secure `JWT_SECRET`. **The application will fast-fail on boot if these are missing.**

3. **Start the Server**
   ```bash
   npm run dev  # Starts the server with nodemon (development mode)
   # OR
   npm start    # Starts the server using Node (production mode)
   ```

## ⚠️ Database Seeding (Destructive)

To quickly initialize the system with default test users and mock financial records, run the seeding script:

> **WARNING:** Running the seed script will completely wipe your local `users` and `records` collections!

```bash
npm run seed
```

**Seed Credentials (Password is `password123` for all):**
- `admin@test.com` (Admin Role)
- `analyst@test.com` (Analyst Role)
- `viewer@test.com` (Viewer Role)

## 🔐 Role Matrix (RBAC)

| Resource/Action | Viewer     | Analyst       | Admin         |
| --------------- | ---------- | ------------- | ------------- |
| View Dashboard  | GET ✅     | GET ✅        | GET ✅        |
| View Records    | ❌ Denied  | GET ✅        | GET ✅        |
| Modify Records  | ❌ Denied  | ❌ Denied     | POST/PUT/DEL ✅|
| User Mgmt APIs  | ❌ Denied  | ❌ Denied     | GET/PUT ✅    |

> **Note**: Self-registration via `/api/auth/register` prevents privilege escalation by securely hardcoding all new users as `Viewer`. 

## 🌐 Selected API Endpoints Documentation

### Auth Validation
**`POST /api/auth/register`**
Expects: `{ name, email, password }`. All passwords must be >= 6 chars.

**`POST /api/auth/login`**
Return format:
```json
{
  "_id": "60d0fe4f5311236168a109ca",
  "name": "Admin User",
  "email": "admin@test.com",
  "role": "Admin",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```
*Note: Protected by rate-limiting (Max 5 attempts / 15 min).*

### Finance Operations
All operations require `Authorization: Bearer <token>`.

**`GET /api/records`**
Supports advanced filtering via Zod-validated query strings:
- `/api/records?type=income&limit=20&page=1`
- `/api/records?startDate=2024-01-01&endDate=2024-12-31`
- *Returns*: `{ total, page, limit, totalPages, data: [...] }`

**`DELETE /api/records/:id`**
Performs a **soft delete** (`isDeleted: true`), preserving historical auditing data for aggregations.

### Analytical Dashboard
**`GET /api/dashboard/summary`**
Runs concurrent MongoDB aggregation pipelines to efficiently return:
1. `totalIncome`, `totalExpenses`, `netBalance`
2. `incomeByCategory` and `expensesByCategory` 
3. `recentActivity` (Last 5 transactions)
4. `monthlyTrends` (Grouped chronological insights over time)

## 🧠 Architectural Assertions & Assumptions made

1. **Single-Organization Tenancy**: Due to the separation between Analyst and Viewer roles within a "Finance Dashboard", it's assumed this represents an internal company dashboard. Therefore, dashboard analytics sum **all** records created company-wide, rather than individually segregating records per-user space.
2. **Error Boundary Wrapping**: `errorHandler.js` is globally injected to catch internal Node exceptions, Mongoose CastErrors (bad URL ids), and Zod syntax errors—converting all unhandled stack traces into standardized HTTP 400 or 500 JSON payloads for proper REST compliance.
3. **Database Scalability**: The `Record` pipeline injects multi-key compound indexes (such as `{ createdBy: 1, date: -1 }`) ensuring sub-millisecond retrieval speeds regardless of dashboard scale.
