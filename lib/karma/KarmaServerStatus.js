/**
 * KarmaServerStatus object, containing the various statuses a Karma server can have.
 *
 * @author Jimi van der Woning
 */
'use strict';

// All possible statuses of a Karma server instance
var KarmaServerStatus = {
    INITIALIZING: 0,
    READY: 1,
    RUNNING: 2,
    STOPPED: 3,
    KILLED: 4,
    DEFUNCT: 5
};

module.exports = KarmaServerStatus;
