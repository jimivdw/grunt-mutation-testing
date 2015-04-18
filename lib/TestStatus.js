/**
 * Mutation Test Status object, containing the various statuses a test can have after running mutated code.
 *
 * @author Martin Koster
 * Created by martin on 16/04/15.
 */
'use strict';

// All possible statuses of a Karma server instance
var TestStatus = {
    SURVIVED: 'SURVIVED', // The unit test(s) survived the mutation
    KILLED: 'KILLED', // The mutation caused the unit test(s) to fail
    ERROR: 'ERROR', // an error occurred preventing the unit test(s) from reaching a conclusion
    FATAL: 'FATAL' // a fatal error occurred causing the process to abort
};

module.exports = TestStatus;
