var fs = require('$fs');
var util = require('util');

var path = "/tmp/wt.dat";
var tsize = 1000 * 1048576;
var bsizes = [1024, 4096, 8192, 16384, 32768, 65536];

__js function bufit(size) {
  var buf = new Buffer(size);
  for (var i = 0; i <buf.length ; i += 1) {
    buf[i] = 33;
  }
  return buf;
}


function writetest(bsize) {
  var s = fs.openOutStream(path, 'w', 0644);
  var remaining = tsize;
  var buf = bufit(bsize);
  var c = 0;
  var start = Date.now();
  while (remaining > 0) {
    s.writeBuf(buf);
    remaining -= bsize;
    if (++c % 2000 == 0) util.print(".");
  }
  s.close();
  var diff = Date.now() - start;
  console.log('Wrote '+ tsize +' bytes in '+  diff/1000 +'s using '+
              bsize +' byte buffers: '+
              ((tsize/(diff/1000)) / 1048576) +' mB/s');    
}

function readtest(bsize) {
  var s = fs.openInStream(path, 'r', 0644);
  var remaining = tsize;
  var buf = new Buffer(bsize);
  var start = Date.now();
  while (s.readBuf(buf) > 0)
    /**/;
  var diff = Date.now() - start;
  console.log('Read '+ tsize +' bytes in '+  diff/1000 +'s using '+
              bsize +' byte buffers: '+
              ((tsize/(diff/1000)) / 1048576) +' mB/s');    
}


for (var i=0; i<bsizes.length; ++i)
  writetest(bsizes[i]);

for (var i=0; i<bsizes.length; ++i)
  readtest(bsizes[i]);

fs.unlink(path);
console.log('all done');
