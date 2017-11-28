
module.exports = (function(){

  var mongoose = require('mongoose');

  var DB = {
    config: {
      autoreconnectdelay: process.env.DBAUTORECONNECTDELAY || 5000,
      port: process.env.DBPORT || 3000,
      host: process.env.DBHOST || "localhost",
      username: process.env.DBUSERNAME || "",
      pwd: process.env.DBPWD || "",
      dbname: process.env.DBNAME || "test"
    }
  };

  // Determines if database was successfully connected to at least once.
  // This should allow the application to start and wait for MongoDB in case it's unreachable at start.
  var firstConnect = false;


  function Connect(){
    // Setting up the connection string.
    var dburi = "mongodb://";
    if (DB.config.username !== "" && DB.config.pwd !== ""){
      dburi += DB.config.username + ":" + DB.config.pwd + "@";
    }
    dburi += DB.config.host;
    if (DB.config.port > 0){
      dburi += ":" + DB.config.port;
    }
    dburi += "/" + DB.config.dbname;
    var args = [dburi].concat(Array.prototype.slice.call(arguments));
    
    mongoose.connect.apply(mongoose, args);
    mongoose.connection.on("error", function(err){
      if (err.message && err.message.match(/failed to connect to server .* on first connect/)) {
        console.log(new Date(), String(err));

        // Wait for a bit, then try to connect again
        setTimeout(function () {
          console.log("Retrying first connect...");
          mongoose.connection.openUri(dburi);
          // Why the empty catch?
          // Well, errors thrown by db.open() will also be passed to .on('error'),
          // so we can handle them there, no need to log anything in the catch here.
          // But we still need this empty catch to avoid unhandled rejections.
        }, DB.config.autoreconnectdelay);
      } else {
	console.error(new Date(), String(err));
      }
    });
    mongoose.connection.on("open", function(){
      console.log(new Date(), "Database connection open!");
      firstConnect = true;
    });
    mongoose.connection.on("connected", function(){
      console.log(new Date(), "Connection to database established.");
    });
    mongoose.connection.on("disconnected", function(){
      console.log(new Date(), "Database disconnected.");
    });
    mongoose.connection.on("reconnected", function(){
      console.log(new Date(), "Database connection reestablished.");
    });
    mongoose.connection.on("close", function(){
      console.log(new Date(), "Database connection has been closed.");
    });
  }


  Object.defineProperties(DB, {
    "connection":{
      enumerable: true,
      get:function(){return mongoose.connection;}
    },

    "connect":{
      enumerable: true,
      writable: false,
      configurable: false,
      value: Connect
    }
  });


  return DB;
})();
