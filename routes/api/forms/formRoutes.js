const express = require("express");
const router = express.Router();
const formController = require('../../../controllers/forms/formController')
const registrationController = require('../../../controllers/registration/registrationController');
const { getTeamDetails } = require('../../../controllers/registration/getTeamDetails');
const { verifyToken } = require('../../../middleware/verifyToken');
const { checkAccess } = require('../../../middleware/access/checkAccess');
const multer = require('multer');
const { imageUpload } = require('../../../middleware/upload');
const upload = multer();

// Add validations
// Define your form routes here

router.get('/getAllForms', formController.getAllForms)
router.post('/contact', formController.contact);

router.use(verifyToken);

// Test route to verify authentication is working
router.get("/test-auth", (req, res) => {
    console.log("=== Test auth route hit ===");
    console.log("Request user:", req.user);
    res.json({ 
        success: true, 
        message: "Authentication working", 
        user: req.user 
    });
});

// Debug route to see what's happening
router.get("/debug-routes", (req, res) => {
    console.log("=== Debug routes hit ===");
    console.log("Request method:", req.method);
    console.log("Request URL:", req.url);
    console.log("Request original URL:", req.originalUrl);
    console.log("Request params:", req.params);
    console.log("Request user:", req.user);
    res.json({ 
        success: true, 
        message: "Debug route hit",
        method: req.method,
        url: req.url,
        originalUrl: req.originalUrl,
        params: req.params,
        user: req.user
    });
});

router.get(
    "/teamDetails/:formId",
    checkAccess('USER'),
    getTeamDetails
);

router.use('/register', 
    checkAccess('USER'), 
    imageUpload.any(), 
    registrationController.addRegistration
);

router.get(
    "/getFormAnalytics/:id",
    formController.analytics
)

// router.get(
//   "/registrationCount",
//   checkAccess("MEMBER"),
//   registrationController.getRegistrationCount
// );

// router.get(
//     "/formAnalytics/:id",
//     formController.analytics
// )

// Add middleware verifyToken, isAdmin
router.use(checkAccess("ADMIN"));

router.post(
    "/addForm",
    imageUpload.fields([
        { name: "eventImg", maxCount: 1 },
        { name: "media", maxCount: 1 },
    ]),
    formController.addForm
);
router.delete("/deleteForm/:id", formController.deleteForm);
router.put(
    "/editForm/:id",
    imageUpload.fields([
        { name: "eventImg", maxCount: 1 },
        { name: "media", maxCount: 1 },
    ]),
    formController.editForm
);

router.get("/download/:id", registrationController.downloadRegistration);

module.exports = router;
