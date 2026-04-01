require("dotenv").config();

const app = require("./app");
const pool = require("./config/db");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    process.on("uncaughtException", (err) => {
      logger.error("Uncaught Exception! Shutting down...", { error: err.message, stack: err.stack });
      process.exit(1);
    });

    const connection = await pool.getConnection();
    logger.info("Database connection established successfully");
    connection.release();

    app.listen(PORT, async () => {
      logger.info(`Server is running on port ${PORT}`);
    });

    process.on("unhandledRejection", (err) => {
      logger.error("Unhandled Rejection! Shutting down...", { error: err.message, stack: err.stack });
      process.exit(1);
    });
  } catch (error) {
    logger.error("Error connecting to the database:", { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

startServer();