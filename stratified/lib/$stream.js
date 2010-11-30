// Stratified stream support

// Note that for build-technical reasons this lib has a '*.js'
// extension, whereas it should have a *.sjs one.

//----------------------------------------------------------------------
// imports

var FreeList = require('freelist').FreeList;

//----------------------------------------------------------------------
// helpers

// pool of 4-byte buffers (for utf-8 conversion):
var b4bufs = new FreeList('b4buf', 10,
                          function() { return new Buffer(4); });

// pool of 4K buffers for general socket & file IO:
var iobufs = new FreeList('iobuf', 500,
                          function() { return new Buffer(4*1024); });

//----------------------------------------------------------------------
// InStream prototype

exports.InStreamProto = {
  // To be provided by subclass:
  // readRaw(buf) : read new data into buffer; return bytes read (0==eof)
  
  // temporary buffering structures:
  // rbuffer : readbuffer, buffer if rl>0
  // rl      : bytes avail in readbuffer
  // rstart  : offset into readbuffer

  readBuf : function(buf, min /*=0*/, max /*=buf.length*/, offset /*=0*/) {
    min = min || 0;
    max = max || buf.length;
    offset = offset || 0;
    var bytesRead = 0;
    try { 
      do {
        if (!this.rl) {
          if (!this.rbuffer)
            this.rbuffer = iobufs.alloc();
          this.rl = this.readRaw(this.rbuffer);
          if (!this.rl && bytesRead < min) throw "End of stream";        
          this.rstart = 0;
        }
        var b = Math.min(this.rl, max-bytesRead);
        this.rbuffer.copy(buf, offset, this.rstart, this.rstart+b);
        bytesRead += b;
        this.rl -= b;
        this.rstart += b;
        offset += b;
      } while (bytesRead < min);
      return bytesRead;
    }
    finally {
      if (!this.rl && this.rbuffer) {
        iobufs.free(this.rbuffer);
        delete this.rbuffer;
      }
    }
  },

  readUtf8 : function(min /*=0 bytes*/, max /*=4K bytes*/) {
    min = min || 0;
    max = max || 4*1024;
    var rv = "";
    var bytesRead = 0;
    
    try {
      do {
        if (!this.rl) {
          if (!this.rbuffer)
            this.rbuffer = iobufs.alloc();
          this.rl = this.readRaw(this.rbuffer);
          if (!this.rl && bytesRead < min) throw "End of stream";
          this.rstart = 0;
        }
        var b = Math.min(this.rl, max-bytesRead);
        
        // check for incomplete multibyte char at end:
        var mbyte = 0;
        for (var i = Math.min(b, 3); i>0; --i) {
          var c = this.rbuffer[this.rstart + b - i];
          // 110XXXXX
          if (i==1 && (c >> 5) == 0x06) { mbyte = 2; break; }
          // 1110XXXX
          if (i<=2 && (c >> 4) == 0x0E) { mbyte = 3; break; }
          // 11110XXX
          if (i<=3 && (c >> 3) == 0x1E) { mbyte = 4; break; }
        }
        // if there's a partial multi-byte character, don't read it yet:
        if (mbyte)
          b -= i;
        
        if (b) {
          var s = this.rbuffer.toString('utf8', this.rstart, this.rstart+b);
          bytesRead += b;
          rv += s;
          this.rstart += b;
          this.rl -= b;
        }
        if (mbyte && (bytesRead < min | !min)) {
          // we need at least another character & we've got a partial
          // multibyte character at the end of the buffer.

          if (mbyte + bytesRead > max) {
            // the multibyte character would take us over our allowed
            // number of bytes. it seems that there is an encoding error.
            // XXX we should really alert that somehow.
            // for now let's just read a partial character:
            mbyte = max - bytesRead;
          }
          if (mbyte) {
            var buf4 = b4bufs.alloc();
            try {
              bytesRead += this.readBuf(buf4, mbyte, mbyte);
              rv += buf4.toString('utf8', 0, mbyte);
            }
            finally {
              b4bufs.free(buf4);
            }
          }
        }
      } while (bytesRead < min);
      return rv;
    }
    finally {
      if (!this.rl && this.rbuffer) {
        iobufs.free(this.rbuffer);
        this.rbuffer = null;
      }      
    }
  },

  readOctets : function(min /*=0*/, max /*=4K*/) {
    min = min || 0;
    max = max || 4*1024;
    var rv = "";
    var bytesRead = 0;
    
    try {
      do {
        if (!this.rl) {
          if (!this.rbuffer)
            this.rbuffer = iobufs.alloc();
          this.rl = this.readRaw(this.rbuffer);
          if (!this.rl && bytesRead < min) throw "End of stream";
          this.rstart = 0;
        }
        var b = Math.min(this.rl, max-bytesRead);
                
        if (b) {
          var s = this.rbuffer.toString('binary', this.rstart, this.rstart+b);
          bytesRead += b;
          rv += s;
          this.rstart += b;
          this.rl -= b;
        }
      } while (bytesRead < min);
      return rv;
    }
    finally {
      if (!this.rl && this.rbuffer) {
        iobufs.free(this.rbuffer);
        this.rbuffer = null;
      }      
    }
  },

  readOctetMatches : function(regex, max /*=4*1024*/) {
    max = max || 4*1024;
    var accu = "";
    var bytesRead = 0;
    var matches;
    try {
      do {
        if (!this.rl) {
          if (!this.rbuffer)
            this.rbuffer = iobufs.alloc();
          this.rl = this.readRaw(this.rbuffer);
          if (!this.rl) throw "End of stream";
          this.rstart = 0;
        }
        var b = Math.min(this.rl, max-bytesRead);
                
        if (b) {
          var s = this.rbuffer.toString('binary', this.rstart, this.rstart+b);
          bytesRead += b;
          accu += s;
          this.rstart += b;
          this.rl -= b;
        }
      } while (!(matches=regex.exec(accu)) && bytesRead < max);
      if (!matches) throw "No matches not found in stream";
      // put back non-matched end characters:
      var rest = accu.length - matches[0].length;
      this.rl += rest;
      this.rstart -= rest;
      return matches;
    }
    finally {
      if (!this.rl && this.rbuffer) {
        iobufs.free(this.rbuffer);
        this.rbuffer = null;
      }      
    }
  },

  writeTo : function(stream) {
    var bytesCopied = 0;
    try { 
      do {
        if (!this.rl) {
          if (!this.rbuffer)
            this.rbuffer = iobufs.alloc();
          this.rl = this.readRaw(this.rbuffer);
          if (!this.rl) break; // eof
          this.rstart = 0;
        }
        stream.writeBuf(this.rbuffer, this.rstart, this.rl);
        bytesCopied += this.rl;
        this.rl=0;
      } while (true);
      return bytesCopied;
    }
    finally {
      if (!this.rl && this.rbuffer) {
        iobufs.free(this.rbuffer);
        delete this.rbuffer;
      }
    }
  }
};

//----------------------------------------------------------------------
// OutStream prototype

exports.OutStreamProto = {
  // To be provided by subclass:
  // writeRaw(buf, off, len) : write out buffer; return bytes written

  writeBuf : function(buf, off /*=0*/, len /*=buf.length*/) {
    off = off || 0;
    len = len || buf.length;
    while (len > 0) {
      var written = this.writeRaw(buf, off, len);
      // XXX do we need to handle 'written==0' ?
      off += written;
      len -= written;
    }
  },

  writeOctets : function(data) {
    // XXX rewrite in terms of IO buffers
    var buf = new Buffer(data, 'binary');
    this.writeBuf(buf);
  },

  writeUtf8 : function(data) {
    // XXX rewrite in terms of IO buffers
    var buf = new Buffer(data, 'utf8');
    this.writeBuf(buf);
  }
};

//----------------------------------------------------------------------
