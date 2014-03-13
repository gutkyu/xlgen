var util = require('util'),
	Buf = require('../buf');

module.exports = Global;

function Global(sheets, bufsst){
	var self = this;
	var buf = null;
	var sheetNames = sheets.map(function(x){return x.name;});
	var len1 = 164 + (4 +sheets.length*2) + 737  + (12*sheets.length + sheetNames.join().length*2) ;
	
	Object.defineProperty(self, 'length', {get:function(){return len1+ bufsst.length + 4;}});
	
	function setBoundSheets(sheets){
		/*
		var start = beforeBoundSheet
					+ (12*sheets.length + sheetNames.join().length)//total size : rec id, len, pos, visibility, unknown,sheetName 
					+  afterBoundSheet ;
console.log(start,beforeBoundSheet,(12*sheets.length + sheetNames.join().length),afterBoundSheet)						;
		*/
		var shtStart = self.length;
		sheets.forEach(function(x){
			buf.u16(0x0085);
			buf.u16(8+x.name.length*2);
			buf.uln(shtStart);//stream pos
			buf.u8(0);//visibility
			buf.u8(0);
			//unicode or latin1
			buf.u8(x.name.length);
			buf.u8(1);
			buf.uni(x.name);
			shtStart += x.length; 
		});
	}
	
	function setBOF(){
		buf.u16(0x0809);
		buf.u16(16);//len
		buf.u16(0x0600);//version
		buf.u16(0x0005);//rec_type
		buf.u16(0x0DBB);//build
		buf.u16(0x07CC);//year
		buf.u32(0x00);//file_hist_flags
		buf.u32(0x06);//ver_can_read
	}
	function setWriteAccess(){
		buf.u16(0x005C);
		buf.u16(0x70);
		buf.asc('None');
		buf.fil(' '.charCodeAt(0),0x70-'None'.length);
	}
	function setTabID(sheetCount){
		buf.u16(0x013D);
		buf.u16(2*sheetCount);
        for(i =0; i < sheetCount; i++) buf.u16(i+1);
	}
	function setWindow1(){
		buf.u16(0x003D);
		buf.u16(18);
		buf.u16(0x000001e0);//hpos_twips
		buf.u16(0x005a);//vpos_twips
		buf.u16(0x3fcf);//width_twips
		buf.u16(0x2a4e);//height_twips
		buf.u16(0x0038);//flag
		buf.u16(0x0000);//active_sheet
		buf.u16(0x0000);//first_tab_index
		buf.u16(0x0001);//selected_tabs
		buf.u16(0x0258);//tab_width		
	}
	function setAllFontsNumberFormatsXfStyles(){
		//all font
		[0, 1, 2, 3, 4, 5, 6].forEach(function(x){
			buf.u16(0x0031);
			buf.u16(21);
			buf.u16(0x00c8);//height
			buf.u16(0x0000);//options
			buf.u16(0x7fff);//colour_index
			buf.u16(0x0190);//weight
			buf.u16(0x0000);//escapement
			buf.u8(0x00);//underline
			buf.u8(0x00);//family
			buf.u8(0x01);//charset
			buf.u8(0x00);
			//unicode or latin1
			buf.u8(0x05);
			buf.u8(0x00);
			buf.asc('Arial');
		});
		//all number formats
		buf.u16(0x041E);
		buf.u16(12);
		buf.u16(0x00A4);
		//unicode or latin1
		buf.u16(0x07);
		buf.u8(0x00);
		buf.asc('General');
		//all cell styles
		for(i =0 ; i< 16; i++){
			buf.u16(0x00E0);
			buf.u16(20);
			buf.u16(0x0006);//font_xf_idx
			buf.u16(0x00a4);//num_fmt_str_xf_idx
			buf.u16(0xFFF5);//protection
			buf.u8(2<<4);//aln
			buf.u8(0);//rot
			buf.u8(0);//txt
			buf.u8(0xF4);//used_attr
			buf.u32(0);//borders1 
			buf.u32(0);//borders2
			buf.u16(((0x40 & 0x7F) << 0 )|((0x41 & 0x7F) << 7));//pattern
		}
		buf.u16(0x00E0);
		buf.u16(20);
		buf.u16(0x0006);//font_xf_idx
		buf.u16(0x00a4);//num_fmt_str_xf_idx
		buf.u16(0x0001);//protection
		buf.u8(2<<4);//aln
		buf.u8(0);//rot
		buf.u8(0);//txt
		buf.u8(0xF8);//used_attr
		buf.u32(0);//borders1 
		buf.u32(0);//borders2
		buf.u16(((0x40 & 0x7F) << 0 )|((0x41 & 0x7F) << 7));//pattern
		
		buf.u16(0x00E0);
		buf.u16(20);
		buf.u16(0x0007);//font_xf_idx
		buf.u16(0x00a4);//num_fmt_str_xf_idx
		buf.u16(0x0001);//protection
		buf.u8(2<<4);//aln
		buf.u8(0);//rot
		buf.u8(0);//txt
		buf.u8(0xF8);//used_attr
		buf.u32(0);//borders1 
		buf.u32(0);//borders2
		buf.u16(((0x40 & 0x7F) << 0 )|((0x41 & 0x7F) << 7));//pattern
		//all_styles
		buf.u16(0x0293);
		buf.u16(4);
		buf.u16(0x8000);
		buf.u8(0x00);
		buf.u8(0xFF);
	}
	self.flush = function (writer){
		var wrtLen = 0 ;
		buf = new Buf(len1);
		//bof
		setBOF();
		
		//InteraceHdr
		buf.hex('E1000200B004');
		//MMS
		buf.hex('C10002000000');
		//InteraceEnd
		buf.hex('E2000000');
		//WriteAccess
		setWriteAccess();
	
		//Codepage
		buf.u16(0x0042);
		buf.u16(2);
		buf.u16(0x04B0);//utf16le
		//DSF
		buf.u16(0x0161);
		buf.u16(2);
		buf.u16(0x0000);
		//TabID
		setTabID(sheets.length);//4 +sheets.length*2
	
		//FnGroupCount
		buf.u16(0x009C);
		buf.u16(2);
		buf.u8(0x0E);
		buf.u8(0x00);
		//WindowProtect
		buf.u16(0x0019);
		buf.u16(2);
		buf.u16(0x0000);
		//ProtectRecord
		buf.u16(0x0012);
		buf.u16(2);
		buf.u16(0x0000);
		//ObjectProtect
		buf.u16(0x0063);
		buf.u16(2);
		buf.u16(0x0000);
		//Password
		buf.u16(0x0013);
		buf.u16(2);
		buf.u16(0x0000);
		//Prot4Rev
		buf.u16(0x01AF);
		buf.u16(2);
		buf.u16(0x0000);
		//Prot4RevPass
		buf.u16(0x01BC);
		buf.u16(2);
		buf.u16(0x0000);
		//Backup
		buf.u16(0x0040);
		buf.u16(2);
		buf.u16(0x0000);
		//HideObj
		buf.u16(0x008D);
		buf.u16(2);
		buf.u16(0x0000);
		//Window1
		setWindow1();
		//DateMode
		buf.u16(0x0022);
		buf.u16(2);
		buf.u16(0x0000);
		//Precision
		buf.u16(0x000E);
		buf.u16(2);
		buf.u16(0x0001);
		//RefreshAll
		buf.u16(0x01B7);
		buf.u16(2);
		buf.u16(0x0000);
		//BookBool
		buf.u16(0x00DA);
		buf.u16(2);
		buf.u16(0x0000);
		//AllFontsNumberFormatsXfStyles
		//all font, except 4
		setAllFontsNumberFormatsXfStyles();
		//palette
		//''
		//UseSelfs
		buf.u16(0x0160);
		buf.u16(2);
		buf.u16(0x0001);
	
		//boundSheet
		var lenB = buf.pos();
		var lenA = bufsst.length; //country.length + allLink.length + SST.length
		var ext_sst = ''; // need fake cause we need calc stream pos
		var eofLen = 4;

		setBoundSheets(sheets, lenB, lenA + ext_sst.length + eofLen);//12*sheets.length
		writer(buf.raw);
		wrtLen += buf.length;
		
		//country
		//''
		//all_links
		//''
                    
        //shared_str_table 
		writer(bufsst);
		wrtLen += bufsst.length;
		
		ext_sst = ''; // need fake cause we need calc stream pos
		//eof
		buf = new Buf(4);
        buf.u16(0x000A); 
        buf.u16(0);
		writer(buf.raw);
		wrtLen += buf.length;
		
		return wrtLen;
	}
	
}
