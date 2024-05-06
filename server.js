const express = require("express");
const app = express();

//var cors = require('cors');
const mongoose = require("mongoose");

const jwt = require("jsonwebtoken");
const exjwt = require("express-jwt");
const bodyParser = require("body-parser");
const path = require("path");

//app.use(cors());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); //TODO: change this to be more secure???
  res.setHeader("Access-Control-Allow-Headers", "Content-type,Authorization");
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = 3000;

const secretKey = "My super secret key";
const jwtMW = exjwt.expressjwt({
  secret: secretKey,
  algorithms: ["HS256"],
});

const usersModel = require("./models/users_schema");
const budgetModel = require("./models/budget_schema");

let dbURL = "mongodb://localhost:27017/final-project";

app.use("/", express.static("public"));
var jsonParser = bodyParser.json();

//TODO: gzip stuff?????

//TODO: add password encryption

//TODO: look into how to refresh token thru alert box button press
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  //Mongoose calls to pull users table from database, checks if entered user info matches
  //If info matches, creates JWT token
  mongoose.connect(dbURL).then(() => {
      console.log("connected to MongoDB database - login");

      usersModel.find({ username: username }).then((data) => {
          if (data.length) {
            const userPass = data[0].password;

            if (userPass === password) {
              console.log("Password matches!");
              let token = jwt.sign(
                {
                  id: data[0]._id,
                  username: data[0].username,
                },
                secretKey,
                { expiresIn: "1m" }
              );
              res.status(200).json({
                success: true,
                err: null,
                token,
              });
              mongoose.connection.close();
              return;
            } else {
              console.log("Password incorrect!");
              res.status(401).json({
                success: false,
                token: null,
                err: "Username or password is incorrect",
              });

              mongoose.connection.close();
              return;
            }
          } else {
            console.log("Username not found!");
            res.status(401).json({
              success: false,
              token: null,
              err: "Username not found",
            });
          }
        }).catch((connectionError) => {
          console.log(connectionError);
          res.status(404).json({connectionError});
          //return;
        });
    }).catch((connectionError) => {
      console.log(connectionError);
      res.status(400).json({connectionError});
    });
});

app.post("/api/signup", jsonParser, (req, res) => {
  console.log(req.body);

  mongoose.connect(dbURL).then(() => {
    console.log("Connected to database - signup");

    let newUser = new usersModel(req.body);
    usersModel.insertMany(newUser).then((data) => {
        console.log(data);

        let token = jwt.sign(
          { id: data[0]._id, username: data[0].username },
          secretKey,
          { expiresIn: "1m" }
        );
        res.status(200).json({
          success: true,
          err: null,
          token,
        });
        mongoose.connection.close();
        return;
      }).catch((connectionError) => {
        console.log(connectionError);
        res.status(404).json({
            success: false,
            token: null,
            err: error,
          });
      });
  }).catch((connectionError) => {
    console.log(connectionError);
    res.status(400).json({connectionError});
  });
});

app.get("/api/dashboard", jwtMW, (req, res) => {
  let budgetData = {
    myBudget: [],
  };

  //console.log(req.header);
  var authHeader = req.headers["authorization"];
  var token = authHeader && authHeader.split(" ")[1];
  //console.log(authHeader);
  //console.log(token);

  var userID = getUserID(token);

  mongoose.connect(dbURL).then(() => {
      console.log("connected to MongoDB database - dashboard");

      budgetModel.find({ user: userID }).then((data) => {
          //console.log(data);
          budgetData.myBudget = data;
          mongoose.connection.close();
          res.status(200).json({
            success: true,
            myContent: budgetData,
          });
        })
        .catch((error) => {
          console.log(error);
          return res.status(404).json({
            success: false,
            token: null,
            err: error,
          });
        });
    }).catch((connectionError) => {
      console.log(connectionError);
      return res.status(400).json({connectionError});
    });
});

app.post("/api/newdoc", jsonParser, (req, res) => {
  //console.log(req.body);
  //console.log(req.body.user);
  //console.log(typeof req.body.user);

  var newID = new mongoose.mongo.ObjectId(String(req.body.user));
  //console.log(newID);

  req.body.user = newID;
  console.log(req.body);

  mongoose.connect(dbURL).then(() => {
    console.log("Connected to MongoDB database - newdoc");

    let newData = new budgetModel(req.body);
    budgetModel.insertMany(newData).then((data) => {
        //console.log(data);
        mongoose.connection.close();
        res.status(200).json({
          success: true,
          content: data,
        });
      })
      .catch((error) => {
        console.log(error);
        res.status(404).json({
            success: false,
            token: null,
            err: error,
          });
      });
  }).catch((connectionError) => {
    console.log(connectionError);
    return res.status(400).json({connectionError});
  });
});

app.get("/api/verify", jwtMW, (req, res) => {
  var authHeader = req.headers["authorization"];
  var token = authHeader && authHeader.split(" ")[1];

  if (token) {
    try {
      const decode = jwt.verify(token, secretKey);
      req.user = decode;
      console.log(req.user);
      console.log("user id " + req.user.id);
      return res.status(200).json({
        success: true,
        content: req.user.id,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        token: null,
        err: "Token not valid",
      });
    }
  } else {
    return res.status(401).json({
        success: false,
        token: null,
        err: "Unauthorized user",
      });
  }
});

function getUserID(token) {
  var tokenArray = token.split(".");
  //console.log(tokenArray);
  const tokenPayload = JSON.parse(atob(tokenArray[1]));
  //console.log(tokenPayload);
  var userID = tokenPayload.id;
  //console.log(tokenPayload.id);

  return userID;
}

//TODO: add function for unpacking/verifying token to reduce redundant code????

//TODO: add token ttl check for frontend to call

app.use(function (err, req, res, next) {
  console.log(err.name === "UnauthorizedError");
  console.log(err);
  if (err.name === "UnauthorizedError") {
    res.status(401).json({
      success: false,
      officialErr: err,
      err: "Unauthorized, please log in",
    });
  } else {
    next(err);
  }
});

app.listen(PORT, () => {
  console.log(`Serving on port ${PORT}`);
});
