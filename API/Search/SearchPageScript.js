function search() {
	/*parse the sentence here*/
	let price = parseInt($('#price_input').val());
	let city = $('#city_input').val();
	let room_num = parseInt($('#room_num_input').val());

	let data = {
		price: price,
		city: city,
		size: room_num
	};

	$.ajax({
		type: 'POST',
		url: 'http://localhost:8080/search',
		dataType: "json",
		data: data,
		success: function(res){
			if (res) {
				// clean the table first
				cleanResidenceList();

				// Generate the new table
				res.forEach(post => {
					context = {
						title: post.postTitle,
						thumbnailSrc: `http://localhost:8080/images/${post.iname}`,
						postlink: `http://localhost:8080/posts/${post.pid}`,
						price: post.price,
						size: post.size
					};
					createResidenceUnit(context);
				});
			}
		}
	});
}

function newResidenceUnitHtml(context) {
	let priceTag = '', sizeTag = '';
	if (context.size) {
		sizeTag = `<div>Size: ${context.size} room</div>`;
	}
	if (context.price) {
		priceTag = `<div>Price: ${context.price}NRS</div>`;
	}

	let newElementHtml = `
	<li class="residence-unit">
		<a href="${context.postlink}" class="residence-unit-link">
			<div class="residence-unit-title">
				<label>${context.title}</label>
			</div>
			<div class="residence-unit-thumbnail">
				<img class="residence-unit-thumbnail-image" src="${context.thumbnailSrc}">
			</div>
			<div class="residence-unit-detail">${sizeTag}${priceTag}</div>
		</a>
	</li>`;
	return newElementHtml;
}

function createResidenceUnit(context) {
	$(".residence-list ul").append(newResidenceUnitHtml(context));
}

function cleanResidenceList() {
	$(".residence-list ul li").map(function(index, obj) {
		obj.remove();
	});
	
	return new Promise((resolve, reject) => {
		if ($(".residence-list ul li").length == 0) {
			resolve("All elements removed");
		}
	})
}

/************************
*	Register events		*
************************/
$(function() {
	$("#searchButton").click(function() {
		search();
	});
	
	$(".deleteAnimate").on('transitionend', function(e){
		$(e.target).remove();
	});

	// load navigation bar
	$("#nav-placeholder").load("./../NavigationBar/navigationBar.html");
	// Search without any parameters
	search()
});