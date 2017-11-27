
var express = require('express'),
    app = express(),
    port = process.env.PORT || 8080,
    bodyParser = require('body-parser');


app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

// Setup API routes here.
// https://www.codementor.io/olatundegaruba/nodejs-restful-apis-in-10-minutes-q0sgsfhbd
// https://davidwalsh.name/2fa

app.listen(port, function(){
  console.log("NoteDown Server listening on port " + port);
});



