const { PrismaClient, AccessTypes } = require('@prisma/client');
const prisma = new PrismaClient();
const expressAsyncHandler = require('express-async-handler');
const { ApiError } = require('../../../utils/error/ApiError');
const deleteImage = require('../../../utils/image/deleteImage');
const uploadImage = require('../../../utils/image/uploadImage');
const fs = require('fs');
const path = require('path');
const createOrUpdateUser = require('../../../utils/user/createOrUpdateUser');

// @description     Update User Details
// @route           PUT /api/user/update
// @access          Members
const updateUser = expressAsyncHandler(async (req, res, next) => {
    const { email, password, access, extra, ...rest } = req.body;

    try {

        let updatedMember = currentUser.extra ? { ...currentUser.extra } : {};

        if (extra) {
            const { github, linkedin, img } = extra;

            // Update member object with new values
            if (github) updatedMember.github = github;
            if (linkedin) updatedMember.linkedin = linkedin;

            // Check if request contains a file -> seperate route to be created 
            // if (req.file) {
            //     const newFilePath = req.file.path;

            //     // Delete existing image if img exists in the member object
            //     if (updatedMember.img) {
            //         await deleteImage(updatedMember.img);
            //     }

            //     // Upload new image
            //     const uploadedImage = await uploadImage(newFilePath);

            //     // Update img with the new image URL
            //     updatedMember.img = uploadedImage.secure_url;
            // } else if (img) {
            //     updatedMember.img = img;
            // }
        }

        // Update the user details
        const updatedUser = await createOrUpdateUser({email : email}, rest, {access : req.user.access})

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

module.exports = { updateUser };
