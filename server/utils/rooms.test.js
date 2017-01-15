require('./../config/config');
const expect = require('expect');

const {Rooms} = require('./rooms');
const {ModeledRoom} = require('./../models/rooms');

var rooms = new Rooms();

describe('\n\n****ROOMS CLASS****', function(){
  var testRoom = 'TESTROOM';
  before(function(done){
    rooms.clearAll().then((doc)=>{
      console.log('before() --> ', doc);
      done();
    });
  });
  after(function(done){
    this.timeout(5000);
    console.log('ROOMS TEST: after() --> \n\n\n\n****************************');
    setTimeout(done, 1000);
  });

  it('\n\nShould add a new Room', function(done){
    var added = rooms.addRoom(testRoom).then((saved)=>{
      console.log('ROOM SAVED to DB -- RETURNED: ', saved);
      var pushed = rooms.pushRoom
      ({name: saved.roomName, messages: saved.messages});
      console.log('\n\tROOMS ARRAY:', pushed);
      expect(pushed[0].name).toBe(testRoom);
      rooms.extractRoom(testRoom).then((doc)=>{
        expect(doc._id).toEqual(saved._id);
        expect(doc.roomName).toBe(saved.roomName);
        done();
      });
    });
  });

  it('\n\nShould REMOVE the new Room', function(done){
    var removed = rooms.removeRoom(testRoom).then((returned)=>{
      console.log('ROOM REMOVED from DB -- RETURNED: ', returned);
      var spliced = rooms.spliceRoom
      ({name: returned.roomName, messages: returned.messages});
      console.log('\n\tROOMS ARRAY:', spliced);
      expect(returned.roomName).toBe(testRoom);
      expect(spliced.length).toBe(0);
      rooms.extractRoom(testRoom).then((doc)=>{
        console.log('ROOM EXTRACTED: ', doc.typeof);
        expect(doc).toBeAn(Error);
        done();
      });
    });
  });



});//end ROOMS CLASS DESCRIBE
