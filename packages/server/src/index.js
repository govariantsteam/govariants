"use strict";
exports.__esModule = true;
var express_1 = require("express");
var http_1 = require("http");
var app = (0, express_1["default"])();
var server = http_1["default"].createServer(app);
app.get("/", function (req, res) {
    res.send("<h1>Hello world</h1>");
});
server.listen(3000, function () {
    console.log("listening on *:3000");
});
