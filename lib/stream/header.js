var util = require('util'),
	Buf = require('../buf');

module.exports = Header;

function Header(){
	var self = this;
	var buf = new Buf(76);
	buf.hex('D0CF11E0A1B11AE1');//doc_magic
	buf.fil(0,16);//file_uid
	buf.u16(0x3E);// rev_num               = '\x3E\x00'
	buf.u16(0x03);//ver_num               = '\x03\x00'
	buf.u16(0xFFFE);//byte_order            = '\xFE\xFF'
	buf.u16(9);//log_sect_size         = struct.pack('<H', 9)
	buf.u16(6);//log_short_sect_size   = struct.pack('<H', 6)
	buf.fil(0,10);//not_used0             = '\x00'*10
	var totalSATSectorsPos = buf.pos();
	buf.u32(0);// total_sat_sectors , SAT_sect에 의존, *마지막에 다시 계산해서 수정
	var dirStartSidPos = buf.pos();
	buf.i32(0);//dir_start_sid, dir_stream_sect[0] 에 의존, *마지막에 다시 계산해서 수정
	buf.fil(0,4);//not_used1             = '\x00'*4        
	buf.u32(0x1000);//min_stream_size       = struct.pack('<L', 0x1000)
	buf.i32(-2);//ssat_start_sid        = struct.pack('<l', -2)
	buf.u32(0);//total_ssat_sectors    = struct.pack('<L', 0)
	var msatStartSidPos = buf.pos();
	buf.lng(-2);//msat_start_sid , self.MSAT_sect_2nd 에 의존적, *마지막에 다시 계산해서 수정
	var totalMSATSectorsPos = buf.pos();
	buf.uln(0);//total_msat_sectors   , self.MSAT_sect_2nd 에 의존적, *마지막에 다시 계산해서 수정
	self.setTotalSATSectors = function(value){
		buf.pos(totalSATSectorsPos);
		buf.u32(value);
	}
	
	self.setDirStartSid = function(value){
		buf.pos(dirStartSidPos);
		buf.i32(value);
	}
	
	self.setMSATStartSid = function(value){
		buf.pos(msatStartSidPos);
		buf.lng(value);
	}
	
	self.setTotalMSATSectors = function(value){
		buf.pos(totalMSATSectorsPos);
		buf.uln(value);
	}
	
	self.getBiffData=function(){return buf.raw;};
}