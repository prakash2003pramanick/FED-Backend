const { PrismaClient, AccessTypes } = require('@prisma/client');
const prisma = new PrismaClient();
const expressAsyncHandler = require('express-async-handler');
const { ApiError } = require('../../../utils/error/ApiError');
const deleteImage = require('../../../utils/image/deleteImage');
const uploadImage = require('../../../utils/image/uploadImage');
const fs = require('fs');
const path = require('path');
const updateUser = require('../../../utils/user/updateUser');

// @description     Update User Details
// @route           PUT /api/user/update
// @access          Members
const editProfile = expressAsyncHandler(async (req, res, next) => {
    const { email, password, access, github, linkedin, extra, ...rest } = req.body;

    try {

        let updatedExtra = req.user? req.user.extra: null;
        if (extra) {
            const { github, linkedin } = extra;
            // Update member object with new values
            if (github) updatedExtra.github = github;
            if (linkedin) updatedExtra.linkedin = linkedin;
        }
        rest.extra = updatedExtra

        // Update the user details
        const updatedUser = await updateUser({email : req.user.email}, rest)

        // Remove sensitive information from updatedUser
        delete updatedUser.password;

        console.log("Updated user:", updatedUser);

        res.status(200).json({ message: 'User updated successfully', data: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);

        // Handle specific Prisma errors
        if (error.code === 'P2002') {
            return next(new ApiError(400, 'Invalid request format', error));
        }

        // Handle other errors
        next(new ApiError(500, 'Error updating user', error));
    }
});

module.exports = { editProfile };
