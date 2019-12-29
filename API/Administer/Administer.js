function checkSession(handler) {
	$.ajax({
		type: 'GET',
		url: 'http://localhost:8080/checkSession',
		success: handler
	});
}

function initializePage(res) {
    if (!res.username) {
        // case not login yet
        $('.administerContent').empty();
        $('.administerContent').append('<label style="font-size: 20px;">Requires Login to view profile</label>')
    } else if (!res.isAdmin) {
        // case not login yet
        $('.administerContent').empty();
        $('.administerContent').append('<label style="font-size: 20px;">You are not Administer</label>')
    }
}

function freezeAccount() {
    let freezeAccount = $('#freezeAccount').val();
    if (!freezeAccount) {
        return;
    }

    $.ajax({
		type: 'POST',
		url: 'http://localhost:8080/freezeAccount',
		dataType: "json",
		data: {aid: freezeAccount},
        success: function(res) {
            location.reload();
        }
    });
}

function deletePost() {
    let deletePost = $('#deletePost').val();
    if (!deletePost) {
        return;
    }

    $.ajax({
		type: 'POST',
		url: 'http://localhost:8080/deletePost',
		dataType: "json",
		data: {pid: deletePost},
        success: function(res) {
            location.reload();
        }
    });
}

function executeQuery() {
    let sql = $('#sqlquery').val()
    let data = {
        sql: sql
    };

    $.ajax({
		type: 'POST',
		url: 'http://localhost:8080/admin',
		dataType: "json",
		data: data,
        success: generateTableFromQuery
    });
}

function generateTableFromQuery(result) {
    console.log(result);
    $('#result').empty();
    if (result.errno) {
        $('#result').append(`<thead><tr><th>Error in SQL: ${result.code}</th></tr></thead>`);
    } else if (result.length === 0) {
        $('#result').append('<thead><tr><th>No result found!</th></tr></thead>');
    } else {
        // Append header to table
        let headers = Object.keys(result[0]);
        let headersHtml = headers.map(header => `<th>${header}</th>`).join();
        $('#result').append(`<thead><tr>${headersHtml}</tr></thead>`);

        // Append body to table
        let bodyHtml = result.map(tuple => {
            let newbodyRow = Object.keys(tuple).map(key => `<td>${tuple[key]}</td>`).join();
            return `<tr>${newbodyRow}</tr>`;
        }).join();
        $('#result').append(`<tbody>${bodyHtml}</tbody>`);
    }
}

function optionButtonClick(buttonId) {
    $('#sqlquery').val('');
    $('#sqlquery').val(sqlQueries[buttonId]);
    executeQuery();
}

$(function() {
    // load navigation bar
    $("#nav-placeholder").load("./../NavigationBar/navigationBar.html");
    checkSession(initializePage);

    // Register exectute query button event
    $('button.execute').click(executeQuery)

    // Register all other button event
    $("#sqloptions button").click(function() {
        optionButtonClick(this.id);
    });
});

var sqlQueries = {}
sqlQueries['reply_all_post'] = `
SELECT a.aid, a.username
FROM account a
WHERE NOT EXISTS
(SELECT p.pid FROM post p
WHERE NOT EXISTS
(SELECT * FROM comment c WHERE c.pid=p.pid and c.aid=a.aid));`;

sqlQueries['post_below_average'] = `
SELECT p.pid, p.postTitle, r1.price
FROM post p, rentoutpost r1
WHERE p.pid = r1.pid and r1.price < (SELECT AVG(r2.price)
FROM rentoutpost r2)`;

sqlQueries['average_price'] = `
SELECT avg(r2.price) as averagePrice
FROM rentoutpost r2`;

sqlQueries['below_average_by_city'] = `
SELECT city, AVG(price) 
FROM rentoutpost
GROUP BY city
`