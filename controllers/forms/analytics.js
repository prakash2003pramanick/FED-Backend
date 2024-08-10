// controllers/form/analytics.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ApiError } = require('../../utils/error/ApiError');
const expressAsyncHandler = require('express-async-handler');

// @description     Form analytics
// @route           GET /api/form/formAnalytics/:id
// @access          ADMIN
const analytics = expressAsyncHandler(async (req, res, next) => {
  try {
    console.log("entering form analytics")
    const { id: formId } = req.params;
    let form = await prisma.form.findUnique({
      where: { id: formId },
      include: { formAnalytics: true, sections: false }
    });
    console.log("form",form);
    if(form.formAnalytics.length === 0){
      return next(new ApiError(404, "No users have registered to this form yet"))
    }

    let formAnalytics = form.formAnalytics[0];
    let yearCounts;
    console.log("form analytics : ",formAnalytics);
    formAnalytics.regCount = formAnalytics?.regUserEmails?.length;
    try {
      const users = await prisma.user.findMany({
        where: {
          email: {
            in: formAnalytics.regUserEmails,  // Use the 'in' operator to match any email in the list
          },
        },

      });
      yearCounts = users.reduce((acc, obj) => {
      acc[obj.year] = (acc[obj.year] || 0) + 1;
      return acc;
    }, {});
    } catch (error) {
      console.error("Error fetching all the users form the array list", error);
      // next(new ApiError(500, "Internal Server Error", error));
    }

    console.log("year counts : ", yearCounts);
    return res.status(200).json({ message: "success", form: form.formAnalytics[0], registrationCount: formAnalytics.regCount, yearCounts });
  } catch (error) {
    console.log(error)
    next(new ApiError(500, "Internal Server Error", error));
  }
});



// const addClickCount = expressAsyncHandler(async (req, res, next) => {
//   const { formId } = req.body;

//   await prisma.model.update({
//     where: { id: formId },
//     data: { value: { increment: 1 } }
//   });

//   return res.status(200).json({ message: "Click count incremented" });
// });

module.exports = { analytics };
