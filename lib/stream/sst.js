"use strict"
var Buf = require('../buf');

module.exports = SST;

function SST(){
	var self = this;
    var sstId = 0x00FC;
    var continueId = 0x003C;

	var strs = [];
	//self._rt_indexes = {}
	var tally = [];
	var addCount = 0;
	
	var sstRecord = null;
	var continues = null;
	var currentPiece = null;
	var currentPieceLen = 0;

    self.addStr= function(str){
        addCount += 1;
		var idx = 0;
		var fndIdx = strs.indexOf(str) ;
		if(fndIdx<0){
			idx = strs.length ;
			strs.push(str);
            tally.push(1);
		}else{
			idx = fndIdx;
			tally[idx] += 1;
		}
        return idx;
	}

    self.delStr= function(idx){

        assert(tally[idx] > 0,'tally[idx] > 0');
        tally[idx] -= 1;
        addCount -= 1;
	}
	

    self.getBiffData = function(){
        continues = [null, null];
        currentPiece = [new Buf([0,0,0,0,0,0,0,0])];
		currentPieceLen = currentPiece[0].length;
		
		strs.forEach(function(str, idx){
			if(tally[idx] == 0) str = '';
			addToSST(str);
		})
		
        newPiece();
		var buf0 = new Buf(12);
		buf0.u16(sstId);
		buf0.u16(sstRecord.length);;
		buf0.u32(addCount);
		buf0.u32(strs.length);
        continues[0] = buf0;;
        continues[1] = Buf.slice(sstRecord,8);
        sstRecord = null;
        currentPiece = null;
		return continues
	}

    function addToSST(str){
		//compressed format(4bytes)고려하지 않고 unicode코드(5bytes)만 사용
		var len = str.length;
		var buf = new Buf(3+len*2);
		buf
		.u16(len)
		.u8(1)
		.uni(str);
        var atomLen = 5; // 2 byte -- len, 1 byte -- options, 2 byte -- 1st sym
        
        saveAtom(Buf.slice(buf,0,atomLen));
        saveSplitted(Buf.slice(buf,atomLen));
	}
   
    function newPiece(){
        if (!sstRecord){
            sstRecord = Buf.concat(currentPiece);
        }else{
            var currPieceLen = currentPieceLen ;
			var buf = new Buf(4+currPieceLen);
			buf
			.u16(continueId)
			.u16(currPieceLen)
			.set(currentPiece);
            continues.push(buf);
		}
        currentPiece = [];
		currentPieceLen  = 0;
	}
    function saveAtom(buf){
        var atomLen = buf.length;
        var freeSpace = 0x2020 - currentPieceLen;
        if (freeSpace < atomLen) newPiece();
        currentPiece.push(buf);
		currentPieceLen += buf.length;
	}
    function saveSplitted(buf){
        var i = 0;
        var strLen = buf.length;
        while (i < strLen){
            var pieceLen = currentPieceLen;
            var freeSpace = 0x2020 - pieceLen;
            var tailLen = strLen - i;
            var needMoreSpace = freeSpace < tailLen;
			var atomLen = 0;
            if (! needMoreSpace)
                atomLen = tailLen;
            else{
				atomLen = freeSpace & 0xFFFE;
			}
			
            currentPiece.push(Buf.slice(buf,i,i+atomLen));
			currentPieceLen += atomLen;
			
            if (needMoreSpace){
                newPiece();
				currentPiece.push(new buf([1]));
				currentPieceLen += 1;
			}
            i += atomLen;
		}
	}
}
