const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const expressAsyncHandler = require('express-async-handler');
const { ApiError } = require('../../../utils/error/ApiError');
const createOrUpdateUser = require('../../../utils/user/createOrUpdateUser');
const deleteImage = require('../../../utils/image/deleteImage');
const uploadImage = require('../../../utils/image/uploadImage');

// @description     Update User Details
// @route           PUT /api/user/addMember
// @access          Admin
const addMember = expressAsyncHandler(async (req, res, next) => {
    console.log("add member controller called");

    try {
        // Validate request
        if (!req.body.email || !req.body.access) {
            return next(new ApiError(400, "Email and access are required"));
        }

        // Handle CSV or non-CSV inputs for email and name
        const emails = req.body.email.includes(',') ? req.body.email.split(',') : [req.body.email];
        const names = req.body.name ? (req.body.name.includes(',') ? req.body.name.split(',') : [req.body.name]) : [];

        const accessType = req.body.access.toUpperCase().replace(/\s+/g, '_');
        console.log("req.access is ", accessType);

        // Initialize an array to hold the results for all users
        const updatedUsers = [];

        for (let i = 0; i < emails.length; i++) {
            const email = emails[i].trim();
            const name = names[i] ? names[i].trim() : undefined;
            let { password, ...rest } = req.body;

            // Attach access type and name (if provided) to the rest object
            rest.access = accessType;
            if (name) {
                rest.name = name;
            }

            // Handle image upload if a file is provided
            if (req.file?.path) {
                if (req.user.img) {
                    try {
                        await deleteImage(req.user.img, 'MemberImages');
                    } catch (error) {
                        console.log("Error deleting image", error);
                    }
                }

                const result = await uploadImage(req.file.path, 'MemberImages');
                console.log("result from cloudinary: ", result);

                if (result) {
                    rest.img = result.secure_url;
                }
            }

            // Parse extra JSON if provided
            try {
                rest.extra = req.body.extra ? JSON.parse(req.body.extra) : {};
            } catch (error) {
                console.error('Error parsing JSON:', error);
                return next(new ApiError(400, 'Invalid JSON format in request body', error));
            }

            // Create or update the user
            try {
                const updatedUser = await createOrUpdateUser({ email: email }, rest);
                delete updatedUser.password; // Remove password from the response
                updatedUsers.push(updatedUser);
            } catch (error) {
                console.error('Error updating user:', error);

                // Handle specific Prisma errors
                if (error.code === 'P2002') {
                    return next(new ApiError(400, 'Invalid request format', error));
                }
                return next(new ApiError(500, 'Error updating user', error));
            }
        }

        // Return the response for all updated users
        res.status(200).json({ message: 'Users updated successfully', users: updatedUsers });
    } catch (error) {
        console.error('Error updating user:', error);
        next(new ApiError(500, 'Internal Server Error', error));
    }
});

module.exports = { addMember };
