var net = require('$net');

waitfor {
  using (var c = net.createConnection(80, 'onilabs.com')) {
    c.writeOctets("GET / HTTP/1.1\r\nHost:onilabs.com\r\n\r\n");
    var matches = c.readOctetMatches(/^HTTP\/(1\.(?:0|1)) (\d+) .*\r\n([^]*)\r\n\r\n/, 10*1024);
    console.log('http version:'+matches[1]);
    console.log('response code:'+matches[2]);
    console.log('headers:'+matches[3]);
    waitfor {
      var str, accu="";
      while ((str=c.readUtf8()))
        accu += str;
    }
    or {
      hold(1000);
    }
    console.log("measured content length (utf8 chars):"+accu.length);
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
    c.writeOctets("GET / HTTP/1.1\r\nHost:localhost\r\n\r\n");
    var matches = c.readOctetMatches(/^HTTP\/(1\.(?:0|1)) (\d+) .*\r\n([^]*)\r\n\r\n/, 10*1024);
    console.log('http version:'+matches[1]);
    console.log('response code:'+matches[2]);
    console.log('headers:'+matches[3]);
    waitfor {
      var str, accu="";
      while ((str=c.readUtf8()))
        accu += str;
    }
    or {
      hold(1000);
    }
    console.log("measured content length (utf8 chars):"+accu.length);
  }
}
or {
  hold(10000);
  throw "timeout";
}
catch(e) {
  console.log("Local request failed: "+e);
}

