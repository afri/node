// Stratified http server/client

// Note that for build-technical reasons this lib has a '*.js'
// extension, whereas it should have a *.sjs one.

//----------------------------------------------------------------------
// imports

var net = require('$net');
var FreeList = require('freelist').FreeList;
var parseURL = require('common').parseURL;
var stream = require('$stream');

//----------------------------------------------------------------------

exports.createServer = function(port, /* opt */ host) {
  var tcpserver = net.createServer(port, host);
  return new Server(tcpserver);
};

//----------------------------------------------------------------------
// Http Server

function Server(s) {
  this.tcpserver = s;
}
Server.prototype = {
  close : function() { this.tcpserver.close(); },
  __finally__ : function() { this.close(); },
  run : function(handleRequest) {
    function handleConnection(tcpcon) {
      // we do our own buffering into packets:
      // tcpcon.setNoDelay(true);

      // keep the connection open until closed, error or timeout:
      try {
        while (true) {
          var request;
          waitfor {
            // 1 minute timeout on connection
            // XXX should also have a means of reaping connections if
            // there are too many concurrent ones
            hold(60000);
            __js console.log("reaping connection from "+tcpcon.remoteAddress);
            return;
          }
          or {
            // it's ok to let this throw; we'll just close the tcp
            // connection if it does
            request = readRequest(tcpcon);
          }
          
          // we've got a request, let the handler handle it
          
          // by putting this into 'using', we ensure that the
          // request's __finally__ method always gets called
          using (request)
            handleRequest(request);
          
          if (request.version == "0" &&
              request.headers["Connection"] != "Keep-Alive")
            return; // http version 1.0 -> close the connection
        }
      }
      catch (e) {
        // ignore silently; could just be EPIPE
//       __js console.log("Connection "+
//                    tcpcon.remoteAddress+ " : " + e);
      }
      finally {
        __js tcpcon.__finally__();
      }
    }
    //this.tcpserver.run2(handleConnection);
    while (1) {
      var c = this.tcpserver.accept();
      spawn(handleConnection, c);
    }
    
  }
};

//----------------------------------------------------------------------
// request parsing


var RE_REQUEST = /^(\S+)\s+(\S+)\s+HTTP\/1\.(0|1)\s*\r\n([^]*)\r\n\r\n/;
function readRequest(tcpcon) {
//  tcpcon.readOctets();
  var matches = tcpcon.readOctetMatches(RE_REQUEST, 10240); // limit request without body to 10K
//  console.log(matches[0]);
/*
   // unfortunately we need http/1.0 for compatibility with 'ab'
   if (matches[3] != "1") // come on, it's the 21st century
     throw "Unsupported http version 1."+matches[3]+""; 
  */

  __js {
    var r = new IncomingRequest();//reqs.alloc();
    r.init(matches[1], // method
           parseURL(matches[2]), // url
           matches[3],
           parseHeaders(matches[4]),
           tcpcon);
  }

  return r;
}

__js function parseHeaders(head) {
  // XXX not 100% rfc2616 compliant
  head = head.split('\r\n');
  var rv = {};
  for (var i=0; i<head.length;++i) {
    var matches = head[i].match(/([^ :]+)\:\s*(.*)/);
    if (!matches) {
      //dump("Unknown header: "+head[i]);
      throw "Unknown header: "+head[i];
    }
    //console.log("found: "+matches[1]+" ==> "+matches[2]);
    rv[matches[1]] = matches[2];
  }
  return rv;  
}

//----------------------------------------------------------------------
// Incoming Request object

var R = 0;

__js {
var reqs = new FreeList('req', 50,
                        function() {
                          return new IncomingRequest();
                                    });



  function IncomingRequest() {
    this.writebuffer = stream.createStringBuf();
  }
  IncomingRequest.prototype = {};
  
  IncomingRequest.prototype.init = function(method, url, version, headers, tcpcon) {
    this.method = method;
    this.url = url;
    this.version = version;
    this.tcpcon = tcpcon;
    this.headers = headers;
    this.sink = this.writebuffer;
    this.sink.attach(tcpcon);
    this.replyStarted = false;
    this.bodySent = false;
    this.chunked = false;
    ++R;
    if (R%20 == 0) console.log("request "+R);
  };


  IncomingRequest.prototype.toString = function() {
    return "Request to '"+this.url.path+"' from "+this.tcpcon.remoteAddress;
  };
}
  
// finish off reply:
IncomingRequest.prototype.__finally__ = function() {
  --R;
  if (!this.replyStarted) {
    this.writeErrorResponse(501, "Not Implemented",
                            "The server is not configured to fulfill this request.");
  }
  else if (this.chunked) {
    //XXX
  }
  else if (!this.bodySent) {
    this.writeSimpleOctetBody("");
  }
  this.sink.flush();
//  __js reqs.free(this); 
};

//----------------------------------------------------------------------
// low-level response writing api
  
// write head of a response; to be followed by optional calls to
// writeSimple[Type]Body, write[X], and a final call to __finally__:
__js IncomingRequest.prototype.writeResponseHead = function(status, title, mimeType, extraHeaders) {
  var header = "HTTP/1.1 "+status+" "+title+"\r\n";
  if (this.headers["Connection"] == "Keep-Alive")
    header += "Connection: Keep-Alive\r\n";
  if (mimeType)
    header += "Content-Type: "+mimeType+"\r\n";
  if (extraHeaders) {
    for (var i=0; i<extraHeaders.length; ++i)
      header += extraHeaders[i] + "\r\n";
  }
  this.sink.writeOctets(header);
  this.replyStarted = true;
};

IncomingRequest.prototype.writeSimpleOctetBody = function(octets) {
  this.bodySent = true;
  var l = octets.length;
  //  assert(!this.bodySent && !this.chunked && this.replyStarted)
  __js this.sink.writeOctets("Content-Length: "+
                             l+"\r\n\r\n");
  if (l > 2000) {
    // get writebuffer out of the picture
    this.sink.flush();
    this.sink = this.tcpcon;
  }
  this.sink.writeOctets(octets);
};

//----------------------------------------------------------------------
// high-level response writing api:
  
IncomingRequest.prototype.writeErrorResponse = function(status, title, text) {
  __js  this.writeResponseHead(status, title, "text/html");
  // XXX write as utf8
  this.writeSimpleOctetBody(
    "<html><head><title>"+status+" "+title+"</title></head>"+
      "<body><h4>"+status+" "+title+"</h4>"+
      text+"</body></html>");
};

IncomingRequest.prototype.writeHTMLResponse = function(s) {
  __js  this.writeResponseHead(200, "OK", "text/html");
  // xxx use utf8
  this.writeSimpleOctetBody(s);
};

IncomingRequest.prototype.writeTextResponse = function(s) {
  __js  this.writeResponseHead(200, "OK", "text/plain");
  // xxx use utf8
  this.writeSimpleOctetBody(s);
//  this.sink.flush();
};

IncomingRequest.prototype.writeBufferResponse = function(buf) {
  __js  this.writeResponseHead(200, "OK", "text/plain");
  __js  this.sink.writeOctets("Content-Length: "+
                              buf.length+"\r\n\r\n");
  this.sink.flush();
  // let the writebuffer drop out of the picture
  this.sink = this.tcpcon;
  this.sink.writeBuf(buf);
};
