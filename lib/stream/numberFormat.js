var defaultFmtDic={
    'General':                 0 ,
    '0':                       1 ,
    '0.00':                    2 ,
    '#,##0':                   3 ,
    '#,##0.00':                4 ,
    '0%':                      9 ,
    '0.00%':                   10,
    '0.00E+00':                11,
    '# ?/?':                   12,
    '# ??/??':                 13,
    'mm-dd-yy':                14,
    'd-mmm-yy':                15,
    'd-mmm':                   16,
    'mmm-yy':                  17,
    'h:mm AM/PM':              18,
    'h:mm:ss AM/PM':           19,
    'h:mm':                    20,
    'h:mm:ss':                 21,
    'm/d/yy h:mm':             22,
    '#,##0 ;(#,##0)':          37,
    '#,##0 ;[Red](#,##0)':     38,
    '#,##0.00;(#,##0.00)':     39,
    '#,##0.00;[Red](#,##0.00)':40,
    'mm:ss':                   45,
    '[h]:mm:ss':               46,
    'mmss.0':                  47,
    '##0.0E+0':                48,
    '@':                       49,
};

var fmtTypes ={
    general : [0],
    number: [1 ,2 ,3 ,4 ,9 ,10,11,12,13,37,38,39,40,48],
    date:[14,15,16,17,],
    time:[18,19,20,21,45,46,47],
    dateTime:[22],
    string:[49]
};

var commonFmts = [],
    defaultRevFmtDic = {},
    defaultFmtStrs = Object.keys(defaultFmtDic),
    expFmtStrs = {};

function Format(id, formatString, isCommon){
    var self = this;
    if(id > 0x017E) throw new Error('too many custom formats.');
    Object.defineProperty(self, 'isCommon', {get:function(){return isCommon;}});
    Object.defineProperty(self, 'id', {get:function(){return id;}});
    Object.defineProperty(self, 'format', {get:function(){return formatString;}});
}


Object.keys(defaultFmtDic).forEach(function(x){
    commonFmts.push(new Format(defaultFmtDic[x],x,true));
    defaultRevFmtDic[defaultFmtDic[x]] = x;
});

Object.keys(fmtTypes).forEach(function(typ){
    var nm = typ,
        i = fmtTypes[typ].length == 1 ? -1 : 0;
    fmtTypes[typ].forEach(function(id){
        expFmtStrs[nm + (i == -1 ? '' : i++)] = defaultRevFmtDic[id];
    });
});

delete defaultRevFmtDic;

var mod = module.exports = function(){
    var usedFmtDics = {},
        usedFmts = [],
        custId = 0x00A4;
    
    buildFormat(expFmtStrs.general);
    buildFormat(expFmtStrs.date0);
    
    function buildFormat(formatString){
        var fmt = usedFmtDics[formatString];
        if(!fmt){
            fmt = usedFmtDics[formatString] = (defaultFmtDic[formatString] === undefined ? new Format(custId++, formatString, false):commonFmts[defaultFmtStrs.indexOf(formatString)]);
            usedFmts.push(fmt);
        }
        return fmt;
    }
    return {build:buildFormat, usedFormats:usedFmts}
}

mod.commonStrings = expFmtStrs;
mod.isFormat = function(object){
    return object instanceof Format;
}