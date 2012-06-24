# Mock UDP
**Node v0.8 compatible**

Mock requests and write tests for sending data to a UDP server.

## Installation
```
$ npm install mock-udp
```

## Basic Usage
```javascript
var mockudp = require('mock-udp');  // When imported, Socket gets patched immediately

// Create scope to capture UDP requests
var scope = mockudp('localhost:1234');

var client = require('dgram').createSocket('udp4');
var message = new Buffer('hello world');
client.send(message, 0, message.length, 1234, 'localhost', function(err, bytes) {
    scope.buffer; // scope.buffer is the buffer which would have been sent
    scope.done();  // Will throw an Error *if* the scope wasn't used
});
```
## Create a Mocked scope
Intercept all requests going to localhost, port 1234, and redirect sent data into the scope returned. All other requests without a scope attached will throw an Error.
```javascript
var scope = mockudp('localhost:1234');
```
After sending a request to `localhost:1234`, the buffer which was sent is available on the scope object:
```javascript
scope.buffer
```
The scope can also be verified that it was even used.
```javascript
scope.done();
```
`scope.done()` returns `true` if it has been used, but throws an exception if not, so it makes for easy testing.

## Patching `Socket.send`
By default, `Socket.send` gets patched when imported. To override this behavior, you can revert it:
```javascript
var mockudp = require('mock-udp');
mockudp.revert();
```
After `revert` is called, `Socket.send` is in it's original state. This can be again reversed manually by calling `intercept`:
```javascript
mockudp.intercept();
```
