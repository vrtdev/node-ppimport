#! /usr/bin/env node

var path = require('path');
var fs = require('fs');
var argv = require('minimist')(process.argv.slice(2), {
    default: {
        "h": "http://localhost",
        "v": false
    }
});

var lib = path.join(path.dirname(fs.realpathSync(__filename)), '../lib');

if (argv._.length !== 1 || !argv.u || !argv.p) {
    printUsage();
    process.exit(1);
}

function printUsage() {
    console.log("Usage: ppimport [-h <url>] [-c <context JSON file>] [-v] -u <username> -p <password> <path-to-import>");
}
path = argv._[0];

var context = {};
if (argv.c) {
    try {
        var fileContents = fs.readFileSync(argv.c, 'utf8');
        context = JSON.parse(fileContents);
    } catch (err) {
        console.log("The context file you passed with the -c flag is invalid. Make sure you pass an existing json file.");
        process.exit(-10);
    }
}

var options = {polopolyUrl: argv.h, username: argv.u, password: argv.p};
console.log("Importing " + path);
if (argv.v) {
    console.log("options:", JSON.stringify(options, null, 4));
    console.log("context:", JSON.stringify(context, null, 4));
}

require(lib + '/ppimport.js')(options).importContent(path, context, function (error, result) {
    if (error) {

        if (argv.v) {
            console.warn("Import failed");
            console.error(error.stack);
            if (error.cause) {
                console.error(error.cause.stack);
            }
        } else {
            console.warn("Import failed, for more info, run with -v option.");
        }
        process.exit(2);
    } else {
        console.log("Import succeeded");
        console.log(result);
        process.exit(0);
    }
});