node-ppimport
=============

Polopoly content importer for node.js

This module is made to enable content to be imported into polopoly (http://www.atex.com/products/web-cms) by using the xmlio format as suggested by the CMS system.

Synopsis
--------

The importer is capable of taking files and directories to import a single file or an entire hierarchy of files as its input. It uses file type hooks to deal with specific file types. Out-of-the box, it comes with 2 build in hooks for XML and DUST files. In this way you can import static XML files or dynamically parsed dust templates.

Installation
------------

If you plan on using the importer in a terminal, we suggest installing ppimport globaly:

```
npm install -g ppimport
```

This allows you to run the CLI wit ease.

If you plan on integrating ppimport into your own node module, you should install using the following command. Be sure to run the command in your module's root folder (folder containing the package.json file). 

```
npm install --save ppimport
```

This will install the ppimport module locally to your own module and add a dependency to your package.json file.

Command Line Interface
----------------------

You can use the command line tool provided with the package. Use the CLI as follows:

```
ppimport [-h host] [-c context] [-v] -u username -p password path
	
	-h     polopoly HTTP url where the import endpoint is located. 
	-c     a json file containing context information. This context is passed to the file processing hooks. This comes in handy when using a template hook which probably needs data to fill in the placeholder values.
	-u     username to login to polopoly before importing
	-p     password to login to polopoly before importing
	-v     verbose mode, prints out extra information during the import process. If you specify this option as last in your argument list, be sure to terminate with -- (see examples)
	
	path   the path to the file or folder to be imported. If you specify a folder, only supported file type will be included in the import package. (By default: .xml and .dust files)
	
Examples:
	Import an entire directory
		ppimport -h http://pp-dev.vrt.be//polopoly/import -c data.json -u editor -p edpass /folder/containing/templates
		
	Import a single file
		ppimport -v -h http://pp-dev.vrt.be//polopoly/import -u editor -p edpass /folder/containing/templates/firstfile.xml
		
	Using the verbose option at the end of the option flag list (use --)
		ppimport -h http://pp-dev.vrt.be//polopoly/import -u editor -p edpass -v -- /folder/containing/templates/firstfile.xml

```

Use ppimport as dependecny in your own module
---------------------------------------------

To use the importer, your should require it in your code as so:

```javascript
var options = {
    "polopolyUrl": "http://localhost/polopoly/import",
    "username": "editor",
    "password": "edpass"
}
var ppimport = require('ppimport')(options);
```

The options object is used to configure the polopoly user credentials and to point to the correct import location.

Now you can call the importContent function on ppimport as so:

```javascript
ppimport.importContent('../path/to/file/or/folder/to/import', function(error) {
	if (error) {
		console.log('import failed');
	}
}); 
```

If you are passing a template file (such as a .dust file) or a directory containing template files, you will probably need to also pass a context object, so the templating engine can use that context to resolve it's placeholders. You do this as so:

```javascript
var context = {
	"somePlaceholder": "value"
};

ppimport.importContent('../path/to/file/or/folder/to/import', context, function(error) {
	if (error) {
		console.log('import failed');
	}
}); 
```

Adding your own file type hooks
-------------------------------
If you prefer to use a templating engine other then dust, you can always provide you own hook. A hook is a node.js module exposing two methods:
* singleFileFunction: called when importing a single file. This function should create a stream for the file/rendered template that is to be imported. When the stream has been created, call the passed in callback with null as first parameter and the stream as the second parameter. When an error occurs just pass the error parameter to the callback.
	
* directoryFunction: called when importing an entire directory. In this function you should add the files your hook supports under the passed in path to the passed in archive. Once you are ready, be sure to call the passed in callback. If an error occurs, pass it as single parameter to the callback. 

```javascript
exports.singleFileFunction = function (path, context, callback) {
	//Insert your code here
	var stream = ...; //a node.js stream
    callback(null, stream);
};

exports.directoryFunction = function (path, archive, context, callback) {
    //Insert your code here
    callback();
};
```

See http://nodejs.org/api/stream.html for more information on streams

To use your custom hook, add your hook to the configuration options of the importer as so:

```javascript
var myHook = require('myExtHook');
var options = {
    "polopolyUrl": "http://localhost/polopoly/import",
    "username": "editor",
    "password": "edpass",
    "hooks": {".EXT": myHook}
}
var ppimport = require('ppimport')(options);
```

The .EXT should be replaced by the file extension your hook is supporting.


References & extra info
-----------------------

* Dust template engine: http://akdubya.github.io/dustjs/
* Archiver: https://github.com/ctalkington/node-archiver
