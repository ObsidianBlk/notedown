module.exports = (function(){
  var mongoose = require('mongoose');


  var notebookSchema = new mongoose.Schema({
    userid:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title:{
      type: String,
      required: true
    },
    description: String,
    createdDate:{
      type: Date,
      default: Date.now
    }
  });

  mongoose.model('Notebook', notebookSchema);
})();
