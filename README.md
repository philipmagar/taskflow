##  Project Status
✅ Week 1 
Day 1: Backend foundation setup
- Node.js + Express installed
- Clean architecture folder structure
- Environment variables configured
- API versioning `/api/v1` working
Day 2: Database Integration
- MySQL setup (XAMPP)
- Database `taskflow_db` created
- Connection pooling using `mysql2`
- Database config separated in `config/db.js`
- Server starts only after successful DB connection

 Project Structure
taskflow-api/
│
├── src/
│ ├── config/
│ │ └── db.js # MySQL connection pool
│ │
│ ├── controllers/ # Request/response logic
│ ├── services/ # Business logic layer
│ ├── models/ # Database queries layer
│ ├── routes/ # API route definitions
│ ├── middlewares/ # Custom middlewares
│ ├── utils/ # Helper utilities
│ │
│ ├── app.js # Express app configuration
│ └── server.js # Application entry point
│
├── .env # Environment variables (not committed)
├── .gitignore
├── package.json
└── README.md