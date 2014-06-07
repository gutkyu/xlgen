
var xl = require('../lib/xlgen');

var xlg = xl.createXLGen('./test.xls');

var fmtDate0 = xlg.addFormat(xl.formatStrings.date0);
var fmtDate1 = xlg.addFormat(xl.formatStrings.date1);
var fmtDate2 = xlg.addFormat(xl.formatStrings.date2);
var custfmtDate = xlg.addFormat('0.0000E+00');

var sht = xlg.addSheet('Sheet1');
//var sht = xlg.addSheet('시트1');

console.log(xl.formatStrings)

try{
    sht.cell(0, 1, 1);
    sht.cell(1, 1, 2.1);
    sht.cell(2, 3, 'hi!');
    sht.cell(3, 3, '안녕!');
    sht.cell(5, 4, new Date);
    sht.cell(6, 4, new Date, fmtDate0);
    sht.cell(7, 4, 10000,fmtDate0);
    sht.cell(8, 4, new Date, fmtDate1);
    sht.cell(9, 4, new Date, fmtDate2);
    sht.cell(10, 4, 9999,custfmtDate);
}catch(e){
    console.log(err.name, e.message);
}

xlg.end(function(err){
	if(err) console.log(err.name, err.message);
	else console.log('complete');
});
