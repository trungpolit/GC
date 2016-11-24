var maxsize = 10 * 1024 * 1024;
var maxFiles = 100;

var winston = require('winston');
var logger = new(winston.Logger)({
    transports: [
        new winston
            .transports
            .Console({handleExceptions: true, json: true}),
        new winston
            .transports
            .File({
                name: 'info',
                filename: 'info.log',
                level: 'info',
                json: false,
                maxsize: maxsize,
                maxFiles: maxFiles
            }),
        new winston
            .transports
            .File({
                name: 'error',
                filename: 'error.log',
                level: 'error',
                json: false,
                maxsize: maxsize,
                maxFiles: maxFiles
            })
    ],
    exceptionHandlers: [
        new winston
            .transports
            .File({
                filename: 'exceptions.log',
                handleExceptions: true,
                humanReadableUnhandledException: true,
                json: false,
                maxsize: maxsize,
                maxFiles: maxFiles
            })
    ],
    exitOnError: false
});

var express = require('express');
var app = express();
var fs = require('fs');
var path = require('path');
var http = require('http');
var mkdirp = require('mkdirp');
var getDirName = path.dirname;
const gcDomain = 'http://s1.play.gemchip.com:8880/';
const indexPath = path.resolve(__dirname, '../public/index.html');
const publicDir = path.resolve(__dirname, '../public');
const resDir = path.resolve(__dirname, '../res');

app.use(express.static(publicDir));
app.use('/res', express.static(resDir));

var download = function (url, dest, cb) {
    mkdirp(getDirName(dest), function (err) {
        if (err) {
            logger.error('Cant not create folder "%s"', getDirName(dest));
            if (cb) {
                cb(err.message);
            }
        } else {
            logger.info('Create folder "%s"', getDirName(dest));
            var file = fs.createWriteStream(dest);
            var request = http.get(url, function (response) {
                response.pipe(file);
                file.on('finish', function () {
                    file.close(cb); // close() is async, call cb after close completes.
                });
            })
                .on('error', function (err) { // Handle errors
                    fs.unlink(dest); // Delete the file async. (But we don't check the result)
                    if (cb) {
                        cb(err.message);
                    }
                });
        }

    });
};

app.get('/proxy/*', function (req, res) {
    console.log(req.params[0]);
    var filePath = path.resolve(__dirname, req.params[0]);
    var fileUrl = gcDomain + req.params[0];
    fs.access(filePath, fs.F_OK, function (err) {
        if (!err) {
            logger.info('File was existed in "%s"', filePath);
            res.sendFile(filePath);
        } else {
            download(fileUrl, filePath, function (err) {
                if (!err) {
                    logger.info('File was downloaded from "%s" to "%s"', fileUrl, filePath);
                    res.sendFile(filePath);
                } else {
                    logger.error('File was failed to download from "%s"', fileUrl);
                    res.status(404) // HTTP status 404: NotFound
                        .send('Not found');
                }
            });
        }
    });
})

app.get('/', function (req, res) {
    console.log(indexPath);
    res.sendFile(indexPath);
})

app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
})