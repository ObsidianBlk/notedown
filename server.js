
var express = require('express'),
    app = express(),
    port = process.env.PORT || 8080,
    bodyParser = require('body-parser');

var db = require('./app/db');
db.connect({useMongoClient: true});
db.connection.once("open", function(){
  // Start up the server as soon as we have the first connection to the database!
  
  app.use(bodyParser.urlencoded({extended:true}));
  app.use(bodyParser.json());
  app.use(require('./app/ctrls/user').mw.sys.parseUserAuth);

  // Setup API routes here.
  // https://www.codementor.io/olatundegaruba/nodejs-restful-apis-in-10-minutes-q0sgsfhbd
  // https://www.codementor.io/olatundegaruba/5-steps-to-authenticating-node-js-with-jwt-7ahb5dmyr
  // https://davidwalsh.name/2fa

  app.listen(port, function(){
    console.log("Scribedown Server listening on port " + port);
  });

});



