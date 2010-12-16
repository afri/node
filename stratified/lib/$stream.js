// Stratified stream support

// Note that for build-technical reasons this lib has a '*.js'
// extension, whereas it should have a *.sjs one.

//----------------------------------------------------------------------
// imports

var FreeList = require('freelist').FreeList;
var common = require('common');

//----------------------------------------------------------------------
// helpers

// pool of 4-byte buffers (for utf-8 conversion):
__js var b4bufs = new FreeList('b4buf', 10,
                               function() { return new Buffer(4); });

// pool of 4K buffers for general socket & file IO:
__js var iobufs = new FreeList('iobuf', 500,
                               function() { return new Buffer(8*1024); });

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
    do {
      if (!this.rl) {
        __js if (!this.rbuffer)
          this.rbuffer = iobufs.alloc();
        this.rl = this.readRaw(this.rbuffer);
        __js if (!this.rl && bytesRead < min) throw "End of stream";        
        this.rstart = 0;
      }
      __js var b = Math.min(this.rl, max-bytesRead);
      __js this.rbuffer.copy(buf, offset, this.rstart, this.rstart+b);
      bytesRead += b;
      this.rl -= b;
      this.rstart += b;
      offset += b;
    } while (bytesRead < min);
    // XXX this should really go into a finally block:
    __js if (!this.rl && this.rbuffer) {
      iobufs.free(this.rbuffer);
      delete this.rbuffer;
    }
    return bytesRead;
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
    
    do {
      if (!this.rl) {
        __js if (!this.rbuffer)
          this.rbuffer = iobufs.alloc();
        this.rl = this.readRaw(this.rbuffer);
        __js if (!this.rl && bytesRead < min) throw "End of stream";
        this.rstart = 0;
      }
      __js {
        var b = Math.min(this.rl, max-bytesRead);
        if (b) {
          var s = this.rbuffer.toString('binary', this.rstart, this.rstart+b);
          bytesRead += b;
          rv += s;
          this.rstart += b;
          this.rl -= b;
        }
      }
    } while (bytesRead < min);
    // XXX this should really go into a finally block:
    __js if (!this.rl && this.rbuffer) {
      iobufs.free(this.rbuffer);
      this.rbuffer = null;
    }      
    return rv;
  },

  readOctetMatches : function(regex, max /*=4*1024*/) {
    max = max || 4*1024;
    var accu = "";
    var bytesRead = 0;
    var matches;
    
    do {
      if (!this.rl) {
        __js if (!this.rbuffer)
          this.rbuffer = iobufs.alloc();
        this.rl = this.readRaw(this.rbuffer);
        __js if (!this.rl) throw "End of stream";
        this.rstart = 0;
      }
      __js {
        var b = Math.min(this.rl, max-bytesRead);        
        if (b) {
          __js var s = this.rbuffer.toString('binary', this.rstart, this.rstart+b);
          bytesRead += b;
          accu += s;
          this.rstart += b;
          this.rl -= b;
        }
        matches = regex.exec(accu);
        if (!matches) { console.log('no matches on "'+accu+'"'); }
      }
    } while (!matches && bytesRead < max);

    __js {
      if (!matches) throw "No matches not found in stream";
      // put back non-matched end characters:
      var rest = accu.length - matches[0].length;
      this.rl += rest;
      this.rstart -= rest;
      
      // XXX this should really go into a finally block;
      if (!this.rl && this.rbuffer) {
        iobufs.free(this.rbuffer);
        this.rbuffer = null;
      }     
    }
    return matches;
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
    __js var buf = iobufs.alloc();
    var len = data.length;
    var soff = 0;
    //    try {
    while (len) {
      __js var chunk = buf.write(data, 0, 'binary', soff);
      len -= chunk;
      soff += chunk;
      var off = 0;
      while (chunk > 0) {
        var bytes = this.writeRaw(buf, off, chunk);
        off += bytes;
        chunk -= bytes;
      }
    }
    //    }
    //    finally {
    __js iobufs.free(buf);
    //    }    
  },
  
  writeUtf8 : function(data) {
    // XXX rewrite in terms of IO buffers
    var buf = new Buffer(data, 'utf8');
    this.writeBuf(buf);
  }

};
__js exports.OutStreamProto.flush = function() {};

//----------------------------------------------------------------------
// StringBuf

__js {

  exports.createStringBuf = function() {
    return new StringBuf();
  };
  
  function StringBuf() {
    this.buffer = "";
  };

  StringBuf.prototype = {};

  StringBuf.prototype.attach = function(os) {
    this.os = os;
  };

  StringBuf.prototype.writeOctets = function(data) {
    this.buffer += data;
  };
}

StringBuf.prototype.flush = function() {
  this.os.writeOctets(this.buffer);
  this.buffer = "";
};

//----------------------------------------------------------------------
// OutStreamBuf

__js exports.createOutStreamBuf = function(size) {
  return new OutStreamBuf(size);
};

__js function OutStreamBuf(size) {
  this.buffer = new Buffer(size);
  this.size = size;
  this.bp = 0;
}

OutStreamBuf.prototype = {};
common.copyProps(exports.OutStreamProto, OutStreamBuf.prototype);

__js OutStreamBuf.prototype.attach = function(os) {
  this.os = os;
  this.bp = 0;
};
  
OutStreamBuf.prototype.flush = function() {
  if (this.bp) {
    this.os.writeBuf(this.buffer, 0, this.bp);
    this.bp = 0;
  }
};

__js OutStreamBuf.prototype.__finally__ = function() { this.flush(); };

OutStreamBuf.prototype.writeRaw = function(buf, off, len) {
  // XXX can be optimized to not copy in some cases
  __js var bytes = Math.min(this.size-this.bp, len);
  __js buf.copy(this.buffer, this.bp, off, off + bytes);
  this.bp += bytes;
  if (this.bp == this.size)
    this.flush();
  return bytes;
};

OutStreamBuf.prototype.writeOctets = function(data) { 
  var len = data.length;
  var soff = 0;
  while (len) {
    __js var chunk = this.buffer.write(data, this.bp, 'binary', soff);
    this.bp += chunk;
    len -= chunk;
    soff += chunk;
    if (len) this.flush();
  }
};


//----------------------------------------------------------------------
// RingBuf

__js exports.createRingBuf = function(size, os) {
  return new RingBuf(size, os);
};

function RingBuf(size, threshold) {
  __js this.buffer = new Buffer(size+1);
  this.size = size+1;
  this.threshold = threshold || 1;
}

RingBuf.prototype = {};
common.copyProps(exports.OutStreamProto, RingBuf.prototype);

RingBuf.prototype.attach = function(os) {
  this.os = os;
  this.insert = 0;
  this.remove = 0;
  var me = this;
  
  function prodWrite(written) {
    if (me.resumeWrite)
      __js me.resumeWrite(written);
  }
  function reader() {
    try {
      while (1) {
        if (me.os === null) return;
        var written = 0;
        //        console.log('resume with removing');
        if ((me.size + me.insert - me.remove) % me.size > 0) {
          //        console.log('removing: remove='+me.remove+' insert='+me.insert);
          var end;
          if (me.insert < me.remove) {
            end = me.size;
          }
          else {
            end = me.insert;
          }
          //__js console.log(me.os.fd+' to disk');
          written = end-me.remove;
          me.os.writeBuf(me.buffer, me.remove, written);
          me.remove = (me.remove + written) % me.size; 
        }
        //        console.log("done to disk");
        spawn(prodWrite, written);
        
        waitfor () { me.resumeRead = resume; }
        finally { me.resumeRead = null; }
      }
    } catch(e) { console.log(e+" "+me.os); /*XXX what to do */ }
  }
  // hmm, we want waitfor { reader() } and { continue; }
  // or synchronous spawn; in the meanwhile, the hold(0) is important here
  spawn(reader);
  hold(0);
};

RingBuf.prototype.detach = function() {
  // xxx this is where we would like to use spawn/abort
  if (!this.resumeRead && this.os) this.flush();
  var o = this.os;
  this.os = null;
  if (this.resumeRead) this.resumeRead();
};

RingBuf.prototype.flush = function() {
  if (this.os === null) return;
  while ((this.size + this.insert - this.remove) % this.size) {
    waitfor () {
      this.resumeWrite = resume;
      if (this.resumeRead) this.resumeRead();
    }
  }
};

RingBuf.prototype.__finally__ = function() { this.flush(); this.detach(); };

RingBuf.prototype.writeRaw = function(buf, off, len) {
  var avail;
  if ((avail=(this.size + this.insert - this.remove) % this.size) == this.size-1) {
    //      console.log(' avail='+avail+' - we need to block');
    waitfor (var written) { this.resumeWrite = resume; }
    finally {
      avail -= written;
      this.resumeWrite = null;
    }
  }
  //    console.log('inserting: remove='+this.remove+' insert='+this.insert);
  var end;
  if (this.insert >= this.remove)
    end = this.size;
  else
    end = this.remove;
  __js var bytes = Math.min(this.size-1, end-this.insert, len);
  __js buf.copy(this.buffer, this.insert, off, off + bytes);
  this.insert = (this.insert + bytes) % this.size;
  //    console.log("after insert: "+this.remove+" -- "+this.insert);
  if ((avail+bytes >= this.threshold) && this.resumeRead) {
    //        console.log('prod remove');
    __js this.resumeRead();
  }
  return bytes;
};

RingBuf.prototype.writeOctetsRaw = function(octets) {
  var avail;
  if ((avail=(this.size + this.insert - this.remove) % this.size) == this.size-1) {
    //      console.log(' avail='+avail+' - we need to block');
    waitfor (var written) { this.resumeWrite = resume; }
    finally {
      avail -= written;
      this.resumeWrite = null;
    }
  }
  //    console.log('inserting: remove='+this.remove+' insert='+this.insert);
  var end;
  if (this.insert >= this.remove)
    end = this.size;
  else
    end = this.remove;
  __js var bytes = Math.min(this.size-1, end-this.insert, octets.length);
  __js this.buffer.write(octets.substring(0,bytes), this.insert, 'binary');
  this.insert = (this.insert + bytes) % this.size;
  //    console.log("after insert: "+this.remove+" -- "+this.insert);
  if ((avail+bytes >= this.threshold) && this.resumeRead) {
    //        console.log('prod remove');
    __js this.resumeRead();
  }
  return bytes;
};
  
RingBuf.prototype.writeOctets2 = function(data) {
  var len = data.length;
  while (len) {
    written = this.writeOctetsRaw(data);
    len -= written;
    if (len) 
      __js data = data.substring(written);
  }
};
