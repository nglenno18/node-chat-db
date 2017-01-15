var mongoose = require('mongoose');
var {ObjectID} = require('mongodb');
// const validator = require('validator');


//NEED an _owner variable that ids the Email Account token to store as FK in DB
var ModeledOccupant = new mongoose.Schema({
  id: {
    type: String,
    unique: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    minlength: 1
  },
  room:{
    type: String,
    minlength: 2
  },
  _owner:{type:String}
  // rooms: [{type:String, unique: true}],
});

ModeledOccupant.methods.toJSON = function(){
  var occupant = this;
  var ocObject = occupant.toObject();

  //import lodash --> need to use pick method to pick which data is returned to Occupant
  return ocObject;
};

ModeledOccupant.post('save', function(docs){
  console.log('OCCUPANT has been successfully saved', docs);
})

var Occupant = mongoose.model('Occupant', ModeledOccupant);

module.exports = {Occupant};
