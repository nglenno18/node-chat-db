var env = process.env.NODE_ENV || 'development'; //need to configure NODE_ENV in package.json
console.log(`***********ENVIRONMENT: `, env);

if(env=== 'development' || env === 'test' || env === 'test '){
  //LOAD in a SEPERATE json file where DEV and TEST config variables will live
      //that file ^^ config.json will NOT be part of git repo
  //REQUIRE the JSON file --> parse into object
  var config = require('./config.json');
  //console.log(config);  //CONFIG contains the JWT_SECRET
  var envConfig = config[env]; //Stores JUST the config variables for current env

  console.log(Object.keys(envConfig));  //finds all the keys in env
  Object.keys(envConfig).forEach(function(key){ //callback gets called with each item
    process.env[key] = envConfig[key];  //set the process.env keys as the local
  });
}

console.log(`\n       PORT: ${process.env.PORT}`);
console.log(`MONGODB_URI: ${process.env.MONGODB_URI}`);
// if(env === 'development'){
//   //set up mongodb URL
//   console.log('\nenv = dev');
//   process.env.PORT = 3000;  //remove the default below
//   process.env.MONGODB_URI = 'mongodb://localhost:27017/TokenChat';
// }else if(env === 'test ' || env === 'test'){
//   //set custom DB URL
//   console.log('\nenv = test');
//   process.env.PORT = 3000;
//   process.env.MONGODB_URI = 'mongodb://localhost:27017/TokenChatTest';
// }

console.log(process.env.PORT);
