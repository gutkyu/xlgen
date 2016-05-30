var Buf = require('../buf'),
    format = require('./numberFormat'),
    baseDate = new Date(1899, 11, 30);

module.exports = Sheet;

function Sheet(name, index, sst, styleInfo){
	var self = this,
        rows = {},
        cells = [],
        len0 = 282,
        len1 = 22,
        len2 = 4,
        rowLen = 20,
        cellsLen = 0,
        lastUsedRow = 0,
        firstUsedRow = 65535,
        lastUsedCol = 0,
        firstUsedCol = 255;

    self.name = name;

	Object.defineProperty(self,'length',{get:function(){return len0 + Object.keys(rows).length*rowLen + cellsLen + len1 + len2;}});
	
	function adjustBound(row,col){
		if (!rows[row]){
            rows[row] = {minColIdx:0,maxColIdx:0};
            if (row > lastUsedRow) lastUsedRow = row;
            if (row < firstUsedRow) firstUsedRow = row;
			cells[row] = [];
		}
		        
		if (0 > col || col > 255) throw new Error(util.format("column index (%s) not an int in range(256)" , col));
		if (col < rows[row].minColIdx) rows[row].minColIdx = col;
		if (col > rows[row].maxColIdx) rows[row].maxColIdx = col;
		if (col < firstUsedCol) firstUsedCol = col;
		if (col > lastUsedCol) lastUsedCol = col;
		
	}
	
	function writeDate(row, col, value, style){
        var dateNum  = (value - baseDate)/(24*60*60*1000),
            styleIndex = styleInfo.defaultDateStyleIndex;
            
        if(format.isFormat(style))
            styleIndex = styleInfo.getStyleIndex(style);

 		// TODO: Set proper style (Find out which style is Date)
 		writeNumberBase(row, col, dateNum, styleIndex);
	}
	
    function writeNumber(row,col,value, style){
        var styleIndex = styleInfo.defaultStyleIndex;
        
        if(format.isFormat(style))
            styleIndex = styleInfo.getStyleIndex(style);
        
        writeNumberBase(row,col,value, styleIndex);
    }
    
	function writeNumberBase(row,col,value, styleIndex){
		var rk = null;

        if(styleIndex < 0) throw new Error('invalid style index');
        
		//30-bit integer RK 
        if(-0x20000000 <= value &&  value < 0x20000000){ 
            if (Math.round(value) == value ){
				rk = 2 | (value << 2)
			}                
		}
		if(rk==null){
			var temp = value * 100;
			if(-0x20000000 <= temp && temp < 0x20000000){
				var itemp = Math.round(temp);
				if( Math.floor(itemp / 100.0) == value){
					rk = 3 | (itemp << 2);
				}
			}
		}
		var buf = null;
		if(rk != null) {
			(buf = new Buf(14))
			.u16(0x027E)
			.u16(10)
			.u16(row)
			.u16(col)
			.u16(styleIndex)
			.i32(rk);
		}else{
			(buf = new Buf(18))
			.u16(0x0203)
			.u16(14)
			.u16(row)
			.u16(col)
			.u16(styleIndex)
			.dbl(value);
		}
		
		putCell(row,col,buf);
	}
	
	function writeBool(row, col, value){
		var buf = new Buf(12),
            styleIndex = styleInfo.defaultStyleIndex;
            
		buf
		.u16(0x0205)
		.u16(8)
		.u16(row)
		.u16(col)
		.u16(sytleIndex)
		.u8(value)
		.u8(0);
		
        putCell(row,col,buf);
	}
	
	function writeString(row, col, value){
		var idx = sst.addStr(value),
            buf = new Buf(14),
            styleIndex = styleInfo.defaultStyleIndex;

		buf
		.u16(0x00FD)
		.u16(10)
		.u16(row)
		.u16(col)
		.u16(styleIndex)
		.u32(idx);
		
        putCell(row,col,buf);
	}
	
	function writeBlank(row, col){
		var buf = new Buf(10),
            styleIndex = styleInfo.defaultStyleIndex;
            
		buf
		.u16(0x0201)
		.u16(6)
		.u16(row)
		.u16(col)
		.u16(styleIndex);
		
        putCell(row,col,buf);
   	}
	
    function putCell(row, col, buf){
        var preValLen = cells[row][col] ? cells[row][col].length : 0 ;
        cells[row][col]=buf;
		cellsLen += buf.length - preValLen;
    }
    
	self.cell = function(row, col, value, style){
		if(value == null || value == undefined || (typeof(value) == 'string' && value == '')) return;
		
		if(!cells[row] || !cells[row][col]) adjustBound(row,col);
        
        if ( typeof(value) == 'string'){
            if (!value.length) return;
            writeString(row, col, value);
		}else if ( typeof(value) == 'bool') // bool is subclass of int; test bool first
            writeBool(row, col, value, style);
        else if ( typeof(value) == 'number')
            writeNumber(row, col, value, style);
        else if ( value instanceof Date){
 			writeDate(row, col, value, style);
        }else
            throw new Error("Unexpected data type : " + typeof(value));
	}
	self.flush = function(writer){
		var buf = new Buf(282);
		//bof
		buf
		.u16(0x0809)
		.u16(16)//len
		.u16(0x0600)//version
		.u16(0x0010)//rec_type
		.u16(0x0DBB)//build
		.u16(0x07CC)//year
		.u32(0x00)//file_hist_flags
		.u32(0x06)//ver_can_read
		
		//calc_settings
		//CalcMode
		.u16(0x000D)
		.u16(2)//len
		.i16(0x0001)
		//CalcCount
		.u16(0x000C)
		.u16(2)//len
		.u16(0x0064)
		//RefMode
		.u16(0x000F)
		.u16(2)//len
		.u16(0x0001)
		//Iteration
		.u16(0x0011)
		.u16(2)//len
		.u16(0x0000)
		//Delta
		.u16(0x0010)
		.u16(8)//len
		.dbl(0.001)
		//SaveRecalc
		.u16(0x005F)
		.u16(2)//len
		.u16(0x0000)
		
		//guts
		.u16(0x0080)
		.u16(8)
		.u16(0x0000)
		.u16(0x0000)
		.u16(0x0001)
		.u16(0x0000)
		
		//default row weight
		.u16(0x0225)
		.u16(4)
		.u16(0x0000)
		.u16(0x00FF)
		
		//wsbool
		.u16(0x0081)
		.u16(2)
		.u16(0x0C01);
		
		//dimesions
		if(firstUsedRow > lastUsedRow || firstUsedCol > lastUsedCol){
            //empty worksheet
            firstUsedRow = firstUsedCol = 0
            lastUsedRow = lastUsedCol = -1
		}
		buf
		.u16(0x0200)
		.u16(14)
		.u32(firstUsedRow)
		.u32(lastUsedRow + 1)
		.u16(firstUsedCol)
		.u16(lastUsedCol + 1)
		.u16(0x00)
        
		//print settings
		//print headers
		.u16(0x02A)
		.u16(2)
		.u16(0)
		//print grid lines
		.u16(0x02B)
		.u16(2)
		.u16(0)
		//grid set
		.u16(0x082)
		.u16(2)
		.u16(1)
		//horizontal page breaks
		.u16(0x001B)
		.u16(2)
		.u16(0)
        //vertical page breaks
		.u16(0x001A)
		.u16(2)
		.u16(0)
		//header
		.u16(0x0014)
		.u16(5)
		.u16(2)
		.u8(0)
		.asc('&P')//unicode or latin1
		//footer
		.u16(0x0015)
		.u16(5)
		.u16(2)
		.u8(0)
		.asc('&F')//unicode or latin1
		//horizontal center
		.u16(0x0083)
		.u16(2)
		.u16(1)
		//vertical center
		.u16(0x0084)
		.u16(2)
		.u16(0)
		//left margin
		.u16(0x0026)
		.u16(8)
		.dbl(0.3)
		//right margin
		.u16(0x0027)
		.u16(8)
		.dbl(0.3)
		//top margin
		.u16(0x0028)
		.u16(8)
		.dbl(0.61)
		//bottom margin
		.u16(0x0029)
		.u16(8)
		.dbl(0.37)
		//setup page
		.u16(0x00A1)
		.u16(34)
		.u16(9)
		.u16(0x64)
		.u16(1)
		.u16(1)
		.u16(1)
		.u16(0x83)
		.u16(0x012C)
		.u16(0x012C)
		.dbl(0.1)
		.dbl(0.1)
		.u16(1)
		
		//protection
		//protect
		.u16(0x0012)
		.u16(2)
		.u16(0)
		//scen protect
		.u16(0x00DD)
		.u16(2)
		.u16(0)
		//window protect
		.u16(0x0019)
		.u16(2)
		.u16(0)
		//object protect
		.u16(0x0063)
		.u16(2)
		.u16(0)
		//password
		.u16(0x0013)
		.u16(2)
		.u16(0);
		writer(buf);
		
		//row blocks
		var i = 0;
		for(ridx in rows){
			var row = rows[ridx];
			buf = new Buf(rowLen); 
			//row
			buf
			.u16(0x0208)
			.u16(16)
			.u16(i++)
			.u16(row.minColIdx)
			.u16(row.maxColIdx+1)
			.u16(0x00FF)
			.u16(0x0000)
			.u16(0x0000)
			.u32(0x000F0100);
		
			writer(buf);
			//cells
			cells[ridx].forEach(function(x){writer(x);});
		}
		//merged
		
		//bitmaps
		
		//window2
		(buf = new Buf(len1))
		.u16(0x023E)
		.u16(18)
		.u16(0x02b6)
		.u16(0)
		.u16(0)
		.u16(0x0040)
		.u16(0)
		.u16(0)
		.u16(0)
		.u32(0)
		writer(buf);
		//panes
		
		//eof
		(buf = new Buf(len2))
		.u16(0x000A)
		.u16(0);
		writer(buf);
	}
}
