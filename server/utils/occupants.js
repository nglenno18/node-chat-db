//ES6 classes
var {mongoose} = require('./../db/mongoose');
const {Occupant} = require('./../models/occupants');
var {isRealString} = require('./validation');

class Occupants{
  constructor(){
    this.occupants = [];
  }
  clearAll(){
  return Occupant.remove({}).then((removed, err)=>{
      if(!removed) return 'ERROR: Occupant DB is Already Clear'
      console.log(`ALL OCCUPANTS accounts were deleted:`,removed.result);
      return removed.result;
    });
  }

  getToken(id){
    var occ = this.getOccupant(id);
    console.log('\n\n\t......Occupant to get token from.....', id);
    return occ.token;
  }

  addOccupant(id, displayName, room, email, token){   //token session only available in local variable occupant
    if(!isRealString(displayName)) return 'Invalid DisplayName';
    if(!isRealString(room)) return 'Invalid Room Request';
    var occ = {id, displayName, room, _owner:email, token};
    this.occupants.push(occ);
    var DBocc = new Occupant({id, displayName, room, _owner:email}).save();
    return DBocc.then((doc)=>{
      console.log(`Occupant Saved to DB: ${doc}`);
      return occ;
      return doc;
    });
    return occ;
  }
  removeOccupant(id){
    var gotOcc = this.occupants.filter(function(occ){
      return occ.id === id;
    });
    console.log(this.occupants);
    console.log('Occupant to be REMOVED: ', gotOcc);
    if(!gotOcc.length > 0){
      console.log(`ID(${id}) NOT FOUND --- could NOT return an Occupant`);
      return undefined;
    }
    var occ = gotOcc[0];
    var index = this.occupants.indexOf(occ);
    this.occupants.splice(index, 1);
    var DBocc = Occupant.findOne({displayName:occ.displayName});
    return DBocc.then((docs)=>{
      console.log('Occupant REMOVED from DB: ', docs);
      docs.remove();
      return occ;
      return docs;
    })
    console.log('\nList of Occupants: ', this.occupants);
    return occ;
  }

  getOccList(room){
    var occsList = this.occupants.filter(function(occ){
      return occ.room === room;
    });
    if(!occsList.length>0) return console.log(`No Occupants in Chat Room ${room}`);
    console.log('Occupants List: ', occsList);
    return occsList;
  }

  getOccupant(id){
    var occ = this.occupants.filter((user)=> user.id===id)[0];
    console.log('FIND OCCUpant: ', id);
    console.log('GoT OCCUpant: ', this.occupants);
    return occ;
    // var gotOcc = this.occupants.filter(function(user){
    //   return user.id === id;
    // });
    // if(!gotOcc.length > 0){
    //   return (`Missing User with id ${id}`);
    // }
    // console.log('Document returned from getOccupant filter: ', gotOcc);
    // return(gotOcc);
  }


}//end Occupants Class
module.exports = {Occupants};
