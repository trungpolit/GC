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
    ref_id: {
        type: ObjectId,
        default: null
    },
    type: Number,
    payload: Array,
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

var WebSocket = require('ws');
const gsWss = 'ws://125.212.226.192:8850/';
var ws1,
    socket;
try {
    socket = new WebSocket(gsWss);
    socket.on('open', function open() {
        console.log('Socket Status:%s (open)', socket.readyState);
    });
    socket.on('message', function (data, flags) {
        // flags.binary will be set if a binary data is received. flags.masked will be
        // set if the data was masked.
        console.log('Socket Received:%s', data);
        ws1.send(data);
        var message = new Message({
            ref_id: refId,
            type: 1,
            payload: JSON.parse(data),
            raw: data
        });
        message.save(function (err, message, numAffected) {
            if (err) {
                logger.error('Can not save gs message to database!');
            }
        });
    });
    socket.on('close', function () {
        console.log('Socket Status:%s (Closed)', socket.readyState);
    });
} catch (error) {
    console.log('Socket Error:%s' + error);
}

var server = require('http').createServer(),
    url = require('url'),
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({server: server}),
    express = require('express'),
    app = express(),
    port = 4080;

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
        try {
            socket.send(data);
            console.log('Socket Sent:%s', data);
        } catch (exception) {
            console.log('Socket Sent Exception:%s', exception);
        }
        refId = null;
        var message = new Message({
            type: 0,
            payload: JSON.parse(data),
            raw: data
        });
        message.save(function (err, message, numAffected) {
            if (err) {
                logger.error('Can not save client message to database!');
            } else {
                refId = message._id;
            }
        });
    });

});

server.on('request', app);
server.listen(port, function () {
    console.log('Listening on ' + server.address().port)
});