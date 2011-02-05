// StratifiedJS Node bootstrapping

var Script = process.binding('evals').Script;
var runInThisContext = Script.runInThisContext;
var NativeModule = require('native_module');
var Module = require('module');

installGlobals();
patchNativeModule();
patchModule();
// run sjs bootstrapping code:
var SJS = require('__$oni_rt');

if (runScript()) return;
if (SJS.runEval()) return;
runRepl();

//----------------------------------------------------------------------

function installGlobals() {
  global.__oni_rt = require('__oni_rt');
  global.$eval = function(code, filename) {
    filename = filename || "'$eval code'";
    var source = global.__oni_rt.c1.compile(code, {filename:filename});
    return eval(source);
  };
}

function patchNativeModule() {
  // patch up NativeModule.compile to load $* and __$* files as SJS:
  NativeModule.prototype.compile = function() {
    var source = NativeModule.getSource(this.id);
    source = NativeModule.wrap(source);
    if (this.id[0] == '$' || this.id[2] == '$')
      source = global.__oni_rt.c1.compile(source, {filename: this.id+'.js'});
    var fn = runInThisContext(source, this.filename, true);
    fn(this.exports, NativeModule.require, this, this.filename);
    
    this.loaded = true;
  };
}

function patchModule() {
  // patch up Module._load to load the repl as SJS:
  var old = Module._load;
  Module._load = function(request, parent, isMain) {
    if (request == "repl") {
      var replModule = new Module('repl');
      var source = NativeModule.getSource('repl');
      source = global.__oni_rt.c1.compile(source, {filename: 'repl.js'});
      replModule._compile(source, 'repl.js');
      NativeModule._cache.repl = replModule;
      return replModule.exports;
    }
    return old(request, parent, isMain);
  }
}

// copied from src/node.js
function runScript() {
  if (!process.argv[1]) {
    return;
  }

  // make process.argv[1] into a full path
  if (!(/^http:\/\//).exec(process.argv[1])) {
    var path = NativeModule.require('path');
    process.argv[1] = path.resolve(process.argv[1]);
  }

  var Module = NativeModule.require('module');

  // REMOVEME: nextTick should not be necessary. This hack to get
  // test/simple/test-exception-handler2.js working.
  process.nextTick(Module.runMain);

  return true;
};


function runRepl() {
  Module.requireRepl().start();
}

