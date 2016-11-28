var openProxy = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
    console.log('XMLHttpRequest.prototype.open Origin:');
    console.log('%s: %s', method, url);
    var urlProxy = url.replace('http://s1.play.gemchip.com:8880/', window.location.href);
    urlProxy = urlProxy.replace(window.location.href, window.location.href + 'proxy/');
    console.log('XMLHttpRequest.prototype.open Proxy:');
    console.log('%s: %s', method, urlProxy);
    openProxy.call(this, method, urlProxy, async, user, password);
}