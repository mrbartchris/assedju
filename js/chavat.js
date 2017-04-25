function imgClC(x){
    var aList = document.getElementsByName("avatar");
    for (var i = 0; i < aList.length; i++) {
        aList[i].classList.remove("activeImgAv");
    }
    x.classList.add("activeImgAv");
    var splitStringArr = x.src.split("/");
    document.getElementById("sessionVar").value = splitStringArr[splitStringArr.length - 1];
}

window.onload = function() {
    var socket = io();
    $('#avChange').on('submit', function (e) {
        e.preventDefault();
        var iconNum = $('#sessionVar').val();
        $('#avLabel').attr("src","../imgs/" + iconNum);
        var user = getCookie('tempUN');
        socket.emit('change avatar',user,iconNum);
    });
};