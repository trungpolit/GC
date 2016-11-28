// Lưu lại data nhận về từ server
lj()
    .addEventListener("message", function (event) {
        var data = event.data;
        var canvas = document.querySelector("canvas");
        var screenshot = canvas.toDataURL();
        var payload = parseWatcherData(requestId, data, screenshot, 1);
        watcherSocket.send(payload);
    });