var FreeNodeHandler	= require("./libs/freenode").FreeNode,
	Configs			= require("./configs");

// Instanciate our main object
var FreeNode	= new FreeNodeHandler();

FreeNode.init();

// Process SIGHUP by calling reinit
process.on("SIGHUP", function() {
	console.log(("\n\n**** Reloading FreeNode! ****\n")[Configs.color]);
	
	FreeNode.reinit();
});
