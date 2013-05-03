var net = require("net");

//Create the server
var server = net.createServer(function(socket){
	var req = []; //buffers so far
	socket.on("data",function(data){
		req.push(data); // add the new buffer
		var check = checkForCRLF(data);
		if(check.loc !== -1){
			var dataUpToHeaders= req.map(function(x){
				return x.toString();//get buffer strings
			}).join("");
			//get data up to /r/n
			dataUpToHeaders = dataUpToHeaders.substring(0,check.after);
			//split by line
			var headerList = dataUpToHeaders.trim().split("\r\n");
			headerList.shift() ;// remove the request line itself, eg GET / HTTP1.1
			console.log("Got headers!");
			//Read the headers
			var headerObject = readHeaders(headerList);
			//Get the header with your token
			console.log(headerObject["your-header-name"]);

			// Now perform all checks you need for it
			/*
			if(!yourHeaderValueValid){
				socket.end();
			}else{
	    		continue reading request body, and pass control to whatever logic you want!
			}
			*/


		}
	});
}).listen(8080);


//Method for reading the headers
function readHeaders(headers) {
    var parsedHeaders = {};
    var previous = "";    
    headers.forEach(function (val) {
        // check if the next line is actually continuing a header from previous line
        if (isContinuation(val)) {
            if (previous !== "") {
                parsedHeaders[previous] += decodeURIComponent(val.trimLeft());
                return;
            } else {
                throw "continuation, but no previous header";
            }
        }

        // parse a header that looks like : "name: SP value".
        var index = val.indexOf(":");

        if (index === -1) {
            throw "bad header structure: " + val;
        }

        var head = val.substr(0, index).toLowerCase();
        var value = val.substr(index + 1).trimLeft();

        previous = head;
        if (value !== "") {
            parsedHeaders[head] = decodeURIComponent(value);
        } else {
            parsedHeaders[head] = null;
        }
    });
    return parsedHeaders;
};

//Method for checking for CRLF
function checkForCRLF(data) {
    if (!Buffer.isBuffer(data)) {
        data = new Buffer(data,"utf-8");
    }
    for (var i = 0; i < data.length - 1; i++) {
        if (data[i] === 13) { //\r
            if (data[i + 1] === 10) { //\n
                if (i + 3 < data.length && data[i + 2] === 13 && data[i + 3] === 10) {
                    return { loc: i, after: i + 4 };
                }
            }
        } else if (data[i] === 10) { //\n

            if (data[i + 1] === 10) { //\n
                return { loc: i, after: i + 2 };
            }
        }
    }    
    return { loc: -1, after: -1337 };
};

function isContinuation(str) {
    return str.charAt(0) === " " || str.charAt(0) === "\t";
}

