// Stratified version of fs.js

// Note that for build-technical reasons this lib has a '*.js'
// extension, whereas it should have a *.sjs one.

var fs = require('fs');

exports.rename = function(path1, path2) {
  waitfor (var err) { fs.rename(path1, path2, resume); }
  if (err) throw err;
};

exports.truncate = function(fd, len) {
  waitfor (var err) { fs.truncate(fd, len, resume); }
  if (err) throw err;
};

exports.chmod = function(path, mode) {
  waitfor (var err) { fs.chmod(path, mode, resume); }
  if (err) throw err;
};

exports.stat = function(path) {
  waitfor (var err, stats) { fs.stat(path, resume); }
  if (err) throw err;
  return stats;
};

exports.lstat = function(path) {
  waitfor (var err, stats) { fs.lstat(path, resume); }
  if (err) throw err;
  return stats;
};

exports.fstat = function(fd) {
  waitfor (var err, stats) { fs.fstat(fd, resume); }
  if (err) throw err;
  return stats;
};

exports.link = function(srcpath, dstpath) {
  waitfor (var err) { fs.link(srcpath, dstpath, resume); }
  if (err) throw err;
};

exports.symlink = function(linkdata, path) {
  waitfor (var err) { fs.symlink(linkdata, path, resume); }
  if (err) throw err;
};

exports.readlink = function(path) {
  waitfor (var err, resolvedPath) { fs.readlink(path, resume); }
  if (err) throw err;
  return resolvedPath;
};

exports.realpath = function(path) {
  waitfor (var err, resolvedPath) { fs.realpath(path, resume); }
  if (err) throw err;
  return resolvedPath;
};

exports.unlink = function(path) {
  waitfor (var err) { fs.unlink(path, resume); }
  if (err) throw err;
};

exports.rmdir = function(path) {
  waitfor (var err) { fs.rmdir(path, resume); }
  if (err) throw err;
};

exports.mkdir = function(path, mode) {
  waitfor (var err) { fs.mkdir(path, mode, resume); }
  if (err) throw err;
};

exports.readdir = function(path) {
  waitfor (var err, files) { fs.readdir(path, resume); }
  if (err) throw err;
  return files;
};

exports.close = function(fd) {
  waitfor (var err) { fs.close(fd, resume); }
  if (err) throw err;
};

exports.open = function(path, flags, mode) {
  waitfor (var err, fd) { fs.open(path, flags, mode, resume); }
  if (err) throw err;
  return fd;
};

exports.write = function(fd, buffer, offset, length, position) {
  waitfor (var err, written) {
    fs.write(fd, buffer, offset, length, position, resume);
  }
  if (err) throw err;
  return fd;
};

exports.read = function(fd, buffer, offset, length, position) {
  waitfor (var err, bytesRead) {
    fs.read(fd, buffer, offset, length, position, resume);
  }
  if (err) throw err;
  return bytesRead;
};

exports.readFile = function(filename, /* opt */ encoding) {
  waitfor (var err, data) { fs.readFile(filename, encoding, resume); }
  if (err) throw err;
  return data;
};

exports.writeFile = function(filename, data, encoding /*='utf8'*/) {
  waitfor (var err) { fs.writeFile(filename, data, encoding, resume); }
  if (err) throw err;
};

// XXX watchFile/unwatchFile are a pretty bad interface, in the sense
// that it's not safe to watch/unwatch the same file from different
// places in the code at the same time. We work around that by doing
// our own bookkeeping on top of that in fs.js:
var watchers = {};

exports.waitforChange = function(filename, interval /*=0*/) {
  waitfor (var curr, prev) {
    if (!watchers[filename])
      watchers[filename] = 1;
    else
      ++watchers[filename];
    fs.watchFile(filename,
                 { persistent:true, interval:interval||0},
                 resume);
  }
  finally {
    if (--watchers[filename] <= 0) {
      delete watchers[filename];
      fs.unwatchFile(filename);
    }
  }
  
  return { curr: curr, prev: prev }; 
}; 

