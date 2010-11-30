var net = require('$net');
var exec = require('$child_process').exec;

var s = net.createServer(9090);
var i = 0;
console.log("Listening for connections on port 9090");
s.run(function(c) {
  console.log("Accepting "+(++i)+". connection from "+c.remoteAddress);
  c.writeOctets("Welcome to the echo server on "+exec('uname -a').stdout);
  c.writeOctets("You are the "+i+". connection.\r\n");
  while (1) {
    waitfor {
      var s = c.readOctets();
      if (!s.length) return; // EOF
      c.writeOctets(s);
    }
    or {
      hold(10000);
      c.writeOctets("10s inactivity timout expired!\r\n");
      return;
    }
  }
});
