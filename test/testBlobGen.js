module.exports = blobGenerator;

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

function blobGenerator(build, cleanup) {
    var self = this;
    var Buf = self.BufferView;
    var fs = require('fs');
    return function(callback){
        var len = 0;
        var chunks = [];
        var raw = null;
        build(function(buffer){
           if(!buffer){
               raw = Buf.concat(chunks).raw;
               var buffer = blobToBuffer(raw);
               fs.writeFileSync(self.path,buffer,{flags:'w'});
               cleanup();
               return callback(null,raw);
           }else{
               if(Buf.isBufferView(buffer)){
                   chunks.push(buffer);
                   len += buffer.length;
               }else if(Array.isArray(buffer)){
                   if(!buffer.length) return;
                   if(!(Buf.isBufferView(buffer[0])))
                    return callback('unsupported type');
                   buffer.forEach(function (x) {
                       chunks.push(x);
                       len += x.length;
                   });
               }else{
                   return callback('unsupported type');
               }
           }
        });
    }
}