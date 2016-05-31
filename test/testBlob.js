var blobGen = require('../lib/blobGenerator');
var xl = require('../lib/xlgen');

var xlg = xl.createXLGen('./test.xls',{binGenerator : blobGen});

var fmtDate0 = xlg.addFormat(xl.formatStrings.date0);
var fmtDate1 = xlg.addFormat(xl.formatStrings.date1);
var fmtDate2 = xlg.addFormat(xl.formatStrings.date2);
var custfmtNum = xlg.addFormat('0.0000E+00');

var sht1 = xlg.addSheet('Sheet1');
var sht2 = xlg.addSheet('Sheet2');
//var sht = xlg.addSheet('시트1');

console.log(xl.formatStrings);//print all standard format strings

try{
    sht1.cell(0, 1, 1);
    sht1.cell(1, 1, 2.1);
    sht1.cell(2, 3, 'hi!');
    sht1.cell(3, 3, '안녕!');
	sht1.cell(10, 4, 9999,custfmtNum);
	
    sht2.cell(5, 4, new Date);
    sht2.cell(6, 4, new Date, fmtDate0);
    sht2.cell(7, 4, 10000,fmtDate0);
    sht2.cell(8, 4, new Date, fmtDate1);
    sht2.cell(9, 4, new Date, fmtDate2);
    
}catch(e){
    return console.log(e.name, e.message);
}

xlg.end(function(err,result){
	if(err){ return console.log(err);}
	else {
        console.log('result type : ',result instanceof ArrayBuffer ? 'ArrayBuffer':'Object');
        console.log('result.length:',result.byteLength);
        var fs = require('fs');
        var buffer = new Buffer(result.byteLength);
        var bfdv = new Uint8Array (result);
        for(var i =0; i < result.byteLength;i++){
            buffer[i] = bfdv[i];
        }
        fs.writeFileSync('./testBlob.xls',buffer,{flags:'w'});
        return;
    }
});
