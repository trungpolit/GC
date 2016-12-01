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
                name: 'wss-info',
                filename: 'wss-info.log',
                level: 'info',
                json: false,
                maxsize: maxsize,
                maxFiles: maxFiles
            }),
        new winston
            .transports
            .File({
                name: 'wss-error',
                filename: 'wss-error.log',
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
                filename: 'wss-exceptions.log',
                handleExceptions: true,
                humanReadableUnhandledException: true,
                json: false,
                maxsize: maxsize,
                maxFiles: maxFiles
            })
    ],
    exitOnError: false
});

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/gc');
var refId;
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var messageSchema = new Schema({
    request_id: String,
    ref_id: {
        type: ObjectId,
        default: null
    },
    type: Number,
    data: Array,
    raw: String,
    screenshot: String,
    created: Date,
    modified: Date
});
messageSchema.pre('save', function (next) {
    if (!this.created) {
        this.created = Date.now();
    }
    if (!this.id && !this.modified) {
        this.modified = Date.now();
    } else if (this.id && !this.modified) {
        this.modified = Date.now();
    }
    // do stuff
    next();
});
var Message = mongoose.model('Message', messageSchema);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connect to database  error:'));
db.once('open', function () {
    // we're connected!
    console.log('Connect to database successful.');
});

var server = require('http').createServer(),
    url = require('url'),
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({server: server}),
    express = require('express'),
    app = express(),
    port = 4081;

app.use(function (req, res) {
    res.send({msg: "hello"});
});

wss.on('connection', function connection(ws) {
    ws1 = ws;
    var location = url.parse(ws.upgradeReq.url, true);
    // you might use location.query.access_token to authenticate or share sessions
    // or ws.upgradeReq.headers.cookie (see
    // http://stackoverflow.com/a/16395220/151312)

    ws.on('message', function incoming(data) {
        console.log('Client message was received: %s', data);
        var parseData = JSON.parse(data);
        if (refId) {
            parseData.ref_id = refId;
        }
        var message = new Message(parseData);
        message.save(function (err, message, numAffected) {
            if (err) {
                logger.error('Can not save client message to database!');
                ws.send('Can not save client message to database!');
            } else {
                refId = message._id;
                ws.send('Save client message to database successful!');
            }
        });
    });

});

server.on('request', app);
server.listen(port, function () {
    console.log('Listening on ' + server.address().port)
});