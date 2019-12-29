function checkSession(handler) {
	$.ajax({
		type: 'GET',
		url: 'http://localhost:8080/checkSession',
		success: handler
	});
}

function navBarHandler(res) {
	if (res.username != undefined) {
		console.log('already loged in!');
		$(".topnav").find("ul").append(userIconHTML(res));
		$(".topnav").find("ul").append(`<li><a href="http://localhost:8080/createPost"><span class="glyphicon glyphicon-pencil"></span> Create New Post</a></li>`);
	} else {
		console.log(res.msg);
		// load login button
		$(".topnav").find("ul").append(`<li><a onclick="showModal();"><span class="glyphicon glyphicon-user"></span> Login</a></li>`);
		$(".topnav").find("ul").append(`<li><a href="http://localhost:8080/registeration/"><span class="glyphicon glyphicon-plus-sign"></span> Register</a></li>`);
		$("body").append("<div id='login-placeholder'></div>");
		$("#login-placeholder").load("./../Login/login.html");
	}
}

function logout () {
	$.ajax({
		type: 'GET',
		url: 'http://localhost:8080/logout',
		success: function(res){
			location.reload();
		}
	});
}

function userIconHTML(userInfo) {
	let adminTag = userInfo.isAdmin ? '<a href="http://localhost:8080/admin"> Administer</a>' : '';
	// load user icon and name
	return `<li class="dropdown">
		<a href="#" class="dropbtn">
			<span class="glyphicon glyphicon-user"></span> ${userInfo.username}
		</a>
		<div class="dropdown-content">
			${adminTag}
			<a href="http://localhost:8080/profile"> Profile</a>
			<a href="#" onclick="logout();"> Log out</a>
		</div>
	</li>`
}

function showModal() {
	document.getElementById('loginModal').style.display='block';
}

$(function() {
	checkSession(navBarHandler);
});

