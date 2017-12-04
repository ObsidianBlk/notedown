
module.exports = (function(){

  var mongoose = require('mongoose'),
      jwt = require('jsonwebtoken'),
      bcrypt = require('bcrypt'),
      speakeasy = require('speakeasy'),
      qrcode = require('qrcode'),
      User = mongoose.model('User');

  var config = require('../config');


  // TODO: Add functionality for enabling and disabling two factor authentication.

  function register(req, res){
    // TODO: Auto enable two factor authentication if req.body.enabletf exists and is true!
    // TODO: Check for the existance of a user with the same credentials first (aka... read the mongoose schema manual to see if it does this check already :D )
    
    bcrypt.hash(req.body.pwd, 10, function(err, hash){
      if (err){
        throw err; // Should never happen... I hope.
      }

      var nuser = new User(req.body);
      nuser.pwdHash = hash;
      nuser.save(function(err, user){
        if (err){
	  res.status(400).send({
	    message: err
	  });
        } else {
          user.pwdHash = undefined;
          res.json(user);
        }
      });
    });
  }

  function login(req, res){
    var search = null;
    if (req.body.email !== undefined){
      search = {email: req.body.email};
    } else if (req.body.username !== undefined){
      search = {username: req.body.username};
    }
    if (search !== null){
      var sendToken = function(user, authorized){
        var tk = jwt.sign(
	  {
	    username: user.username,
	    email: user.email,
	    authorized: authorized,
	    _id: user._id
	  },
	  config.JWT_PASSPHRASE,
	  {
	    expiresIn: (!authorized) ? config.JWT_PREAUTH_TIMEOUT : config.JWT_TIMEOUT,
	    issuer: config.JWT_ISSUER
	  }
	);
	res.json({token:tk, authreq:!authorized});
      };

      
      User.findOne(search, function(err, user){
	if (err){
	  // TODO: Actually throw this to a log.
	  throw err;
	}
	if (!user){
	  res.status(401).json({message:"Authentication Failed: Email or Username not found."});
	} else {
          user.comparePassword(req.body.password)
            .then(function(r){
              if (r === false){
                res.status(401).json({message:"Authentication Failed: Invalid password."});
              } else {
                var authorized = (user.secret2f === "");
                if (authorized === false && req.body.tft !== undefined){ // If two factor authentication is enabled, and a two factor token was given, check it...
                  return user.verifyTwoFactor(req.body.tft);
                } else {
	          sendToken(user, authorized);
                }
              }
              return null;
            })
            .then(function(tfr){
              if (tfr !== null){
                if (tfr === true){
                  sendToken(user, true); // send a valid jwt token if tfr (two factor result) is true.
                } else {
                  res.status(401).json({message:"Authorization Failed: Invalid Two Factor token."}); // ... or bitch if it's an invalid token.
                }
              }
            })
            .catch(function(err){
              res.status(401).json({message:err});
            });
	}
      });
    } else {
      res.status(401).json({message:"Authentication Failed: Missing required information."});
    }
  }

  // Will generate a new, updated JWT token on the following conditions...
  // 1) User does not have two factor authentication enabled
  // 2) User has two factor authentication enabled, but has already validated that authentication since login.
  // 3) User has two factor authentication enabled and provides a valid two factor token for full authentication.
  function authorize(req, res){
    if (req.user){
      var sendToken = function(){
        var tk = jwt.sign(
	  {
	    username: req.user.username,
	    email: req.user.email,
	    authorized: true,
	    _id: req.user._id
	  },
	  config.JWT_PASSPHRASE,
	  {
	    expiresIn: config.JWT_TIMEOUT,
	    issuer: config.JWT_ISSUER
	  }
	);
	res.json({token:tk});
      };

      User.findOne({_id:req.user._id}, function(err, user){
        if (err){
	  // TODO: Actually throw this to a log.
	  throw err;
	}
        
        if (user.secret2f === ""){
          // Two factor now enabled... just send a new token.
	  sendToken();
        } else {
          // Two factor IS enabled...
          if (req.tft === undefined){ // No two factor token given...
            if (req.user.authorized === false){ // If not already authorized... error out!
              res.status(401).json({message:"Authorization Failed: Missing Two Factor token."});
            } else { // if we previously authorized, then we're fine, send a new token!
              sendToken();
            }
          } else { // If a two factor token WAS given...
            user.verifyTwoFactor(req.tft) // check if it's a valid two factor token...
              .then(function(result){
                if (result === true){
                  sendToken(); // ... and send a new token if it is...
                } else {
                  res.status(401).json({message:"Authorization Failed: Invalid Two Factor token."}); // ... or bitch if it's an invalid token.
                }
              })
              .catch(function(err){
                res.status(401).json({message:err});
              });
          }
        }
      });
    } else {
      // WHY is a user making a request to this API if they haven't logged in first. lol.
      res.status(401).json({message:"Authorization Failed: Missing Credentials."});
    }
  }

  function loginRequired(req, res, next){
    if (req.user){
      if (req.user.authorized === true){
        next();
      } else {
        res.json({authreq: true});
      }
    } else {
      res.status(401).json({message:"Unauthorized User!"});
    }
  }

  
  function parseUserAuth(req, res, next){
    (new Promise(function(resolve, reject){
      if (req.headers && req.headers.authorization){
        var hauth = req.headers.authorization.split(' ');
        if (hauth[0] === 'JWT'){
          jwt.verify(hauth[1], config.JWT_PASSPHRASE, {issuer:config.JWT_ISSUER}, function(err, decoded){
            if (err){
              resolve(undefined);
            } else {
              resolve(decoded);
            }
          });
        } else {resolve(undefined);}
      } else {resolve(undefined);}
    })).then(function(user){
      req.user = user;
      next();
    });
  }


  return {
    register: register,
    login: login,
    authorize: authorize,
    mw:{
      sys:{
        parseUserAuth: parseUserAuth
      },
      loginRequired: loginRequired
    }
  };
  
})();
