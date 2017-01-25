var mongoose = require('mongoose');

var ObjectId = mongoose.Schema.Types.ObjectId;
var RoomSchema = new mongoose.Schema({
  roomName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    unique: true
  },
  occupants: [{type : String, unique: true, required:true }],
  messages: []
});

RoomSchema.methods.pushOccupant = function(displayName){
  var room = this;
  // var roomObject = user.toObject();
  console.log(`\n PUSHING Occupant (${displayName} into ROOM: ${room.roomName})`);
  console.log('Existing Occs: ', room.occupants);
  room.occupants.push(displayName);
  return room.save();
};
RoomSchema.methods.spliceOccupant = function(index){
  var room = this;
  // var roomObject = user.toObject();
  console.log(`\n SPLICING Occupant (${index} out of ROOM: ${room.roomName})`);
  room.occupants.splice(index);
  console.log('\n\nSpliced: ', room.occupants);
  room.save();
};

RoomSchema.methods.pullOcc = function(occ){
  var room = this;
  console.log('\n\n\n\n\nPulling occupant: ', occ);
  return room.update({
    $pull:{
      occupants:{occ}
    }
  });
}

RoomSchema.methods.clearOccs = function(){
  var room = this;
  console.log('Clearing all Occupants');
  room.occupants = [];
  return room.save();
}
RoomSchema.methods.clearMessages = function(){
  var room = this;
  console.log('Clearing all MESSAGES');
  room.messages = [];
  return room.save();
}
RoomSchema.statics.fetchMessages = function(r){
  var ModeledRoom = this;
  console.log('\n\n\n\n\n\n\n&&&&&&&&&&&&&&&&&&&&&&&\n', ro);
  var roomObj = ModeledRoom.find({roomName:r});
  return room.then(function(ro){
    return ro.messages;
  });
}


RoomSchema.methods.pushMessage = function(msgName){
  var room = this;
  // var roomObject = user.toObject();
  console.log(`\n PUSHING Message (${msgName} into ROOM: ${room.roomName})`);
  room.messages.push(msgName);
  room.save();
  return;
};
RoomSchema.post('save', function(docs){
  console.log('ROOM has been successfully saved', docs);
});
// RoomSchema.pre('save', function(next){
//   if(this.occupants = []){
//     this.messages = [];
//   }
//   next();
// });
RoomSchema.post('update', function(docs){
  console.log('ROOM has been successfully updated', docs);
});


var ModeledRoom = mongoose.model('Room', RoomSchema);

module.exports = {ModeledRoom};
