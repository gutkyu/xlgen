module.exports = generator;

function extractNodejsBuffer(buffer) {
    return buffer.rawOffset == 0 && buffer.rawLength === buffer.length ?
               buffer.raw : buffer.raw.slice(buffer.rawOffset, buffer.rawOffset + buffer.length);
}
function generator(build, cleanup) {
    var self = this; // 'this' is options
    var Buf = self.BufferView;
    return function(callback){
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
                if(Buf.isBufferView(buffer)){
                    ws.write(extractNodejsBuffer(buffer));
                    wrtLen += buffer.length;
                    //console.log('flush',buffer.length, wrtLen);
                }else if(Array.isArray(buffer)){
                    if(!buffer.length) return;
                    if(!(Buf.isBufferView(buffer[0])))
                        return callback('unsupported type');
                    buffer.forEach(function (x) {
                        ws.write(extractNodejsBuffer(x));
                        wrtLen += x.length;
                    });
                    //console.log('flush',buffer.length, wrtLen);
                }else if(!buffer){
                    ws.end();
                }else{
                    return callback('unsupported type');
                }
            });
        });
    }
};