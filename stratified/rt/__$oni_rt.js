// SJS bootstrapping code
// This file contains SJS code, even though, for build technical
// reasons, it is "*.js".

var Module = require('module');
var NativeModule = require('native_module');

Module._extensions['.sjs'] = function (module, filename) {
  var content = NativeModule.require('fs').readFileSync(filename, 'utf8');
  // remove shebang
  content = content.replace(/^\#\!.*/, '');
  // sjs -> js
  content = global.__oni_rt.c1.compile(content, { filename: filename });
  return Module.prototype._compile(content, filename);
};

exports.runEval = function() {
  if (!process._eval) return;
  var source = global.__oni_rt.c1.compile("$eval(process._eval);");
  console.log(new Module()._compile("return "+source, 'eval'));
  return true;
};
