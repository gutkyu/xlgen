module.exports = blobGenerator;

function blobGenerator(build, cleanup) {
    return function(callback){
        var Buf = require('./bufferView');
        var len = 0;
        var chunks = [];
        var raw = null;
        build(function(buffer){
           if(!buffer){
               raw = Buf.concat(chunks).raw;
               cleanup();
               return callback(null,raw);
           }else{
               if(buffer instanceof Buf){
                   chunks.push(buffer);
                   len += buffer.length;
               }else if(Array.isArray(buffer)){
                   if(!buffer.length) return;
                   if(!(buffer[0] instanceof Buf))
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