
module.exports = Buf;

function Buf(length){
	var self = this;
	var buf = new Buffer(length);
	var pos = 0;
	
	Object.defineProperty(self, 'length', {get:function(){return buf.length;}});
	Object.defineProperty(self, 'raw', {get:function(){return buf;}});

	self.u8 =function (value){buf.writeUInt8(value,pos); pos+=1;};
	self.i8f=function (value){buf.writeInt8(value,pos); pos+=1;};
	self.u16=function (value){buf.writeUInt16LE(value,pos); pos+=2;};
	self.i16=function (value){buf.writeInt16LE(value,pos); pos+=2;};
	self.u32=function (value){buf.writeUInt32LE(value,pos); pos+=4;};
	self.i32=function (value){buf.writeInt32LE(value,pos); pos+=4;};
	self.lng= self.i32;
	self.uln= self.u32;
	self.flt=function (value){buf.writeFloatLE(value,pos); pos+=4;};
	self.dbl=function (value){buf.writeDoubleLE(value,pos); pos+=8;};
	self.hex=function (value){var len = buf.write(value,pos,'hex'); pos+=len;};
	self.uni=function (value){var len = buf.write(value,pos,'utf16le'); pos+=len;};
	self.asc=function (value){var len = buf.write(value,pos,'ascii'); pos+=len;};
	self.fil=function (value,length){ length = length||(buf.length-pos); buf.fill(value,pos,pos+length); pos +=length };
	self.pos=function (position){if(position == undefined) return pos; else pos=position;};	
	self.mov=function (offset){if(offset == undefined) return pos; else pos+=offset;};
	self.slice=function(start, end){
		if(end == undefined)  end = buf.length;
		return buf.slice(start,end);
	}
}