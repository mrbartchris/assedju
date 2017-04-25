function fieldVal(){
    $('#userChange').bootstrapValidator({
        feedbackIcons: {
            valid: 'glyphicon glyphicon-ok',
            invalid: 'glyphicon glyphicon-remove',
            validating: 'glyphicon glyphicon-refresh'
        },
        fields: {
            newUsername: {
                validators: {
                    stringLength: {
                        max: 32,
                        message: 'Username can contain up to 32 characters'
                    },
                    notEmpty: {
                        message: 'Username must be filled in'
                    }/*,
                    different:{
                        field: 'sessionUsername',
                        message: 'New username must be different from current username'
                    }*/
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
    document.getElementById("errRowInner").innerHTML = "<strong>Error! </strong>Username is already taken!";
};

function setErr(){
    document.getElementById("errRow").style.display = "block";
    document.getElementById("errRowInner").innerHTML = "New username must be different from old username!";
};

function setSucc(){
    document.getElementById("succRow").style.display = "block";
    document.getElementById("succRowInner").innerHTML ="<strong>Username changed successfully!</strong>";
};


$(document).ready(function() {
    fieldVal();

    var currUser = $('#sessionUsername').val();

    $('#userChange').on('submit',function(e){
        e.preventDefault();
        document.getElementById("errRow").style.display = "none";
        document.getElementById("succRow").style.display = "none";
        //var user = getCookie('tempUN');

        var newUser = $('#newUsername').val();
        if(currUser!== newUser) {
            document.getElementById("usernameLabel").innerHTML = newUser;
            socket.emit('change username', currUser, newUser);
            currUser = newUser;
        }
        else{
            setErr();
        }
    });

    socket.on('chuser wrong',function(){
        setError();
    });

    socket.on('chuser ok',function(){
        setSucc();
    });

});
