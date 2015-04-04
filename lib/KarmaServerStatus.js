/**
 * KarmaServerState
 *
 * @author Jimi van der Woning
 */
'use strict';

var KarmaServerStatus = {
    INITIALIZING: 0,
    READY: 1,
    RUNNING: 2,
    KILLED: 3,
    DEFUNCT: 4
};

module.exports = KarmaServerStatus;
