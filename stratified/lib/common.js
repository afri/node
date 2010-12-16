// Common JS utility functions
//

exports.copyProps = function(src, dest) {
  for (var p in src)
    dest[p] = src[p];
};

/*
     Implementation is taken from
     parseUri 1.2.2
     (c) Steven Levithan <stevenlevithan.com>
     MIT License
     http://blog.stevenlevithan.com/archives/parseuri
*/
exports.parseURL = function(str) {
  var o = exports.parseURL.options,
  m = o.parser.exec(str),
  uri = {},
  i = 14;
  
  while (i--) uri[o.key[i]] = m[i] || "";

  uri[o.q.name] = {};
  uri[o.key[12]].replace(o.q.parser, function($0, $1, $2) {
    if ($1) uri[o.q.name][$1] = $2;
  });
  
  return uri;
};
exports.parseURL.options = {
	key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
	q:   {
		name:   "queryKey",
		parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	},
  // We're only using the 'strict' mode parser:
	parser: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/
};
