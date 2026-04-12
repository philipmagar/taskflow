const OrderService = require("../services/order.service");
const catchAsync = require("../utils/catchAsync");
const apiResponse = require("../utils/apiResponse");

exports.createOrder = catchAsync(async (req, res, next) => {
  const { productId, quantity } = req.body;

  const result = await OrderService.createOrder(
    req.user.id,
    productId,
    quantity,
  );

  apiResponse.success(res, "Order created", { orderId: result.insertId }, 201);
});
