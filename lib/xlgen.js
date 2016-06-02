var	Header = require('./stream/header');
var	Global = require('./stream/global');
var	SST = require('./stream/sst');
var format = require('./stream/numberFormat');
var	Sheet = require('./stream/sheet');

var SID_FREE_SECTOR  = -1;
var SID_END_OF_CHAIN = -2;
var SID_USED_BY_SAT  = -3;
var SID_USED_BY_MSAT = -4;

exports.formatStrings = format.commonStrings;

//callback(writer)
exports.createXLGen = function (path,options){
	options = options || {};
	options.path = path;
	
	var Buf = require('./innerMod').BufferView 
		= options.BufferView
		= options.BufferView || require('./bufferView');
	
	var fmt = format();
	
	//dimension
	var sheets = [];

	var header = null;
	var gbl = null;
	var sst = new SST();

	var bufDir = null;
	var bufsat = null;
	var bufmsat1 = null;
	var bufmsat2 = null;
	var msatSect2 = [];
	var satSect = [];
	var dirSect = [];

	function buildSAT(bookStreamLen){
		// Build SAT
        var bookSectCount = bookStreamLen >> 9;
        var dirSectCount  = bufDir.length >> 9;
        
        var totalSectCount     = bookSectCount + dirSectCount;
        var satSectCount       = 0;
        var msatSectCount      = 0;
        var satSectCountLimit = 109;
        while (totalSectCount > 128*satSectCount || satSectCount > satSectCountLimit){
            satSectCount   += 1;
            totalSectCount += 1;
            if (satSectCount > satSectCountLimit){
                msatSectCount      += 1;
                totalSectCount     += 1;
                satSectCountLimit += 127;
			}
		}

        var sat = new Array(128 * satSectCount);
		for(i=0; i<sat.length; i++) sat[i]=SID_FREE_SECTOR;
		
        var sect = 0;
        while( sect < bookSectCount - 1){
            sat[sect] = sect + 1;
            sect += 1;
		}
        sat[sect] = SID_END_OF_CHAIN;
        sect += 1;

        while(sect < bookSectCount + msatSectCount){
            msatSect2.push(sect);
            sat[sect] = SID_USED_BY_MSAT;
            sect += 1;
		}
        while(sect < bookSectCount + msatSectCount + satSectCount){
            satSect.push(sect);
            sat[sect] = SID_USED_BY_SAT;
            sect += 1;
		}
        while( sect < bookSectCount + msatSectCount + satSectCount + dirSectCount - 1){
            dirSect.push(sect);
            sat[sect] = sect + 1;
            sect += 1;
		}
        dirSect.push(sect);
        sat[sect] = SID_END_OF_CHAIN;
        sect += 1;

		bufsat = new Buf(128 * satSectCount * 4);
		for(i = 0; i< 128 * satSectCount ;i++) bufsat.i32(sat[i]);

		bufmsat1 =  new Buf(109*4);
		var len = Math.min(satSect.length, satSect.length)
		for(i=0; i < len; i++) bufmsat1.i32(satSect[i]);
		bufmsat1.fil(SID_FREE_SECTOR, (109 - i)*4);

		bufmsat2 =  new Buf(msatSectCount*128*4);
		for(i=0; i< msatSectCount*128; i++) bufmsat2.i32(SID_FREE_SECTOR);
		if(msatSectCount > 0) {
			bufmsat2
			.pos(bufmsat2.length - 4)
			.i32(SID_END_OF_CHAIN);			
		}
		i = 109;
        var msatSect = 0;
        var sidNum = 0;
        while(i < satSectCount){
            if ((sidNum + 1) % 128 == 0){
                //print 'link: ',
                msatSect += 1;
                if (msatSect < msatSect2.length){
					bufmsat2
					.pos(sidNum*4)
                    .i32(msatSect2[msatSect]);
				}
            }else{
                //print 'sid: ',
				bufmsat2
				.pos(sidNum*4)
                .writeInt32LE(satSect[i]);
                i += 1;
			}
            sidNum += 1;
		}
	}
	function buildDir(bookStreamLen){
		var name = 'Root Entry\0';
		var start = 0;
		(bufDir = new Buf(128*4))
		.fil(0)
		.pos(start)
		.uni(name)
		.pos(start+64)
		.u16(name.length*2)
		.u8(0x05)// type : root storage
		.u8(0x01)// color : black
		.i32(-1)// did_left
		.i32(-1)// did_right
		.i32(1)// did_root
		.pos(start+116)
		.i32(-2)// start_sid
		.u32(0);// stream_sz

		//workbook
		name = 'Workbook\0';
		start = 128;
		bufDir
		.pos(start)
		.uni(name)
		.pos(start+64)
		.u16(name.length*2)
		.u8(0x02)// type : user stream
		.u8(0x01)// color : black
		.i32(-1)// did_left
		.i32(-1)// did_right
		.i32(-1)// did_root
		.pos(start+116)
		.i32(0)// start_sid
		.u32(bookStreamLen);// stream_sz


        //padding
		var start = 256;
		var i = 1;
		while(i<=2){
			//bufDir.write('',start,bufDir.length,'utf16le');
			//bufDir.writeUInt16LE(''.length,start+64);
			bufDir
			.pos(start+66)
			.u8(0x00)// type : empty
			.u8(0x01)// color : black
			.i32(-1)// did_left
			.i32(-1)// did_right
			.i32(-1)// did_root
			.pos(start+116)
			.i32(-2)// start_sid
			.u32(0);// stream_sz
			start += i++*128;
		}
	}
	
	function build(writer){
		var allShtBiffLen = 0; 
		var bookStreamLen = 0;
		
		var sheetsInfo = sheets.map(function(x){
			allShtBiffLen += x.length;
			return {name:x.name, length:x.length};
		});

		gbl = new Global(sheetsInfo, sst.getBiffData(), fmt.usedFormats);
		var padding = 0x1000-((gbl.length + allShtBiffLen)%0x1000);
	
		bookStreamLen = padding + gbl.length + allShtBiffLen;

		buildDir(bookStreamLen);
		buildSAT(bookStreamLen);

		header = new Header();
		header.setTotalSATSectors(satSect.length);
		header.setDirStartSid(dirSect[0]); 
		header.setMSATStartSid(!msatSect2.length?-2:msatSect2[0]);
		header.setTotalMSATSectors(msatSect2.length);
		writer(header.getBiffData());

		writer(bufmsat1);
		gbl.flush(writer);
	
		sheets.forEach(function(x){
			x.flush(writer);
		});

		if(padding){
			var bufpadding = new Buf(padding);
			bufpadding.fil(0);
			writer(bufpadding);
		}

		writer(bufmsat2);
		writer(bufsat);
		writer(bufDir);
		writer(null);
	}
	
	function cleanup() {
		sheets.forEach(function(x){
			delete x;
		})
	}
	
	
	function XLGen(){
		var self = this;
		
		var	defStyIdx = getStyleIndex(fmt.build(format.commonStrings.general));
		var	defDatIdx = getStyleIndex(fmt.build(format.commonStrings.date0));
			
		function getStyleIndex(format){
			var idx = fmt.usedFormats.indexOf(format);
			return idx == -1 ? -1 : 16 + idx ;
		}
		
        self.addFormat = fmt.build;
        
		self.addSheet = function(name){
			if(!name) throw new Error('sheet name can not be blank');
			if(sheets.length && sheets.some(function(x){return x.name.toLowerCase() == name.toLowerCase();})) 
				throw new Error('a sheet with the same name already exists ');
			var sheet = new Sheet(name, sheets.length, sst,{
                                        getStyleIndex : getStyleIndex, 
                                        defaultStyleIndex : defStyIdx, 
                                        defaultDateStyleIndex : defDatIdx,
                                    });
			sheets.push(sheet);
			return sheet;
		}
		if(!options.binGenerator){
			var binGen = require('./generator/streamGen');
			options.binGenerator = binGen;
		}
		self.end = options.binGenerator(build,cleanup);
	};

	var xlgen = new XLGen();

	return xlgen;
}
