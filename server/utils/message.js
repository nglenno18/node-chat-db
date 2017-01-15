var moment = require('moment');
const {ModeledMessage} = require('./../models/messageModel.js');

class Messages{
  constructor(){
    this.messages = [];
  }
  clearAll(){
  return ModeledMessage.remove({}).then((removed, err)=>{
      if(!removed) return 'ERROR: Message DB is Already Clear'
      console.log(`ALL MESSAGES accounts were deleted:`, removed.result);
      return removed.result;
    });
  }
  fetchMessages(room){
    return ModeledMessage.find({_home:room, from:{$ne:'ADMIN'}}).then((docs)=>{
      console.log(`All messages from ROOM : \n${room}: \n${docs}`);
      return docs;
    });
  }
}

var generateMessage = function(from, text, creator, room){
  console.log('Generating message in room', room);
  console.log(`FROM: ${from}
    TEXT: ${text}
    CREATOR: ${creator}
    ROOM: ${room}`);
  var m = new ModeledMessage({
    from,
    text,
    _home: room,
    createdAt: new Date().getTime()
  });
  return m.save().then((doc)=>{
    console.log('Message Saved in DB: ', doc);
    return doc;
    return {
      from,
      text,
      // createdAt: new Date().getTime()
      createdAt: moment().valueOf()
    };
  });
};

var generateLocationMessage = function(from, latitude, longitude){
  return{
    from,
    url: `https://www.google.com/maps?q=${latitude},${longitude}`,
    // createdAt: new Date().getTime()
    createdAt: moment().valueOf()
  };
};
v=


module.exports = {generateMessage, generateLocationMessage, Messages};
