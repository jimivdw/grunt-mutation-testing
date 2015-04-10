var processID = JSON.parse(process.argv[2]);
console.log('killing process', processID);
//process.disconnect(); //disconnect so that a possible error code 3 issued by Node will not kill the parent process
process.kill(processID);
