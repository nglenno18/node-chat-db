//CLIENT-SIDE javascript
var socket = io();
socket.on('connect', function(){
  console.log(socket.id);
  console.log(`NEW CONNECTION (this message was sent from index.html) \n\t CLIENT: ${socket.id}`);
  console.log(sessionStorage.token);
  if(sessionStorage.email) $('[name=email]').val(sessionStorage.email);
  if(sessionStorage.token){
    socket.emit('verifyToken', sessionStorage.token, function(d){
      console.log('-------verifyToken: ', d);
      if(d) window.location.href = '/join.html';
    });
  }
});

socket.on('disconnect', function(){
  localStorage.clear();
  console.log(`CLIENT: ${socket.id} --> DISCONNECTED from Server`);
});

jQuery('#login-form').on('submit', function(e){
  e.preventDefault();
  console.log('CLIENT submitted Email credentials to SERVER');
  var jQpassword = jQuery('[name=password]');
  var jQemail= jQuery('[name=email]');
  var params = {
    email: jQemail.val(),
    password: jQpassword.val()
  };
  socket.emit('validateUser', params, function(err, token){    //add the acknowledgement
    if(!err){
      console.log('User validated: ');

      sessionStorage.setItem('token', token);
      sessionStorage.setItem('email', params.email);
      sessionStorage.setItem('messages', []);
      return window.location.href = '/join.html'
    }
    if(err ==='ADD'){
      if(confirm(`Register new Email ${params.email}?`)){
        sessionStorage.setItem('email', document.getElementById('email-text').value);
        console.log('Socket will emit "registerUser"');
        var pconfirm = prompt('Please retype password: ');
        if(pconfirm != params.password){
          alert('Passwords DO NOT MATCH!, please try again');
          console.log(document);
          console.log(localStorage);
          return window.location.href = '/register.html';
        }
        socket.emit('registerUser', params, function(es){
          if(es._id){
            console.log('Returned from addUser in server to client:', es);
            //login the user!!!! retrieve tokens
            return socket.emit('validateUser', params, function(err, token){
              if(!err){
                console.log('User validated: ');

                sessionStorage.setItem('token', token);
                sessionStorage.setItem('email', params.email);
                return window.location.href = '/join.html'
              }
            });
          }
          return invalidEmail();
        });
      }
      else window.location.href ='/';
    }else{
      console.log('callback was called', err);
      if(err === 'INVALID EMAIL REQUEST'){
        return invalidEmail();
      }else{  //password problem
        return invalidPassword();
      }
    }
  });

  var invalidEmail = function(){
    alert('INVALID EMAIL REQUEST');
    jQpassword.removeClass("highlight");
    jQemail.focus();
    return jQemail.addClass("highlight");
  }
  var invalidPassword = function(){
    alert('Invalid Password')
    jQemail.removeClass("highlight");
    jQpassword.val('');
    console.log(jQpassword.addClass("highlight"));
    return jQpassword.focus();
  }
});

jQuery('#register-form').on('submit', function(e){
  e.preventDefault();
  var email = jQuery('[name=email]').val();
  var password = jQuery('[name=password]').val();
  var params = {email, password};
  window.location.href = '/register.html';
});
