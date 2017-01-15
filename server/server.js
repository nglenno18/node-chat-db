const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// path we want to provide to the public express middleware
const publicPath = path.join(__dirname, '../public');
//console.log(publicPath);
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
var _ = require('lodash');
var app = express();
var server = http.createServer(app);  //now using the HTTP server
//now config server to use socket.io
var io = socketIO(server);


var updateRooms = function(){
  rooms.rooms.forEach(function(r){
    //console.log('...starting updatingRooms() function', rooms.rooms);
    var listed = occupants.getOccList(r.name);
    //console.log(`Users listed in ${r.name}: `, listed);
    if(listed === undefined) {
      //console.log('\n\nREMOVE THE ROOM FROM THE DB');
      rooms.removeRoom(r.name);
    }
  });
}
app.use(express.static(publicPath));

app.get('/accounts', function(request, response){
  //console.log('APP. GET /accounts route: ');
  users.getAccounts().then((d)=>{
    return response.send(d);
  });
  // response.render('/register.html');
});
app.get('/clear', function(request, response){
  //console.log('APP /clear -->\n\tclearing all DB Accounts...');
  var r = [];
  users.clearAll().then((d)=> r.push(d));
  rooms.clearAll().then((d)=> r.push(d));
  occupants.clearAll().then((d)=> r.push(d));
  messages.clearAll().then((d)=>r.push(d));
  return response.send(r);
});

var repairToken = function(account, token){
  users.findToken(token).then((returned)=>{ //WORKS FOR ONE REFRESH!!! neeed to update the sessionStorage!!
    console.log(`\n\n\n\n\nREPAIRING TOKEN: ${token}\n`, returned);
    // io.to(room).emit('updateOccupants', occupants.getOccList(room));
    if(returned === false){
      users.emailExists(account.toUpperCase()).then((user)=>{  //method works but does not check for duplicates
        if(user === false) return 'no EMAIL';
        //console.log('\n\n\tUSER ACCOUNT returned from DB email search: ', user);

        user.generateToken(token).then((token)=>{
          console.log(`\n${account} TOKEN ADDED: ${token}\n`);
        });
      });
    }
    else{
      console.log('\n\n\n\n\tuser ALREADY HAD token\n\n\n');
    }
  });
}

io.on('connection', (socket)=>{
  socket.on('repairToken', function(sessionStorage, callback){
    console.log('\n\nCONNECTED USER -- need to find existing token\n\n');
    if(sessionStorage.token) repairToken(sessionStorage.email, sessionStorage.token);
  });

  //console.log(`New user connected:  \n\t(socket.id):${socket.id}\n`);
  socket.emit('updateRoomsList', rooms.rooms);
  socket.on('validateUser', function(params, callback){
    //console.log('Client has submitted a login request');
    //console.log('params: ', params);
    var em = params.email.toUpperCase();
    if(!users.isEmail(em)){
      //console.log('ALERT USER to retry email request');
      return callback('INVALID EMAIL REQUEST');
    }
    if(params.password.length < 5) {callback('Password must be at least 5 characters');}
    users.emailExists(em).then((docs)=>{
      if(docs === false) return callback('ADD');
      //console.log('Docs returned from DB email search: ', docs);

      var returnedPassword = docs.password;
      bcrypt.compare(params.password, docs.password, (err, result)=>{
        //console.log('\n\n\nResult of comparing password: ', result);
        if(result){
          //console.log('\n\n Email AND HASHED password matched\n');
          docs.generateToken('').then((token)=>{
            //console.log(`\n${docs.email} generatedToken: ${token}\n`);
            callback(null, token);
          });
        }else return callback('Password does not match that Email Account')
      });
    });

  });
  socket.on('registerUser', function(params, callback){
    //console.log('...Client --> Server addUser...');
    var email = params.email.toUpperCase();
    var ptoken = params.password;
    //console.log('ADD USER (password ptoken) created: ', ptoken);
    var newUser = users.addUser(email, ptoken);
    newUser.then((token)=>{
      //console.log(`New user added, new token `, token);
      callback(token);
    }).catch((e)=>{
      //console.log('Error returned to server, should send back to client', e);
    });
  });

  socket.on('verifyToken', function(token, callback){
    var t = users.findToken(token);
    //console.log('\nSERVER to verifyToken:', t);
    t.then((docs)=>{
      //console.log('DOCS sent back to Server from verifyToken method:',docs);
      callback(docs);
    })
  });

  socket.on('logout', function(token, callback){
    var t = users.findToken(token);
    //console.log('\nSERVER to verifyToken:', t);
    t.then((docs)=>{
      //console.log('DOCS sent back to Server from verifyToken method:',docs);
      var removedToken = docs.logout(token);
      removedToken.then((d)=>{
        //console.log('Token Removed = ', d);
        if(d.ok === 1)callback(d);
      });
    });
  });

  socket.on('join', function(params, sessionStorage, callback){
    debugger;
    //validate data (name and room) --> create new utils file for duplicate code
    if(!isRealString(params.name) || !isRealString(params.room)){
      //call the callback with a str message
      return callback('Name and Room Name are required');
    }

    //console.log('PARAMS at LOGIN: ', params.name, params.room);
    //console.log('EMAIL ACCOUNT: ', sessionStorage.email);
    //console.log('SESSIONSTORAGE: ', sessionStorage);
    var name = params.name;
    var account = sessionStorage.email;
    var token = sessionStorage.token;
    var taken = false;
    debugger;
    var room = params.room.toUpperCase();
    taken = occupants.occupants.filter((occ)=> occ.displayName===name && occ.room === room);
    if(taken.length > 0){ return callback('Display Name already exists in that Chat Room');}

    //console.log(taken);

    var boo = rooms.rooms.filter((ro)=> ro.name=== room);
    if(boo.length === 0){
      rooms.addRoom(room);
      socket.emit('updateRoomsList', rooms.rooms);
    }

    socket.join(room);
    //MAYBE ONLY SAVE BROADCASTED MESSAGES TO THE DB?
    try{
      occupants.removeOccupant(socket.id).then((docs)=>{
        console.log('\n\n\n\nDocs returned to server from removeOccupant method', docs);
        rooms.spliceOccupant(room , docs.displayName);
        // io.to(room).emit('updateOccupants', occupants.getOccList(room));
        occupants.addOccupant(socket.id, params.name, room, account, token).then((docs)=>{
          console.log('Docs returned to server from addOccupant method', docs);
          rooms.pushOccupant(room , docs.displayName);
        });
      });
    }catch(e){
      occupants.addOccupant(socket.id, params.name, room, account, token).then((docs)=>{
        console.log('Docs returned to server from addOccupant method', docs);
        rooms.pushOccupant(room , docs.displayName);
      });
    }
    var msg = generateMessage(`ADMIN`,
                      `\tHello, Occupant(${params.name})! \n\tWelcome to the ${room}!`,
                      undefined,
                      room);
    var msg2 =  generateMessage('ADMIN', `${params.name} has joined`,
                undefined,
                room);
    msg.then((docs)=>{
      //console.log('\n\nINTRO MESSAGE generated and returned to Server', docs);
      socket.emit('newMessage', docs);
    });
    msg2.then((docs)=>{
      //console.log('Message generated and returned to Server', docs);
      socket.broadcast.to(room).emit('newMessage', docs);
      callback(); //no arg because we set up the first arg to be an error arg in chat.js
    });
    callback(); //no arg because we set up the first arg to be an error arg in chat.js
  });


  socket.on('fetchMessages', function(r, callback){
    //console.log('\nstarting fetchMessages request from client\n\nprint & return messages: ', r);
    var msgs = messages.fetchMessages(r);
    return msgs.then((docs)=>{
      //console.log('Room Messages fetched: ', docs);
      callback(docs);
    });
  });

  socket.on('createMessage', function(createdMessage, callback){
    var occupant = occupants.getOccupant(socket.id);
    // occupant = occupant[0];
    //console.log('\n\n\n\n\n\nCreatingMessage in Server from ', occupant);
    if(!occupant) //console.log('\nERROR: occupant was not found?!?!?'); callback();
    if(!isRealString(createdMessage.text)) callback();
    var msg = generateMessage(occupant.displayName, createdMessage.text, occupant.id, occupant.room);
    msg.then((m)=>{
      //console.log('Message should have SAVED and Returned to Server: ', m);
      rooms.pushMessage(occupant.room, m);
      // socket.broadcast.to(occupant.room).emit('newMessage', m);
      io.to(occupant.room).emit('newMessage', m);
      callback();
    });
  });

  //GEOLOCATION EVENT listener
  socket.on('createLocationMessage', function(user, coords){
    //console.log(`${user}\n\t`, coords);
    var occ = occupants.getOccupant(socket.id);
    //console.log('GeoLocation OCCUPANT: ', occ);
    io.to
    (occ.room).emit('newLocationMessage', generateLocationMessage(occ.displayName,
                                                          coords.latitude, coords.longitude));
  });


  socket.on('disconnect', ()=>{
    console.log(`\nUser (${socket.id}) was DISCONNECTED from server\n`);
    var occupant;
    try{
      occupant = occupants.removeOccupant(socket.id).then((docs)=>{
        console.log('Docs returned to server from removeOccupant method', docs);
        var token = docs.token;
        console.log('\n\n\nToken to remove!: ', token);
        User.findByToken(token).then((doc)=>{
          console.log('User found through token: ', doc);
          doc.logout(token).then((out)=>{
            console.log('Logged Out');
          });
        });
        //
        // io.to(room).emit('updateOccupants', occupants.getOccList(room));
        // mess.then((d)=>{
        //   io.to(room).emit('newMessage', d);
        // });
      });
    }catch(e){
      console.log('\nERROR thrown at Disconnect Occupants');
    }
  });//end disconnect socket event listener

});//end on IO connection event listener

server.listen(port, function(){
  console.log(`Server up and running on port: ${port}`);
});
