var fs = require('$fs');

try {
  fs.unlink('./testfile.txt');
} catch(e) {}

using (var s = fs.openOutStream('./testfile.txt')) {
  s.writeOctets('The quick brown fox jumps over the lazy dog');
}
using (var s = fs.openInStream('./testfile.txt')) {
  while (d = s.readOctets())
    console.log(d);
}

using (var s = fs.openOutStream('./testfile.txt')) {
  // write 10MB of data
  var str = '';
  for (var i=0; i<1024*10; ++ i) 
    str += i%10;
  for (var i=0; i<1024; ++i) {
    s.writeOctets(str);
  }
}

console.log("testfile is now "+fs.stat('./testfile.txt').size+"bytes long (should be "+(1024*1024*10+43)+")");

console.log('copy to testfile2:');
using (var s = fs.openInStream('./testfile.txt')) {
  using (var t = fs.openOutStream('./testfile2.txt')) {
    s.writeTo(t);
  }
}

console.log("testfile2 is now "+fs.stat('./testfile2.txt').size+"bytes long (should be "+(1024*1024*10+43)+")");


fs.unlink('./testfile.txt');
fs.unlink('./testfile2.txt');
