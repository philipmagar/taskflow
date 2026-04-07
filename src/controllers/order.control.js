const OrderService = require("../services/order.service");
const catchAsync = require("../utils/catchAsync");

exports.createOrder = catchAsync(async (req, res, next) => {
  const { productId, quantity } = req.body;

  const result = await OrderService.createOrder(
    req.user.id,
    productId,
    quantity,
  );

  res.status(201).json({
    status: "success",
    message: "Order created",
    orderId: result.insertId,
  });
});
