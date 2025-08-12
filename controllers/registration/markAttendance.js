const { ApiError } = require("../../utils/error/ApiError");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const ExcelJS = require("exceljs");

const getAttendanceCode = async (req, res, next) => {
  try {
    const { id: formId } = req.params;
    const { teamCode } = req.query;
    const { id: userId } = req.user;

    if (!formId || !userId) {
      return next(new ApiError(400, "Form ID or User ID is missing."));
    }

    let formRegistrationDetails = null;
    // Fetching event details from the database
    if (teamCode) {
      formRegistrationDetails = await prisma.formRegistration.findFirst({
        where: {
          formId,
          teamCode,
        },
      });

      console.log("formRegistrationDetails:", formRegistrationDetails);
    } else {
      const allFormRegistrationDetails = await prisma.formRegistration.findMany(
        {
          where: {
            formId,
          },
        }
      );

      console.log("allFormRegistrationDetails:", allFormRegistrationDetails);

      formRegistrationDetails = allFormRegistrationDetails.find(
        (registration) =>
          registration.value.some((value) => value.user_id === userId)
      );

      console.log("Filtered formRegistrationDetails:", formRegistrationDetails);

      if (!formRegistrationDetails) {
        return next(
          new ApiError(404, "Form registration not found for the user.")
        );
      }
      formRegistrationDetails = {
        ...formRegistrationDetails,
      };
    }

    // If no registration details found, return an error
    if (!formRegistrationDetails) {
      return next(new ApiError(404, "Form registration not found."));
    }

    const info = formRegistrationDetails.value.find(
      (value) => value.user_id === userId
    );

    // Put in attendance db
    const attendanceData = {
      formId: formId,
      userId: userId,
      teamName: formRegistrationDetails.teamName,
      teamCode: formRegistrationDetails.teamCode,
      info,
    };

    // Create or update attendance record
    const attendanceDetails = await prisma.attendance.upsert({
      where: {
        formId_userId_teamCode: {
          formId: attendanceData.formId,
          userId: attendanceData.userId,
          teamCode: attendanceData.teamCode,
        },
      },
      create: attendanceData,
      update: attendanceData,
    });

    // Create JWT token for QR code that expires in 20 minutes
    const token = jwt.sign(
      {
        attendanceToken: attendanceDetails.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "20m" }
    );

    // Return JWT token
    return res.status(200).json({
      message: "Validation id generated successfully.",
      attendanceToken: token,
    });
  } catch (error) {
    console.error("Error generating QR link:", error);
    return next(
      new ApiError(
        error.statusCode || 500,
        error.message || "Internal Server Error",
        error
      )
    );
  }
};

const markAttendance = async (req, res, next) => {
  const { formId, token } = req.body;

  if (!token) {
    return next(new ApiError(400, "Attendance token is required."));
  }
  try {
    // Verify the JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(new ApiError(401, "Invalid or expired QR."));
    }
    const attendanceId = decoded.attendanceToken;

    if (!attendanceId) {
      return next(new ApiError(400, "Attendance ID is missing in the token."));
    }

    // Check if the attendance ID is valid
    const attendanceRecord = await prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    // If no attendance record found, return an error
    if (!attendanceRecord) {
      return next(new ApiError(404, "Attendance record not found."));
    }

    // Check if it belongs to the correct form
    if (attendanceRecord.formId !== formId) {
      return next(
        new ApiError(400, "QR does not belong to the specified form.")
      );
    }

    // Check if the attendance is already marked
    if (attendanceRecord?.isPresent) {
      return next(new ApiError(400, "Attendance already marked."));
    }

    // Check if payment is verified
    // if (!attendanceRecord?.isPaymentVerified) {
    //   return next(new ApiError(400, "Payment not verified for this attendance."));
    // }

    // Mark attendance as present
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: { isPresent: true },
    });

    res.status(200).json({
      message: "Attendance marked successfully.",
      attendance: updatedAttendance,
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    return next(
      new ApiError(
        error.statusCode || 500,
        error.message || "Internal Server Error",
        error
      )
    );
  }
};

const exportAttendance = async (req, res, next) => {
  try {
    /*************  ✨ Windsurf Command ⭐  *************/
    /**
     * Exports attendance records for a specific form in either JSON or XLSX format.
     *
     * @param {Object} req - The request object.
     * @param {Object} req.params - Parameters from the request URL.
     * @param {string} req.params.id - The form ID to fetch attendance for.
     * @param {Object} req.query - Query parameters from the request URL.
     * @param {string} [req.query.teamCode] - Optional team code to filter attendance records.
     * @param {string} [req.query.format] - The format of the export ('json' or 'xlsx'). Defaults to 'json'.
     * @param {Object} res - The response object.
     * @param {Function} next - The next middleware function.
     *
     * @returns {void} - Sends the attendance data in the specified format or an error message.
     *
     * @throws {ApiError} - Throws an error if the form ID is missing, no records are found,
     *                      or an invalid format is specified.
     */

    /*******  53c09f81-5f5f-4dbd-abc3-c89f49f952d6  *******/ const {
      id: formId,
    } = req.params;
    const { teamCode, format } = req.query;

    if (!formId) {
      return next(new ApiError(400, "Form ID is required."));
    }

    const whereClause = { formId };
    if (teamCode) whereClause.teamCode = teamCode;

    const records = await prisma.attendance.findMany({
      where: whereClause,
    });

    if (!records.length) {
      return next(new ApiError(404, "No attendance records found."));
    }

    // JSON output (unchanged)
    if (!format || format === "json") {
      let grouped;
      if (teamCode) {
        grouped = [{ teamCode, members: records }];
      } else {
        grouped = Object.values(
          records.reduce((acc, record) => {
            if (!acc[record.teamCode]) {
              acc[record.teamCode] = { teamCode: record.teamCode, members: [] };
            }
            acc[record.teamCode].members.push(record);
            return acc;
          }, {})
        );
      }
      return res.status(200).json(grouped);
    }

    // XLSX output with styling
    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Attendance");

      // Define columns
      sheet.columns = [
        { header: "User ID", key: "userId", width: 25 },
        { header: "Team Name", key: "teamName", width: 20 },
        { header: "Team Code", key: "teamCode", width: 15 },
        { header: "Present", key: "isPresent", width: 10 },
        { header: "Payment Verified", key: "isPaymentVerified", width: 20 },
        { header: "Phone Number", key: "phoneNumber", width: 15 },
      ];

      // Add rows + style
      records.forEach((r) => {
        const row = sheet.addRow({
          ...r,
          phoneNumber: "1234",
        });

        if (!r.isPresent) {
          row.eachCell((cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFCCCC" }, // light red
            };
          });
        }
      });

      // Write buffer
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="attendance_${formId}.xlsx"`
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      return res.send(buffer);
    }

    return next(new ApiError(400, "Invalid format. Supported: json, xlsx."));
  } catch (error) {
    console.error(error);
    next(new ApiError(500, "Server error."));
  }
};

module.exports = {
  getAttendanceCode,
  markAttendance,
  exportAttendance,
};
