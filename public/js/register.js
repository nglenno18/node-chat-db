//CLIENT-SIDE javascript
var socket = io();
socket.on('connect', function(){
  console.log(socket.id);
  console.log(`REGISTER PAGE \n\t CLIENT: ${socket.id}`);
  console.log('PASSED Data', localStorage);
  var doc = document.getElementById("login-form");
  var emailField = localStorage.email;
  jQuery('[name=email]').val(emailField);
  jQuery('[name=email]').focus();
  console.log('Document: ', doc);
    jQuery('#register-form').on('submit', function(e){
      e.preventDefault();
      var email = jQuery('[name=email]').val();
      var password = jQuery('[name=password]').val();
      var retype = jQuery('[name=retype]').val();
      var at = email.indexOf('@');
      var dot = email.lastIndexOf('.');
      if(at === -1 || dot < (at+2)){
        $("#text").focus();
        return alert('Please enter a valid email')
      }
      if(password.length < 5){
        $("#password-text").focus();
        return alert('Password length must be at least 5 characters');
      }
      if(password != retype){
        $("#retype-text").focus();
        return alert('Passwords do not match');
      }
      var params = {email, password};

      socket.emit('registerUser', params, function(err){
        console.log('emitted the registerUser request');
        console.log(err);
        if(err === 'MongoError'){
          if(confirm('Email is already registered\n Return to Login Page?')){
            return window.location.href = "/";
          }else{
            return window.location.href = "/register.html"
          }
        }else if(!err.email){
          alert('Email is not Valid');
          return $("#text").focus();
        }
        console.log('New user was created: ', err);
        console.log('\t params that created that user: ', params);
        // localStorage.setItem('email', params.email);
        //login the user, provide tokens!!!!! socket.emit('login')
        socket.emit('validateUser', params, function(err, token){
          if(!err){
            console.log('User validated: ');

            sessionStorage.setItem('token', token);
            sessionStorage.setItem('email', params.email);
            return window.location.href = '/join.html'
          }
        });
      });
    });
});

socket.on('disconnect', function(){
  console.log(`CLIENT: ${socket.id} --> DISCONNECTED from Server`);
});
