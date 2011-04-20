var sys			= require("sys"),
	util		= require("util"),
	events		= require("events"),
	colors		= require("colors"),
	recurseDir	= require("./modules/recurseDir").recurseDir,
	Configs		= require("./configs");

var load	= function (Foulinks) {
	var self		= this;
	
	if (typeof this.Responders	=== "undefined") {
		this.Responders	= {};
	}
	
	var loadResponder	= function(filePath, responderBase) {
		var fileKey			= filePath.replace(/^(.*)\/|\.js$/g, "");
		
		if (typeof responderBase[fileKey] === "undefined") {
			responderBase[fileKey]	= new Object();
		}
		
		try {
			var responderFile	= require(filePath).Responder;
			responderFile.forEach(function (func) {
				func.apply(responderBase[fileKey], [Foulinks]);
			
				responderBase[fileKey].responderFile	= filePath;
			
				if (typeof responderBase[fileKey].init === "function") {
					responderBase[fileKey].init();
				}
			});
		
			sys.puts(("[ responders ] ." + filePath.replace(__dirname+"/"+Configs.responderDir, "").replace(/(\.js)$/, ""))[Configs.colors.responders]);
		} catch (err) {
			// Don't keep a cache of failed includes!
			/*if (typeof process.mainModule.moduleCache[filePath] !== "undefined") {
				delete process.mainModule.moduleCache[filePath];
			}
			*/
			delete responderBase[fileKey];
			
			sys.puts(("[ responders ] ERROR Loading ." + 
						filePath.replace(__dirname+"/"+Configs.responderDir, "").replace(/(\.js)$/, "") + 
						": " + err.toString() + "\n" + err.stack.toString())[Configs.colors.failure]);
		}
	};
	
	var loadResponders	= function(data) {
		for (fileIndex in data) {
			if (data[fileIndex].stat.isDirectory()) {
				loadResponders(data[fileIndex].children);
			} else {
				var baseStart		= data[fileIndex].filepath.indexOf(Configs.responderDir) + Configs.responderDir.length + 1;
				var basePath		= data[fileIndex].filepath.substr(baseStart);
				var responderBase	= self.Responders;
				var baseSections	= basePath.split("/");
				
				for (index in baseSections) {
					if (index >= baseSections.length - 1) {
						continue;
					}
					
					if (typeof responderBase[baseSections[index]] === "undefined") {
						responderBase[baseSections[index]]	= {};
					}
					
					responderBase			= responderBase[baseSections[index]];
				}
				
				responderBase.isDir	= true;
				
				loadResponder(data[fileIndex].filepath, responderBase);
			}
		}
	};
	
	var validFile	= function(name, stat, filter) {
		if (stat.isDirectory() === true) {
			return true;
		} else {
			if (/\.js$/.test(name)) {
				return true;
			}
		}
		
		return false;
	};
	
	recurseDir(__dirname + "/" + Configs.responderDir, function(err, data) {
		if (typeof err === "undefined") {
			loadResponders(data);
			
			self.emit("responders:loaded");
		} else {
			self.emit("responders:error");
		}
	}, {callback: validFile});
};

exports.load = load;

var unload	= function(Foulinks, recurse) {
	// We went too far!
	if (typeof this.responderFile !== "undefined") {
		return;
	}
	
	for (fileKey in this) {
		if (typeof this[fileKey] === "object") {
			// This is a responder and we should remove it
			if (typeof this[fileKey].responderFile !== "undefined") {
				var filePath	= this[fileKey].responderFile;
				if (typeof this[fileKey].deinit === "function") {
					this[fileKey].deinit();
					
					delete this[fileKey];
				}
				/*
				// Delete responder cache
				if (typeof process.mainModule.moduleCache[filePath] !== "undefined") {
					delete process.mainModule.moduleCache[filePath];
				}
				*/
				delete this[fileKey];
				
				sys.puts(("[ responders ] removed: " + fileKey)[Configs.colors.responders]);
			// Sub responders follow... maybe
			} else {
				unload.apply(this[fileKey], [Foulinks, true]);
			}
		}
	}
	
	if (recurse !== true) {
		Foulinks.emit("responders:deloaded");
	}
};

exports.unload = unload;

