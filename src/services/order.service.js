const pool = require("../config/db");
const AppError = require("../utils/appError");

exports.createOrder = async (userId, productId, quantity) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    
    if (quantity < 1) {
      throw new AppError("Quantity must be at least 1", 400);
    }

    // 🔴 LOCK PRODUCT ROW
    const [productRows] = await connection.query(
      "SELECT stock FROM products WHERE id = ? FOR UPDATE",
      [productId],
    );

    if (!productRows.length) {
      throw new AppError("Product not found", 404);
    }

    const product = productRows[0];

    // ❌ Not enough stock
    if (product.stock < quantity) {
      throw new AppError("Insufficient stock", 400);
    }

    // ✅ Deduct stock
    await connection.query(
      "UPDATE products SET stock = stock - ? WHERE id = ?",
      [quantity, productId],
    );

    // ✅ Create order
    const [orderResult] = await connection.query(
      "INSERT INTO orders (user_id, product_id, quantity) VALUES (?, ?, ?)",
      [userId, productId, quantity],
    );

    await connection.commit();

    return orderResult;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
