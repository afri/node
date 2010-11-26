// Stratified version of dns.js

// Note that for build-technical reasons this lib has a '*.js'
// extension, whereas it should have a *.sjs one.

var dns = require('dns');

exports.lookup = function(domain, /*optional*/ family) {
  waitfor (var err, addr, fam) {
    dns.lookup(domain, family, resume);
  }
  // retract {XXX} 

  if (err) throw err;
  return { address: addr, family: fam };
};

exports.resolve = function(domain, rtype) {
  waitfor (var err, addresses) {
    dns.resolve(domain, rtype, resume);
  }
  // retract {XXX}

  if (err) throw err;
  return addresses;
};

var resolvers = [
  ['A', '4'], ['AAAA', '6'],
  ['MX', 'Mx' ], ['TXT', 'Txt'],
  ['SRV', 'Srv'], ['PTR', 'Ptr'],
  ['NS', 'Ns'], ['CNAME', 'Cname'] ];

resolvers.forEach(function (r) {
  exports['resolve'+r[1]] = function(domain) { return exports.resolve(domain, r[0]); };
});


exports.reverse = exports.resolvePtr;
