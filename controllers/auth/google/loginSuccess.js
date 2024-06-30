const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const expressAsyncHandler = require('express-async-handler');
const prisma = new PrismaClient();

const loginSuccess = expressAsyncHandler(async(req, res) => {
    try{
        if(req.user){
            // res.status(200).json({
            //     error: false,
            //     message: "Successfully Logged In",
            //     user: req.user,
            // });
            
            console.log(req.user.emails[0].value)
                
                const user = await prisma.user.findUnique({
                    where: { email: req.user.emails[0].value.toString() }
                });

                if (!user) {
                    // return next(new ApiError(404, 'User not found'));
                    res.json("User not found")
                }
                else{
                    const token = jwt.sign({ id: user.id, email: user.email, loginTime: new Date().toISOString() }, process.env.JWT_SECRET, { expiresIn: '7h' });
                    res.cookie('token', token, {
                        httpOnly: true,
                        secure: true,
                    });
                    console.log(token)
                    res.json("Logged in successfully with token")
                }
            } else{
                res.status(403).json({error: true, message: "Not Authorized"})
            }
        }
    catch (error){
        res.json({error : error.message})
    }
});

module.exports = {loginSuccess};