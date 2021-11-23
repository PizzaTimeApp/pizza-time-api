// Import 
const express =  require('express');

// Initialize Server
var server = express();

// Configure Routes 
server.get("/", function(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.status("200").send('<h1>API - Pizza</h1>');
})

server.listen("8100", function() {
    console.log("Server running");
})