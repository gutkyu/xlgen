
module.exports = Buf;

var bufLETest = new ArrayBuffer(2);
new DataView(bufLETest).setInt16(0, 256, true);
var isLE =  new Int16Array(buffer)[0] === 256;

function Buf(length){
	var self = this;
	var buf = new ArrayBuffer(length); 
	var bufDv = new Dataview(buf);
	var pos = 0;
	
	Object.defineProperty(self, 'length', {get:function(){return buf.length;}});
	Object.defineProperty(self, 'raw', {get:function(){return buf;}});

	self.u8 =function (value){bufDv.setUint8(pos,value); pos+=1;};
	self.i8f=function (value){bufDv.setInt8(pos,value); pos+=1;};
	self.u16=function (value){bufDv.setUInt16(value,pos,true); pos+=2;};
	self.i16=function (value){bufDv.setInt16(pos,value,true); pos+=2;};
	self.u32=function (value){bufDv.setUInt32(pos,value,true); pos+=4;};
	self.i32=function (value){bufDv.setInt32(pos,value,true); pos+=4;};
	self.lng= self.i32;
	self.uln= self.u32;
	self.flt=function (value){bufDv.setFloat32(pos,value,true); pos+=4;};
	self.dbl=function (value){bufDv.setFloat64(pos,value,true); pos+=8;};
	self.hex=function (value){var len = bufDv.write(value,pos,'hex'); pos+=len;};
	self.uni=function (value){var len = bufDv.write(value,pos,'utf16le'); pos+=len;};
	self.asc=function (value){var len = bufDv.write(value,pos,'ascii'); pos+=len;};
	self.fil=function (value,length){ length = length||(bufDv.length-pos); bufDv.fill(value,pos,pos+length); pos +=length };
	self.pos=function (position){if(position === null||position === undefined) return pos; else pos=position;};	
	self.mov=function (offset){if(offset === null||offset === undefined) return pos; else pos+=offset;};
	self.slice=function(start, end){
		if(end == undefined)  end = bufDv.length;
		return bufDv.slice(start,end);
	}
}