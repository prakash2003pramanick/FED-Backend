const Razorpay = require("razorpay");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const {ObjectId} = require('mongodb');
// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay Order
const createOrder = async (req, res) => {
  try {
    console.log(req.body);
    const { amount } = req.body;
    
    const registrationId = new ObjectId().toString();
    if (!registrationId || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

     

    // Create an order in Razorpay
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paisa
      currency: "INR",
      receipt: `order_rcptid_${registrationId}`,
      payment_capture: 1,
    });

    // Save order details in the database
    await prisma.payment.create({
      data: {
        registrationId,
        status: "PENDING",
        razorpayOrderId: order.id,
        deadline: new Date(new Date().setDate(new Date().getDate() + 7)), // Example: 7-day deadline
      },
    });

    res.json({ orderId: order.id });

    // res.json({ success: true, message: "Order created successfully" });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};

// Verify Payment
const verifyPayment = async (req, res) => {
  try {
    const {
      registrationId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Fetch order from DB
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
    });

    if (!payment) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    // Update payment status to COMPLETED
    await prisma.payment.update({
      where: { razorpayOrderId: razorpay_order_id },
      data: { status: "COMPLETED" },
    });

    // Update registration payment status
    await prisma.formRegistration.update({
      where: { id: registrationId },
      data: { paymentStatus: "COMPLETED" },
    });

    res.json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
};

// Handle Pay Later (Mark Payment as Pending)
const payLater = async (req, res) => {
  try {
    const { registrationId } = req.body;

    if (!registrationId) {
      return res.status(400).json({ error: "Missing registration ID" });
    }

    // Check if payment entry exists
    const existingPayment = await prisma.payment.findUnique({
      where: { registrationId },
    });

    if (!existingPayment) {
      await prisma.payment.create({
        data: {
          registrationId,
          status: "PENDING",
          deadline: new Date(new Date().setDate(new Date().getDate() + 7)), // Example: 7-day deadline
        },
      });
    }

    res.json({ success: true, message: "Marked as pay later" });
  } catch (error) {
    console.error("Error marking pay later:", error);
    res.status(500).json({ error: "Failed to process pay later request" });
  }
};

module.exports = { createOrder, verifyPayment, payLater };
