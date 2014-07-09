# XLGen
node.js's module to generate Microsoft Excel 97 ~ 2003 File(.xls)

## Features
*  Excel 97 ~ 2003 File Format
*  pure javascript on node.js

## Changelog
### 0.2.2
* fixed 
  Unable to create more than one sheet in a workbook

### 0.2.1
* added support for date - ivantodorovich  
  convert javascript date value to excel raw value(number)
* added support number and date formats  
* modified to overwrite a cell value  

### 0.1.0  
* first release

## API
   * createXLGen( filePath)  
   create a XLGen object
     
### XLGen class  
   * formatStrings  
      standard number format strings  
      
         formatStrings.general: 'General',
         formatStrings.number0: '0',
         formatStrings.number1: '0.00',
         formatStrings.number2: '#,##0',
         formatStrings.number3: '#,##0.00',
         formatStrings.number4: '0%',
         formatStrings.number5: '0.00%',
         formatStrings.number6: '0.00E+00',
         formatStrings.number7: '# ?/?',
         formatStrings.number8: '# ??/??',
         formatStrings.number9: '#,##0 ;(#,##0)',
         formatStrings.number10: '#,##0 ;[Red](#,##0)',
         formatStrings.number11: '#,##0.00;(#,##0.00)',
         formatStrings.number12: '#,##0.00;[Red](#,##0.00)',
         formatStrings.number13: '##0.0E+0',
         formatStrings.date0: 'mm-dd-yy',
         formatStrings.date1: 'd-mmm-yy',
         formatStrings.date2: 'd-mmm',
         formatStrings.date3: 'mmm-yy',
         formatStrings.time0: 'h:mm AM/PM',
         formatStrings.time1: 'h:mm:ss AM/PM',
         formatStrings.time2: 'h:mm',
         formatStrings.time3: 'h:mm:ss',
         formatStrings.time4: 'mm:ss',
         formatStrings.time5: '[h]:mm:ss',
         formatStrings.time6: 'mmss.0',
         formatStrings.dateTime: 'm/d/yy h:mm',
         formatStrings.string: '@'

   * addFormat(formatString)  
      use to format a number and date type's value  
      formatString : a format string for a number formatting  
      return : a Format object  
         
   * addSheet(sheetName)  
      sheetName : a sheet name  
      return : a Sheet object  
         
   * end(callback)  
      flush all into a file and clean up all resources associated with the object.  
      after function 'end' has been called, cannot use xlg object again.  
      callback(err) : call this after ending a flush  
         
### Sheet class  
   * cell( rowIndex, colIndex, value, [format])  
      input value into cell.  
      rowIndex , colIndex: zero-based index  
      value : allow a Number, String, Date Type's value  
      format : *optional*, Format object added by addFormat function  
             
## Example  

```js
var xl = require('xlgen');
var xlg = xl.createXLGen('./test.xls');

//register formats
var fmtDate0 = xlg.addFormat(xl.formatStrings.date0);
var fmtDate1 = xlg.addFormat(xl.formatStrings.date1);
var fmtDate2 = xlg.addFormat(xl.formatStrings.date2);
var custfmtDate = xlg.addFormat('0.0000E+00');

var sht = xlg.addSheet('Sheet1');
//var sht = xlg.addSheet('시트1');

console.log(xl.formatStrings);//print all standard format strings

try{
   sht.cell(0, 1, 1);
   sht.cell(1, 1, 2.1);
   sht.cell(2, 3, 'hi!');
   sht.cell(3, 3, '안녕!');
   sht.cell(5, 4, new Date);
   sht.cell(6, 4, new Date, fmtDate0);
   sht.cell(7, 4, 10000, fmtDate0);
   sht.cell(8, 4, new Date, fmtDate1);
   sht.cell(9, 4, new Date, fmtDate2);
   sht.cell(10, 4, 9999, custfmtDate);
}catch(e){
   console.log(e.name, e.message);
}

xlg.end(function(err){
   if(err) console.log(err.name, err.message);
   else console.log('complete');
});
```

## References
  [[MS-XLS]: Excel Binary File Format (.xls) Structure](http://msdn.microsoft.com/en-us/library/cc313154(v=office.14).aspx)

## License
MIT
