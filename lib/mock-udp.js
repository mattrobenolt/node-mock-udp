var Socket = require('dgram').Socket;

function Scope() {
    this._done = false;
    this.buffer = null;
    this.offset = 0;
    this.length = 0;
    this.port = 0;
    this.address = null;
}
Scope.prototype.done = function() {
    if (!this._done)
        throw new Error('Scope was not used!');
    return true;
}

function overriddenSocketSend(buffer, offset, length, port, address, callback) {
    if (offset >= buffer.length)
        throw new Error('Offset into buffer too large');

    if (offset + length > buffer.length)
        throw new Error('Offset + length beyond buffer length');

    var newBuffer = buffer.slice(offset, offset + length);

    var host = address + ':' + port;
    if (intercepts.hasOwnProperty(host)) {
        intercepts[host].forEach(function(scope){
            // Populate scope with data what was sent
            scope._done = true;
            scope.buffer = newBuffer;
            scope.offset = offset;
            scope.length = length;
            scope.port = port;
            scope.address = address;
        });
        // scopes have been used, clean up so they don't run again
        delete intercepts[host];

        if (callback)
            callback(null, length);
        return;
    }
    throw new Error('Request sent to unmocked path: ' + host);
}
overriddenSocketSend._mocked = true;


function overriddenSocketConnect(port, address = '127.0.0.1', cb = () => {}) {
  this.send = (buffer, callback) => {
    console.log('repara que esse individuo chegou aqui...')
    return overriddenSocketSend(buffer, null, null, port, address, callback)
  }
  cb()
}
overriddenSocketConnect._mocked = true;


var intercepts = {};
function add(path) {
    if (!intercepts.hasOwnProperty(path)) {
        intercepts[path] = [];
    }
    var scope = new Scope();
    intercepts[path].push(scope);
    return scope;
}

function cleanInterceptions() {
    intercepts = {};
}

var oldSocketSend = Socket.prototype.send;
var oldSocketConnect = Socket.prototype.connect;
function restoreSocketPrototype() {
    Socket.prototype.send = oldSocketSend;
    Socket.prototype.connect = oldSocketConnect
}

// Punch Socket prototype in the mouth
function interceptSocketPrototype() {
    Socket.prototype.send = overriddenSocketSend;
    Socket.prototype.connect = overriddenSocketConnect;
}
interceptSocketPrototype();

module.exports = add;
module.exports.revert = restoreSocketPrototype;
module.exports.intercept = interceptSocketPrototype;
module.exports.clean = cleanInterceptions;
module.exports.isMocked = function() { 
  return Socket.prototype.send.hasOwnProperty('_mocked') && Socket.prototype.connect.hasOwnProperty('_mocked')
}
module.exports.version = require('../package.json').version;
