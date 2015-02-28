/**
 * The command executor will execute commands passed to it and do any possible housekeeping required
 *
 * Created by Martin Koster on 2/11/15.
 */
(function (exports) {

    /**
     * executes a given command
     * @param {object} mutationCommand an instance of a mutation command
     * @returns {array} sub-nodes to be processed
     */
    function executeCommand(mutationCommand) {
        return mutationCommand.execute();
    }

    exports.executeCommand = executeCommand;
})(module.exports);
