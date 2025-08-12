const { ApiError } = require('../../utils/error/ApiError');
const { PrismaClient, AccessTypes } = require("@prisma/client");
const prisma = new PrismaClient();

const checkAccess = (...requiredAccess) => { 
    return async (req, res, next) => {
        try {
            console.log("=== checkAccess middleware called ===");
            console.log("Required access:", requiredAccess);
            console.log("Request user:", req.user);
            console.log("User access:", req.user?.access);
            
            let user;
            if (req.user) {
                user = req.user;
            } else {
                const { email } = req.body;

                if (!email) {
                    throw new ApiError(400, "Email is required");
                }

                user = await prisma.user.findUnique({
                    where: { email }
                });

                if (!user) {
                    throw new ApiError(404, "User not found!");
                }

                req.user = user;
            }

            // Check if the user is admin
            if (user.access === AccessTypes.ADMIN) {
                return next();
            }
            
            // Check if user has any of the required access types
            const hasRequiredAccess = requiredAccess.some(access => {
                if (access === 'MEMBER') {
                    return user.access !== AccessTypes.USER;
                }
                return user.access === access;
            });

            if (hasRequiredAccess) {
                console.log("Access granted, proceeding...");
                return next();
            }

            console.log("Access denied. User access:", user.access, "Required:", requiredAccess);
            throw new ApiError(403, 'Unauthorized');
        } catch (error) {
            console.log("Could not pass checkAccess middleware",error);
            if (error instanceof ApiError) {
                next(error); 
            } else {
                console.error("Unexpected error:", error);
                next(new ApiError(500, "Internal Server Error", [], error)); 
            }
        }
    };
};

module.exports = { checkAccess };
