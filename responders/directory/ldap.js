var sys			= require("sys"),
	ltx			= require("../../modules/ltx/lib/index"),
	Configs		= require("../../configs.js"),
	LDAPClient	= require("../../modules/node-ldapsearch/build/default/ldap.node");

var ldap		= function(parent) {
	this.selector	= {
		"startup": {"tag_name": false, "Event-Name": "REQUEST_PARAMS"},
		"auth": {"tag_name": "domain", "Event-Name": "REQUEST_PARAMS", "action": "sip_auth", "Event-Calling-Function": "sofia_reg_parse_auth", "user": /^[1-9]{1}[0-9]{3,6}$/},
		"mailbox": {"tag_name": "domain", "Event-Name": "GENERAL", "Event-Calling-Function": /^(resolve_id|voicemail_check_main)$/, "user": /^[1-9]{1}[0-9]{3,6}$/},
		"user": {"tag_name": "domain", "Event-Name": "REQUEST_PARAMS", "action": "user_call", "Event-Calling-Function": "user_outgoing_channel", "user": /^[1-9]{1}[0-9]{3,6}$/}
	};
	
	this.startup	= function(cbReturn, decodedBody) {
		var response	= new ltx.Element("document", {"type":"freeswitch/xml"})
			.c("section", {"name":"directory", "description":"Dynamic User Directory"})
				.c("domain", {"name":"$${domain}"})
					.c("params")
						.c("param", {"name":"dial-string", "value": "{presence_id=${dialed_user}@${dialed_domain}}${sofia_contact(${dialed_user}@${dialed_domain})}"}).up()
					.up()
				.up()
			.up();
		
		cbReturn(response.toString());
	};
	
	this.auth	= function(cbReturn, decodedBody) {
		var searchFilter	= "("+ Configs.ldap.userKey +"="+ decodedBody["user"] +")";
		var searchUri		= Configs.ldap.uri + Configs.ldap.users + searchFilter;
		
		LDAPClient.Search(searchUri, function(error, result) {
			if (typeof error !== "undefined") {
				cbReturn(null);
			} else if (typeof result[0] !== "undefined") {
				var response	= new ltx.Element("document", {"type":"freeswitch/xml"})
					.c("section", {"name":"directory", "description":"Dynamic User Directory"})
						.c("domain", {"name":"$${domain}"})
							.c("params")
								.c("param", {"name":"dial-string", "value": "{presence_id=${dialed_user}@${dialed_domain}}${sofia_contact(${dialed_user}@${dialed_domain})}"}).up()
							.up()
							.c("groups")
								.c("group", {"name":"default"})
									.c("users")
										.c("user", {"id":decodedBody["user"]})
											.c("params")
												.c("param", {"name":"password", "value":result[0][Configs.ldap.sipPassword][0]}).up()
												.c("param", {"name":"vm-password", "value":result[0][Configs.ldap.vmPassword][0]}).up()
												.c("param", {"name":"vm-enabled", "value":"true"}).up()
											.up()
											.c("variables")
												.c("variable", {"name":"toll_allow", "value":""}).up()
												.c("variable", {"name":"accountcode", "value":decodedBody["user"]}).up()
												.c("variable", {"name":"user_context", "value":"default"}).up()
											.up()
										.up()
									.up()
								.up()
							.up()
						.up()
					.up();
				
				cbReturn(response.toString());
			}
		});
	};
	
	this.mailbox	= function(cbReturn, decodedBody) {
		var searchFilter	= "("+ Configs.ldap.userKey +"="+ decodedBody["user"] +")";
		var searchUri		= Configs.ldap.uri + Configs.ldap.users + searchFilter;
		
		LDAPClient.Search(searchUri, function(error, result) {
			if (typeof error !== "undefined") {
				cbReturn(null);
			} else if (typeof result[0] !== "undefined") {
		
				var response	= new ltx.Element("document", {"type":"freeswitch/xml"})
					.c("section", {"name":"directory", "description":"Dynamic User Directory"})
						.c("domain", {"name":"$${domain}"})
							.c("params")
								.c("param", {"name":"dial-string", "value": "{presence_id=${dialed_user}@${dialed_domain}}${sofia_contact(${dialed_user}@${dialed_domain})}"}).up()
							.up()
							.c("groups")
								.c("group", {"name":"default"})
									.c("users")
										.c("user", {"id":decodedBody["user"]})
											.c("params")
												.c("param", {"name":"password", "value":result[0][Configs.ldap.sipPassword][0]}).up()
												.c("param", {"name":"vm-password", "value":result[0][Configs.ldap.vmPassword][0]}).up()
												.c("param", {"name":"vm-enabled", "value":"true"}).up()
											.up()
										.up()
									.up()
								.up()
							.up()
						.up()
					.up();
		
				cbReturn(response.toString());
			}
		});
	};
	
	this.user	= function(cbReturn, decodedBody) {
		var searchFilter	= "("+ Configs.ldap.userKey +"="+ decodedBody["user"] +")";
		var searchUri		= Configs.ldap.uri + Configs.ldap.users + searchFilter;
		
		LDAPClient.Search(searchUri, function(error, result) {
			if (typeof error !== "undefined") {
				cbReturn(null);
			} else if (typeof result[0] !== "undefined") {
		
				var response	= new ltx.Element("document", {"type":"freeswitch/xml"})
					.c("section", {"name":"directory", "description":"Dynamic User Directory"})
						.c("domain", {"name":"$${domain}"})
							.c("params")
								.c("param", {"name":"dial-string", "value": "{presence_id=${dialed_user}@${dialed_domain}}${sofia_contact(${dialed_user}@${dialed_domain})}"}).up()
							.up()
							.c("groups")
								.c("group", {"name":"default"})
									.c("users")
										.c("user", {"id":decodedBody["user"]}).up()
									.up()
								.up()
							.up()
						.up()
					.up();
		
				cbReturn(response.toString());
			}
		});
	};
	
};

exports.Responder	= [ldap];
