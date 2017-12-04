
module.exports = (function(){
  var mongoose = require('mongoose'),
      bcrypt = require('bcrypt'),
      speakeasy = require('speakeasy');


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
    return bcrypt.compareSync(pwd, this.pwdHash);
  };

  userSchema.methods.verifyTwoFactor = function(token){
    return speakeasy.totp.verify({
      secret: this.secret2f,
      encoding: "base32",
      token: token
    });
  };

  mongoose.model('User', userSchema);
})();
