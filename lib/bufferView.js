"use strict"
module.exports = BufferView;

var bufLETest = new ArrayBuffer(2);
new DataView(bufLETest).setInt16(0, 256, true);
var isLE =  new Int16Array(bufLETest)[0] === 256;
//byte order : Little Endian
function BufferView(){
	var self = this;
	var raw = null;
	var offset = 0;
	var bufLen = 0;
	if(arguments.length == 3){
		raw = arguments[0];
		offset = arguments[1];
		bufLen = arguments[2];
	}else if(arguments.length == 2){
		raw = arguments[0];
		offset = arguments[1];
		bufLen = raw.length - offset;
	}else if(arguments.length == 1){
		if(arguments[0] instanceof ArrayBuffer){
			raw = arguments[0];
			bufLen = raw.byteLength;
		}else if(Array.isArray(arguments[0])){
			raw = (new Uint8Array(arguments[0])).buffer;
			bufLen = raw.byteLength;
		}else if( typeof arguments[0] == 'number'){
			bufLen = arguments[0];
			raw = new ArrayBuffer(bufLen); 				
		}else{
			throw new Error('invalidation arguments');			
		}
	}else{
		throw new Error('undefined arguments');
	}

	var rawLen = raw.length;
	var bufDv = bufLen ? new DataView(raw,offset,bufLen) : null;
	// var bufU8 = bufLen ? new Uint8Array(raw,offset,bufLen) : null;
	var bufU8 = undefined; 
	var pos = 0;
	
	Object.defineProperty(self, 'length', {get:function(){return bufLen;}});
	Object.defineProperty(self, 'position', {get:function(){return pos;}});
	Object.defineProperty(self, 'raw', {get:function(){return raw;}});
	Object.defineProperty(self, 'rawOffset', {get:function(){return offset;}});
	Object.defineProperty(self, 'rawLength', {get:function(){return rawLen;}});
	
	function defbufU8() {
		bufU8 = bufLen ? new Uint8Array(raw,offset,bufLen) : null;
	}

	self.u8 =function (value){if(!bufLen) return self;bufDv.setUint8(pos,value); pos+=1;return self;};
	self.i8 =function (value){if(!bufLen) return self;bufDv.setInt8(pos,value); pos+=1;return self;};
	self.u16=function (value){if(!bufLen) return self;bufDv.setUint16(pos,value,true); pos+=2;return self;};
	self.i16=function (value){if(!bufLen) return self;bufDv.setInt16(pos,value,true); pos+=2;return self;};
	self.u32=function (value){if(!bufLen) return self;bufDv.setUint32(pos,value,true); pos+=4;return self;};
	self.i32=function (value){if(!bufLen) return self;bufDv.setInt32(pos,value,true); pos+=4;return self;};
	self.lng= self.i32;
	self.uln= self.u32;
	self.flt=function (value){if(!bufLen) return self;bufDv.setFloat32(pos,value,true); pos+=4;return self;};
	self.dbl=function (value){if(!bufLen) return self;bufDv.setFloat64(pos,value,true); pos+=8;return self;};
	self.hex=function (hexStr){
		if(!bufLen) return self;
		var len = hexStr.length;
		if(len&0x1) throw new Error('hex string length error');
		for(var i=0; i < len; i+=2){
			bufDv.setUint8(pos++,parseInt(hexStr.substr(i,2),16));
		}
		return self;
	};
	//utf16le
	self.uni=function (str){
		if(!bufLen) return self;
		var len = str.length;
		for(var i=0; i < len; i++){
			bufDv.setUint16(pos,str.charCodeAt(i), true);
			pos += 2;
		}
		return self;
	};
	//ascii
	self.asc=function (str){
		if(!bufLen) return self;
		var len = str.length;
		for(var i=0; i < len; i++){
			bufDv.setUint8(pos++,0x7FF&str.charCodeAt(i));
		}
		return self;
	};
	if(!Uint8Array.prototype.fill){
		Uint8Array.prototype.fill = function (value, start, end) {
			var self = this;
			if(end === undefined){
				end = self.byteLength;
			}
			if(start === undefined){
				start = 0;
			}
			for(var i = start; i < end; i++){
				self[i] = value;
			}
		};
	}
	self.fil=function (value,length){
		if(!bufLen) return self;
		if(bufU8 === undefined)
			defbufU8();
		length = length||(bufLen-pos);
		bufU8.fill(value,pos,pos+length);
		pos +=length;
		return self;
	};		
	//value : BufferView or BufferView's Array
	self.set=function (value) {
		if(!bufLen) return;
		var pos = 0;
		var len = 0;
		if(bufU8 === undefined) defbufU8();
		if(value instanceof BufferView){
			len = value.length;
			var bufIn = new Uint8Array(value.raw,value.rawOffset,len);
			bufU8.set(bufIn,pos);
			pos += len;
		}else if(Array.isArray(value)){
			var val = value[0];
			if(typeof val == 'number'){
				len = value.length;
				bufU8.set(value,pos);
				pos += len;
			}else if(Array.isArray(val)){
				value.forEach(function(buf){
					len = buf.length;
					var bufIn = new Uint8Array(buf.raw,buf.rawOffset,len);
					bufU8.set(bufIn,pos)
					pos += len;
				});
			}else{
				throw new Error('unsupported type');
			}
		}else{
			throw new Error('unsupported type');
		}
		
	}
	self.pos=function (position){
		if(!bufLen) return self;
		if(position === null||position === undefined)
			throw new Error('position value is invalidate'); 
		pos=position;
		return self;
	};	
	self.mov=function (offset){
		if(!bufLen) return self;
		if(offset === null||offset === undefined)
			throw new Error('offset value is invalidate'); 
		pos+=offset;
		return self;
	};
	
}
//Zero-based index at which to end extraction. slice extracts up to but not including end.
BufferView.slice = function(buf, start, end){
	if(end === null||end === undefined)
		end = buf.length;
	return new BufferView(buf.raw, buf.rawOffset + start, end-start);
}
//list : [BufferView, BufferView, ...], totalLength : sum(BufferView.length)
BufferView.concat = function(list, totalLength){
	var len = totalLength === undefined ? 
			list.reduce(function (preSum,curItm) { return preSum + curItm.length;}, 0)
			:totalLength;
	var bufU8 = new Uint8Array(len);
	var pos = 0;
	list.forEach(function (buf) {
		var len = buf.length;
		var bufIn = new Uint8Array(buf.raw,buf.rawOffset,len);
		bufU8.set(bufIn,pos);
		pos += len;
	});
	return new BufferView(bufU8.buffer);
}