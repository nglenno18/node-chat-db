const MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://localhost:27017/jwtAppDB', (err, db)=>{
  if(err) return console.log('Unable to connect to MongoDB server');
  console.log(`Connected to MongoDB server`);

  db.collection('Samples').insertOne({
    text: 'Something of a sample',
    completed: false
  }, (err, result)=>{
    if(err) return console.log('Unable to insert the Object', err);
    console.log('\nArray of Objects inserted: ');
    console.log(JSON.stringify(result.ops, undefined, 2));
  });

  db.close();
});
