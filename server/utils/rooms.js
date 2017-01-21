//ES6 classes
var {isRealString} = require('./validation');
var {mongoose} = require('./../db/mongoose');
const {ModeledRoom} = require('./../models/rooms');

class Rooms {
  constructor (){
    this.rooms = [];
  }
  clearAll(){
  return ModeledRoom.remove({}).then((removed, err)=>{
      if(!removed) return 'ERROR: Room DB is Already Clear'
      console.log(`ALL ROOMS accounts were deleted:`, removed.result);
      return removed.result;
    });
  }

  isTaken(name){
    var list = this.rooms.filter((room)=> room.name === name);
    if(list.length > 0) {
      return true;
    }
    return false;
  }
  pushOccupant(roomName, userName){
    console.log('\n\nUser to be pushed into room  ', roomName);

    return ModeledRoom.findOne({roomName:roomName}).then((pushed)=>{
          console.log('Found in ROOMS DB: ', pushed);
          return pushed.pushOccupant(userName);
        });
  }
  spliceOccupant(roomName, userName){
    console.log('\n\n Occupant to be REMOVED from room ', roomName);
    var room =
    ModeledRoom.findOne({roomName});
    return room.then((removed)=>{
          console.log('Found in ROOMS DB: ', removed);
          var index = removed.occupants.indexOf(userName);
          // removed.spliceOccupant(index);
          // removed.pullOcc(userName);
          var temp = removed.occupants;

          removed.clearOccs();
          console.log('Cleared occupants: ', removed.occupants);
          temp.forEach((ex)=>{
            console.log('\tEX: ', ex);
            if(ex.toString() != userName.toString()){
              console.log('Added to occs: ', ex);
              removed.occupants.push(ex);
            }
          })
          console.log('\nOccupant removed');
        });
  }
  pushMessage(roomName, msg){
    console.log(`\n...starting rooms.pushMessage(${roomName}, ${msg})\n`);
    ModeledRoom.findOne({roomName:roomName}).then((retrieved)=>{
          console.log('(pushMessage)Found in ROOMS DB: ', retrieved);
          retrieved.pushMessage(msg);
        });
  }

  addRoom(name){
    var message = "";
    var messages = [];
    name = name.toUpperCase();
    if(!isRealString(name)) return 'Room is Invalid';
    if(this.isTaken(name)) return 'Room is Taken';
    var roomDB = new ModeledRoom({roomName:name, messages}).save();
    return roomDB.then(function(docs){
      console.log(`room SAVED to the DB: ${docs}`);
      return docs;
    });
  }

  pushRoom(room){
    console.log(`Pushing Room (${room.name}) to Rooms Array...`);
    this.rooms.push(room);
    return this.rooms;
  }

  getRoomsList(){
    var list = ModeledRoom.find({});
    return list.then((returned)=>{
      console.log('Rooms List returned: ', returned);
      return returned;
    });
  }

  getRoom(name){
    var matches = this.rooms.filter(function(r){
      return r.name === name
    });
    return matches[0];
  }
  extractRoom(name){
    var matches = ModeledRoom.findOne({roomName:name});
    return matches.then((returned)=>{
      if(!returned) return Error(`ROOM(${name}) NOT found in DB`);
      console.log('Room from DB: ', returned);
      return returned;
    });
  }

  roomIsEmpty(room){
    var gotRoom = this.getRoom(room);
    var userList;
    if(gotRoom != undefined) {
        userList = getOccList(gotRoom);
    }else{
      console.log(room, ' Chat Room does not exist');
    }
    console.log(`Is ${gotRoom} empty?`);
    if(userList && userList.length > 0) return false;
    else return true;
  }
  ///REMOVE----------------------------------
  removeRoom(name){
    //return the object after you remove it from the list
    console.log('ALL ROOMS LISTED\t', this.rooms);
    var gotRoom = this.rooms.filter(function(ro){
      return ro.name === name;
    });
    console.log(this.rooms);
    console.log('ROOM to Be REMOVED: ', gotRoom);
    var room;
    if(!gotRoom.length > 0){
      console.log(`\tChatRoom(${name}) NOT FOUND -- could NOT return a ChatRoom`);
      return undefined;
    }
    room = gotRoom[0];
    var index = this.rooms.indexOf(room);
    console.log(room, index);
    var splicedRoom = ModeledRoom.findOne({roomName:room.name});
    return splicedRoom.then((removed)=>{
      console.log('Found in DB: ', removed);
      return removed.remove();
    });
    this.rooms.splice(index, 1);
    console.log(this.rooms);
  }
  spliceRoom(room){
    console.log(`SPLICING Room (${room.name}) to Rooms Array...`);
    var index = this.rooms.indexOf(room);
    this.rooms.splice(index, 1);
    return this.rooms;
  }

  updateMessages(name, message){
    // var r = this.getRoom(name);
    console.log('\n\nRoom Name to be updated: ', name);
    var matches= this.rooms.filter(function(r){
      return r.name === name;
    });
    var r = matches[0];
    console.log('\n', r);      //HOW  IS THIS UNDEFINED
    console.log('\n\n\n');
    if(r){
      console.log('\nShould have updateMessages for ROOM', r.name);
      console.log('MSG to be pushed into room:', message);
      r.messages.push(message);
      return r;
    }
  }

}//END ROOMS class

module.exports = {Rooms};
