var mockudp = require('./lib/mock-udp');
var dgram = require('dgram');
var Socket = dgram.Socket;

var buffer = new Buffer('hello world');

describe('mock-udp.version', function(){
    it('should be valid', function(){
        mockudp.version.should.match(/^\d+\.\d+\.\d+(-\w+)?$/);
    });

    it('should match package.json', function(){
        var version = require('./package.json').version;
        mockudp.version.should.equal(version);
    });
});

describe('mock-udp.intercept', function(){
    it('should have punched Socket.prototype.send and Socket.prototype.connect in the face', function(){
        mockudp.intercept();
        mockudp.isMocked().should.be.ok;
        mockudp.revert();
    });
});

describe('mock-udp.revert', function(){
    it('should revert back to the unpunched state', function(){
        mockudp.intercept();
        mockudp.revert();
        mockudp.isMocked().should.not.be.ok;
    });
});

describe('mock-udp.add', function(){
    it('should return a new, unused Scope', function(){
        var scope = mockudp();
        scope.done.should.throw();
        mockudp.clean();
    });
});

describe('mock-udp.clean', function(){
    it('should clean all interceptions', function(){
        var range = [0,1,2,3,4,5,6,7,8,9];
        range.forEach(function(i){
            mockudp('localhost:100' + i);
        });
        mockudp.intercept();
        mockudp.clean();
        var client = dgram.createSocket('udp4');
        range.forEach(function(i){
            (function(){
                client.send(buffer, 0, buffer.length, 1000+i, 'localhost');
            }).should.throw();
        });
    });
});

describe('mock-udp.overriddenSocketSend', function(){
    beforeEach(function(){
        mockudp.intercept();
        mockudp.clean();
    });

    it('should intercept a basic UDP request', function(done){
        var scope = mockudp('localhost:1000');
        var client = dgram.createSocket('udp4');
        client.send(buffer, 0, buffer.length, 1000, 'localhost', function(err, bytes) {
            scope.done();
            done();
        });
    });

    it('should not throw an exception with a missing callback', function(){
        var scope = mockudp('localhost:1000');
        var client = dgram.createSocket('udp4');
        client.send(buffer, 0, buffer.length, 1000, 'localhost');
    });

    it('should return the correct number of bytes to the callback', function(done){
        var scope = mockudp('localhost:1000');
        var client = dgram.createSocket('udp4');
        client.send(buffer, 0, 5, 1000, 'localhost', function(err, bytes) {
            bytes.should.equal(5);
            done();
        });
    });

    it('should return a scope with a correct buffer', function(done){
        var scope = mockudp('localhost:1000');
        var client = dgram.createSocket('udp4');
        client.send(buffer, 1, 6, 1000, 'localhost', function(err, bytes) {
            scope.buffer.toString().should.equal('ello w');
            done();
        });
    });

    it('should handle two UDP intercepts per request', function(done){
        var scope1 = mockudp('localhost:1000');
        var scope2 = mockudp('localhost:1000');
        var client = dgram.createSocket('udp4');
        client.send(buffer, 0, buffer.length, 1000, 'localhost', function(err, bytes) {
            scope1.done();
            scope2.done();
            done();
        });
    });

    it('should throw an error when reusing an intercept', function(done){
        var scope = mockudp('localhost:1000');
        var client = dgram.createSocket('udp4');
        client.send(buffer, 0, buffer.length, 1000, 'localhost', function(err, bytes) {
            scope.done();
            (function(){
                client.send(buffer, 0, buffer.length, 1000, 'localhost');
            }).should.throw();
            done();
        });
    });

    it('should throw an error if offset is equal to the length of the buffer', function(){
        var scope = mockudp('localhost:1000');
        var client = dgram.createSocket('udp4');
        (function(){
            client.send(buffer, buffer.length, buffer.length, 1000, 'localhost');
        }).should.throw();
        scope.done.should.throw();
    });

    it('should throw an error if offset is greater than the length of the buffer', function(){
        var scope = mockudp('localhost:1000');
        var client = dgram.createSocket('udp4');
        (function(){
            client.send(buffer, buffer.length + 1, buffer.length, 1000, 'localhost');
        }).should.throw();
        scope.done.should.throw();
    });

    it('should throw an error if the length is greater than the length of the buffer', function(){
        var scope = mockudp('localhost:1000');
        var client = dgram.createSocket('udp4');
        (function(){
            client.send(buffer, 0, buffer.length + 1, 1000, 'localhost');
        }).should.throw();
        scope.done.should.throw();
    });
});