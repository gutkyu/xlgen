var util = require('util'),
	fs = require('fs'),
	stream = require('stream'),
	Buf = require('./buf'),
	Header = require('./stream/header'),
	Global = require('./stream/global'),
	SST = require('./stream/sst'),
    format = require('./stream/numberFormat'),
	Sheet = require('./stream/sheet');
	
var SID_FREE_SECTOR  = -1;
var SID_END_OF_CHAIN = -2;
var SID_USED_BY_SAT  = -3;
var SID_USED_BY_MSAT = -4;

exports.formatStrings = format.commonStrings;

//callback(writer)
exports.createXLGen = function (path,options){
	options = options || {};
	
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
			bufmsat2.pos(bufmsat2.length - 4);
			bufmsat2.i32(SID_END_OF_CHAIN);			
		}
		i = 109;
        var msat_sect = 0;
        var sid_num = 0;
        while(i < satSectCount){
            if ((sid_num + 1) % 128 == 0){
                //print 'link: ',
                msat_sect += 1;
                if (msat_sect < msatSect2.length){
					bufmsat2.pos(sid_num*4);
                    bufmsat2.i32(msatSect2[msat_sect]);
				}
            }else{
                //print 'sid: ',
				bufmsat2.pos(sid_num*4);
                bufmsat2.writeInt32LE(satSect[i]);
                i += 1;
			}
            sid_num += 1;
		}
	}
	function buildDir(bookStreamLen){
		var start = 0;
		bufDir = new Buf(128*4);
		bufDir.fil(0);
		bufDir.pos(start);
		var name = 'Root Entry\0';
		bufDir.uni(name);
		bufDir.pos(start+64);
		bufDir.u16(name.length*2);
		bufDir.u8(0x05);// type : root storage
		bufDir.u8(0x01);// color : black
		bufDir.i32(-1);// did_left
		bufDir.i32(-1);// did_right
		bufDir.i32(1);// did_root
		bufDir.pos(start+116);
		bufDir.i32(-2);// start_sid
		bufDir.u32(0);// stream_sz

		//workbook
		start = 128;
		bufDir.pos(start);
		name = 'Workbook\0';
		bufDir.uni(name);
		bufDir.pos(start+64);
		bufDir.u16(name.length*2);
		bufDir.u8(0x02);// type : user stream
		bufDir.u8(0x01);// color : black
		bufDir.i32(-1);// did_left
		bufDir.i32(-1);// did_right
		bufDir.i32(-1);// did_root
		bufDir.pos(start+116);
		bufDir.i32(0);// start_sid
		bufDir.u32(bookStreamLen);// stream_sz


        //padding
		var start = 256;
		var i = 1;
		while(i<=2){
			//bufDir.write('',start,bufDir.length,'utf16le');
			//bufDir.writeUInt16LE(''.length,start+64);
			bufDir.pos(start+66);
			bufDir.u8(0x00);// type : empty
			bufDir.u8(0x01);// color : black
			bufDir.i32(-1);// did_left
			bufDir.i32(-1);// did_right
			bufDir.i32(-1);// did_root
			bufDir.pos(start+116);
			bufDir.i32(-2);// start_sid
			bufDir.u32(0);// stream_sz
			start += i++*128;
		}
	}
	
	function XLGen(){
		var self = this,
            fmt = format(),
            defStyIdx = getStyleIndex(fmt.build(format.commonStrings.general)),
            defDatIdx = getStyleIndex(fmt.build(format.commonStrings.date0));
            
        function getStyleIndex(format){
            var idx = fmt.usedFormats.indexOf(format);
            return idx == -1 ? -1 : 16 + idx ;
        }
        
		function end(writer){
			var allShtBiffLen = 0; 
			var bookStreamLen = 0;
			
			var sheetsInfo = sheets.map(function(x){
				allShtBiffLen += x.length;
				return {name:x.name, length:x.length};
			});

			var bufsst = sst.getBiffData();
			gbl = new Global(sheetsInfo, bufsst, fmt.usedFormats);
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

			writer(bufmsat1.raw);
			gbl.flush(writer);
		
			sheets.forEach(function(x){
				x.flush(writer);
			});

			if(padding){
				var bufpadding = new Buf(padding);
				bufpadding.fil(0);
				writer(bufpadding.raw);
			}

			writer(bufmsat2.raw);
			writer(bufsat.raw);
			writer(bufDir.raw);
			writer(null);
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
		
		self.end = function(callback){
			var ws = isWriteableStream(path) ? path : fs.createWriteStream(path, {flags:'w'});
			ws.on('finish', function(){
				sheets.forEach(function(x){
					delete x;
				})
				callback();
			});
			ws.on('error', function(err){
				callback(err);
			});
			ws.on('open', function(){
				var wrtLen = 0;
				end(function(buffer){
					if(buffer){
						ws.write(buffer);
						wrtLen += buffer.length;
						//console.log('flush',buffer.length, wrtLen);
					}else{
						ws.end();
					}
				});
			});
		}
	};

	var xlgen = new XLGen();

	return xlgen;
}

function isWriteableStream (obj) {
	return obj instanceof stream.Stream &&
		typeof (obj._write === 'function') &&
		typeof (obj._writeableState === 'object');
}
