const express = require("express");

// Initialize Server
const server = express();

module.exports = {
    render: function() {
        let routes = getRoutes();
        routes.forEach((route) => {
            let html = '<code><strong>"'+route.stack[0].method+ '"</strong></code><br><a href="' +route.path+'">"'+route.path+'"</a><br>';
            // return html;
            ReactDOM.render(html, document.getElementById('sectionbody'));
        });
    },

    getRoutes: function() {
        const route = [];
        const routes = [];
        server._router.stack.forEach(function(middleware){
            if(middleware.route){ // routes registered directly on the app
                routes.push(middleware.route);
            } else if(middleware.name === 'router'){ // router middleware 
                middleware.handle.stack.forEach(function(handler){
                    route = handler.route;
                    route && routes.push(route);
                });
            }
        });
        return routes;
    }
}

