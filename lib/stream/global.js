module.exports = Global;

var Buf = null;
function Global(sheets, bufsst, formats){
	var self = this;
	if(!Buf) Buf = require('../innerMod').BufferView;
    var buf = null,
        fontRec = new FontRecords(),
        fmtRec = new NumberFormatRecords(formats),
        xfRec = new XFRecords(formats),
        styleRec = new StyleRecords(),
        sheetNames = sheets.map(function(x){return x.name;}),
        //len1 = 164 + (4 +sheets.length*2) + 737 - 16 + (12*sheets.length + sheetNames.join().length*2);
        len1 = 164 + (4 +sheets.length*2) + 100 +
                fontRec.count() + fmtRec.count() + xfRec.count() + styleRec.count() +
                (12*sheets.length + 
					sheetNames.reduce(function(sum,val){
						return sum+val.length*2;
					}, 0)
				) + 6 ;
    var bufsstTotalLen = bufsst.reduce(function (pre,cur) {return pre + cur.length;},0);
	Object.defineProperty(self, 'length', {get:function(){return len1+ bufsstTotalLen + 4;}});
	
	function setBoundSheets(sheets){
		/*
		var start = beforeBoundSheet
					+ (12*sheets.length + sheetNames.join().length)//total size : rec id, len, pos, visibility, unknown,sheetName 
					+  afterBoundSheet ;
console.log(start,beforeBoundSheet,(12*sheets.length + sheetNames.join().length),afterBoundSheet)						;
		*/
		var shtStart = self.length;
		sheets.forEach(function(x){
			buf
			.u16(0x0085)
			.u16(8+x.name.length*2)
			.uln(shtStart)//stream pos
			.u8(0)//visibility
			.u8(0)
			//unicode or latin1
			.u8(x.name.length)
			.u8(1)
			.uni(x.name);
			shtStart += x.length; 
		});
	}
	
	function setBOF(){
		buf
		.u16(0x0809)
		.u16(16)//len
		.u16(0x0600)//version
		.u16(0x0005)//rec_type
		.u16(0x0DBB)//build
		.u16(0x07CC)//year
		.u32(0x00)//file_hist_flags
		.u32(0x06);//ver_can_read
	}
	function setWriteAccess(){
		buf
		.u16(0x005C)
		.u16(0x70)
		.asc('None')
		.fil(' '.charCodeAt(0),0x70-'None'.length);
	}
	function setTabID(sheetCount){
		buf
		.u16(0x013D)
		.u16(2*sheetCount);
        for(i =0; i < sheetCount; i++) buf.u16(i+1);
	}
	function setWindow1(){
		buf
		.u16(0x003D)
		.u16(18)
		.u16(0x000001e0)//hpos_twips
		.u16(0x005a)//vpos_twips
		.u16(0x3fcf)//width_twips
		.u16(0x2a4e)//height_twips
		.u16(0x0038)//flag
		.u16(0x0000)//active_sheet
		.u16(0x0000)//first_tab_index
		.u16(0x0001)//selected_tabs
		.u16(0x0258);//tab_width		
	}
    self.flush = function (writer){
		var wrtLen = 0 ;
		buf = new Buf(len1);
		//bof
		setBOF();
		
		//InteraceHdr
		buf
		.hex('E1000200B004')
		//MMS
		.hex('C10002000000')
		//InteraceEnd
		.hex('E2000000')
		//WriteAccess
		setWriteAccess();
	
		//Codepage
		buf
		.u16(0x0042)
		.u16(2)
		.u16(0x04B0)//utf16le
		//DSF
		.u16(0x0161)
		.u16(2)
		.u16(0x0000);
		//TabID
		setTabID(sheets.length);//4 +sheets.length*2
		//FnGroupCount
		buf
		.u16(0x009C)
		.u16(2)
		.u8(0x0E)
		.u8(0x00)
		//WindowProtect
		.u16(0x0019)
		.u16(2)
		.u16(0x0000)
		//ProtectRecord
		.u16(0x0012)
		.u16(2)
		.u16(0x0000)
		//ObjectProtect
		.u16(0x0063)
		.u16(2)
		.u16(0x0000)
		//Password
		.u16(0x0013)
		.u16(2)
		.u16(0x0000)
		//Prot4Rev
		.u16(0x01AF)
		.u16(2)
		.u16(0x0000)
		//Prot4RevPass
		.u16(0x01BC)
		.u16(2)
		.u16(0x0000)
		//Backup
		.u16(0x0040)
		.u16(2)
		.u16(0x0000)
		//HideObj
		.u16(0x008D)
		.u16(2)
		.u16(0x0000);
		//Window1
		setWindow1();
		//DateMode
		buf
		.u16(0x0022)
		.u16(2)
		.u16(0x0000)
		//Precision
		.u16(0x000E)
		.u16(2)
		.u16(0x0001)
		//RefreshAll
		.u16(0x01B7)
		.u16(2)
		.u16(0x0000)
		//BookBool
		.u16(0x00DA)
		.u16(2)
		.u16(0x0000);
		//AllFontsNumberFormatsXfStyles
        fontRec.build(buf);
        fmtRec.build(buf);
        xfRec.build(buf);
        styleRec.build(buf);
		//palette
		//''
		//UseSelfs
		buf
		.u16(0x0160)
		.u16(2)
		.u16(0x0001);
		//boundSheet
		var lenB = buf.position;
		var lenA = bufsstTotalLen; //country.length + allLink.length + SST.length
		var extSST = ''; // need fake cause we need calc stream pos
		var eofLen = 4;

		setBoundSheets(sheets, lenB, lenA + extSST.length + eofLen);//12*sheets.length
		writer(buf);
		wrtLen += buf.length;
		//country
		
		//all_links
		
                    
        //shared_str_table 
		writer(bufsst);
		wrtLen += bufsstTotalLen;
		
		extSST = ''; // need fake cause we need calc stream pos
		//eof
		(buf = new Buf(4))
        .u16(0x000A) 
        .u16(0);
		writer(buf);
		wrtLen += buf.length;
		
		return wrtLen;
	}
	
}

function FontRecords(fonts){
    var self = this,
        count = 7;
    self.count = function(){return count*25;};
    self.build = function(buf){
        //all font, except 4
        for(var i = 0; i < count; i++){
            buf
			.u16(0x0031)
            .u16(21)
            .u16(0x00c8)//height
            .u16(0x0000)//options
            .u16(0x7fff)//colour_index
            .u16(0x0190)//weight
            .u16(0x0000)//escapement
            .u8(0x00)//underline
            .u8(0x00)//family
            .u8(0x01)//charset
            .u8(0x00)
            //unicode or latin1
            .u8(0x05)
            .u8(0x00)
            .asc('Arial');
        }
    };
}
function NumberFormatRecords(formats){
    var self = this,
        custFmts = formats.filter(function(x){return !x.isCommon}),
        sumFmtStrLen = custFmts.reduce(function(preRet,fmt){return preRet + fmt.format.length*2;},0);

    self.count = function(){return custFmts.length*9 + (custFmts.length ? sumFmtStrLen : 0);};
    self.build =  function(buf){
        custFmts.forEach(function(x){
            //all number formats
            buf
			.u16(0x041E)
            .u16(5 + x.format.length*2)
            .u16(x.id)
            //unicode or latin1
            .u16(x.format.length)
            .u8(0x01)
            .uni(x.format);
        });
    };
}
function XFRecords(formats){
    var self = this;
    self.count = function(){return (16 + formats.length)*24;};
    self.build = function(buf){
        //all cell styles - XF list
        for(i =0 ; i< 15; i++){
            buf
			.u16(0x00E0)//XF:formatting properties for a cell or a cell style
            .u16(20)
            .u16(0x0006)//font_xf_idx
            .u16(0x0000)//num_fmt_str_xf_idx
            .u16(0xFFF5)//protection
            .u8(2<<4)//aln
            .u8(0)//rot
            .u8(0)//txt
            .u8(0xF4)//used_attr
            .u32(0)//borders1 
            .u32(0)//borders2
            .u16(((0x40 & 0x7F) << 0 )|((0x41 & 0x7F) << 7));//pattern
        }
        buf
		.u16(0x00E0)
        .u16(20)
        .u16(0x0006)//font_xf_idx
        .u16(0x0000)//num_fmt_str_xf_idx
        .u16(0x0001)//protection
        .u8(2<<4)//aln
        .u8(0)//rot
        .u8(0)//txt
        .u8(0xF8)//used_attr
        .u32(0)//borders1 
        .u32(0)//borders2
        .u16(((0x40 & 0x7F) << 0 )|((0x41 & 0x7F) << 7));//pattern
        
        formats.forEach(function(x){
            buf
			.u16(0x00E0)
            .u16(20)
            .u16(0x0007)//font_xf_idx
            .u16(x.id)//num_fmt_str_xf_idx
            .u16(0x0001)//protection
            .u8(2<<4)//aln
            .u8(0)//rot
            .u8(0)//txt
            .u8(0xF8)//used_attr
            .u32(0)//borders1 
            .u32(0)//borders2
            .u16(((0x40 & 0x7F) << 0 )|((0x41 & 0x7F) << 7));//pattern
        });
    };
};
function StyleRecords(){
    var self = this;
    self.count = function(){return 8;};
    self.build = function(buf){
        //all_styles
        buf
		.u16(0x0293)//Style: cell style
        .u16(4)
        .u16(0x8000)
        .u8(0x00)//BuiltInStyle.istyBuiltIn
        .u8(0xFF);//BuiltInStyle.OutlineLevel 
    };
};
