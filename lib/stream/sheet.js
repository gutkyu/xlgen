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
			buf = new Buf(14);
			buf.u16(0x027E);
			buf.u16(10);
			buf.u16(row);
			buf.u16(col);
			buf.u16(styleIndex);
			buf.i32(rk);
		}else{
			buf = new Buf(18);
			buf.u16(0x0203);
			buf.u16(14);
			buf.u16(row);
			buf.u16(col);
			buf.u16(styleIndex);
			buf.dbl(value);
		}
		
		putCell(row,col,buf);
	}
	
	function writeBool(row, col, value){
		var buf = new Buf(12),
            styleIndex = styleInfo.defaultStyleIndex;
            
		buf.u16(0x0205);
		buf.u16(8);
		buf.u16(row);
		buf.u16(col);
		buf.u16(sytleIndex);
		buf.u8(value);
		buf.u8(0);
		
        putCell(row,col,buf);
	}
	
	function writeString(row, col, value){
		var idx = sst.addStr(value),
            buf = new Buf(14),
            styleIndex = styleInfo.defaultStyleIndex;

		buf.u16(0x00FD);
		buf.u16(10);
		buf.u16(row);
		buf.u16(col);
		buf.u16(styleIndex);
		buf.u32(idx);
		
        putCell(row,col,buf);
	}
	
	function writeBlank(row, col){
		var buf = new Buf(10),
            styleIndex = styleInfo.defaultStyleIndex;
            
		buf.u16(0x0201)
		buf.u16(6);
		buf.u16(row);
		buf.u16(col);
		buf.u16(styleIndex);
		
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
		buf.u16(0x0809);
		buf.u16(16);//len
		buf.u16(0x0600);//version
		buf.u16(0x0010);//rec_type
		buf.u16(0x0DBB);//build
		buf.u16(0x07CC);//year
		buf.u32(0x00);//file_hist_flags
		buf.u32(0x06);//ver_can_read
		
		//calc_settings
		//CalcMode
		buf.u16(0x000D);
		buf.u16(2);//len
		buf.i16(0x0001);
		//CalcCount
		buf.u16(0x000C);
		buf.u16(2);//len
		buf.u16(0x0064);
		//RefMode
		buf.u16(0x000F);
		buf.u16(2);//len
		buf.u16(0x0001);
		//Iteration
		buf.u16(0x0011);
		buf.u16(2);//len
		buf.u16(0x0000);
		//Delta
		buf.u16(0x0010);
		buf.u16(8);//len
		buf.dbl(0.001);
		//SaveRecalc
		buf.u16(0x005F);
		buf.u16(2);//len
		buf.u16(0x0000);
		
		//guts
		buf.u16(0x0080);
		buf.u16(8);
		buf.u16(0x0000);
		buf.u16(0x0000);
		buf.u16(0x0001);
		buf.u16(0x0000);
		
		//default row weight
		buf.u16(0x0225);
		buf.u16(4);
		buf.u16(0x0000);
		buf.u16(0x00FF);
		
		//wsbool
		buf.u16(0x0081);
		buf.u16(2);
		buf.u16(0x0C01);
		
		//dimesions
		if(firstUsedRow > lastUsedRow || firstUsedCol > lastUsedCol){
            //empty worksheet
            firstUsedRow = firstUsedCol = 0
            lastUsedRow = lastUsedCol = -1
		}
		buf.u16(0x0200);
		buf.u16(14);
		buf.u32(firstUsedRow);
		buf.u32(lastUsedRow + 1);
		buf.u16(firstUsedCol);
		buf.u16(lastUsedCol + 1);
		buf.u16(0x00);
        
		//print settings
		//print headers
		buf.u16(0x02A);
		buf.u16(2);
		buf.u16(0);
		//print grid lines
		buf.u16(0x02B);
		buf.u16(2);
		buf.u16(0);
		//grid set
		buf.u16(0x082);
		buf.u16(2);
		buf.u16(1);
		//horizontal page breaks
		buf.u16(0x001B);
		buf.u16(2);
		buf.u16(0);
        //vertical page breaks
		buf.u16(0x001A);
		buf.u16(2);
		buf.u16(0);
		//header
		buf.u16(0x0014);
		buf.u16(5);
		buf.u16(2);
		buf.u8(0);
		buf.asc('&P');//unicode or latin1
		//footer
		buf.u16(0x0015);
		buf.u16(5);
		buf.u16(2);
		buf.u8(0);
		buf.asc('&F');//unicode or latin1
		//horizontal center
		buf.u16(0x0083);
		buf.u16(2);
		buf.u16(1);
		//vertical center
		buf.u16(0x0084);
		buf.u16(2);
		buf.u16(0);
		//left margin
		buf.u16(0x0026);
		buf.u16(8);
		buf.dbl(0.3);
		//right margin
		buf.u16(0x0027);
		buf.u16(8);
		buf.dbl(0.3);
		//top margin
		buf.u16(0x0028);
		buf.u16(8);
		buf.dbl(0.61);
		//bottom margin
		buf.u16(0x0029);
		buf.u16(8);
		buf.dbl(0.37);
		//setup page
		buf.u16(0x00A1);
		buf.u16(34);
		buf.u16(9);
		buf.u16(0x64);
		buf.u16(1);
		buf.u16(1);
		buf.u16(1);
		buf.u16(0x83);
		buf.u16(0x012C);
		buf.u16(0x012C);
		buf.dbl(0.1);
		buf.dbl(0.1);
		buf.u16(1);
		
		//protection
		//protect
		buf.u16(0x0012);
		buf.u16(2);
		buf.u16(0);
		//scen protect
		buf.u16(0x00DD);
		buf.u16(2);
		buf.u16(0);
		//window protect
		buf.u16(0x0019);
		buf.u16(2);
		buf.u16(0);
		//object protect
		buf.u16(0x0063);
		buf.u16(2);
		buf.u16(0);
		//password
		buf.u16(0x0013);
		buf.u16(2);
		buf.u16(0);
		writer(buf);
		
		//row blocks
		var i = 0;
		for(ridx in rows){
			var row = rows[ridx];
			buf = new Buf(rowLen); 
			//row
			buf.u16(0x0208);
			buf.u16(16);
			buf.u16(i++);
			buf.u16(row.minColIdx);
			buf.u16(row.maxColIdx+1);
			buf.u16(0x00FF);
			buf.u16(0x0000);
			buf.u16(0x0000);
			buf.u32(0x000F0100);
		
			writer(buf);
			//cells
			cells[ridx].forEach(function(x){writer(x);});
		}
		//merged
		
		//bitmaps
		
		//window2
		buf = new Buf(len1);
		buf.u16(0x023E);
		buf.u16(18);
		buf.u16(0x02b6);
		buf.u16(0);
		buf.u16(0);
		buf.u16(0x0040);
		buf.u16(0);
		buf.u16(0);
		buf.u16(0);
		buf.u32(0);
		writer(buf);
		//panes
		
		//eof
		buf = new Buf(len2);
		buf.u16(0x000A);
		buf.u16(0);
		writer(buf);
	}
}
