require('dotenv').config();
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const jsonParseErrorHandler = require('./middleware/jsonParseErrorHandler');
const cors = require("cors");
const errorHandler = require('./middleware/errorHandler');
const logRequestBody = require('./middleware/requestLog');
const { sendMail } = require('./utils/email/nodeMailer');
const deleteImage = require('./utils/image/deleteImage');

const app = express();

const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// Use body-parser to parse JSON
app.use(bodyParser.json());

// Log the request if enabled
if (process.env.LOG_REQ === "true") {
    app.use(logRequestBody);
}

// Routes
app.use('/api', require('./routes/api/index'));

// Custom JSON parse error handler - should be after the body parsers
app.use(jsonParseErrorHandler);

// Error-handling middleware - should be at the end
app.use(errorHandler);

const { imageUpload, excelUpload } = require('./middleware/upload');
const { addMembersThroughExcel } = require('./controllers/userController/userController');

// Route for uploading images
app.post('/user/editImage', imageUpload.single('file'), (req, res) => {
    res.status(200).json({ message: 'Image uploaded successfully', file: req.file });
});

// Route for uploading Excel files
app.post('/user/addMemberExcel', excelUpload.single('file'), addMembersThroughExcel);

// Example routes for sending mail and deleting images
app.post('/mail', (req, res) => {
    const otp = 1234;
    const content = `<p>OTP is ${otp}</p>`;
    const { email, subject } = req.body;
    sendMail(email, subject, content);
    res.json("Email sent successfully!");
});

app.delete('/deleteImage', async (req, res) => {
    const image_url = req.body.url;
    const result = await deleteImage(image_url);
    res.json(result);
});

// Start server
app.listen(PORT, () => {
    console.log(`FED-Backend listening to PORT -> ${PORT}`);
});
