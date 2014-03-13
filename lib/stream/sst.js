var util = require('util'),
	Buf = require('../buf');


module.exports = SST;

function SST(){
	var self = this;
    var sstId = 0x00FC;
    var continueId = 0x003C;

	var strIdxs = {};
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
		var keys = Object.keys(strIdxs);
        if(keys.indexOf(str) < 0){
            idx = keys.length ;
            strIdxs[str] = idx;
            tally.push(1);
        }else{
            idx = strIdxs[str];
            tally[idx] += 1;
		}
        return idx;
	}

    self.delStr= function(idx){
        // This is called when we are replacing the contents of a string cell.
        // handles both regular and rt strings
        assert(tally[idx] > 0,'tally[idx] > 0');
        tally[idx] -= 1;
        addCount -= 1;
	}
	

    self.getBiffData = function(){
        continues = [null, null];
        currentPiece = [new Buffer([0,0,0,0,0,0,0,0])];
		currentPieceLen = currentPiece[0].length;
		for(str in strIdxs){
			var idx = strIdxs[str];
			if(tally[idx] == 0) str = '';
			addToSST(str);
		}
        newPiece();
		var buf0 = new Buf(12);
		buf0.u16(sstId);
		buf0.u16(sstRecord.length);;
		buf0.u32(addCount);
		buf0.u32(Object.keys(strIdxs).length);
        continues[0] = buf0.raw;;
        continues[1] = sstRecord.slice(8);
        sstRecord = null;
        currentPiece = null;
        result = Buffer.concat(continues);
        continues = null;
        return result;
	}

    function addToSST(str){
		//compressed format(4bytes)고려하지 않고 unicode코드(5bytes)만 사용
		var len = str.length;
		var buf = new Buf(3+len*2);
		buf.u16(len);
		buf.u8(1);
		buf.uni(str);
        var atom_len = 5; // 2 byte -- len, 1 byte -- options, 2 byte -- 1st sym
        
        saveAtom(buf.slice(0,atom_len));
        saveSplitted(buf.slice(atom_len));
	}
   
    function newPiece(){
        if (!sstRecord){
            sstRecord = Buffer.concat(currentPiece);
        }else{
            var curr_piece_len = currentPieceLen ;
			var buf = new Buf(4+curr_piece_len);
			buf.u16(continueId);
			buf.u16(curr_piece_len);
			var rbuf = buf.raw;
			var cbuf = Buffer.concat(currentPiece);
			cbuf.copy(rbuf,buf.pos());
            continues.push(rbuf);
		}
        currentPiece = [];
		currentPieceLen  = 0;
	}
    function saveAtom(buf){
        var atom_len = buf.length;
        var free_space = 0x2020 - currentPieceLen;
        if (free_space < atom_len) newPiece();
        currentPiece.push(buf);
		currentPieceLen += buf.length;
	}
    function saveSplitted(buf){
        var i = 0;
        var strLen = buf.length;
        while (i < strLen){
            var piece_len = currentPieceLen;
            var free_space = 0x2020 - piece_len;
            var tail_len = strLen - i;
            var need_more_space = free_space < tail_len;

            if (! need_more_space)
                atom_len = tail_len;
            else{
				atom_len = free_space & 0xFFFE;
			}
			
            currentPiece.push(buf.slice(i,i+atom_len));
			currentPieceLen += atom_len;
			
            if (need_more_space){
                newPiece();
				currentPiece.push(new Buffer([1]));
				currentPieceLen += 1;
			}
            i += atom_len;
		}
	}
}
