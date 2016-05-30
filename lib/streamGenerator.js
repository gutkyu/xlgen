module.exports = streamGenerator;

var blobToBuffer = null;
var ver = /^v(\d+)\./.exec(process.version);
if(ver && parseInt(ver[1]) < 6){//node.js version < 6.0.0
    blobToBuffer = function(blob) {
        var buffer = new Buffer(blob.byteLength);
        var bfdv = new Uint8Array(blob);
        for(var i =0; i < blob.byteLength;i++){
            buffer[i] = bfdv[i];
        }
        return buffer;
    }
}else{
    blobToBuffer = Buffer.from;
}

function streamGenerator(build, cleanup) {
    var self = this; // 'this' is options
    return function(callback){
        var Buf = require('./bufferView');
        var fs = require('fs');
        var ws = fs.createWriteStream(self.path, {flags:'w'});
        ws.on('finish', function(){
            cleanup();
            callback();
        });
        ws.on('error', callback);
        ws.on('open', function(){
            var wrtLen = 0;
            build(function(buffer){
                if(buffer instanceof Buf){
                    ws.write(blobToBuffer(buffer.raw));
                    wrtLen += buffer.length;
                    //console.log('flush',buffer.length, wrtLen);
                }else if(buffer){
                    if(!buffer.length) return;
                    if(!(buffer[0] instanceof Buf))
                        return callback('unsupported type');
                    buffer.forEach(function (x) {
                        ws.write(blobToBuffer(x.raw));
                        wrtLen += x.length;
                    });
                    //console.log('flush',buffer.length, wrtLen);
                }else{
                    ws.end();
                }
            });
        });
    }
};