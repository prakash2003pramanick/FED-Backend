const express = require("express");
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  payLater,
} = require("../../../controllers/payment/paymentController");

// Create Razorpay Order
router.post("/create-order", createOrder);

// Verify Payment
router.post("/verify", verifyPayment);

// Pay Later (Mark as Pending)
router.post("/pay-later", payLater);

module.exports = router;
