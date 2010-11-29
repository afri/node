var fs = require('$fs');

streamRawFile('./testfiles/utf8-doubles.txt');
streamUtf8File('./testfiles/utf8-doubles.txt');

streamRawFile('./testfiles/utf8-triples.txt');
streamUtf8File('./testfiles/utf8-triples.txt');

streamRawFile('./testfiles/utf8-quads.txt');
streamUtf8File('./testfiles/utf8-quads.txt');
streamOctetFile('./testfiles/utf8-quads.txt');
readUtf8Bytes('./testfiles/utf8-quads.txt', 40);



function streamRawFile(f) {
  using(var stream = fs.openInStream(f)) {
    var b = new Buffer(7);
    var bytesRead = 0;
    var bytes = "";
    var r;
    while ((r = stream.readBuf(b))) {
      for (var i=0; i<r; ++i)
        bytes += b[i] + " ";
      bytesRead += r;
    }
  }
  console.log(f);
  console.log("Bytes: "+bytesRead);
  console.log("Raw:\n"+bytes);
  console.log("-------------------------");
}

function streamUtf8File(f) {
  using(var stream = fs.openInStream(f)) {
    var str = "";
    var r;
    while ((r = stream.readUtf8()).length)
      str += r;
  }
  console.log(f);
  console.log("Chars: "+str.length);
  console.log("Utf8:\n"+str);
  console.log("-------------------------");
}

function readUtf8Bytes(f, b) {
  using(var stream = fs.openInStream(f)) {
    var str = stream.readUtf8(b,b);
  }
  console.log(f);
  console.log("Bytes: "+b);
  console.log("Chars: "+str.length);
  console.log("Utf8:\n"+str);
  console.log("-------------------------");
}


function streamOctetFile(f) {
  using(var stream = fs.openInStream(f)) {
    var str = "";
    var r;
    while ((r = stream.readOctets()).length)
      str += r;
  }
  console.log(f);
  console.log("Chars: "+str.length);
  console.log("Octet:\n"+str);
  console.log("-------------------------");
}
