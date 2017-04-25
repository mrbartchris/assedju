function loginFunc(){
	document.getElementById("loginRow").style.display = "block";
	document.getElementById("regRow").style.display = "none";
};

function regFunc(){
	document.getElementById("regRow").style.display = "block";
	document.getElementById("loginRow").style.display = "none";
};

function fieldVal(){
	$('#loginForm').bootstrapValidator({
        // To use feedback icons, ensure that you use Bootstrap v3.1.0 or later
        feedbackIcons: {
            valid: 'glyphicon glyphicon-ok',
            invalid: 'glyphicon glyphicon-remove',
            validating: 'glyphicon glyphicon-refresh'
        },
        fields: {
            usernamel: {
                validators: {
                        notEmpty: {
                        message: 'Username must be filled in'
                    }
                }
            },
            passwordl: {
                validators: {
                    notEmpty: {
                        message: 'Password must be filled in'
                    }
                }
            }
		}
    })
	.on('success.form.bv', function(e) {
            $('#success_message').slideDown({ opacity: "show" }, "slow") // Do something ...
			$('#loginForm').data('bootstrapValidator').resetForm();
            // Prevent form submission
            e.preventDefault();

            // Get the form instance
            var $form = $(e.target);

            // Get the BootstrapValidator instance
            var bv = $form.data('bootstrapValidator');

            // Use Ajax to submit form data
            $.post($form.attr('action'), $form.serialize(), function(result) {
                console.log(result);
            }, 'json');
        });
		
		

	$('#registerForm').bootstrapValidator({
        feedbackIcons: {
            valid: 'glyphicon glyphicon-ok',
            invalid: 'glyphicon glyphicon-remove',
            validating: 'glyphicon glyphicon-refresh'
        },
        fields: {
            username: {
                validators: {
                    stringLength: {
                        max: 32,
                        message: 'Username can contain up to 32 characters'
                    },
                    notEmpty: {
                        message: 'Username must be filled in'
                    }
                }
            },
			email: {
                validators: {
                    stringLength: {
                        max: 128
                    },
                    notEmpty: {
                        message: 'Email must be filled in'
                    },
					emailAddress: {
                        message: 'Please supply a valid email address'
                    }
                }
            },
            password: {
                validators: {
                    stringLength: {
                        min: 3,
						max: 32,
						message: 'Password must be between 3 and 32 characters in length'
                    },
                    notEmpty: {
                        message: 'Password must be filled in'
                    },
					identical:{
						field: 'password2',
						message: 'Passwords must match'
					}
                }
            },
			password2: {
                validators: {
                    notEmpty: {
                        message: 'Password must be filled in'
                    },
					identical:{
						field: 'password',
						message: 'Passwords must match'
					}
                }
            }
		}
    })
	.on('success.form.bv', function(f) {
            $('#success_message').slideDown({ opacity: "show" }, "slow") // Do something ...
			$('#registerForm').data('bootstrapValidator').resetForm();
            // Prevent form submission
            f.preventDefault();

            // Get the form instance
            var $form = $(f.target);

            // Get the BootstrapValidator instance
            var bv = $form.data('bootstrapValidator');

            // Use Ajax to submit form data
            $.post($form.attr('action'), $form.serialize(), function(result) {
                console.log(result);
            }, 'json');
    });
}

$(document).ready(function() {
	fieldVal();
});

/*
 function setError(error){
 document.getElementById("errRow").style.display = "block";
 document.getElementById("errRowInner").innerHTML += error;
 };

 var socket = io();
 socket.on('error', function(data){
 console.log(data);
 alert("on socket: setting error data: "+data);
 setError(data);
 });
 */

/*
 $('#registerForm').on('submit', function (e) {
 e.preventDefault();
 //var form = document.getElementById('registerForm');
 //alert("1: "+document.getElementById("errRow").style.display);
 if(document.getElementById("errRow").style.display === "block"){ //if no error
 alert("Submit (no error on form)");
 e.preventDefault();
 //form.submit();
 }
 else { //if error
 alert("Do not submit - if error");
 e.preventDefault();
 }
 console.log("YUP");
 });
 */

