"use strict"
module.exports = BufferView;

function BufferView(){
	var self = this;
	var raw = null;
	var offset = 0;
	var bufLen = 0;
	var buf = null;
	if(arguments.length == 3){
		raw = arguments[0];
		offset = arguments[1];
		bufLen = arguments[2];
	}else if(arguments.length == 2){
		raw = arguments[0];
		offset = arguments[1];
		bufLen = raw.length - offset;
	}else if(arguments.length == 1){
		if(Buffer.isBuffer(arguments[0])){
			raw = arguments[0];
			bufLen = raw.length;
		}else if(Array.isArray(arguments[0])){
			raw = new Buffer(arguments[0]);
			bufLen = raw.length;
		}else if( typeof arguments[0] == 'number'){
			bufLen = arguments[0];
			raw = new Buffer(bufLen); 				
		}else{
			throw new Error('invalidation arguments');			
		}
	}else{
		throw new Error('undefined arguments');
	}

	var rawLen = raw.length;
	var buf = bufLen ? raw : null;
	var pos = 0;
	
	Object.defineProperty(self, 'length', {get:function(){return bufLen;}});
	Object.defineProperty(self, 'position', {get:function(){return pos;}});
	Object.defineProperty(self, 'raw', {get:function(){return raw;}});
	Object.defineProperty(self, 'rawOffset', {get:function(){return offset;}});
	Object.defineProperty(self, 'rawLength', {get:function(){return rawLen;}});
	
	self.u8 =function (value){if(!bufLen) return self;buf.writeUInt8(value,pos); pos+=1;return self;};
	self.i8=function (value){if(!bufLen) return self;buf.writeInt8(value,pos); pos+=1;return self;};
	self.u16=function (value){if(!bufLen) return self;buf.writeUInt16LE(value,pos); pos+=2;return self;};
	self.i16=function (value){if(!bufLen) return self;buf.writeInt16LE(value,pos); pos+=2;return self;};
	self.u32=function (value){if(!bufLen) return self;buf.writeUInt32LE(value,pos); pos+=4;return self;};
	self.i32=function (value){if(!bufLen) return self;buf.writeInt32LE(value,pos); pos+=4;return self;};
	self.lng= self.i32;
	self.uln= self.u32;
	self.flt=function (value){if(!bufLen) return self;buf.writeFloatLE(value,pos); pos+=4;return self;};
	self.dbl=function (value){if(!bufLen) return self;buf.writeDoubleLE(value,pos); pos+=8;return self;};
	self.hex=function (value){if(!bufLen) return self;var len = buf.write(value,pos,'hex'); pos+=len;return self;};
	self.uni=function (value){if(!bufLen) return self;var len = buf.write(value,pos,'utf16le'); pos+=len;return self;};
	self.asc=function (value){var len = buf.write(value,pos,'ascii'); pos+=len;return self;};
	self.fil=function (value,length){
		if(!bufLen) return self;
		length = length||(bufLen-pos);
		buf.fill(value,pos,pos+length);
		pos +=length;
		return self;
	};
	//value : BufferView or BufferView's Array
	self.set=function (value) {
		if(!bufLen) return;
		var pos = 0;
		var len = 0;
		if(Buffer.isBuffer(value)){
			len = value.length;
			value.copy(buf,0,pos);
			pos += len;
		}else if(Array.isArray(value)){
			var val = value[0];
			if(typeof val == 'number'){
				len = value.length;
				for(var i=0; i<len; i++){
					buf[pos++] = value[i];
				}
			}else if(Array.isArray(val)){ // Buffer's Array
				value.forEach(function(val){
					len = val.length;
					val.copy(buf,0,pos);
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
		if(position === null||position === undefined)
			throw new Error('position value is invalidate');
		pos+=offset;
		return self;
	};
}
BufferView.isBufferView = function (obj) {
	return obj instanceof BufferView;
}
//Zero-based index at which to end extraction. slice extracts up to but not including end.
BufferView.slice = function(buf, start, end){
	if(end === null||end === undefined)
		end = buf.length;
	//return new BufferView(buf.raw.slice(start,end));
	return new BufferView(buf.raw, buf.rawOffset + start, end-start);
}
//list : [BufferView, BufferView, ...], totalLength : sum(BufferView.length)
BufferView.concat = function(list, totalLength){
	var len = totalLength === undefined ? 
			list.reduce(function (preSum,curItm) {return preSum + curItm.length;}, 0)
			:totalLength;
	var buffer = new Buffer(len);
	var pos = 0;
	list.forEach(function (buf) {
		var bLen = buf.length;
		var bRaw = buf.raw;
		bRaw.copy(buffer, pos, buf.rawOffset, buf.rawOffset + bLen);
		pos += bLen;
	});
	return new BufferView(buffer);
}