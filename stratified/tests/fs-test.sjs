var fs = require('$fs');

streamFile('./testfiles/utf8-doubles.txt');
streamFile('./testfiles/utf8-triples.txt');
streamFile('./testfiles/utf8-quads.txt');

function streamFile(f) {
  using(var stream = fs.openInStream(f)) {
    // pick buffer size to be a prime>3, so that we hit the decoder
    // boundary for multi-byte sequences:
    var b = new Buffer(7);
    var str = "";
    var bytesRead = 0;
    var bytes = "";
    var r;
    while ((r = stream.read(b))) {
      for (var i=0; i<r; ++i)
        bytes += b[i] + " ";
      str += b.toString('utf8',0,r);
      bytesRead += r;
    }
  }
  console.log(f);
  console.log("Bytes: "+bytesRead);
  console.log("Chars: "+str.length);
  console.log("Raw:\n"+bytes);
  console.log("Utf8:\n"+str);
  console.log("-------------------------");
}
