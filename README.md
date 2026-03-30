#  TaskFlow API

A robust, secure, and scalable Task Management API built with Node.js, Express, and MySQL. TaskFlow follows a Clean Architecture to provide a seamless experience for user authentication and task CRUD operations with advanced querying capabilities.

---

##  Key Features

- ** Secure Authentication**: JWT-based stateless authentication with password hashing (bcryptjs).
- ** RBAC (Role-Based Access Control)**: Restrict access to specific routes based on user roles (e.g., Admin only routes).
- ** Advanced Task Management**: Complete CRUD functionality with ownership protection.
- ** Powerful Query Engine**:
  - **Filtering**: Filter tasks by status (e.g., `?status=pending`).
  - **Sorting**: Multi-column sorting support (e.g., `?sort=-created_at`).
  - **Pagination**: Efficient data retrieval with `page` and `limit`.
- ** Enterprise Security**:
  - **Helmet**: Secure HTTP headers to prevent XSS and clickjacking.
  - **Rate Limiting**: Brute-force protection for all API endpoints.
  - **CORS**: Restricted origins for production security.
  - **Input Validation**: Strict validation using `express-validator`.
- ** Error Handling**: Centralized global error handling with custom `AppError` class and async wrappers.

---

##  Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (using `mysql2` connection pooling)
- **Validation**: Express Validator
- **Logging**: Morgan & Winston
- **Environment**: Dotenv

---

##  Installation & Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/philipmagar/taskflow.git
   cd taskflow-api
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root directory and add:

   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=taskflow_db
   JWT_SECRET=your_super_secret_key
   JWT_EXPIRES_IN=90d
   NODE_ENV=development
   ```

4. **Database Setup**:
   - Ensure MySQL is running (XAMPP/Docker).
   - Create a database named `taskflow_db`.
   - The tables will be synchronized based on the models (Users & Tasks).

5. **Run the server**:

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

---

##  API Endpoints (v1)

### Auth & Users

| Method | Endpoint                | Description                   |
| :----- | :---------------------- | :---------------------------- |
| POST   | `/api/v1/auth/register` | Register a new user           |
| POST   | `/api/v1/auth/login`    | Login and receive JWT         |
| POST   | `/api/v1/users`         | Admin: Create a user manually |

### Tasks (Protected)

| Method | Endpoint                   | Description                                    |
| :----- | :------------------------- | :--------------------------------------------- |
| GET    | `/api/v1/tasks`            | Get all user tasks (supports sort/filter/page) |
| POST   | `/api/v1/tasks`            | Create a new task                              |
| GET    | `/api/v1/tasks/:id`        | Get single task details                        |
| PATCH  | `/api/v1/tasks/:id`        | Update task title/description                  |
| PATCH  | `/api/v1/tasks/:id/status` | Update task status specifically                |
| DELETE | `/api/v1/tasks/:id`        | Delete a task                                  |

---

##  Project Structure

```text
taskflow-api/
├── src/
│   ├── config/          # Database & app configurations
│   ├── controllers/     # Request handling logic
│   ├── middlewares/     # Auth, Validation, Error middlewares
│   ├── models/          # MySQL database queries
│   ├── routes/          # API endpoint definitions
│   ├── utils/           # Shared utilities (AppError, catchAsync)
│   ├── validators/      # Schema-based validations
│   ├── app.js           # App configuration
│   └── server.js        # Entry point
├── .env                 # Environment variables
└── package.json         # Dependencies & Scripts
```

---

##  Development Timeline

#### Day 1: Backend Foundation Setup

- Node.js + Express installed
- Clean architecture folder structure
- Environment variables configured
- API versioning (`/api/v1`) working

#### Day 2: Database Integration

- MySQL setup (XAMPP)
- Database `taskflow_db` created
- Connection pooling using `mysql2`
- Database config separated in `config/db.js`
- Server starts only after successful DB connection

#### Day 3: Create Users Table

- Designing a proper users table
- Applying database constraints
- Understanding `UNIQUE` and `ENUM`
- Creating the User Model
- Connecting application logic to MySQL

#### Day 4: Create Controllers and Models

- Implement `POST /api/v1/users` endpoint
- Add User model with `create` and `findByEmail` methods
- Connect to MySQL database using connection pooling

#### Day 5: Input Validation (Joi)

- Valid email format
- Minimum password length
- Restricted role values
- Clean separation of concerns using middleware

#### Day 6: User Authentication & Error Handling

- Implemented centralized error handling with `AppError` class
- Added async wrapper (`catchAsync`)
- Added Nodemon for development
- Tested responses in Thunder Client

#### Day 7: Input Validation with Express Validator

- Switched from Joi to `express-validator`
- Integrated validation error responses with `AppError`
- Created reusable validation middleware

#### Day 8: Debugging and Request Logging

- Add request logging with `morgan`
- Handle unhandled crashes
- Improve error visibility

#### Day 9-11: Auth & Role Based Access Control (RBAC)

- Secure password hashing with bcryptjs
- Stateless JWT authentication
- Implemented `protect` and `restrictTo` middlewares
- Admin-only route testing

#### Day 12-16: Task CRUD System

- Designed tasks table with foreign key relationship
- Implemented Task Model and Controller
- Added ownership authorization checks
- Completed Create, Read (Single/All), Update, and Delete operations

#### Day 17-21: Advanced Querying & Filtering

- Added query filtering by status
- Implemented multi-column sorting (`?sort=-created_at`)
- Added pagination support (`?page=1&limit=10`)
- Built a unified dynamic query engine
- Added specialized `PATCH /tasks/:id/status` endpoint

#### Day 22-23: Security Hardening

- Installed and configured `helmet` for HTTP headers
- Added `express-rate-limit` for DDoS/Brute-force protection
- Configured CORS and request body size limits

#### Day 24: Centralized Logging with Winston

- Integrated `winston` for systematic application logging
- Created a custom logger utility (`src/utils/logger.js`)
- Configured log rotation for errors (`error.log`) and combined logs (`combined.log`)
- Replaced basic `console.error` with `logger.error` in global error handler
- Added colorized console output for development environment

#### Day 25: Custom Request Logging Middleware

- Implemented a custom request logging middleware using the `winston` logger.
- Captured essential request details including HTTP method, URL, status code, duration, IP address, and user identity.
- Integrated the custom logger into the application's top-level middleware stack for comprehensive traffic visibility.
- Replaced basic logging with detailed, structured logs for better monitoring and debugging.

#### Day 26: Security Tracking and Brute-force Protection

- Implemented an IP-based security tracker (`src/utils/securityTrack.js`) to record failed login attempts.
- Added logic to block access for 15 minutes after 5 failed attempts from the same IP address.
- Refactored login controller to use the new tracker and improved security by removing sensitive information from logs.
- Integrated `isBlocked` middleware-like logic for enhanced brute-force defense.


#### Day 27: Sorting, Pagination, and Request Hardening

- Added a sorting whitelist and dynamic ORDER BY logic to the Task model.
- Implemented pagination limits to prevent database overloading.
- Integrated `helmet` middleware for essential HTTP security headers.
- Enhanced input validation and sanitization using `express-validator`.
- Verified security against unauthorized role escalation during registration.

#### Day 28: Security Hardening & API Consistency

- Installed and configured `hpp` (HTTP Parameter Pollution) middleware for protection against multi-parameter attacks.
- Secured production error responses to strictly prevent leaking internal stack traces or database details.
- Standardized API response formats with a consistent `status`, `message`, and `data` structure.
- Strengthened input validation for tasks with dedicated `express-validator` schemas.
- Implemented robust mass assignment prevention using object filtering in the Task controller.
- Refactored validation middleware into a reusable handler to improve code modularity.

#### Day 29: Input Security & Suspicious Activity Detection

- Developed a central `securityDetector` utility to scan inputs for common attack patterns (XSS, SQL Injection).
- Implemented `securityMiddleware` to automatically scan `req.body` and `req.query` for all incoming requests.
- Integrated structured logging for suspicious activities using the `winston` logger.
- Configured the API to block requests containing malicious payloads with a 400 Bad Request response.

#### Day 30: Automated IP Blocking & Suspicious Activity Tracking

- Refactored `securityTrack.js` for reliable IP-based event recording and 15-minute temporary blocks.
- Updated `securityMiddleware` to automatically track suspicious inputs (XSS/SQLi) towards IP blocking.
- Standardized 403 Forbidden responses for blocked IPs with descriptive messaging.
- Enhanced security logging to include attempt counts and specific block reasons for better auditability.

---

## License

This project is licensed under the **ISC License**.
