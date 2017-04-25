function fieldVal(){
	$('#passChange').bootstrapValidator({
        feedbackIcons: {
            valid: 'glyphicon glyphicon-ok',
            invalid: 'glyphicon glyphicon-remove',
            validating: 'glyphicon glyphicon-refresh'
        },
        fields: {
            opass: {
                validators: {
                    stringLength: {
                        min: 3,
                        max: 32,
                        message: 'Password must be between 3 and 32 characters in length'
                    },
                    notEmpty: {
                        message: 'Password must be filled in'
                    }
                }
            },
            passwordN: {
                validators: {
                    different:{
                        field: 'opass',
                        message: 'New password must be different from original password'
                    },
                    stringLength: {
                        min: 3,
						max: 32,
						message: 'Password must be between 3 and 32 characters in length'
                    },
                    notEmpty: {
                        message: 'Password must be filled in'
                    },
					identical:{
						field: 'passwordN2',
						message: 'Passwords must match'
					}
                }
            },
			passwordN2: {
                validators: {
                    notEmpty: {
                        message: 'Password must be filled in'
                    },
					identical:{
						field: 'passwordN',
						message: 'Passwords must match'
					}
                }
            }
		}
    })
	.on('success.form.bv', function(f) {
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

var socket = io();

function setError(){
    document.getElementById("errRow").style.display = "block";
    document.getElementById("errRowInner").innerHTML = "<strong>Error! </strong>Old password is incorrect!";
};

function setSucc(){
    document.getElementById("succRow").style.display = "block";
    document.getElementById("succRowInner").innerHTML ="<strong>Password changed successfully!</strong>";
};


$(document).ready(function() {
	fieldVal();

    $('#passChange').on('submit',function(e){
        e.preventDefault();
        document.getElementById("errRow").style.display = "none";
        document.getElementById("succRow").style.display = "none";
        var user = getCookie('tempUN');
        var oldPass = $('#opass').val();
        var newPass = $('#passwordN').val();
        socket.emit('change password',user,oldPass,newPass);
    });

    socket.on('chpass wrong',function(){
        setError();
    });

    socket.on('chpass ok',function(){
        setSucc();
    });

});
