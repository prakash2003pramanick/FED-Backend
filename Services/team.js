const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ApiError } = require("../utils/error/ApiError");
const { nanoid } = require("nanoid");
const status = require("http-status");

const getTeam = async (id, teamCode, data) => {
  try {
    const teams = await prisma.team.findFirst({
      where: {
        OR: [{ userId: id }, { teamId: teamCode }],
      },
    });

    if (!teams) {
      if (data) {
        return await createTeam(data);
      }

      throw new ApiError(status.NOT_FOUND, "Team not found");
    }

    await prisma.participant.create({
      data: {
        userId: id,
        type: 1, // Member
        formId: data.formId,
        team: { connect: { id: teams.id } },
      },
    });

    return teams;
  } catch (error) {
    throw new ApiError(status.INTERNAL_SERVER_ERROR, "Error fetching team");
  }
};

const createTeam = async (data) => {
  try {
    const newTeam = await prisma.team.create({
      data: {
        teamId: `OM_${nanoid(6)}`,
        user: { connect: { id: data.userId } },
        form: { connect: { id: data.formId } },
        teamName: data.teamName,
        participants: {
          create: data.participants.map((participant) => ({
            user: { connect: { id: participant.userId } },
            type: participant.type,
            formId: participant.formId,
          })),
        },
      },
    });

    if (!newTeam) {
      throw new ApiError(status.BAD_REQUEST, "Team not created");
    }
    return newTeam;
  } catch (error) {
    throw new ApiError(status.INTERNAL_SERVER_ERROR, "Error creating team");
  }
};

module.exports = { getTeam, createTeam };
