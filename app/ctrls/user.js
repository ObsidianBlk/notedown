
module.exports = (function(){

  var mongoose = require('mongoose'),
      jwt = require('jsonwebtoken'),
      bcrypt = require('bcrypt'),
      speakeasy = require('speakeasy'),
      qrcode = require('qrcode'),
      User = mongoose.model('User');

  var config = require('../config');


  function register(req, res){
    var nuser = new User(req.body);
    nuser.pwdHash = bcrypt.hashSync(req.body.pwd, 10);
    nuser.save(function(err, user){
      if (err){
	return res.status(400).send({
	  message: err
	});
      }
      user.pwdHash = undefined;
      return res.json(user);
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
      User.findOne(search, function(err, user){
	if (err){
	  // TODO: Actually throw this to a log.
	  throw err;
	}
	if (!user){
	  res.status(401).json({message:"Authentication Failed: Email or Username not found."});
	} else {
	  if (user.comparePassword(req.body.password) === false){
	    res.status(401).json({message:"Authentication Failed: Invalid password."});
	  } else {
	    var authreq = (user.secret2f !== "");
	    var tk = jwt.sign(
	      {
		username: user.username,
		email: user.email,
		authreq: authreq,
		_id: user._id
	      },
	      config.JWT_PASSPHRASE,
	      {
		expiresIn: (authreq) ? config.JWT_PREAUTH_TIMEOUT : config.JWT_TIMEOUT,
		issuer: config.JWT_ISSUER
	      }
	    );
	    res.json({token:tk, authreq:authreq});
	  }
	}
      });
    } else {
      res.status(401).json({message:"Authentication Failed: Missing required information."});
    }
  }

  function authorize(req, res){
    if (req.user){
      if (req.user.secret2f === ""){
	res.status(401).json({message:"Authorization not enabled."});
      } else {
	if (req.user.verifyTwoFactor(req.tft) === true){
	  var tk = jwt.sign(
	    {
	      username: req.user.username,
	      email: req.user.email,
	      authreq: false,
	      _id: req.user._id
	    },
	    config.JWT_PASSPHRASE,
	    {
	      expiresIn: config.JWT_TIMEOUT,
	      issuer: config.JWT_ISSUER
	    }
	  );
	  res.json({token:tk});
	}
      }
    } else {
      // Technically, this should never happen!
      // Perhaps I should throw an error instead?
      res.status(401).json({message:"Authorization Failed: No user"});
    }
  }

  function loginRequired(req, res, next){
    if (req.user){
      next();
    } else {
      res.status(401).json({message:"Unauthorized User!"});
    }
  }


  return {
    register: register,
    login: login,
    loginRequired: loginRequired
  };
  
})();
