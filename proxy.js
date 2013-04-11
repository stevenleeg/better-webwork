var http = require('http'),
    https = require('https'),
    stream = require('stream'),
    mime = require('mime'),
    fs = require('fs'),
    util = require('util'),

    host = 'math.webwork.rochester.edu',
    listenPort = 8031,
    
    extension = 'better-webwork',
    extensionDir = '.',
    contentScripts = require(extensionDir + '/manifest.json').content_scripts,

    localFiles = {};
    bww = contentScripts[0],
    bww.css.concat(bww.js).forEach(function (file) {
        localFiles['/' + extension + '/' + file] = extensionDir + '/' + file;
    });

// http://cantina.co/2012/11/13/save-your-sanity-with-node-proxies-injectorations/
function serveLocalFile(httpRequest, httpResponse, filename) {
    console.log("local: " + httpRequest.url);

    var send404 = function () {
        httpResponse.setHeader('Content-Type', 'text/html');
        httpResponse.write("NOT FOUND: " + httpRequest.url);
        httpResponse.end();
    };

    var existsCallback = function (exists) {
        var readStream;
        if (!exists) {
            send404();
            return;
        }
        httpResponse.setHeader('Content-Type', 
            mime.lookup(httpRequest.url));
            readStream = fs.createReadStream(filename);
            readStream.pipe(httpResponse);
    };

    fs.exists(filename, existsCallback);
}

function Injector() {
    stream.Transform.apply(this, arguments);
}
util.inherits(Injector, stream.Transform);

Injector.prototype.injection = contentScripts.map(function (content) {
    return content.css.map(function (file) {
        return '<link rel="stylesheet" type="text/css" href="/' +
            extension + '/' + file + '">';
    }).concat(content.js.map(function (file) {
        return '<script type="text/javascript" src="/' +
            extension + '/' + file + '"></script>';
    }), '</head>').join("\n");
});

Injector.prototype._transform = function (chunk, encoding, done) {
    var chunkString, chunkBuffer;

    chunkString = chunk.toString();
    chunkString = chunkString.replace('</head>', this.injection);
    chunkBuffer = new Buffer(chunkString);

    this.push(chunkBuffer);
    done();
};

// http://stackoverflow.com/questions/13472024/simple-node-js-proxy-by-piping-http-server-to-http-request
function serveViaProxy(httpRequest, httpResponse) {
    var output;
    httpRequest.pause();
    var options = {
        hostname: host,
        port: 443,
        path: httpRequest.url,
        headers: httpRequest.headers,
        method: httpRequest.method,
        agent: false
    };
    var remoteRequest = https.request(options, function (serverResponse) {
        serverResponse.pause();
        httpResponse.writeHeader(serverResponse.statusCode, serverResponse.headers);
        serverResponse.pipe(output);
        serverResponse.resume();
    });

    if (/\.html$|\/[^.]*$/.test(httpRequest.url)) {
        console.log("transforming: " + httpRequest.url);
        output = new Injector();
        output.pipe(httpResponse);
    } else {
        console.log("serving: " + httpRequest.url);
        output = httpResponse;
    }

    httpRequest.pipe(remoteRequest);
    httpRequest.resume();
}

function server(httpRequest, httpResponse) {
    var filename = localFiles[httpRequest.url];
    if (filename) {
        serveLocalFile(httpRequest, httpResponse, filename);
    } else {
        serveViaProxy(httpRequest, httpResponse);
    }
}

http.createServer(server).listen(listenPort);

console.log("Server running at http://127.0.0.1:" + listenPort + "/");
