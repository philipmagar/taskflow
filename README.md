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

---

## Project Structure

```text
taskflow-api/
│
├── src/
│   ├── config/
│   │   └── db.js            # MySQL connection pool
│   │
│   ├── controllers/         # Request/response logic
│   ├── services/            # Business logic layer
│   ├── models/              # Database queries layer
│   │   └── user.model.js
│   ├── routes/              # API route definitions
│   ├── middlewares/         # Custom middlewares
│   ├── utils/               # Helper utilities
│   │
│   ├── app.js               # Express app configuration
│   └── server.js            # Application entry point
│
├── .env                     # Environment variables
├── .gitignore               # Git ignore rules
├── package.json             # Project metadata and dependencies
└── README.md                # Project documentation
```
