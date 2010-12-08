// This is a rather complex test which sets up various TLS servers with node
// and connects to them using the 'openssl s_client' command line utility
// with various keys. Depending on the certificate authority and other
// parameters given to the server, the various clients are
// - rejected,
// - accepted and "unauthorized", or
// - accepted and "authorized".

var testCases =
  [ { title: "Do not request certs. Everyone is unauthorized.",
      requestCert: false,
      rejectUnauthorized: false,
      CAs: ['ca1-cert'],
      clients:
        [ { name: 'agent1', shouldReject: false, shouldAuth: false },
          { name: 'agent2', shouldReject: false, shouldAuth: false },
          { name: 'agent3', shouldReject: false, shouldAuth: false },
          { name: 'nocert', shouldReject: false, shouldAuth: false }
        ]
    },

    { title: "Allow both authed and unauthed connections with CA1",
      requestCert: true,
      rejectUnauthorized: false,
      CAs: ['ca1-cert'],
      clients:
        [ { name: 'agent1', shouldReject: false, shouldAuth: true },
          { name: 'agent2', shouldReject: false, shouldAuth: false },
          { name: 'agent3', shouldReject: false, shouldAuth: false },
          { name: 'nocert', shouldReject: false, shouldAuth: false }
        ]
    },

    { title: "Allow only authed connections with CA1",
      requestCert: true,
      rejectUnauthorized: true,
      CAs: ['ca1-cert'],
      clients:
        [ { name: 'agent1', shouldReject: false, shouldAuth: true },
          { name: 'agent2', shouldReject: true },
          { name: 'agent3', shouldReject: true },
          { name: 'nocert', shouldReject: true }
        ]
    },

  ];


var common = require('../common');
var assert = require('assert');
var fs = require('fs');
var tls = require('tls');
var spawn = require('child_process').spawn;


function filenamePEM(n) {
  return require('path').join(common.fixturesDir, 'keys', n + ".pem");
}


function loadPEM(n) {
  return fs.readFileSync(filenamePEM(n)).toString();
}


var serverKey = loadPEM('agent2-key');
var serverCert = loadPEM('agent2-cert');


function runClient (options, cb) {

  // Client can connect in three ways:
  // - Self-signed cert
  // - Certificate, but not signed by CA.
  // - Certificate signed by CA.

  var args = ['s_client', '-connect', '127.0.0.1:' + common.PORT];

  switch (options.name) {
    case 'agent1':
      // Signed by CA1
      args.push('-key');
      args.push(filenamePEM('agent1-key'));
      args.push('-cert');
      args.push(filenamePEM('agent1-cert'));
      break;

    case 'agent2':
      // Self-signed
      // This is also the key-cert pair that the server will use.
      args.push('-key');
      args.push(filenamePEM('agent2-key'));
      args.push('-cert');
      args.push(filenamePEM('agent2-cert'));
      break;

    case 'agent3':
      // Signed by CA2
      args.push('-key');
      args.push(filenamePEM('agent3-key'));
      args.push('-cert');
      args.push(filenamePEM('agent3-cert'));
      break;

    case 'nocert':
      // Do not send certificate
      break;

    default:
      throw new Error("Unknown agent name");
  }

  // To test use: openssl s_client -connect localhost:8000
  var client = spawn('openssl', args);
  //console.error(args);

  var out = '';

  var rejected = true;
  var authed = false;

  client.stdout.setEncoding('utf8');
  client.stdout.on('data', function(d) {
    out += d;

    if (/_unauthed/g.test(out)) {
      console.error("  * unauthed");
      client.stdin.end('goodbye\n');
      authed = false;
      rejected = false;
    }

    if (/_authed/g.test(out)) {
      console.error("  * authed");
      client.stdin.end('goodbye\n');
      authed = true;
      rejected = false;
    }
  });

  //client.stdout.pipe(process.stdout);

  client.on('exit', function(code) {
    if (options.shouldReject) {
      assert.equal(true, rejected);
    } else {
      assert.equal(false, rejected);
      assert.equal(options.shouldAuth, authed);
    }

    cb();
  });
}


// Run the tests
var successfulTests = 0;
function runTest (testIndex) {
  var tcase = testCases[testIndex];
  if (!tcase) return;

  console.error("Running '%s'", tcase.title);

  var cas = tcase.CAs.map(loadPEM);

  var server = tls.Server({ key: serverKey,
                            cert: serverCert,
                            ca: cas,
                            requestCert: tcase.requestCert,
                            rejectUnauthorized: tcase.rejectUnauthorized });

  var connections = 0;

  server.on('authorized', function(c) {
    connections++;
    console.error('- authed connection');
    c.write('\n_authed\n');
  });

  server.on('unauthorized', function(c, e) {
    connections++;
    console.error('- unauthed connection: %s', e);
    c.write('\n_unauthed\n');
  });

  function runNextClient (clientIndex) {
    var options = tcase.clients[clientIndex];
    if (options) {
      runClient(options, function () {
        runNextClient(clientIndex + 1);
      });
    } else {
      server.close();
      successfulTests++;
      runTest(testIndex + 1);
    }
  }

  server.listen(common.PORT, function() {
    runNextClient(0);
  });
}


runTest(0);


process.on('exit', function() {
  assert.equal(successfulTests, testCases.length);
});
