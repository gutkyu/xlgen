# XLGen
Excel 97-2003 파일(.xls)을 생성하는 node.js 모듈

## 특징

  Excel 97 ~ 2003 포맷(.xls) 생성  
  node.js환경에서 javascript로만 작성  

## API
  * createXLGen( filePath)  
      XLGen object를 생성한다.
        
  * XLGen class
    
    * formatStrings  
      표준 number format strings  
            
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
  
    * addFormat( formatString)  
        number, date type의 값을 formatting하는데 사용하는 object 생성  
        formatString : number formatting에 사용할 문자열  
        return : a Format object  
            
    * addSheet( sheetName)  
        sheetName : sheet 이름  
        return : a Sheet object  
            
    * end(callback)  
        입력한 내용을 모두 파일에 써넣고 내부적으로 사용한 모든 resource들을 해제한다.  
        xlg 객체의 'end'함수를 호출하면 그 xlg 객체는 다시 사용할 수 없다.  
        callback(err) : call this after ending a flush  
            
  * Sheet class
    
    * cell( rowIndex, colIndex, value, [format])  
            해당 위치의 cell에 값을 입력한다.  
            rowIndex , colIndex: 0부터 번호매김한다.  
            value : Number, String, Date 형식의 값만 사용가능  
            format : 선택, 먼저 addFormat로 등록한 format object  
                
## 예제


```js
var xl = require('../lib/xlgen');
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


## License
MIT
