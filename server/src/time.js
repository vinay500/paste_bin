const { addSeconds, isAfter, parseISO } = require('date-fns');

/**
 * Returns the current Date, respecting x-test-now-ms header if TEST_MODE is enabled.
 * @param {import('express').Request} req
 * @returns {Date}
 */
function getCurrentTime(req) {
    console.log('TEST_MODE: ' + process.env.TEST_MODE);
    console.log('x-test-now-ms: ' + req.headers['x-test-now-ms']);
    if (process.env.TEST_MODE === '1' && req.headers['x-test-now-ms']) {
        console.log('Using test time: ' + req.headers['x-test-now-ms']);
        const testTime = parseInt(req.headers['x-test-now-ms'], 10);
        if (!isNaN(testTime)) {
            return new Date(testTime);
        }
    }
    console.log('Using current time');
    return new Date();
}

module.exports = { getCurrentTime };
