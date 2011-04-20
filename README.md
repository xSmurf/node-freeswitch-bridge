# LDAP <> Freeswitch user bridge in NodeJS #

This is a bridge for integrating LDAP users into FreeSwitch. Unlike realtime Asterisk, it does not require many additional schemas to your directory, at the time only three fields are needed for sip password, vm password and mobile phone number. Extensions are based on uid numbers.

## Dependencies ##

[node-ldapsearch](https://github.com/xSmurf/node-ldapsearch), [ltx](https://github.com/astro/ltx), [node-expat](https://github.com/astro/node-expat), colors.

<pre>
	npm install node-expat colors
	git submodule init
</pre>

## TODOS ##

* VM Change Password support (will require additional support from node-ldapsearch)
* LDAP Query cache to avoid hammering the ldap server (FreeSwitch can request user information many times in a single dialplan)

Every original work included is licenced under Creative Commons BY-SH

