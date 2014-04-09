#! /usr/bin/env node

var path = require('path');
var fs = require('fs');
var argv = require('minimist')(process.argv.slice(2), {
    default: {
        "h": "http://localhost"
    }
});

var lib = path.join(path.dirname(fs.realpathSync(__filename)), '../lib');

if (argv._.length !== 1 || !argv.u || !argv.p) {
    printUsage();
    process.exit(1);
}

function printUsage() {
    console.log("Usage: ppimport [-h <url>] -u <username> -p <password> <path-to-import>");
}
path = argv._[0];

var options = {polopolyUrl: argv.h, username: argv.u, password: argv.p};
console.log("Importing " + path + " with options " + options.toString());

require(lib + '/ppimport.js')(options).importContent(path, function (error, result) {
    if (error) {
        console.warn("Import failed");
        console.error(error.stack);
        if (error.cause) {
            console.error(error.cause.stack);
        }
        process.exit(2);
    } else {
        console.log("Import succeeded");
        console.log(result);
        process.exit(0);
    }
});