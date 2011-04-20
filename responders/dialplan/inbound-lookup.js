var sys			= require("sys"),
	ltx			= require("../../modules/ltx/lib/index"),
	Configs		= require("../../configs.js"),
	LDAPClient	= require("../../modules/node-ldapsearch/build/default/ldap.node");
	
var inboundLookup	= function(parent) {
	this.selector	= {
		"lookup":	{"Call-Direction": "inbound", "variable_direction": "inbound", "Caller-Context": "public"}
	};
	
	this.lookup	= function(cbReturn, decodedBody) {
		var searchFilter	= "(mobile="+ decodedBody["Caller-ANI"] +")";
		var searchUri		= Configs.ldap.uri + Configs.ldap.users + searchFilter;
		
		LDAPClient.Search(searchUri, function(error, result) {
			if (typeof error !== "undefined") {
				cbReturn(null);
			} else if (typeof result[0] !== "undefined") {
				var response	= new ltx.Element("document", {"type":"freeswitch/xml"})
					.c("section", {"name":"dialplan", "description": "Inbound LDAP Lookup"})
						.c("context", {"name":"public"})
							.c("extension", {"name":"inbound_ldap_lookup"})
								.c("condition", {"field":"ani", "expression":"/^"+ decodedBody["Caller-ANI"] +"$/"})
									.c("action", {"application": "set", "data": "effective_caller_id_name="+ result[0]["givenName"][0]}).up()
									.c("action", {"application": "export", "data": "alert_info=Bellcore-r5"}).up()
									.c("action", {"application": "transfer", "data": Configs.inboundDestination}).up()
								.up()
							.up()
						.up()
					.up();
					
				cbReturn(response.toString());
			}
		});
	};
};

exports.Responder	= [inboundLookup];
