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
var bind    = net_binding.bind;
var listen  = net_binding.listen;
var accept  = net_binding.accept;
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

exports.createConnection = function(/* port,[host] | path */) {
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

exports.createServer = function(/* port,[host] | path */) {
  var port = toPort(arguments[0]);
  var type;
  if (port === false)
    type = 'unix';
  else
    type = ((arguments[1] = require('$dns').lookup(arguments[1])).family == 4 ?
            'tcp4' : 'tcp6');
  var fd = socket(type);
  try {
    bind(fd, arguments[0], arguments[1]);
    listen(fd, 100);
  }
  catch (e) {
    close(fd);
    throw e;
  }
  return new Server(fd, type);
};

//----------------------------------------------------------------------
// Server class

function Server(listenfd, type) {
  this.listenfd = listenfd;
  this.type = type;
}
Server.prototype = {
  close : function() {
    if (this.listenfd === null) return;
    close(this.listenfd);
    this.listenfd = null;
  },
  __finally__ : function() { this.close(); },
  accept : function() {
    var peerInfo;
    do {
      waitforFd(this.listenfd, true, false);
    } while (!(peerInfo = accept(this.listenfd)));
    var c = new Connection(peerInfo.fd, this.type);
    c.remoteAddress = peerInfo.address;
    c.remotePort = peerInfo.port;
    return c;
  },
  
  run : function(handler) {
    var s = this;
    function inner() {
      var c = s.accept();
      waitfor {
        try {
          handler(c);
        }
        catch(e) {
          console.log("Exception in connection to "+c.remoteAddress+":"+c.remotePort+" : "+e);
        }
        finally {
          c.close();
        }
      }
      and {
        // accept next connection
        inner();
      }
    }
    inner();
  }
};

//----------------------------------------------------------------------
// Connection class

// fd = connected socket
function Connection(fd, type) {
  this.fd = fd;
  this.type = type;
}
Connection.prototype = {
  close : function() {
    if (this.fd === null) return;
    delete this.rbuffer;
    close(this.fd);
    this.fd = null;
  },
  __finally__ : function() { this.close(); },

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
