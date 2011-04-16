var sys		= require("sys"),
	util	= require("util"),
	events	= require("events"),
	colors	= require("colors"),
	fs		= require("fs");

/**
 * read a directory (recursively deep)
 * data[] = an object for each element in the directory
 *		.name = item's name (file or folder name)
 *		.stat = item's stat (.stat.isDirectory() == true IF a folder)
 *		.children = another data[] for the children
 * filter = an object with various filter settings:
 *		.depth		= max directory recursion depth to travel
 *						(0 or missing means: infinite)
 *						(1 means: only the folder passed in)
 *		.hidden		= true means: process hidden files and folders (defaults to false)
 *		.callback	= callback function: callback(name, path, filter) -- returns truthy to keep the file
 *
 *
 * @param path		= path to directory to read (".", ".\apps")
 * @param callback	= function to callback to: callback(err, data)
 * @param [filter]	= (optional) filter object
 * 
 * Shamelessly snagged from:
 * 	http://utahjs.com/2010/09/16/nodejs-events-and-recursion-readdir/
 */
exports.recurseDir = function(path, callback, filter) {
	if (filter) {
		// process filter. are we too deep yet?
		if (!filter.depthAt) filter.depthAt = 1;				// initialize what depth we are at
		if (filter.depth && filter.depth < filter.depthAt) {
			callback(undefined, []);							// we are too deep. return "nothing found"
			return;
		}
	}

	// queue up a "readdir" file system call (and return)
	fs.readdir(path, function(err, files) {
		if (err) {
			callback(err);
			return;
		}
		var doHidden = false;				// true means: process hidden files and folders
		if (filter && filter.hidden) {
			doHidden = true;				// filter requests to process hidden files and folders
		}
		var count = 0;						// count the number of "stat" calls queued up
		var countFolders = 0;				// count the number of "folders" calls queued up
		var data = [];						// the data to return

		// iterate over each file in the dir
		files.forEach(function (name) {
			// ignore files that start with a "." UNLESS requested to process hidden files and folders
			if (doHidden || name.indexOf(".") !== 0) {
				// queue up a "stat" file system call for every file (and return)
				count += 1;
				fs.stat(path + "/" + name, function(err, stat) {
					if (err) {
						callback(err);
						return;
					}
					var processFile = true;
					if (filter && filter.callback) {
						processFile = filter.callback(name, stat, filter);
					}
					if (processFile) {
						var obj = {};
						obj.name = name;
						obj.filepath = path + "/" + name;
						obj.stat = stat;
						data.push(obj);
						if (stat.isDirectory()) {
							countFolders += 1;
							// perform "recurseDir" on each child folder (which queues up a readdir and returns)
							(function(obj2) {
								// obj2 = the "obj" object
								exports.recurseDir(path + "/" + name, function(err, data2) {
									if (err) {
										callback(err);
										return;
									}
									// entire child folder info is in "data2" (1 fewer child folders to wait to be processed)
									countFolders -= 1;
									obj2.children = data2;
									if (countFolders <= 0) {
										// sub-folders found. This was the last sub-folder to processes.
										callback(undefined, data);		// callback w/ data
									} else {
										// more children folders to be processed. do nothing here.
									}
								});
							})(obj);
						}
					}
					// 1 more file has been processed (or skipped)
					count -= 1;
					if (count <= 0) {
						// all files have been processed.
						if (countFolders <= 0) {
							// no sub-folders were found. DONE. no sub-folders found
							callback(undefined, data);		// callback w/ data
						} else {
							// children folders were found. do nothing here (we are waiting for the children to callback)
						}
					}
				});
			}
		});
		if (count <= 0) {	// if no "stat" calls started, then this was an empty folder
			callback(undefined, []);		// callback w/ empty
		}
	});
};

