const Razorpay = require("razorpay");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { ObjectId } = require('mongodb');

// Create Razorpay Order
const createOrder = async (req, res) => {

  // Initialize Razorpay instance
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  // console.log("Create Order");
  try {
    // console.log("try test");
    // console.log("req body ->",req.body);
    // console.log("req body ->",req.body);
    // console.log("req header ->",req.headers);
    // console.log("req user ->",req.user);
    const amount = req.body.amount;


    // get user id
    // const registrationId = new ObjectId().toString();
    // if (!registrationId || !amount) {
    //   return res.status(400).json({ error: "Missing required fields" });
    // }

    const registrationDetails = await prisma.formRegistration.findFirst({
      where: {
        userId: req.user.id,
        formId : req.body.formId
      }
    });

    console.log("registrationDetails ->",registrationDetails);


    console.log("Amount: ", amount);
    // Create an order in Razorpay
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paisa
      currency: "INR",
      receipt: `order_rcptid_${registrationDetails.id}`,
      payment_capture: 1,
    });

    console.log("line 39 passed");

    // Save order details in the database
    await prisma.payment.upsert({
      where: { registrationId: registrationDetails.id},
      update: {
        status: "PENDING",
        razorpayOrderId: order.id,
      },
      create: {
        registrationId: registrationDetails.id,
        status:
          "PENDING",
        razorpayOrderId: order.id,
        deadline: new Date(new Date().setDate(new Date().getDate() + 7)), // Example: 7-day deadline
      },
    });

    console.log("line 52 passed");

    return res.status(200).json({ orderId : order.id , registrationId: registrationDetails.id});

    // res.json({ success: true, message: "Order created successfully" });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};

// Verify Payment
const verifyPayment = async (req, res) => {
  try {

    console.log("req body ->",req.body);
    console.log("req header ->",req.headers);
    console.log("req user ->",req.user);

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
      where: { registrationId},
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
      where: { registrationId },
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
