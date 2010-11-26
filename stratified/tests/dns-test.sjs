var dns = require('$dns');

var google = dns.lookup("google.com");
console.log("google.com is " + google.address);
console.log(google.address + " is " + dns.reverse(google.address));

