var originalData = [];

function checkSession(handler) {
	$.ajax({
		type: 'GET',
		url: 'http://localhost:8080/checkSession',
		success: handler
	});
}

function profileHandler(res) {
    console.log(res)
    if (res.msg == undefined) {
        let avatarName = res.avatarName;
        addAvatarElement(res.avatarName);
        $(".upload").click(function() {
            uploadProfileIcon();
        });
    
        if (res.username) {
            addEditableElement("username", res.username);
        }
        if (res.email) {
            addEditableElement("email", res.email);
        }
        if (res.friendCode) {
            addEditableElement("friendCode", res.friendCode);
        }
        // Generate friend list
        generateFriendList();
    } else {
        $('.profile').empty();
        $('.profile').append('<label style="font-size: 20px;">Requires Login to view profile</label>');
    }
}

function generateFriendList() {
    // Add Friend control
    $(".profile .infoList").append(`<div id="friends" class='attribute'>
        <div>
            <input type="text" class="form-control" id="newFriend" placeholder="Enter friend code here to add friend">
            <button type="button" class="btn btn-success addFriend" onclick="addNewFriend();"> Add Friend</button>
        </div>
    </div>`);

    // Generate friend list
	$.ajax({
		type: 'GET',
		url: 'http://localhost:8080/friends',
		success: function(friends) {
            // check if is array, otherwise print error
            if (!Array.isArray(friends)) {
                console.log(friends);
                return;
            }
            // Append body to table
            let bodyHtml = friends.map(friend => {
                let newbodyRow = Object.keys(friend).map(key => `<td>${friend[key]}</td>`).join('');
                return `<tr>${newbodyRow}</tr>`;
            }).join('');
            $(".profile .infoList #friends").prepend(`
                <label id="label">Friends:</label>
                <table class="table table-bordered"><tbody>${bodyHtml}</tbody></table>`);
        }
	});
}

function addNewFriend() {
    let friendCode = $('#newFriend').val();
	$.ajax({
        type: 'POST',
        dataType: "json",
		data: {friendCode: friendCode},
        url: 'http://localhost:8080/addFriend',
        success: function(res) {
            console.log(res);
            location.reload();
        }
	});
}

function requestProfileChange(attibuteKey, attribtueValue, handler) {
    let data = {
        "key": attibuteKey,
        "value": attribtueValue
    };

	$.ajax({
        type: 'POST',
        dataType: "json",
		data: data,
        url: 'http://localhost:8080/changeProfile',
        success: handler
	});
}

function uploadProfileIcon() {
    console.log("uploading imageS")
    // get data form file input
    var file = $('input[type=file]')[0].files[0];
    var formData = new FormData();
    formData.append('section', 'general');
    formData.append('action', 'previewImg');
    formData.append("userIcon", file)

	$.ajax({
        type: 'POST',
        data: formData,
        contentType: false,
        processData: false,
        url: 'http://localhost:8080/uploadUserAvatar',
		success: function(res){
			location.reload();
		}
	});
}

function toggleControl(clickEdit) {
    if (clickEdit) {
        $(saveButton).show();
        $(cancelButton).show();
        $(editButton).hide();
    } else {
        $(editButton).show();
        $(saveButton).hide();
        $(cancelButton).hide();
    }
}

function addAvatarElement(avatarName) {
    let newHtml = `
    <div class='icon'>
        <div class="control">
            <img src="${"http://localhost:8080/images/" + avatarName}" id="avatar">
            <input type="file" id="filechooser" accept=".jpg, .jpeg, .png">
            <button type="button" class="btn btn-success upload">Upload</button>
        </div>
    </div>`;
    $(".profile").prepend(newHtml);
}

function addEditableElement(attribtueKey, attribtueValue) {
    let newHtml = 
    `
    <div id="${attribtueKey}" class="attribute">
        <label id="label">${attribtueKey.charAt(0).toUpperCase() + attribtueKey.slice(1)}:</label>
        <div class="control">
                <button type="button" class="btn btn-primary edit">Edit</button>
                <button type="button" class="btn btn-success save">Save</button>
                <button type="button" class="btn btn-danger cancel">Cancel</button>
        </div>
        <div class="content">${attribtueValue}</div>
        <hr>
    </div>
    `;
    $(".profile .infoList").append(newHtml).each(function() {
        registerAttributeElement(attribtueKey, attribtueValue);
    });
}

function registerAttributeElement(attribtueKey, attribtueValue) {
    let attrLabel = `#${attribtueKey} .content`;
    let editButton = `#${attribtueKey} .control .edit`;
    let saveButton = `#${attribtueKey} .control .save`;
    let cancelButton = `#${attribtueKey} .control .cancel`;

    originalData[attribtueKey] = attribtueValue;

    function toggleControl(clickEdit) {
        if (clickEdit) {
            $(saveButton).show();
            $(cancelButton).show();
            $(editButton).hide();
        } else {
            $(editButton).show();
            $(saveButton).hide();
            $(cancelButton).hide();
        }
    }

    toggleControl(false);

    $(editButton).click(function() {
        console.log("Edit");
        console.log(attrLabel);
        $(attrLabel).prop('contenteditable', true).toggleClass('editable');
        $(attrLabel).focus();

        // show the corresponding element
        toggleControl(true);
    });

    $(saveButton).click(function() {
        console.log("Save");

        let key = attribtueKey;
        let value = $(attrLabel).text();
        requestProfileChange(key, value, function() {
            console.log("haha")
            location.reload();
        });

        $(attrLabel).prop('contenteditable', false).toggleClass('editable');

        // show the corresponding element
        toggleControl(false);
    });

    $(cancelButton).click(function() {
        console.log("Cancel");

        $(attrLabel).text(originalData[attribtueKey]);
        $(attrLabel).prop('contenteditable', false).toggleClass('editable');

        // show the corresponding element
        toggleControl(false);
    });
}

$(function() {
	// load navigation bar
	$("#nav-placeholder").load("./../NavigationBar/navigationBar.html");
    checkSession(profileHandler);
});