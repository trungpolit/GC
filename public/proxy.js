var openProxy = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
    console.log('openProxy');
    var urlProxy = url.replace('http://s1.play.gemchip.com:8880/', window.location.href);
    urlProxy = urlProxy.replace(window.location.href, window.location.href + 'proxy/');
    console.log('%s: %s', method, urlProxy);
    openProxy.call(this, method, urlProxy, async, user, password);
}

window.WebSocket = function (url, protocols) {
    console.log('WebSocket');
    console.log(url);
    return new WebSocket(url, protocols);
};
