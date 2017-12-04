
module.exports = (function(){

  var config =  {
    JWT_ISSUER: process.env.JWT_ISSUER || "scribedown",
    JWT_PASSPHRASE: process.env.JWT_PASSPHRASE || "",
    JWT_PREAUTH_TIMEOUT: process.env.JWT_PREAUTH_TIMEOUT || 300, // Default 300 seconds (5 minutes)
    JWT_TIMEOUT: process.env.JWT_TIMEOUT || 900 // Default 900 seconds (15 minutes) 
  };

  if (config.JWT_PASSPHRASE === ""){
    console.error("WARNING: Web Token Passphrase was not found in environment! Logins are NOT secure!");
  }

  return config;
  
})();
