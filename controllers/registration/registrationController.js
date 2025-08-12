const { addRegistration } = require('./addRegistration');
const { getRegistrationCount } = require('./countRegistration');
const { downloadRegistration } = require('./downloadRegistration');
const { getAttendanceCode } = require('./markAttendance');

module.exports = {
    addRegistration,
    downloadRegistration,
    getRegistrationCount,
    getAttendanceCode,
};
