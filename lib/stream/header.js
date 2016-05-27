var Buf = require('../buf');

module.exports = Header;

function Header(){
	var self = this;
	var buf = new Buf(76);
	buf.hex('D0CF11E0A1B11AE1');//doc_magic
	buf.fil(0,16);//file_uid
	buf.u16(0x3E);// rev_num              
	buf.u16(0x03);//ver_num              
	buf.u16(0xFFFE);//byte_order            
	buf.u16(9);//log_sect_size         
	buf.u16(6);//log_short_sect_size  
	buf.fil(0,10);//not_used0           
	var totalSATSectorsPos = buf.position;
	buf.u32(0);// total_sat_sectors , SAT_sect에 의존
	var dirStartSidPos = buf.position;
	buf.i32(0);//dir_start_sid, dir_stream_sect[0] 에 의존
	buf.fil(0,4);//not_used1                   
	buf.u32(0x1000);//min_stream_size      
	buf.i32(-2);//ssat_start_sid        
	buf.u32(0);//total_ssat_sectors  
	var msatStartSidPos = buf.position;
	buf.lng(-2);//msat_start_sid , self.MSAT_sect_2nd 에 의존
	var totalMSATSectorsPos = buf.position;
	buf.uln(0);//total_msat_sectors   , self.MSAT_sect_2nd 에 의존
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
	
	self.getBiffData=function(){return buf;};
}