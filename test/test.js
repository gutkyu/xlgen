
var xl = require('../lib/xlgen');

var xlg = xl.createXLGen('./test.xls');

var sht = xlg.addSheet('Sheet1');
//var sht = xlg.addSheet('시트1');

sht.cell(0, 1, 1);
sht.cell(1, 1, 2.1);
sht.cell(2, 3, 'hi!');
sht.cell(3, 3, '안녕!');

xlg.end(function(err){
	if(err) console.log(err.name, err.message);
	else console.log('complete');
});
