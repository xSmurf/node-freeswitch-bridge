/**
* TODO: LDAP query cache for speed and to not hammer the ldap server for nothing 5min cache would be plenty
* TODO: VM Change Password
* TODO: Provider Balance
**/

var debug				= true;

var	sys					= require("sys"),
	util				= require("util"),
	events				= require("events"),
	colors				= require("colors"),
	path				= require("path"),
	hash				= require("../modules/node-hash/lib/hash"),
	// We load this separately because we might need some things before the configs are loaded
	FreeNodeConfig		= require("../configs/freenode").Config,
	Configs				= require("../configs"),
	Responders			= require("../responders"),
	LDAPClient			= require("../modules/node-ldapsearch/build/default/ldap.node"),
	httpServer			= require("./httpd").httpServer;

var FreeNode	= function() {
	var self		  		= this;
	this.uptime				= (new Date().getTime());
	this.loaders			= [];
	this.ConfigsLoader		= null;
	this.RespondersLoader	= null;
	this.httpd				= null;
	
	process.title			= "FreeNode";
	
	events.EventEmitter.call(this);
	
	process.chdir(path.dirname(__dirname));
	
	var onInitedListerner	= function() {
		self.removeListener("loaded", onInitedListerner);
		self.onInited();
	};
	
	this.addListener("loaded", onInitedListerner);
	
	this.addDependencies();
	
	return this;
};


sys.inherits(FreeNode, events.EventEmitter);
exports.FreeNode	= FreeNode;


/**
* init: Processes the loader chain by starting each loader function 
* 	and waiting for the return object's loaded event before processing the next one.
*/
FreeNode.prototype.init	= function(reload) {
	var self	= this;
	
	this.reload	= false;
	if (typeof reload !== "undefined") {
		this.reload	= reload;
	}
	
	if (this.loaders.length > 0) {
		var setup	= function(params) {
			return function() {
				var success	= params.success;
				
				if (typeof success[2] === "undefined") {
					var obj			= success[0]();
				} else {
					var obj			= success[2];
				}
				
				if (typeof params.failure !== "undefined") {
					var failure		= params.failure;
					var cbFailure	= function(error) {
						obj.removeListener(failure[1], cbFailure);
						failure[0](error);
					};
				}
				
				var cbSuccess	= function() {
					obj.removeListener(success[1], cbSuccess);
					if (typeof failure !== "undefined") {
						obj.removeListener(failure[1], cbFailure);
					}
					
					self.loaders.shift();
					self.init(self.reload);
				};
				
				if (typeof params.failure !== "undefined") {
					obj.addListener(failure[1], cbFailure);
				}
				
				obj.addListener(success[1], cbSuccess);
				
				if (typeof success[2] !== "undefined") {
					success[0]();
				}
			};
		}(this.loaders[0]);
		
		setup();
	} else if (this.reload === false) {
		this.emit("loaded");
	} else if (this.reload === true) {
		this.emit("reloaded");
	}
	
	return this;
};

/**
* reinit: Prepares and initiates a processs resource reload
* 	(triggered by SIGHUP)
*/
FreeNode.prototype.reinit	= function(cbReturn) {
	var self	= this;
	
	this.addDependencies(true);
	
	var onReloaded	= function() {
		self.removeListener("reloaded", onReloaded);
		console.log(("\nFreeNode Reload Completed!\n\n")[Configs.color]);
	};
	
	this.addListener("reloaded", onReloaded);
	
	if (typeof cbReturn === "function") {
		var cbFunc	= function(cb) {
			return function() {
				self.removeListener("reloaded", cbFunc);
				cbReturn();
			};
		}(cbReturn);
		
		this.addListener("reloaded", cbFunc);
	}
	
	this.init(true);
};

FreeNode.prototype.onInited	= function() {
	this.httpServer	= new httpd().init();
	
	console.log(util.inspect(this));
};

/**
* addDependencies: loads a list of the process' dependencies in the loading chain.
* Some dependencies are skipped if this is called in reload mode
*/
FreeNode.prototype.addDependencies	= function(reload) {
	var self	= this;
	
	if (typeof reload === "undefined") {
		var reload	= false;
	}
	
	this.addDependency(
		// Loader
		[function() {
			console.log(("Loading Configuration Files")[FreeNodeConfig.colors.configs]);
			self.ConfigsLoader	= new Configs.load(debug);
			return self.ConfigsLoader;
		}, "config:loaded"]
	);
	
	if (reload === true) {
		this.httpd.deinit();
		
		// We also want to wait for the MUC to bind
		this.addDependency(
			// Loader
			[function() {
				console.log(("Removing responders for reload")[Configs.colors.responders]);
				
				Responders.unload.apply(self.Responders, [self]);
			}, "responders:deloaded", this]
		);
	}
	
	this.addDependency(
		// Loader
		[function() {
			console.log(("Loading Responders")[Configs.colors.responders]);
			
			Responders.load.apply(self, [self]);
		}, "responders:loaded", this]
	);
	
	
	this.addDependency(
		// Loader
		[function() {
			console.log(("Loading HTTP Server")[Configs.httpd.color]);
			self.httpd	= new httpServer(self.Responders).init();
			return self.httpd;
		}, "httpd:binded"],
		
		// Failure
		[function(error) {
			sys.error(("Error binding HTTP Server")[Configs.colors.failure]);
			process.exit(1);
		}, "httpd:error"]
	);
	
};

/**
* addDependency: adds a dependency data to the loading chain
* 
* success[0]	= The object loader function, should return the object on which to bind the loaded event
* success[1]	= The "loaded" event which the object will trigger when it's done loading
* success[2]	= Optionally, you can specify an object on which to bind the event before calling the loader function
* 					This is useful in cases where the loading function triggers an the event on a different object that already exists
* Optional:
* failure[0]	= Callback function to bind to the object on failure
* failure[1]	= Error event name on which to bind the callback
*/
FreeNode.prototype.addDependency	= function(success, failure) {
	this.loaders[this.loaders.length]	= {success:success, failure:failure};
};

