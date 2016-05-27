module.exports = streamGenerator;

function streamGenerator(build, cleanup) {
    var self = this; // 'this' is options
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
                if(buffer){
                    ws.write(new Buffer(buffer.raw));
                    wrtLen += buffer.length;
                    //console.log('flush',buffer.length, wrtLen);
                }else{
                    ws.end();
                }
            });
        });
    }
};