// Stratified version of net.js

// Note that for build-technical reasons this lib has a '*.js'
// extension, whereas it should have a *.sjs one.

//----------------------------------------------------------------------
// imports

var FreeList = require('freelist').FreeList;
var IOWatcher   = process.binding('io_watcher').IOWatcher;

var net_binding = process.binding('net');
var socket  = net_binding.socket; // (tcp|tcp4|tcp6|unix|unix_dgram|udp|udp4|udp6)
var close   = net_binding.close; // (fd)
var connect = net_binding.connect; // (fd, (port, [host] | path))
var read    = net_binding.read; // (fd, buf, off, len)
var write   = net_binding.write; // (fd, buf, off, len)
var socketError = net_binding.socketError; 
var errnoException = net_binding.errnoException;

var constants   = process.binding('constants');
var EINPROGRESS = constants.EINPROGRESS;

var common = require('common');
var stream = require('$stream');

//----------------------------------------------------------------------
// helpers

var ioWatchers = new FreeList("iowatcher", 100, function () {
  return new IOWatcher();
});

function waitforFd(fd, r, w) {
  if (fd === null) throw "Socket is closed";
//  var watcher = ioWatchers.alloc();
  var watcher = new IOWatcher;
  waitfor() {
    watcher.callback = resume;
    watcher.set(fd,r,w);
    watcher.start();
  }
  finally {
    watcher.stop();
    ioWatchers.free(watcher);
  }
}


function toPort (x) { return (x = Number(x)) >= 0 ? x : false; }

//----------------------------------------------------------------------

exports.createConnection = function (/* port,[host] | path */) {
  var port = toPort(arguments[0]);
  var type;
  if (port === false)
    type = 'unix';
  else
    type = ((arguments[1] = require('$dns').lookup(arguments[1])).family == 4 ?
            'tcp4' : 'tcp6');
  
  var fd = socket(type);
  try {
    connect(fd, arguments[0], arguments[1]);
    var errno;
    do {
      waitforFd(fd, false, true);
      errno = socketError(fd);
    } while (errno == EINPROGRESS);
    if (errno)
      throw errnoException(errno, 'connect');
  }
  catch (e) {
    close(fd);
    throw e;
  }
  return new Connection(fd, type);
};

//----------------------------------------------------------------------
// Connection class

function Connection(fd, type) {
  this.fd = fd;
  this.type = type;
}
Connection.prototype = {
  destroy: function() { delete this.rbuffer; close(this.fd); this.fd = null;},
  __finally__ : function() { this.destroy(); },

  readRaw : function(buf) {
    // get some more data
    waitforFd(this.fd, true, false);
    var bytesRead = read(this.fd, buf, 0, buf.length);
    if (bytesRead < 0)
      throw errnoException(socketError(fd), 'read');
    return bytesRead;
  },
  writeRaw : function(buf, off, len) {
    waitforFd(this.fd, false, true);
    var written = write(this.fd, buf, off, len);
    if (written <= 0) // XXX <= or < ? what happens in the '==' case?
      throw errnoException(socketError(fd), 'write');
    return written;
  }
};
common.copyProps(stream.InStreamProto, Connection.prototype);
common.copyProps(stream.OutStreamProto, Connection.prototype);
