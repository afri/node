// Stratified version of child_process.js

// Note that for build-technical reasons this lib has a '*.js'
// extension, whereas it should have a *.sjs one.

//----------------------------------------------------------------------
// imports

var child_process = require('child_process');

//----------------------------------------------------------------------

exports.exec = function(command, options) {
  waitfor(var err, stdout, stderr) {
    var child = child_process.exec(command, options, resume);
  }
  retract {
    // XXX support signals other than SIGTERM
    child.kill();
  }
  if (err) throw err;
  return { stdout: stdout, stderr: stderr };
};
