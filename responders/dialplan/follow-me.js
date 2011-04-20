var sys			= require("sys"),
	ltx			= require("../../modules/ltx/lib/index"),
	Configs		= require("../../configs.js"),
	LDAPClient	= require("../../modules/node-ldapsearch/build/default/ldap.node");
	
var followMe	= function(parent) {
	this.selector	= {
		"follow":	{"Call-Direction": "inbound", "variable_direction": "inbound", "Caller-Context": "default", "Caller-Destination-Number": /^[1-6]{1}[0-9]{3,6}$/}
	};
	
	this.follow	= function(cbReturn, decodedBody) {
		var searchFilter	= "(&("+ Configs.ldap.userKey +"="+ decodedBody["Caller-Destination-Number"] +")(mobile=*))";
		var searchUri		= Configs.ldap.uri + Configs.ldap.users + searchFilter;
		
		LDAPClient.Search(searchUri, function(error, result) {
			if (typeof error !== "undefined") {
				cbReturn(null);
			} else if (typeof result[0] !== "undefined") {
				var response	= new ltx.Element("document", {"type":"freeswitch/xml"})
					.c("section", {"name":"dialplan", "description": "LDAP Follow Me"})
						.c("context", {"name":"default"})
							.c("extension", {"name":"inbound_ldap_lookup"})
								.c("condition", {"field":"destination_number", "expression":"/^"+ decodedBody["Caller-Destination-Number"] +"$/"})
									.c("action", {"application": "set", "data": "hangup_after_bridge=true"}).up()
									.c("action", {"application": "set", "data": "continue_on_fail=true"}).up()
									.c("action", {"application": "set", "data": "ignore_early_media=true"}).up()
									.c("action", {"application": "set", "data": "call_timeout=15"}).up()
									.c("action", {"application": "bridge", "data": "sofia/$${domain}/"+ decodedBody["Caller-Destination-Number"]}).up()
									.c("action", {"application": "set", "data": "call_timeout=15"}).up()
									.c("action", {"application": "bridge", "data": "sofia/gateway/"+ Configs.gatewayName +"/"+ result[0]["mobile"][0]}).up()
									.c("action", {"application": "answer"}).up()
									.c("action", {"application": "sleep", "data": "1000"}).up()
									.c("action", {"application": "voicemail", "data": "default $${domain} "+ decodedBody["Caller-Destination-Number"]}).up()
								.up()
							.up()
						.up()
					.up();
				
				
				cbReturn(response.toString());
			}
		});
	};
};

exports.Responder	= [followMe];
