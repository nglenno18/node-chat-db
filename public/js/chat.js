//CLIENT-SIDE javascript
var socket = io();
var messageForm = jQuery('#messages');
var stored = [];
if(!sessionStorage.token) window.location.href = "/";
console.log('Stored Messages: ', JSON.stringify(sessionStorage.getItem('messages'), undefined, 2));

function scrollToBottom(){
  // Selectors
  var messages = jQuery('#messages');
  //variable that stres the selector for the LAST list item (the message that triggered this call)
  // var newMessage = jQuery('#messages')....
  var newMessage = messages.children('li:last-child');
  //Heights
        //messages.prop is a cross-browser way
        //to fetch a property (Alternative to jQuery bc it works for all browsers)
  //CALCULATION
    //this happens AFTER a new message is included
  var clientHeight = messages.prop('clientHeight');
  var scrollTop = messages.prop('scrollTop');
  var scrollHeight = messages.prop('scrollHeight');
  var newMessageHeight = newMessage.innerHeight();
  var lastMessageHeight = newMessage.prev().innerHeight();    //prev() method calls the previous child!!

  if((clientHeight + scrollTop + newMessageHeight + lastMessageHeight)>= scrollHeight){
    console.log('Should scroll to bottom!!');
    messages.scrollTop(scrollHeight); //moves to bottom of container area
  }
};

socket.emit('repairToken', sessionStorage, function(){
  console.log('Callback Called: ');
});

socket.on('connect', function(){
  console.log(socket.id);

  var params = jQuery.deparam(window.location.search);

  socket.emit('join', params, sessionStorage, function(err){
    if(err){
      alert(err);
      window.location.href ='/';
    }else{  //no error
      messageForm= jQuery('#messages').children('li');
      console.log('fetching messages from DB:');
      socket.emit('fetchMessages', params.room.toUpperCase(), function(result){
        // if(!dbdata) console.log('Error fetching Room messages from the DB', dbdata);
        console.log('Messsages retrieved from the Room DB', result);
        result.forEach((msg)=>{
          // console.log('Message: ', msg);
          var formattedTime = moment(msg.completedAt).format('h:mm a');
          var template = jQuery('#message-template').html();
          var m = {
            // text: message.msgBody,
            text: msg.text,
            createdAt: formattedTime,
            from: msg.from
          }
          var html = Mustache.render(template,m);
          // socket.emit('updateMessages', message);
          socket.emit('updateMessages', m);
          jQuery('#messages').append(html);
        });
        return result;
      });
      scrollToBottom();
      console.log('No ERROR');
    }
  });

  var sortItems = function() {
    var $items = $('#messages li');
    $items.sort(function(a, b) {
        var keyA = $(a).data('value');
        var keyB = $(b).data('value');
        return (keyA > keyB) ? 1 : 0;
    });
    $.each($items, function(index, row){
        $('ol').append(row);
    });
  }
});

//NEW LISTENER --> Update the Occs List
socket.on('updateOccupants', function(occs){
  console.log('Occupants List: ', occs);
  var ol = jQuery('<ol></ol>');
  occs.forEach(function(occ){
    ol.append(jQuery('<li></li>').text(occ.displayName));    //append the list item
  });
  jQuery('#occupants').html(ol);
});


socket.on('newMessage', function(message){
  console.log('New Message received from SERVER', message);
  var formattedTime = moment(message.createdAt).format('h:mm a');
  var template = jQuery('#message-template').html();
  var m = {
    // text: message.msgBody,
    text: message.text,
    createdAt: formattedTime,
    from: message.from
  }
  var html = Mustache.render(template,m);
  // socket.emit('updateMessages', message);
  socket.emit('updateMessages', m);
  jQuery('#messages').append(html);
  // sessionStorage.messages.push(m);
  // $('#li.message').toArray().forEach((doc)=>{
  //   console.log('Message Queried: ', doc);
  // });
  console.log('sessionStorage ', sessionStorage);
  // stored.push(m);
  // sessionStorage.messages = stored;
  scrollToBottom();
});

//EVENT Listener for newLocationMessage EVENT
socket.on('newLocationMessage', function(message){
  var formattedTime = moment(message.createdAt).format('h:mm a');
  var template = jQuery('#geomessage-template').html();
  var html = Mustache.render(template, {
    from: message.from,
    createdAt: formattedTime,
    url: message.url
  });
  jQuery('#messages').append(html);   //jQuery selector selects element #messages
  scrollToBottom();
});


jQuery('#message-form').on('submit', function(eventArgument){
  eventArgument.preventDefault();   //stop the submit event from firing, now nothing happens
  var messageTextBox = jQuery('[name=message]');

  socket.emit('createMessage', {
    text: messageTextBox.val()
  }, function(){//add callback function
    messageTextBox.val('');
  });
});


//SEND LOCATION BUTTON CLICK listener
var locationButton = jQuery('#send-location');
locationButton.on('click', function(){
  if(!navigator.geolocation){
    return alert('Geolocation is NOT SUPPORTED by your Browser');  //an alert box
  }
  locationButton.attr('disabled', 'disabled').text('Sending ... ');

  navigator.geolocation.getCurrentPosition(function(position){
    //if things go well, reference the locationButton
    locationButton.removeAttr('disabled');
    locationButton.text('Send Location');
    console.log(position);
    socket.emit('createLocationMessage', socket.id, {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }); //listen to this event in the server
  }, function(){  //error handler function
    alert('Unable to Fetch Location (user rejection)');
  })
});
