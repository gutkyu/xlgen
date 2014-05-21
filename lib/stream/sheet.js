var util = require('util'),
	Buf = require('../buf');


var defaultStyleIdx = 0x11;
var BASE_DATE = new Date(1899, 11, 30);

module.exports = Sheet;

function Sheet(name,index,sst){
	var self = this;
	self.name = name;
	var rows = {};
	var cells = [];
	var len0 = 282,
		len1 = 22,
		len2 = 4;
	var rowLen = 20;
	var cellsLen = 0;
	var last_used_row = 0;
	var first_used_row = 65535;
	var last_used_col = 0;
	var first_used_col = 255;

	
	Object.defineProperty(self,'length',{get:function(){return len0 + Object.keys(rows).length*rowLen + cellsLen + len1 + len2;}});
	
	function adjustBound(row,col){
		if (!rows[row]){
			rows[row] = {min_col_idx:0,max_col_idx:0};
			if (row > last_used_row) last_used_row = row;
			if (row < first_used_row) first_used_row = row;
			cells[row] = [];
		}
		if(cells[row] && cells[row][col]) throw new Error(util.format("it is not possible to overwrite in cell (%d,%d)" , row, col));
		if (0 > col || col > 255) throw new Error(util.format("column index (%s) not an int in range(256)" , col));
		if (col < rows[row].min_col_idx) rows[row].min_col_idx = col;
		if (col > rows[row].max_col_idx) rows[row].max_col_idx = col;
		if (col < first_used_col) first_used_col = col;
		if (col > last_used_col) last_used_col = col;
		
	}
	
	function writeDate(row, col, value, styleIndex){
		var dateNum  = (value - BASE_DATE)/(24*60*60*1000);
		// TODO: Set proper style (Find out which style is Date)
		writeNumber(row, col, dateNum, styleIndex);
	}
	
	function writeNumber(row,col,value, styleIndex){
		var rk = null;
		//30-bit integer RK 
		if(-0x20000000 <= value &&  value < 0x20000000){ 
			if (Math.round(value) == value ){
				rk = 2 | (value << 2)
			}                
		}
		if(rk==null){
			var temp = value * 100
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
		
		cells[row][col]=buf.raw;
		cellsLen += buf.length;
	}
	
	function writeBool(row, col, value, styleIndex){
		var buf = new Buf(12);
		buf.u16(0x0205);
		buf.u16(8);
		buf.u16(row);
		buf.u16(col);
		buf.u16(sytleIndex);
		buf.u8(value);
		buf.u8(0);
		
		cells[row][col]=buf.raw;
		cellsLen += buf.length;
	}
	
	function writeString(row, col, value,  styleIndex){
		var idx = sst.addStr(value);
		var buf = new Buf(14);
		buf.u16(0x00FD);
		buf.u16(10);
		buf.u16(row);
		buf.u16(col);
		buf.u16(styleIndex);
		buf.u32(idx);
		
		cells[row][col]=buf.raw;
		cellsLen += buf.length;
	}
	
	function writeBlank(row, col, styleIndex){
		var buf = new Buf(10);
		buf.u16(0x0201)
		buf.u16(6);
		buf.u16(row);
		buf.u16(col);
		buf.u16(styleIndex);
		
		cells[row][col]=buf.raw;
		cellsLen += buf.length;
	}
	
	self.cell = function(row, col, value){
		if(value == null || value == undefined || (typeof(value) == 'string' && value == '')) return;
		
		adjustBound(row,col);
		var styleIndex = defaultStyleIdx;
		if ( typeof(value) == 'string'){
			if (!value.length) return;
			writeString(row, col, value, styleIndex);
		}else if ( typeof(value) == 'bool') // bool is subclass of int; test bool first
			writeBool(row, col, value, styleIndex);
		else if ( typeof(value) == 'number')
			writeNumber(row, col, value, styleIndex);
		else if ( value instanceof Date){
			writeDate(row, col, value, styleIndex);
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
		if(first_used_row > last_used_row || first_used_col > last_used_col){
			//empty worksheet
			first_used_row = first_used_col = 0
			last_used_row = last_used_col = -1
		}
		buf.u16(0x0200);
		buf.u16(14);
		buf.u32(first_used_row);
		buf.u32(last_used_row + 1);
		buf.u16(first_used_col);
		buf.u16(last_used_col + 1);
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
		writer(buf.raw);
		
		//row blocks
		var i = 0;
		for(ridx in rows){
			var row = rows[ridx];
			buf = new Buf(rowLen); 
			//row
			buf.u16(0x0208);
			buf.u16(16);
			buf.u16(i++);
			buf.u16(row.min_col_idx);
			buf.u16(row.max_col_idx+1);
			buf.u16(0x00FF);
			buf.u16(0x0000);
			buf.u16(0x0000);
			buf.u32(0x000F0100);
		
			writer(buf.raw);
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
		writer(buf.raw);
		//panes
		
		//eof
		buf = new Buf(len2);
		buf.u16(0x000A);
		buf.u16(0);
		writer(buf.raw);
	}
}
