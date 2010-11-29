// Common JS utility functions
//

exports.copyProps = function(src, dest) {
  for (var p in src)
    dest[p] = src[p];
};

