# XLGen
Excel 97-2003 파일(.xls)을 생성하는 node.js 모듈

## 특징
  Excel 97 ~ 2003 포맷(.xls) 생성
  순수하게 node.js환경에서 javascript로만 작성

## 제한
  현재 각 셀안에 숫자나 문자만 입력가능

## 사용방법

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

## License
MIT