require('./config/config');
const port = process.env.PORT;// || 3000;
const {Rooms} = require('./utils/rooms');
const {Users} = require('./utils/users');
const {Occupants} = require('./utils/occupants');
const {Messages, generateMessage, generateLocationMessage} = require('./utils/message');
const {isRealString} = require('./utils/validation');

var users = new Users();
var rooms = new Rooms();
var occupants = new Occupants();
var messages = new Messages();

console.log('CLEARING ALL DATA...\n');
describe('Clear the Tables', function(){
  it('Should Clear All Tables', function(done){
    users.clearAll();
    rooms.clearAll();
    occupants.clearAll();
    messages.clearAll().then((m)=>{
      done();
    });
  });
});
