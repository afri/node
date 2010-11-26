// SJS bootstrapping code
// This file contains SJS code, even though, for build technical
// reasons, it is "*.js".

// stratified functions which will be injected into node.js, so that
// we can load modules with top-level blocking SJS:

var env = {};
exports.env = env;

exports.module_load = function (filename) {
  debug("load " + JSON.stringify(filename) + " for module " + JSON.stringify(this.id));
  
  env.process.assert(!this.loaded);
  this.filename = filename;
  
  var extension = env.path.extname(filename) || '.js';
  if (!env.extensions[extension]) extension = '.js';
  env.extensions[extension](this, filename);
  this.loaded = true;
  return this.exports;
};

exports.sjs_load = function (module, filename) {
  var content = env.requireNative('fs').readFileSync(filename, 'utf8');
  var ignore = module._compile(content, filename, true);
};

exports.process_eval = function() {
  console.log(this._compile('return $eval(process._eval)', 'eval', true));
};