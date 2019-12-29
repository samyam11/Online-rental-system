function sendCommentRequest() {
    let commentContent = $("#comment").val();
    let postUrl = window.location.href;
    let data = {
        commentContent: commentContent,
    };
    $.ajax({
        type: "POST",
        url: postUrl,
        dataType: "json",
        data: data,
        success: function(msg) {
            if (msg.error) {
                $("#warning").show();
                $("#warning").find("label").text(msg.error);
            } else {
                location.reload();
            }
        }
    });
}

function checkSession(handler) {
	$.ajax({
		type: 'GET',
		url: 'http://localhost:8080/checkSession',
		success: function(res) {
            if (res.isFrozen) {
                $("#comment").prop('disabled', true);
                $('#replyBtn').prop('disabled', true);
            }
        }
	});
}
function createComment() {
    if ($("#comment").val() == "") {
        $("#warning").show();
        $("#warning").find("label").text("Comment must not be empty");
    } else {
        sendCommentRequest();
    }
}

$(function() {
  // load navigation bar
    $("#nav-placeholder").load("./../NavigationBar/navigationBar.html");
    $("#replyBtn").click(function() {
        createComment();
    });
    // check account is frozen or not
    checkSession();
});
