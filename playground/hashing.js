const {SHA256} = require('crypto-js');

//to hash a value, pass it into the SHA256
// var message = 'I am user number 3';
// var hash = SHA256(message).toString();
//
// console.log(`Message: ${message}`);
// console.log(`Hashed: ${hash}`);

// //Need to salt and hash the plain text password, compare the result to the hashed/salted password in DB
// var data = {
//   id: 4
// };
//
// //create token variable that we send back to the user
// var token = {
//   data,
//   // hash: SHA256(JSON.stringify(data)).toString()  //unsalted hash
//   hash: SHA256(JSON.stringify(data) + 'somesaltysecret').toString()
// }
//
// //user 4 is mad at user 5, wants to hack in and wipe their todos:
// token.data.id = 5;
// token.hash = SHA256(JSON.stringify(token.data)).toString(); //BUT they dont know the secret
//
// //Validate that token was not manipulated
// var resultHash = SHA256(JSON.stringify(token.data)+ 'somesaltysecret').toString();
// if(resultHash === token.hash){
//   console.log('Data was NOT CHANGED (secure)');
// }else{
//   console.log('Data was CHANGED!! DO NOT TRUST');
// }

//WITH WEBTOKEN MODULE::
// const jwt = require('jsonwebtoken');
// var data = {id:10};
// var token = jwt.sign(data, 'saltysecret');
// console.log('Token HASHED: \n\t', token);
// var decoded = jwt.verify(token, 'saltysecret');
// console.log('Decoded token: ', decoded);

//WITH BCRYPT
const bcrypt = require('bcryptjs');
var password = '123abc!';
var hashedPassword = '$2a$10$B9CHjF/jKwk8ajSrum2hzO6cT0nhHNZ9JypaXrcoka6anqArSBGK2';
bcrypt.genSalt(10, (error, salt)=>{
  bcrypt.hash(password, salt, (err, hash)=>{
    console.log('Hashed password: ', hash);
  });
});

bcrypt.compare(password, hashedPassword, (err, result)=>{
  console.log('Result of comparing password: ', result);
})
