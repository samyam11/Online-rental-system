function sendCreatePostRequest(type, data) {
  let info = {
    type: type,
    data: data
    //img: dataArr
  };
  $.ajax({
    type: "POST",
    url: "http://localhost:8080/createPost",
    dataType: "json",
    data: info,
    success: function(msg) {
      console.log(msg);
      if (msg.error) {
        console.log(msg.error);
      } else {
        // refresh page
        uploadImages();
      }
    }
  });
}

function uploadImages() {
  console.log("uploading imageS");
  // get data form file input
  var file = $("input[type=file]")[0].files[0];
  var formData = new FormData();
  formData.append("section", "general");
  formData.append("action", "previewImg");
  formData.append("img", file);

  $.ajax({
    type: "POST",
    data: formData,
    contentType: false,
    processData: false,
    url: "http://localhost:8080/upload/filesList",
    success: function (res) {
      window.location = res.redirect;
    }
  });
}



function createPost() {
  //get type
  var type = $('input:radio[name="user"]:checked').val();
  let data = {};

  if (type == "rentIn") {
    //Rent in
    let title = $("input[name=inTitle]").val();
    let LowerBoundPrice = $("input[name=Lprice]").val();
    let UpperBoundPrice = $("input[name=Uprice]").val();
    let preferBedroomNumber = $("input[name=numOfBed]").val();
    let content = $("textarea#inArea").val();

    //console.log(content);
    if (
      title == "" ||
      LowerBoundPrice == "" ||
      UpperBoundPrice == "" ||
      preferBedroomNumber == ""
    ) {
      alert("Please fill all the information!");
      return false;
    }

    if (LowerBoundPrice > UpperBoundPrice) {
      alert(
        "You cannot have the min price larger than the max price! Please enter again!"
      );
      return false;
    }

    let testInt = /^[0-9]*[1-9][0-9]*$/;
    if (testInt.test(preferBedroomNumber) != true) {
      alert("Please enter a integer in bedroom area!");
      return false;
    }

    data.title = title;
    data.LowerBoundPrice = LowerBoundPrice;
    data.UpperBoundPrice = UpperBoundPrice;
    data.preferBedroomNumber = preferBedroomNumber;
    data.postContent = content;
    //data.pid = getPid();
  } else {
    // Rent out
    let title = $("input[name=outTitle]").val();
    let price = $("input[name=price]").val();
    let size = $("input[name=size]").val();
    let address = $("input[name=address]").val();
    let city = $("input[name=city]").val();
    let province = $("input[name=province]").val();
    let content = $("textarea#outArea").val();


    if (
      title == "" ||
      price == "" ||
      size == "" ||
      address == "" ||
      city == "" ||
      province == ""
    ) {
      alert("Please fill all the information!");
      return false;
    }

    let testInt = /^[0-9]*[1-9][0-9]*$/;
    if (testInt.test(size) != true) {
      alert("Please enter a integer in size area!");
      return false;
    }

    data.title = title;
    data.address = address;
    data.city = city;
    data.province = province;
    data.size = size;
    data.price = price;
    data.postContent = content;
    //data.pid = getPid();
  }
  console.log(type, data);
  sendCreatePostRequest(type, data);
}

$(function() {
  // load navigation bar
  $("#nav-placeholder").load("./../NavigationBar/navigationBar.html");

  $(".outInfo").hide();
  $(".inInfo").hide();
  $(".submit").hide();
  $("#submitOp").click(function() {
    let val = $('input:radio[name="user"]:checked').val();
    //check radio value
    if (val == null) {
      alert("you did't make any choice");
      return false;
    } else {
      if (val == "rentIn") {
        $(".outInfo").hide();
        $(".inInfo").show();
        $(".submit").show();
      }
      if (val == "rentOut") {
        $(".inInfo").hide();
        $(".outInfo").show();
        $(".submit").show();
      }
    }
  });
  $("#submit").click(function() {
    createPost();
  });
});
