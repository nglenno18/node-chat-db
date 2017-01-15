const {MongoClient, ObjectID} = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/jwtAppDB', (err, db)=>{
  if(err) return console.log('Unable to connect to MongoDB server');
  console.log('Connect to MongoDB server');
  db.collection('Samples').find()
  .toArray() //turns the curser into an array(returns a promise)
  .then((docs)=>{
    console.log('SAMPLES found:');
    console.log(JSON.stringify(docs,undefined,2));
  }, (err)=>{
    console.log('Unable to fetch Samples', err);
  });

  // db.close();
})
