var sys			= require("sys"),
	colors		= require("colors"),
	http		= require("http"),
	util		= require("util"),
	querystring = require("querystring"),
	events		= require("events"),
	hash		= require("../modules/node-hash/lib/hash"),
	dateFormat	= require("../modules/date.js").dateFormat,
	url			= require("url"),
	colors		= require("colors"),
	Configs		= require("../configs.js");

var httpServer	= function(responders) {
	var self		= this;
	this.httpd		= null;
	this.responders	= responders;
	
	events.EventEmitter.call(this);
};

sys.inherits(httpServer, events.EventEmitter);
exports.httpServer = httpServer;

httpServer.prototype.init	= function() {
	var self	= this;
	
	self.httpd	= http.createServer(function(request, response) {
			self.handlerResponse(request, response);
		})
		.addListener("error", function(error) {
			console.log("httpd crapped out");
			console.log(error);
			
			self.emit("httpd:error", self);
		});
	
	self.httpd.listen(Configs.httpd.port);
	
	self.emit("httpd:binded", self);
	
	return self;
};

httpServer.prototype.deinit	= function() {
	var self	= this;
	
	self.httpd.close();
};

httpServer.prototype.getResponder	= function(decodedBody) {
	var self			= this,
		responder		= null,
		handler			= null,
		selectorLen		= 0;
	
	
	try {
		if (typeof decodedBody["section"] === "undefined") {
			throw "Invalid Request";
		}
		
		if (typeof self.responders[decodedBody["section"].toLowerCase()] === "undefined") {
			throw "Invalid Bidings";
		} else {
			var bindings	= decodedBody["section"].toLowerCase();
		}
		
		for (entryName in self.responders[bindings]) {
			var entry	= self.responders[decodedBody["section"]][entryName];
			
			if (typeof entry.selector === "undefined") {
				continue;
			} else {
				for (handlerName in entry.selector) {
					if (Object.keys(entry.selector[handlerName]).length > selectorLen) {
						var ii = 0;
						for (selectorKey in entry.selector[handlerName]) {
							var match = false;
							switch (typeof entry.selector[handlerName][selectorKey]) {
								case "string":
									match	= (decodedBody[selectorKey] === entry.selector[handlerName][selectorKey]);
								break;
								
								case "boolean":
									match	= (
													(entry.selector[handlerName][selectorKey] === true && decodedBody[selectorKey].length !== 0)
													|| (entry.selector[handlerName][selectorKey] === false && decodedBody[selectorKey].length === 0)
												);
								break;
								
								case "object":
								case "function":
									if (entry.selector[handlerName][selectorKey] instanceof RegExp) {
										match	= entry.selector[handlerName][selectorKey].test(decodedBody[selectorKey]);
									}
								break;
								
							}
							
							if (match === true) {
								if (++ii === Object.keys(entry.selector[handlerName]).length) {
									selectorLen		= Object.keys(entry.selector[handlerName]).length;
									responder		= entry;
									handler			= handlerName;
								}
							}
						}
					}
				}
			}
		}
	} catch (err) {
		console.log("Invalid request... " + err);
	}
	
	console.log(util.inspect(decodedBody));
	if (responder !== null) {
		console.log(util.inspect(responder));
		return [responder, handler];
	} else {
		return null;
	}
};

httpServer.prototype.handlerResponse	= function(request, response) {
	var self		= this,
		fullBody	= "";
	
	request.on('data', function(chunk) {
		// append the current chunk of data to the fullBody variable
		fullBody += chunk.toString(); 
	});

	request.on('end', function() {
		// parse the received body data
		var decodedBody = querystring.parse(fullBody);
		var responder	= null;
		
		if ((responder = self.getResponder(decodedBody)) !== null) {
			var cbReturn	= function(responseData) {
				if (typeof responseData !== "undefined" && responseData !== null && responseData.length > 0) {
					response.writeHead(200, "OK", {'Content-Type': 'text/xml'});
					response.write(responseData, "ascii");
				}
				
				response.end();
			};
			
			responder[0][responder[1]](cbReturn, decodedBody);
		} else {
			response.end();
		}
	});
};
