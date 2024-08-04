const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ApiError } = require("../../utils/error/ApiError");
const { createTeam, getTeam } = require("../../Services/team");

// @description     Add registration for a form
// @route           POST /api/form/register
// @access          Public (or as per your authentication requirements)
const addRegistration = async (req, res, next) => {
    try {
      const { formId, value } = req.body;
  
      if (!formId || !value) {
        return next(new ApiError(400, "Form ID and form data are required"));
      }
  
      // Extract team-related data
      const teamData = filterTeamData(value);
  
      // Check if the form exists
      const formExists = await prisma.form.findUnique({
        where: { id: formId },
      });
  
      if (!formExists) {
        return next(new ApiError(404, "Form not found"));
      }
  
      // Check registration existence
      const registrationExists = await prisma.formRegistration.findFirst({
        where: {
          OR: [
            { userId: req.user.id },
            // Uncomment and add regUserEmails logic if needed
            // {
            //     regUserEmails: {
            //         hasSome: regUserEmails
            //     }
            // }
          ],
          AND: {
            formId: formId,
          },
        },
      });
  
      if (registrationExists) {
        return next(new ApiError(400, "User is already registered in this event"));
      }
  
      let team;
  
      if (teamData.createTeam) {
        team = await createTeam({
          userId: req.user.id,
          formId: formId,
          teamName: teamData.teamName,
          participants: [{ userId: req.user.id, type: 0, formId: formId }], 
        });
  
        if (!team) {
          return next(new ApiError(status.BAD_REQUEST, "Team could not be created"));
        }
      } else if (teamData.joinTeam) {
        team = await getTeam(req.user.id, teamData.teamCode, {
          formId: formId,
          participants: [{ userId: req.user.id, type: 1, formId: formId }],
        });
  
        if (!team) {
          return next(new ApiError(status.NOT_FOUND, "Team not found"));
        }
      }
  
      const newRegistration = await prisma.formRegistration.create({
        data: {
          userId: req.user.id,
          formId: formId,
          value: JSON.stringify(value), 
          teamId: team.id, 
        },
      });
  
      res.status(201).json({
        success: true,
        message: "Registration added successfully",
        data: newRegistration,
      });
    } catch (error) {
      console.error("Error in adding registration:", error);
      return next(new ApiError(500, "Error in adding registration", error));
    }
  };
  
  function filterTeamData(formData) {
    const teamSection = formData.find(
      (section) => section.sectionTitle === "Team Selection"
    );
  
    if (!teamSection) {
      throw new Error("Team Selection section not found");
    }
  
    const fields = teamSection.fields.reduce(
      (acc, field) => {
        if (field.name === "Create Team") {
          acc.createTeam = field.value;
        } else if (field.name === "Join Team") {
          acc.joinTeam = field.value;
        } else if (field.name === "Team Name") {
          acc.teamName = field.value;
        } else if (field.name === "Team Code") {
          acc.teamCode = field.value;
        }
        return acc;
      },
      { createTeam: false, joinTeam: false, teamName: "", teamCode: "" }
    );
  
    return fields;
  }
  

module.exports = { addRegistration };
