var net = require('$net');

waitfor {
  using (var c = net.createConnection(80, 'onilabs.com')) {
    c.write("GET / HTTP/1.1\r\nHost:onilabs.com\r\n\r\n");
    var matches = c.readOctetMatches(/^HTTP\/(1\.(?:0|1)) (\d+) .*\r\n([^]*)\r\n\r\n/, 10*1024);
    console.log('http version:'+matches[1]);
    console.log('response code:'+matches[2]);
    console.log('headers:'+matches[3]);
    console.log("content:");
    waitfor {
      var str, accu="";
      while ((str=c.readUtf8()))
        accu += str;
    }
    or {
      hold(1000);
    }
    console.log("CL:"+accu.length);
  }
}
or {
  hold(10000);
  throw "timeout"
}
catch(e) {
  console.log("External request failed: "+e);
}

waitfor {
  using (var c = net.createConnection(7070)) {
    c.write("GET / HTTP/1.1\r\nHost:localhost\r\n\r\n");
    var str;
    while ((str=c.readOctets()))
      console.log(str.length);
  }
}
or {
  hold(10000);
  throw "timeout";
}
catch(e) {
  console.log("Local request failed: "+e);
}

