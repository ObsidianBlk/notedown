
module.exports = (function(){
  var mongoose = require('mongoose'),
      bcrypt = require('bcrypt'),
      speakeasy = require('speakeasy'),
      qrcode = require('qrcode'),
      Promise = require('bluebird');


  var userSchema = new mongoose.Schema({
    username:{
      type: String,
      trim: true,
      required: true
    },
    email:{
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      required: true
    },
    secret2f:{
      type: String,
      default: "",
      trim: true
    },
    verified2f:{
      type: Boolean,
      default: false
    },
    pwdhash:{
      type: String,
      required: true
    },
    created:{
      type: Date,
      default: Date.now
    }
  });

  userSchema.methods.comparePassword = function(pwd){
    return new Promise(function(res, rej){
      bcrypt.compare(pwd, this.pwdHash, function(err, r){
        if (err){
          rej(err);
        } else {
          res(r);
        }
      });
    });
  };

  userSchema.methods.verifyTwoFactor = function(token){
    var user = this;
    return new Promise(function(res, rej){
      if (user.secret2f !== ""){
        var vres = speakeasy.totp.verify({
          secret: this.secret2f,
          encoding: "base32",
          token: token
        });
        if (user.verified2f === false && vres === true){
          user.save(function(err){
            if (err){
              rej(err);
            } else {
              res(vres);
            }
          });
        } else {
          res(vres);
        }
      } else {
        res(true); // If there's no two factor enabled, then any token is valid.
        // NOTE: It's the controllers responsibility NOT to call this method if two factor isn't enabled, this is just here in case I'm stupid.
      }
    });
  };

  userSchema.methods.enableTwoFactor = function(enable){
    var user = this;
    return new Promise(function(res, rej){
      if (enable === true){
        if (user.secret2f === ""){
          var s = speakeasy.generateSecret({length:20});
          user.secret2f = s.base32;
          user.verified2f = false;
          user.save(function(err){
            if (err){
              rej(err);
            } else {
              qrcode.toDataURL(s.otpauth_url, function(err, data_url){
                if (err){
                  rej(err);
                } else {
                  res(data_url);
                }
              });
            }
          });
        } else {
          rej("Two Factor Authentication already enabled.");
        }
      } else {
        if (user.secret2f !== ""){
          user.secret2f = "";
          user.verified2f = false;
          user.save(function(err){
            if (err){
              rej(err);
            } else {
              res();
            }
          });
        } else {
          res();
        }
      }
    });
  };

  mongoose.model('User', userSchema);
})();
