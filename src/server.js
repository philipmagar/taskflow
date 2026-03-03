require("dotenv").config();

const app = require("./app");
const pool = require("./config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try{
    process.on("uncaughtException", (err) => {
    console.error("uncaught error", err);
    process.exit(1);
  });
    const connection = await pool.getConnection();
    console.log("Database connection established successfully");
    connection.release();
  
  app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
  
  });
  process.on("unhandledRejection", (err) => {
  console.error("rejected error", err);
  process.exit(1);
});

}catch(error){
  console.error("Error connecting to the database:", error);
  process.exit(1);
}
}
startServer();