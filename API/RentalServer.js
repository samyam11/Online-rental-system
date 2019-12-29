// Modules
var mysql = require("mysql");
var express = require("express");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
// session for store user login info
var session = require("express-session");
// File uploading module
var multer = require("multer");
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "public/images");
  },
  filename: function(req, file, cb) {
    cb(null, "Image" + Date.now() + file.originalname.replace(/\s+/g, ""));
  }
});
var upload = multer({ storage: storage });

// App inform
var app = express();
var port = 8080;
console.log("The port is set at: " + port);

// Database connection
var con = mysql.createConnection({
  //Maximum 100 concurrent query
  connectLimit: 100,
  host: "localhost",
  user: "root",
  
  password: "",
  database: "rent"
});

// initialize express-session to allow us track the logged-in user across sessions.
app.use(
  session({
    key: "user_sid",
    secret: "this-is-secret-token",
    cookie: {
      expires: 60 * 60 * 1000
    }
  })
);

// Send all static files like images or css files to browser when requested
app.use(express.static("Client"));
app.use(express.static("public"));

// initialize body-parser to parse incoming parameters requests to req.body
// parse json object
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// initialize cookie-parser to allow us access the cookies stored in the browser.
app.use(cookieParser());

//ejs
app.set("view engine", "ejs");

/********************************
 *			   API				*
 *********************************/
// Search
app.get("/search", (req, res) => {
  res.sendFile(__dirname + "/Client/Search/RentalHome.html");
});

app.post("/search", (req, res) => {
  let data = req.body;
  let type = "rentoutpost";
  let orderBy = "";
  let sql = `select * from post p, rentoutpost r where p.pid = r.pid`;
  if (data.city) {
    sql += ` and r.city = "${data.city.toLowerCase()}"`;
  }
  if (data.size && !isNaN(data.size)) {
    sql += ` and r.size <= ${data.size}`;
    orderBy = "r.size";
  }
  if (data.price && !isNaN(data.price)) {
    sql += ` and r.price <= ${data.price}`;
    orderBy = "r.price";
  }
  if (orderBy) {
    sql += ` order by ${orderBy} DESC`;
  }

  // limit to top 10
  sql += " limit 10";
  con.query(sql, function(err, result) {
    if (err) throw err;

    // Default set to question-mark image
    result.forEach(item => (item.iname = "question-mark.jpg"));

    // Get thumbnail for the post
    sql = `select p.pid, i.iid, i.iname from post p, rentoutpost r, image i where p.pid = r.pid and i.pid = p.pid`;
    con.query(sql, function(err, imageInfo) {
      if (err) throw err;
      imageInfo.forEach(function(singleImageInfo) {
        let matchPost = result.find(item => item.pid == singleImageInfo.pid);
        if (matchPost) {
          matchPost.iname = singleImageInfo.iname;
        }
      });
      res.send(result);
    });
  });
});

// Login
app.post("/login", function(req, res) {
  let user = req.body;
  let sql = `SELECT * FROM account where username = '${
    user.username
  }' and password = '${user.password}'`;
  con.query(sql, function(err, result) {
    if (err) throw err;
    if (result.length === 1) {
      // If user exist then set to session
      req.session.user = result[0].aid;
      res.send(200, result[0]);
    } else {
      // check what type of error
      sql = `SELECT * FROM account where username = '${user.username}'`;
      con.query(sql, function(err, result) {
        let data = {
          error: ""
        };
        // username exists that means password is wrong
        if (result.length === 1) {
          data.error = "Incorrect password";
        } else {
          data.error = "User not exists";
        }
        res.send(200, data);
      });
    }
  });
});

app.get("/logout", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.clearCookie("user_sid");
    res.redirect("/search");
  }
});

// Check user session to see if already login
app.get("/checkSession", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    let sql = `SELECT username, email, friendCode, avatarName FROM account where aid = '${
      req.session.user
    }'`;
    con.query(sql, function(err, data) {
      if (err) throw err;
      if (data.length === 1) {
        // If user exist then set to session
        if (!data[0].avatarName) {
          data[0].avatarName = "default.png";
        }
        sql = `SELECT * FROM administer where aid = ${req.session.user}`;
        con.query(sql, function(err, result) {
          if (err) throw err;
          if (result.length === 1) data[0].isAdmin = true;

          sql = `select * from frozenAccount where aid = ${req.session.user}`;
          con.query(sql, function(err, accounts) {
            if (err) throw err;
            if (accounts.length === 1) data[0].isFrozen = true;
            res.send(200, data[0]);
          });
        });
      }
    });
  } else {
    res.send(200, { msg: "Not login yet!" });
  }
});

// Profile
app.get("/profile", (req, res) => {
  res.sendFile(__dirname + "/Client/Profile/Profile.html");
});

// get friends
app.get("/friends", (req, res) => {
  if (!req.session.user || !req.cookies.user_sid) {
    res.send(200, "not login yet!");
    return;
  }

  let sql = `select * from friends where friendIDA = ${
    req.session.user
  } or friendIDB = ${req.session.user}`;
  con.query(sql, function(err, result) {
    if (err) throw err;
    let data = result.map(friendship => {
      if (friendship.friendIDA === req.session.user)
        return friendship.friendIDB;
      return friendship.friendIDA;
    });

    if (data.length === 0) {
      res.send(200, "you have no frineds yet...");
      return;
    }

    // get alll user friends name and email
    sql = `select username, email from account where${data
      .map(aid => " aid = " + aid)
      .join(" or ")}`;
    con.query(sql, function(err, friends) {
      if (err) throw err;
      res.send(200, friends);
    });
  });
});

// add friends
app.post("/addFriend", (req, res) => {
  if (!req.session.user || !req.cookies.user_sid) {
    res.send(200, "not login yet!");
    return;
  }

  let friendCode = req.body.friendCode;
  let sql = `select aid from account where friendCode = '${friendCode}'`;
  con.query(sql, function(err, people) {
    if (err) throw err;
    if (people.length === 0) {
      res.send(200, "not friend found with this code!");
    } else {
      let friendID = people[0].aid;
      sql = `insert into friends values(${req.session.user}, ${friendID})`;
      con.query(sql, function(err, result) {
        if (err) {
          res.send(200, err);
        } else {
          res.send(200, "New friend added!");
        }
      });
    }
  });
});

// Admin page
app.get("/admin", (req, res) => {
  res.sendFile(__dirname + "/Client/Administer/Administer.html");
});

// Admin execute query
app.post("/admin", (req, res) => {
  if (!req.session.user || !req.cookies.user_sid) {
    res.send(200, "not login yet!");
    return;
  }

  let checkAdminSql = `select * from administer where aid = '${
    req.session.user
  }'`;
  con.query(checkAdminSql, function(err, administer) {
    if (err) throw err;
    if (administer.length !== 1) {
      res.send(200, "You are not an administer!");
      return;
    }

    let sql = req.body.sql;
    con.query(sql, function(err, result) {
      if (err) res.send(200, err);
      else res.send(200, result);
    });
  });
});

// Delete Post
app.post("/deletePost", (req, res) => {
  let sql = `delete from post where pid = ${req.body.pid}`;
  con.query(sql, function(err, result) {
    if (err) res.send(200, err);
    else res.send(200, result);
  });
});

// Freeze Account
app.post("/freezeAccount", (req, res) => {
  let sql = `insert into frozenAccount values (${req.body.aid})`;
  con.query(sql, function(err, result) {
    if (err) res.send(200, err);
    else res.send(200, result);
  });
});

// Change profile
app.post("/changeProfile", (req, res) => {
  let key = req.body.key;
  let value = req.body.value;
  if (req.session.user && req.cookies.user_sid) {
    let sql = `UPDATE account set ${key} = '${value}' where aid = '${
      req.session.user
    }'`;
    con.query(sql, function(err, result) {
      if (err) throw err;
      console.log(result);
      res.send(200, result.message);
    });
  }
});

// Upload Image
app.post("/uploadUserAvatar", upload.single("userIcon"), (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    let sql = `UPDATE account set avatarName = '${
      req.file.filename
    }'where aid = '${req.session.user}'`;
    con.query(sql, function(err, result) {
      if (err) throw err;
      res.send(200, result[0]);
    });
  }
  res.send(200);
});

// Register
app.get("/registeration", (req, res) => {
  res.sendFile(__dirname + "/Client/Registeration/Registeration.html");
});

// Register
app.post("/register", (req, res) => {
  let user = req.body;
  let data = { error: "" };
  let sql = `SELECT * FROM account where username = '${user.username}'`;
  con.query(sql, function(err, result) {
    if (result.length === 1) {
      data.error = "user already exist";
      res.send(200, data);
    } else {
      sql = `SELECT * FROM account where email = '${user.email}'`;
      con.query(sql, function(err, result) {
        if (result.length === 1) {
          data.error = "E-mail already been used";
          res.send(200, data);
        } else {
          sql = `SELECT aid FROM account`;
          con.query(sql, function(err, result) {
            let rnumber = Date.now();
            while (result.indexOf(rnumber) != -1) {
              rnumber = Date.now();
            }
            sql = `insert into account values('${rnumber}','${
              user.username
            }','${user.email}','${
              user.password
            }','${Date.now().toString()}', null)`;
            con.query(sql, function(err, result) {
              if (err) throw err;
              // Keep registered user login
              req.session.user = rnumber;
              res.send({ redirect: "/search" });
            });
          });
        }
      });
    }
  });
});

app.get("/createPost", (req, res) => {
  res.sendFile(__dirname + "/Client/CreatePost/CreatePost.html");
});

var posId;
app.post("/createPost", (req, res) => {
  if (!req.session.user || !req.cookies.user_sid) {
    res.send(400, "Not login yet");
    return;
  } else {
    posId = Date.now();
    let aid = req.session.user;
    let postDate = new Date().toLocaleString();
    let postInfo = req.body;
    let sql_post = `INSERT INTO post VALUES (${posId}, ${aid}, '${
      postInfo.data.postContent
    }', '${postInfo.data.title}', '${postDate}')`;
    con.query(sql_post, function(err, result) {
      if (err) throw err;
      if (postInfo.type == "rentIn") {
        let sql_rentIn = `INSERT INTO rentinrequest VALUES (${posId},${
          postInfo.data.LowerBoundPrice
        },${postInfo.data.UpperBoundPrice},${
          postInfo.data.preferBedroomNumber
        })`;
        con.query(sql_rentIn, function(err, result) {
          if (err) throw err;
          res.send(200, { pid: posId });
        });
      } else {
        let sql_rentOut = `INSERT INTO rentoutpost VALUES (${posId},'${
          postInfo.data.address
        }', '${postInfo.data.city.toLowerCase()}', '${postInfo.data.province.toLowerCase()}', '${
          postInfo.data.size
        }', ${postInfo.data.price})`;
        con.query(sql_rentOut, function(err, result) {
          if (err) throw err;
          res.send(200, { pid: posId });
        });
      }
    });
  }
});

app.post("/upload/filesList", upload.single("img"), (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    let iid = Date.now();
    let sql_img = `INSERT INTO image VALUES (${iid},${posId},'${
      req.file ? req.file.filename : ""
    }')`;
    con.query(sql_img, function(err, result) {
      if (err) throw err;
      res.send(200, { redirect: "/search" });
    });
  }
});

app.get("/posts/:id", (req, res) => {
  let pid = req.params.id;
  let sql = `SELECT * FROM Post where pid = '${pid}'`;

  con.query(sql, function(err, post) {
    if (err) throw err;
    let aid = post[0].aid;
    sql = `SELECT username FROM Account WHERE aid = '${aid}'`;
    con.query(sql, function(err, username) {
      if (err) throw err;
      sql = `SELECT * FROM Comment WHERE pid = '${pid}' ORDER BY commentDate`;
      con.query(sql, function(err, comments) {
        if (err) throw err;
        sql = `SELECT * FROM RentOutPost WHERE pid = '${pid}'`;
        con.query(sql, function(err, RentOutPost) {
          if (err) throw err;
          sql = `SELECT * FROM Image WHERE pid = '${pid}'`;
          con.query(sql, function(err, postImage) {
            if (err) throw err;
            let imageName = "";
            if (postImage.length > 0) {
              imageName = postImage[0].iname;
            }
            res.render("post", {
              post: post[0],
              username: username[0],
              comments: comments,
              RentOutPost: RentOutPost,
              postImage: imageName
            });
          });
        });
      });
    });
  });
});

app.post("/posts/:id", (req, res) => {
  if (!req.session.user || !req.cookies.user_sid) {
    res.send(400, { error: "Not login yet!" });
    return;
  }

  let cid = Date.now();
  let timestamp = new Date();
  let date = timestamp.toLocaleString();
  let pid = req.params.id;
  let aid = req.session.user;
  let commentContent = req.body.commentContent;

  let sql = `INSERT INTO Comment VALUES ('${cid}', '${pid}', '${aid}', '${date}', '${commentContent}')`;
  con.query(sql, function(err, post) {
    let data = {
      error: "",
      success: ""
    };
    if (err) {
      data.error = err;
    } else {
      data.success = "success";
      res.send(200, data);
    }
  });
});

// Listen to the port 8080 (infinite loop)
app.listen(port);
