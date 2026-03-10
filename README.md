# TaskFlow API

## Project Status

### ✅ Week 1

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

#### Day 4:create controllers and models

- Implement POST /api/v1/users endpoint.
- Add User model with create and findByEmail methods.
- Connect to MySQL database using connection pooling.
- Add debugging logs to monitor requests.

#### Day 5:Input validation(use joi)

- Valid email format
- Minimum password length
- Restricted role values
- Clean separation of concerns using middleware

#### Day 6: User Authentication & Error Handling

- Removed try/catch duplication in controllers
- Implemented centralized error handling with a custom AppError class
- Added an async wrapper (catchAsync) to handle promise rejections
- Added Nodemon for auto-restarting server during development
- Tested structured error responses in Thunder Client

#### Day 7: Input Validation with Express Validator

- Switched from Joi to `express-validator` for more seamless validation within Express
- Integrated validation error responses with the centralized `AppError` class
- Created a reusable validation middleware for route-level validation
- Enhanced error reporting to provide specific feedback for invalid fields

#### Day 8: Debugging and request logging (morgan)
- Add request logging
- catch unhandled crashes
- improve error visibility
- learn to debug
#### Day 9: Authentication and Role Based Access Control (RBAC)
- secure password hashing
- stateless authentication
- Role-based access control
- protected API endpoints 
#### Day 10 : Login(JWT authentication and debugging )
- Login Endpoint
- Env varaibles seetup
- password Hashing 
#### Day 11 :
- Automatic role assignment 
- Admin only route testing 
- JWT verification testing 
- Hide password 
#### Day 12: Task Creation System

- Designed tasks table with foreign key relationship to users
- Implemented Task Model with parameterized queries
- Created Task Controller for task creation
- Added protected route to allow only authenticated users to create tasks
- Connected tasks to users using JWT authentication

#### Day 13 – Task Retrieval

- Implemented GET /tasks endpoint
- Users can retrieve only their own tasks
- Added filtering using user_id
- Secured endpoint with JWT authentication

##### Day 14 – Update Task Endpoint

- Implemented PATCH /tasks/:id
- Added authorization check to ensure users update only their own tasks
- Added task lookup before update
- Implemented safe update logic with fallback values
##### Day 15 – Delete Task Endpoint

- Implemented DELETE /tasks/:id
- Added authorization check to ensure users delete only their own tasks
- Added task existence check before deletion
- Completed CRUD operations for Task API
-------
## Project Structure

```text
taskflow-api/
│
├── src/
│   ├── config/
│   │   └── db.js            # MySQL connection pool
│   ├── controllers/# Request/response logic
|   |    ├── user.controller.js
|   |    └── auth.controller.js
│   ├── services/            # Business logic layer
│   ├── models/              # Database queries layer
|   |   ├── user.model.js
│   │   └── task.model.js
│   ├── routes/              # API route definitions
|   |    └── user.routes.js
│   ├── middlewares/         # Custom middlewares
│   │   ├── error.middleware.js
│   │   ├──validation.middleware.js
|   |   ├──auth.middleware.js
|   |   └──validate.middleware.js
│   ├── utils/               # Helper utilities
│   │   ├── appError.js
│   │   └── catchAsync.js
│   ├── validators/          # validate user
│   │   └── user.validator.js
│   ├── app.js               # Express app configuration
│   └── server.js            # Application entry point
│
├── .env                     # Environment variables
├── .gitignore               # Git ignore rules
├── package.json             # Project metadata and dependencies
└── README.md                # Project documentation
```
