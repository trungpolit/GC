// Thay đổi url từ XMLHttpRequest chuyển sang local proxy để hack Same-origin
// policy
var openProxy = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
    console.log('XMLHttpRequest.prototype.open Origin:');
    console.log('%s: %s', method, url);
    var urlProxy = url.replace('http://s1.play.gemchip.com:8880/', window.location.href);
    urlProxy = urlProxy.replace(window.location.href, window.location.href + 'proxy/');
    console.log('XMLHttpRequest.prototype.open Proxy:');
    console.log('%s: %s', method, urlProxy);
    openProxy.call(this, method, urlProxy, async, user, password);
};

function genUnique() {
    var date = new Date();
    var components = [
        date.getYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds()
    ];

    var id = components.join("");
    return id;
}

function parseWatcherData(requestId, data, screenshot, type = 0) {
    var payload = {
        request_id: requestId,
        ref_id: null,
        type: type,
        data: null,
        screenshot: screenshot,
        raw: data
    };
    try {
        payload.data = JSON.parse(data);
    } catch (error) {
        payload.data = data;
    }
    return JSON.stringify(payload);
}

var requestId = genUnique();

// Thiết lập socket để lưu lại data trao đổi giữa client và gc
var watcherSocket = new WebSocket("ws://localhost:4081");
watcherSocket.onopen = function (event) {
    console.log('watcherSocket listening on %s, status:%s (open)', 4081, watcherSocket.readyState);
};

// Lưu lại data được gửi từ client
var sendProxy = WebSocket.prototype.send;
WebSocket.prototype.send = function (data) {
    requestId = genUnique();
    var url = this.url;
    var type = 0;
    if (url.search('ws://125.212.226.192:8850') !== -1 || url.search('ws://localhost:4080') !== -1) {
        console.log('WebSocket.prototype.send data:');
        console.log(data);
        console.log('Send data to watcherSocket for saving');
        var screenshot = takeScreenshot(false);
        var payload = parseWatcherData(requestId, data, screenshot, type);
        watcherSocket.send(payload);
    }
    sendProxy.call(this, data);
};