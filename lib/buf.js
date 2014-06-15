
if(Buffer){
    function Buf(length){
        var self = this;
        var buf = new Buffer(length);
        var pos = 0;
        
        Object.defineProperty(self, 'length', {get:function(){return buf.length;}});
        Object.defineProperty(self, 'raw', {get:function(){return buf;}});

        self.u8 =function (value){buf.writeUInt8(value,pos); pos+=1;};
        self.i8=function (value){buf.writeInt8(value,pos); pos+=1;};
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
        self.pos=function (position){if(position === undefined) return pos; else pos=position;};	
        self.mov=function (offset){if(offset === undefined) return pos; else pos+=offset;};
        self.slice=function(start, end){
            if(end === undefined)  end = buf.length;
            return buf.slice(start,end);
        }
    }

}else{
    //typed arrays use the native endianness of the underlying hardware
    //assume to be a little endian
    
    var hexRegEx = /[0-9A-F][0-9A-F]/i;
    function Buf(length){
        var self = this;
        var buf = new DataView(new ArrayBuffer(length));
        var pos = 0;
        
        Object.defineProperty(self, 'length', {get:function(){return buf.length;}});
        
        self.u8 =function (value){buf.setUint8(pos,value); pos+=1;};
        self.i8 =function (value){buf.setInt8(pos,value); pos+=1;};
        self.u16=function (value){buf.setUint16(pos,value);; pos+=2;};
        self.i16=function (value){buf.setInt16(pos,value);; pos+=2;};
        self.u32=function (value){buf.setUint32(pos,value);; pos+=4;};
        self.i32=function (value){buf.setInt32(pos,value);; pos+=4;};
        self.lng= self.i32;
        self.uln= self.u32;
        self.flt=function (value){buf.setFloat32(pos,value); pos+=4;};
        self.dbl=function (value){buf.setFloat64(pos,value); pos+=8;};
        self.hex=function (value){
            if( !value || !value.length || 0x01 & value.length) throw new Error('Invalid hex string');
            var hs = value.match(hexRegEx);
            if(hs.length != value.length >> 1)throw new Error('Invalid hex string');
            hs.forEach(function(x){self.u8(parseInt('0x' + x));});
        };
        self.uni=function (value){
            if( !value || typeof value != 'string') throw new Error('invalid unicode string');
            for(var i = 0; i < value.length; i++)
                self.u16(value.charCodeAt(i));
        };
        self.asc=function (value){
            if( !value || typeof value != 'string') throw new Error('invalid unicode string');
            for(var i = 0; i < value.length; i++){
                var c = value.charCodeAt(i);
                if(c>>7) throw new Error('invalid unicode string')
                self.u8( 0x7F && c);
            }
        };
        self.fil=function (value,length){ 
            length = length||(buf.length - pos); 
            for(var i =pos, maxPos = pos+length ;i < maxPos; i++) buf[i] = value; 
            pos +=length;
        };
        self.pos=function (position){if(position === undefined) return pos; else pos=position;};	
        self.mov=function (offset){if(offset === undefined) return pos; else pos+=offset;};
        self.slice=function(start, end){
            if(end === undefined)  end = buf.length;
            return buf.buffer.slice(start,end);
        }
    }

}

module.exports = Buf;
