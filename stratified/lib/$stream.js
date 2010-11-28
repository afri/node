// Stratified stream support

// Note that for build-technical reasons this lib has a '*.js'
// extension, whereas it should have a *.sjs one.

// pool of 4 bytes buffers:
var bufpool = [];
function get4ByteBuf() {
  if (!bufpool.length)
    return new Buffer(4);
  else
    return bufpool.pop();
}
function release4ByteBuf(buf) {
  if (bufpool.length<100)
    bufpool.push(buf);
}

exports.createStreamReader = function(is, encoding /*='utf8'*/) {
  if (!encoding || encoding == 'utf8')
    return new Utf8StreamReader(is);
  throw new Error("Unknown encoding");
};

function Utf8StreamReader(is) {
  this.is = is;
};
Utf8StreamReader.prototype = {
  read : function(min /*=0*/, max /*=4*1024*/) {
    min = min || 0;
    max = max || 4*1024;
    var rv = "";
    var charsRead = 0;
    
    // utf8 is a contracting encoding (characters<=bytes), so we'll
    // require at least 'min' bytes to fill 'min' characters.
    do {
      if (!this.is.feed() && charsRead < min)
        throw "End of stream";
      var b = Math.min(this.is.rl, max-charsRead);
      
      // check for incomplete multibyte char at end:
      var mbyte = 0;
      for (var i = Math.min(b, 3); i>0; --i) {
        var c = this.is.rbuffer[this.is.rstart + b - i];
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
        var s = this.is.rbuffer.toString('utf8', this.is.rstart, this.is.rstart+b);
        charsRead += s.length;
        rv += s;
        this.is.rstart += b;
        this.is.rl -= b;
      }
      if (mbyte && (charsRead < min | !min)) {
        // we need at least another character & we've got a partial
        // multibyte character at the end of the buffer:
        var buf4 = get4ByteBuf();
        try {
          this.is.read(buf4, mbyte, mbyte);
          rv += buf4.toString('utf8', 0, mbyte);
          ++charsRead;
        }
        finally {
          release4ByteBuf(buf4);
        } 
      }
    } while (charsRead < min);
    return rv;
  }
};
