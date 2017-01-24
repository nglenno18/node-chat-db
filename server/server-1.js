//https://enigmatic-bastion-15739.herokuapp.com

const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;
const {Rooms} = require('./utils/rooms');
const {Users} = require('./utils/users');
const {Occupants} = require('./utils/occupants');
const {User} = require('./models/users');
const {Messages, generateMessage, generateLocationMessage} = require('./utils/message');
const {isRealString} = require('./utils/validation');

var users = new Users();
var rooms = new Rooms();
var occupants = new Occupants();
var messages = new Messages();
var app = express();
var server = http.createServer(app);  //now using the HTTP server
var io = socketIO(server); //now config server to use socket.io


var updateRooms = function(){
  rooms.rooms.forEach(function(r){
    var listed = occupants.getOccList(r.name);
    if(listed === undefined) rooms.removeRoom(r.name);
  });
}
app.use(express.static(publicPath));

app.get('/accounts', function(request, response){
  users.getAccounts().then((d)=>{
    return response.send(JSON.stringify(d, undefined, 2));
  });
});

var introMessage = function(name, room){

};
var repairToken = function(account, token){
  users.findToken(token).then((returned)=>{
    // console.log(`\n\n\n\n\nREPAIRING TOKEN: ${token}\n`, returned);
    if(returned)return console.log('\n\n\n\n\tuser ALREADY HAD token\n\n\n');
      users.emailExists(account.toUpperCase()).then((user)=>{
        if(user === false) return 'no EMAIL';
        user.generateToken(token).then((token)=>{
          // console.log(`\n${account} TOKEN ADDED: ${token}\n`);
        });
      });
  });
};//end REPAIR TOKEN method

var validateUser = function(params, callback){
  var em = params.email.toUpperCase();
  if(!validator.isEmail(em))return callback('INVALID EMAIL REQUEST'); //Request new Attempt
  if(params.password.length < 5)return callback('Password must be at least 5 characters');
  users.emailExists(em).then((docs)=>{
    if(docs === false) return callback('ADD');
    bcrypt.compare(params.password, docs.password, (err, result)=>{
      if(!result)return callback('Password does not match that Email Account')
      docs.generateToken('').then((token)=> callback(null, token));
    });
  });
} //end validateUser method

io.on('connection', (socket)=>{
  socket.on('repairToken', function(sessionStorage, callback){
    console.log('\n\nCONNECTED USER -- need to find existing token\n\n');
    if(sessionStorage.token) repairToken(sessionStorage.email, sessionStorage.token);
  });
  console.log(`\nNew user connected:  \n\t(socket.id):${socket.id}\n`);
  socket.emit('updateRoomsList', rooms.getRoomsList());

  socket.on('validateUser', function(params, callback){
    validateUser(params, callback);
  });//end VALIDATE USER socket event listener

  socket.on('registerUser', function(params, callback){
    var newUser = users.addUser(params.email.toUpperCase(), params.password);
    newUser.then((token)=>{callback(token)}).catch((e)=>{
      console.log('Error returned to server, should send back to client', e);
    });
  });//end REGISTERUSER socketeventListener

  socket.on('verifyToken', function(token, callback){
    users.findToken(token).then((docs)=>{callback(docs)})
  });

  socket.on('logout', function(token, callback){
    users.findToken(token).then((docs)=>{
      docs.logout(token).then((d)=>{
        if(d.ok === 1) callback(d);
      });
    });
  });

  socket.on('join', function(params, sessionStorage, callback){
    debugger;
    if(!isRealString(params.name) || !isRealString(params.room)) return callback('Name and Room Name are required');

    var account = sessionStorage.email;
    var token = sessionStorage.token;
    var taken = false;
    debugger;
    var room = params.room.toUpperCase();
    taken = occupants.occupants.filter((occ)=> occ.displayName===params.name && occ.room === room);
    if(taken.length > 0){ return callback('Display Name already exists in that Chat Room')}
    taken = occupants.occupants.filter((occ)=> occ._owner === params.email && occ.room === room);
    if(taken.length > 0){ return callback('EMAIL account already exists in that Chat Room')};

    var boo = rooms.rooms.filter((ro)=> ro.name=== room);
    if(boo.length === 0){
      try{
        rooms.addRoom(room).then((added)=>{
          console.log('Added Room ', added);
          rooms.rooms.push(added);
        });
      }catch(e){}
    }

    socket.join(room);
    //MAYBE ONLY SAVE BROADCASTED MESSAGES TO THE DB?
    try{
      occupants.removeOccupant(socket.id).then((docs)=>{
        console.log('\n\n\n\nDocs returned to server from removeOccupant method', docs);
        rooms.spliceOccupant(room , docs.displayName);
        occupants.addOccupant(socket.id, params.name, room, account, token).then((docs)=>{
          console.log('Docs returned to server from addOccupant method', docs);
          rooms.pushOccupant(room , docs.displayName);
          io.to(room).emit('updateOccupants', occupants.getOccList(room));
        });
      });
    }catch(e){
      occupants.addOccupant(socket.id, params.name, room, account, token).then((docs)=>{
        console.log('Docs returned to server from addOccupant method', docs);
        rooms.pushOccupant(room , docs.displayName);
        io.to(room).emit('updateOccupants', occupants.getOccList(room));
      });
    }
    var msg = generateMessage(`ADMIN`,
                      `\tHello, Occupant(${params.name})! \n\tWelcome to the ${room}!`,
                      undefined,
                      room);
    var msg2 =  generateMessage('ADMIN', `${params.name} has joined`,
                undefined,
                room);
    msg.then((docs)=> socket.emit('newMessage', docs));
    msg2.then((docs)=>{
      socket.broadcast.to(room).emit('newMessage', docs);
      callback(); //no arg because we set up the first arg to be an error arg in chat.js
    });
    // callback(); //no arg because we set up the first arg to be an error arg in chat.js
  });

  socket.on('fetchMessages', function(r, callback){
    var msgs = messages.fetchMessages(r);
    return msgs.then((docs)=> callback(docs));
  });

  socket.on('createMessage', function(createdMessage, callback){
    var occupant = occupants.getOccupant(socket.id);
    // if(!occupant) //console.log('\nERROR: occupant was not found?!?!?'); callback();
    if(!isRealString(createdMessage.text)) callback();
    var msg = generateMessage(occupant.displayName, createdMessage.text, occupant.id, occupant.room);
    msg.then((m)=>{
      rooms.pushMessage(occupant.room, m);
      io.to(occupant.room).emit('newMessage', m);
      callback();
    });
  });

  //GEOLOCATION EVENT listener
  socket.on('createLocationMessage', function(user, coords){
    var occ = occupants.getOccupant(socket.id);
    // console.log('GeoLocation OCCUPANT: ', occ);
    io.to(occ.room).emit('newLocationMessage',
    generateLocationMessage(occ.displayName, coords.latitude, coords.longitude));
  });


  socket.on('disconnect', ()=>{
    console.log(`\nUser (${socket.id}) was DISCONNECTED from server\n`);
    var occupant;
    try{
      occupant = occupants.removeOccupant(socket.id).then((docs)=>{
        // console.log('Docs returned to server from removeOccupant method', docs);
        var token = docs.token;
        var room = docs.room;
        // console.log('\n\n\nToken to remove!: ', token);
        User.findByToken(token).then((doc)=>{
          console.log('User found through token');
          doc.logout(token).then((out)=>{
            console.log('Logged Out');
          });
        });
        rooms.extractRoom(room).then((ro)=>{
          console.log('Room extracted: ', ro);
          ro.spliceOccupant(docs.displayName);
          // ro.pullOcc(docs.displayName);
        });
        //
        io.to(room).emit('updateOccupants', occupants.getOccList(room));
        // mess.then((d)=>{
        //   io.to(room).emit('newMessage', d);
        // });
      });
    }catch(e){
      console.log('\nERROR thrown at Disconnect Occupants');
      // io.to(room).emit('updateOccupants', occupants.getOccList(room));
    }
  });//end disconnect socket event listener

});//end on IO connection event listener

server.listen(port, function(){
  console.log(`Server up and running on port: ${port}`);
});
