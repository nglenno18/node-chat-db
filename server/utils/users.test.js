require('./../config/config');
const expect = require('expect');

const {Users} = require('./users');
const {User} = require('./../models/users');
var users = new Users();


// beforeEach(function(done){
//   users.remove({}).then(()=>{
//     return User.insertMany(usersArray);
//   }).then(function(){
//     done();
//   });
// });

describe('****USERS CLASS****', function(){
  var testEmail = 'testingEmail@test.com';
  var testpw = 'fakepassword';
  before(function(done){
    User.remove({}).then(()=>{
      done();
    });
  });

  it('\n\nShould add a new User', function(done){
    var added = users.addUser(testEmail, testpw);
    added.then((doc)=>{
      console.log('DOC returned to TESTING: ', doc);
      expect(doc.email).toBe(testEmail);
      expect(doc.password).toNotBe(testpw);
      done();
    });
  });
  it('\n\nShould REJECT a new User (INVALID EMAIL)', function(done){
    var added = users.addUser(testEmail + 'fjfjff@@@', testpw);
    added.then((doc)=>{
      console.log('DOC returned to TESTING: ', doc);
      expect(doc.email).toNotExist();
      done();
    });
  });
  it('\n\nShould confirm an email exists', function(done){
    var em = users.emailExists(testEmail);
    em.then((doc)=>{
      console.log('Doc returned to TESTING: ', doc);
      expect(doc.email).toBe(testEmail);
      done();
    });
  });

});//end USERS CLASS DESCRIBE
