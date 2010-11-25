
function forever_greet() {
  var i=0;
  waitfor {
    while (1) {
      hold(1000);
      console.log((++i)+". Hello,");
    }
  }
  and {
    while (1) {
      try {
      require('./helloworld-module').delayedLog("  stratified world!");
      }catch(e) { console.log("oops: "+e); hold(1000); }
    }
  }
}

waitfor {
  forever_greet();
}
or {
  hold(11000);
  console.log("Enough with the greetings");
}

