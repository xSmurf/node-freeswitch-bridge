var sys	= require("sys"),
events	= require("events"),
fs		= require("fs");

var Configs	= this;

var load	= function (debug) {
	events.EventEmitter.call(this);
	
	var self	= this;
	Configs.debug	= debug || false;
	
	dir = __dirname + "/configs/";
	fs.readdir(dir, function (err, files) {
		if (err) {
			sys.puts(("[ warn ]  unable to load config directory: " + dir).magenta);
			return;
		}
		
		for (var k = 0, l = files.length; k < l; ++k) {
			if (!(/\.js$/.exec(files[k]))) {
				continue;
			}
			
			var filePath	= dir + files[k];
			var fullPath	= __dirname + filePath.substr(1);
			fileName		= filePath.replace(/(\.js)$/, "");
			fileKey			= fileName.replace(/^(.*)\//g, "");
			/*
			// Delete module cache
			if (typeof process.mainModule.moduleCache[fullPath] !== "undefined") {
				delete process.mainModule.moduleCache[fullPath];
			}
			*/
			var configFile	= require(fileName).Config;
			
			Object.keys(configFile).forEach(function (key) {
				Configs[key]	= configFile[key];
				
				if (Object.keys(configFile).length > 1) {
					if (key === "init" && typeof Configs.init === "function") {
						Configs.init.call(Configs, Configs);
						
						delete Configs.init;
					}
				} else {
					if (typeof Configs[key].init === "function") {
						Configs[key].init.call(Configs, Configs[key]);
						
						delete Configs[key].init;
					}
				}
			});
			
			sys.puts(("[ config ] ./" + fileKey).magenta);
		}
		
		Configs.loaded	= true;
		self.emit("config:loaded");
	});
};

sys.inherits(load, events.EventEmitter);

exports.load = load;
