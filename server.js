const express = require("express");
const app = express();
const compression = require("compression");

const mongoose = require("mongoose");

const jwt = require("jsonwebtoken");
const exjwt = require("express-jwt");
const bodyParser = require("body-parser");
const path = require("path");


app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-type,Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(compression());

const PORT = 3000;

const secretKey = "My super secret key";
const refreshKey = "refreshingtokensecretkey";

const jwtMW = exjwt.expressjwt({
  secret: secretKey,
  algorithms: ["HS256"],
});

const usersModel = require("./models/users_schema");
const budgetModel = require("./models/budget_schema");

//let dbURL = "mongodb://localhost:27017/final-project";
let hostedURL = "mongodb+srv://kpflug:SkTfYjo0cmxh45MD@itcs-5166-project.5rohgme.mongodb.net/?retryWrites=true&w=majority&appName=ITCS-5166-project";


app.use("/", express.static("public"));
var jsonParser = bodyParser.json();

//Name of MongoDB database, used to make connection request
const connectionParams={
  dbName: "final-project"
}

//Login API function
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  mongoose.connect(hostedURL, connectionParams).then(() => {
      console.log("connected to MongoDB database - login");
      console.log(mongoose.connection.readyState);

      //Mongoose calls to pull users table from database, checks if entered user info matches
      usersModel.find({ username: username }).then((data) => {
          if (data.length) {
            const userPass = data[0].password;

            //If info matches, creates JWT token
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

              let refreshToken = jwt.sign(
                {
                  id: data[0]._id,
                  username: data[0].username,
                },
                refreshKey,
                {expiresIn: "365d"}
              );

              res.status(200).json({
                success: true,
                err: null,
                token: token,
                refresh: refreshToken
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
          return res.status(404).json({connectionError});
        });
    }).catch((connectionError) => {
      console.log(connectionError);
      return res.status(400).json({connectionError});
    });
});

//Signup API function
app.post("/api/signup", jsonParser, (req, res) => {
  console.log(req.body);

  mongoose.connect(hostedURL, connectionParams).then(() => {
    console.log("Connected to database - signup");
    console.log(mongoose.connection.readyState);

    //Create new Users document, then add it to the Users collection
    let newUser = new usersModel(req.body);

    usersModel.find({ username: req.body.username }).then((data) => {
      if (data.length) {
        console.log("Username must be unique!");
            res.status(401).json({
              success: false,
              token: null,
              err: "Username taken, please choose another",
            });
      } else {
        usersModel.find({ password: req.body.password }).then((data) => {
          if (data.length) {
            console.log("Password must be unique!");
                res.status(401).json({
                  success: false,
                  token: null,
                  err: "Password invalid, please choose another",
                });
          } else {
            usersModel.insertMany(newUser).then((data) => {
              console.log(data);
      
              //If successful, create user token
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
          }
        }).catch((connectionError) => {
          console.log(connectionError);
          res.status(400).json({connectionError});
        });
      }
    }).catch((connectionError) => {
      console.log(connectionError);
      res.status(400).json({connectionError});
    });
  }).catch((connectionError) => {
    console.log(connectionError);
    res.status(400).json({connectionError});
  });
});

//Get Dashboard API function
app.get("/api/dashboard", jwtMW, (req, res) => {
  let budgetData = {
    myBudget: [],
  };

  //Verify user by checking for valid token in header
  var authHeader = req.headers["authorization"];
  var token = authHeader && authHeader.split(" ")[1];

  //Pull user ID from token to search the Budget collection for user's items
  var userID = getUserID(token);

  mongoose.connect(hostedURL, connectionParams).then(() => {
      console.log("connected to MongoDB database - dashboard");
      console.log(mongoose.connection.readyState);

      //Find all budget items associated with the user
      budgetModel.find({ user: userID }).then((data) => {
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

//Add New Document API function
app.post("/api/newdoc", jsonParser, (req, res) => {
  //Create new MongoDB object ID for new document to use
  var newID = new mongoose.mongo.ObjectId(String(req.body.user));

  //Set the object ID
  req.body.user = newID;
  console.log(req.body);

  mongoose.connect(hostedURL, connectionParams).then(() => {
    console.log("Connected to MongoDB database - newdoc");
    console.log(mongoose.connection.readyState);

    //Create new Budget document, then add it to the Budget collection
    let newData = new budgetModel(req.body);
    budgetModel.insertMany(newData).then((data) => {
        console.log(data);
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

//Refresh user token, API function
app.post("/api/refresh", (req, res) => {
  console.log(req.body);
  if(req.body.refresh) {
    const refreshToken = req.body.refresh;
    const oldToken = req.body.currentToken;

    //Verify that the refresh token is valid
    jwt.verify(refreshToken, refreshKey, (err, decoded) => {
      if(err) {
        return res.status(401).json({
          success: false,
          token: null,
          err: "Unauthorized user",
        });
      } else {
        //Create new user token using old token's information
        let userId = getUserID(oldToken);
        var tokenArray = oldToken.split(".");
        const tokenPayload = JSON.parse(atob(tokenArray[1]));
        var userName = tokenPayload.username;

        let token = jwt.sign(
          {
            id: userId,
            username: userName,
          },
          secretKey,
          { expiresIn: "1m" }
        );

        res.status(200).json({
          success: true,
          err: null,
          token,
        });
      }
    });
  } else {
    return res.status(406).json({ message: 'Unauthorized' });
  }
});

//Verify user token API function
app.get("/api/verify", jwtMW, (req, res) => {
  var authHeader = req.headers["authorization"];
  var token = authHeader && authHeader.split(" ")[1];

  if (token) {
    try {
      const decode = jwt.verify(token, secretKey);
      req.user = decode;

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

//Get user ID helper function
function getUserID(token) {
  var tokenArray = token.split(".");
  const tokenPayload = JSON.parse(atob(tokenArray[1]));
  var userID = tokenPayload.id;

  return userID;
}

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

//Function for testing
app.get("/api/test/budget", (req, res) => {
  let budgetData = {
    myBudget: [],
  };

  mongoose.connect(hostedURL, connectionParams).then(() => {
      budgetModel.find().then((data) => {
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
