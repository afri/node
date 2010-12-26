// Stratified version of net.js

// Note that for build-technical reasons this lib has a '*.js'
// extension, whereas it should have a *.sjs one.

//----------------------------------------------------------------------
// imports
__js {
  var FreeList = require('freelist').FreeList;
  var IOWatcher   = process.binding('io_watcher').IOWatcher;
  
  var net_binding = process.binding('net');
  var socket  = net_binding.socket; // (tcp|tcp4|tcp6|unix|unix_dgram|udp|udp4|udp6)
  var close   = net_binding.close; // (fd)
//  var close = require("$fs").close;
  var shutdown= net_binding.shutdown;
  var connect = net_binding.connect; // (fd, (port, [host] | path))
  var bind    = net_binding.bind;
  var listen  = net_binding.listen;
  var accept  = net_binding.accept;
  var read    = net_binding.read; // (fd, buf, off, len)
  var write   = net_binding.write; // (fd, buf, off, len)
  var socketError = net_binding.socketError; 
  var errnoException = net_binding.errnoException;
  var setNoDelay = net_binding.setNoDelay;
  
  var constants   = process.binding('constants');
  var EINPROGRESS = constants.EINPROGRESS;
  
  var common = require('common');
  var stream = require('$stream');
}

//----------------------------------------------------------------------
// helpers


__js function toPort (x) {return (x = Number(x)) >= 0 ? x : false;}

//----------------------------------------------------------------------
// io watching

__js var ioWatchers = new FreeList("iowatcher",500, function () {
  return new IOWatcher();
});

function waitforFd(fd, r, w) {
  __js if (fd === null) throw "Socket is closed";
  __js var watcher = ioWatchers.alloc();
  waitfor() {
    watcher.callback = resume;
    __js watcher.set(fd,r,w);
    __js watcher.start();
  }
  finally {
    __js watcher.stop();
    __js ioWatchers.free(watcher);
  }
}

//----------------------------------------------------------------------
// 

exports.createConnection = function(/* port,[host] | path */) {
  var port = toPort(arguments[0]);
  var type;
  __js if (port === false)
    type = 'unix';
  else
    type = ((arguments[1] = require('$dns').lookup(arguments[1])).family == 4 ?
            'tcp4' : 'tcp6');
  
  __js var fd = socket(type);
  try {
    __js connect(fd, arguments[0], arguments[1]);
    var errno;
    do {
      waitforFd(fd, false, true);
      __js errno = socketError(fd);
    } while (errno == EINPROGRESS);
    __js if (errno)
      throw errnoException(errno, 'connect');
  }
  catch (e) {
    __js close(fd);
    __js throw e;
  }
  __js var c = new Connection(fd, type);
  return c;
};

//----------------------------------------------------------------------

exports.createServer = function(/* port,[host] | path */) {
  var port = toPort(arguments[0]);
  var type;
  __js if (port === false)
    type = 'unix';
  else
    type = ((arguments[1] = require('$dns').lookup(arguments[1])).family == 4 ?
            'tcp4' : 'tcp6');
  var fd = socket(type);
  try {
    __js bind(fd, arguments[0], arguments[1]);
    __js listen(fd, 128);
  }
  catch (e) {
    __js close(fd);
    __js throw e;
  }
  return new Server(fd, type);
};

//////////////////////////////////////////////////////////////////////
// Server class

__js {
  function Server(listenfd, type) {
    this.listenfd = listenfd;
    this.type = type;
  }
  Server.prototype = {};
  
  Server.prototype.close = function() {
    if (this.listenfd !== null) {
      close(this.listenfd);
      this.listenfd = null;
    }
  };
  
  Server.prototype.__finally__ = function() { this.close(); };
}

Server.prototype.accept = function() {
  __js var peerInfo = accept(this.listenfd);
  if (!peerInfo) {
    waitforFd(this.listenfd, true, false);
    __js var peerInfo = accept(this.listenfd);
  }
  __js var c = connections.alloc();
  __js c.init(peerInfo.fd, this.type, peerInfo.address, peerInfo.port);
  return c;
};

// the faster spawn variety:
Server.prototype.run = function(handler) {
  function H(c) {
    try {
      handler(c);
    }
    catch(e) {
      __js console.log("Exception in connection to "+
                       c.remoteAddress+":"+c.remotePort+" : "+e);
    }
    finally {
      __js c.__finally__();
    }
  }
  
  while(1) {
    var c = this.accept();
    spawn(H, c);
  }
};

// the (very slightly) slower recursive variety:
Server.prototype.run2 = function(handler) {
  var s = this;
  function inner() {
    var c = s.accept();
    waitfor {
      try {
        handler(c);
      }
      catch(e) {
        __js console.log("Exception in connection to "+
                         c.remoteAddress+":"+c.remotePort+" : "+e);
      }
      finally {
        __js c.__finally__();
      }
    }
    and {
      // accept next connection
      inner();
    }
  }
  inner();
};



////////////////////////////////////////////////////////////////////////
// Connection class

__js {
  var connections = new FreeList("connection", 100, function() {
    return new Connection();
  });
  
  function Connection() {
  }
  Connection.prototype = {};
  common.copyProps(stream.InStreamProto, Connection.prototype);
  common.copyProps(stream.OutStreamProto, Connection.prototype);

  // fd : connected socket
  Connection.prototype.init = function(fd, type, remoteAddress, remotePort) {
    this.fd = fd;
    this.type = type;
    this.remoteAddress = remoteAddress;
    this.remotePort = remotePort;
  };
  
  Connection.prototype.close = function() {
    if (this.fd === null) return;
    //      shutdown(this.fd, "write");
    close(this.fd);
    this.fd = null;
  };

  Connection.prototype.shutdown = function(how) {
    shutdown(this.fd, how);
  };
  
  Connection.prototype.__finally__ = function() {
    this.close();
    connections.free(this);
  };
}

//----------------------------------------------------------------------
// InStream methods:
Connection.prototype.readRaw = function(buf) {
  // get some more data
  waitforFd(this.fd, true, false);
  __js var bytesRead = read(this.fd, buf, 0, buf.length);
  return bytesRead;
};

//----------------------------------------------------------------------
// OutStream methods:
  
Connection.prototype.writeRaw = function(buf, off, len) {
  // net_binding.write(.) returns 0 or throws
  __js var written = write(this.fd, buf, off, len);
  if (written == 0) {
    waitforFd(this.fd, false, true);
    __js written = write(this.fd, buf, off, len);
  }
  return written;
};

/*Connection.prototype.writeBuf = function(buf, off, len ) { 
  off = off || 0;
  len = len || buf.length;
  while (len > 0) {
    __js var written = write(this.fd, buf, off, len);
    if (written == 0) {
      waitforFd(this.fd, false, true);
      __js written = write(this.fd, buf, off, len);
    }
    off += written;
    len -= written;
  }
};*/


//----------------------------------------------------------------------

__js Connection.prototype.setNoDelay = function(v) {
  setNoDelay(this.fd, v);
};



