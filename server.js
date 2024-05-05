const express = require('express');
const app = express();

//var cors = require('cors');
const mongoose = require('mongoose');

const jwt = require('jsonwebtoken');
const exjwt = require('express-jwt');
const bodyParser = require('body-parser');
const path = require('path');

//app.use(cors());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');//TODO: change this to be more secure???
    res.setHeader('Access-Control-Allow-Headers', 'Content-type,Authorization');
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const PORT = 3000;

const secretKey = 'My super secret key';
const jwtMW = exjwt.expressjwt({
    secret: secretKey,
    algorithms: ['HS256']
});

const usersModel = require("./models/users_schema");
const budgetModel = require("./models/budget_schema");

let dbURL = "mongodb://localhost:27017/final-project";

app.use("/", express.static("public"));
var jsonParser = bodyParser.json();

//TODO: implement oauth2 using jwt?

//TODO: gzip stuff?????
/* let users = [//TODO: get rid of/change later
    {
        id: 1, 
        username: 'fabio',
        password: '123'
    },
    {
        id: 2, 
        username: 'nolasco',
        password: '456'
    },
    {
        id: 3, 
        username: 'jdoe',
        password: 'notrealpw'
    }
]; */

/* mongoose.connect(dbURL).then(() => {
    console.log("connected to MongoDB database");

    mongoose.connection.db
    .listCollections()
    .toArray()
    .then(coll => console.log({ coll }));

    usersModel.find().then((data) => {
        console.log(data);
        let userID = data[0]._id;
        let budgetItems = data[0].budget;
        console.log(userID);
        console.log(budgetItems);

        // budgetModel.find().where('_id').in(budgetItems).then((data) => {
        //     console.log(data);
        //     mongoose.connection.close();
        // });

        budgetModel.find({user: {$ne: userID}}).then((data) => {
            if(data.length){
                console.log(data);
            } else {
                console.log("no matches!");
            }
            
            mongoose.connection.close();
        });

        
        
    }).catch((connectionError) => {
        console.log(connectionError);
    });
    // budgetModel.find().then((data) => {
    //     console.log(data);
    //     let budgetItem = data[0];
    //     //console.log(budgetItem);
    //     let bID = budgetItem._id;
    //     console.log(bID);

    //     budgetModel.findById(bID).populate('user').then((test) => {
    //         console.log(test);
    //         //console.log(test.user.name);
    //         mongoose.connection.close();
    //     });
    // }).catch((connectionError) => {
    //     console.log(connectionError);
    // });

}).catch((connectionError) => {
    console.log(connectionError);
}); */

//TODO: add mongoose calls to handle user adding new budget item

//TODO: add signup feature, w password encryption

//TODO: look into alert box for incorrect user/pass?
//TODO: look into how to refresh token thru alert box button press
//TODO: add mongoose calls to pull users table, check if entered info matches
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    //Mongoose calls to pull users table from database, checks if entered user info matches
    //If info matches, creates JWT token
    mongoose.connect(dbURL).then(() => {
        console.log("connected to MongoDB database");
    
        usersModel.find({username: username}).then((data) => {
            if(data.length){
                //console.log(data[0]);
                const userPass = data[0].password;
                //console.log(userPass);

                if(userPass === password){
                    console.log("Password matches!");
                    let token = jwt.sign({id: data[0]._id, username: data[0].username}, secretKey, {expiresIn: '1m'});
                    res.status(200).json({
                        success: true,
                        err: null,
                        token
                    });
                    mongoose.connection.close();
                    return;
                } else {
                    console.log("Password incorrect!");
                    res.status(401).json({
                        success: false, 
                        token: null,
                        err: 'Username or password is incorrect'
                    });

                    mongoose.connection.close();
                    return;
                }
            } else {
                console.log("Username not found!");
                /* res.status(403).json({
                    success: false, 
                    token: null,
                    err: 'Username not found'
                });
                return; */
            }

            //mongoose.connection.close();
        }).catch((connectionError) => {
            console.log(connectionError);
            //res.status(404).json({connectionError});
            //return;
        });
    
    }).catch((connectionError) => {
        console.log(connectionError);
    });

    //console.log("This is me ", username, password);
    //res.json({data: 'it works'});
});

app.post("/api/signup", jsonParser, (req, res) => {
  console.log(req.body);

  mongoose.connect(dbURL).then(() => {
    console.log("Connected to database");

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
      })
      .catch((connectionError) => {
        console.log(connectionError);
        res.status(400).send(connectionError);
      });
  });
});

app.get('/api/dashboard', jwtMW, (req, res) => {
    let budgetData = {
        myBudget: []
    };

    //console.log(req.header);
    var authHeader = req.headers['authorization'];
    var token = authHeader && authHeader.split(' ')[1];
    //console.log(authHeader);
    //console.log(token);

    var userID = getUserID(token);

    mongoose.connect(dbURL).then(() => {
        console.log("connected to MongoDB database");

        budgetModel.find({user: userID}).then((data) => {
            console.log(data);
            budgetData.myBudget = data;
            mongoose.connection.close();
            res.json({//TODO: change to status
                success: true,
                myContent: budgetData
            });
        }).catch((connectionError) => {
            console.log(connectionError);
        });
        

    
    }).catch((connectionError) => {
        console.log(connectionError);
    });

    /* res.json({
        success: true,
        myContent: 'Personal budget dashboard for logged in user'
    }); */
});

app.post('/api/newdoc', jsonParser, (req, res) => {
    console.log(req.body);
    console.log(req.body.user);
    console.log(typeof req.body.user);

    var newID = new mongoose.mongo.ObjectId(String(req.body.user));
    console.log(newID);

    req.body.user = newID;
    console.log(req.body);

    mongoose.connect(dbURL).then(() => {
        console.log("Connected to database");

        let newData = new budgetModel(req.body);
        budgetModel.insertMany(newData).then((data) => {
            console.log(data);
            mongoose.connection.close();
            res.status(200).json({
                success: true,
                content: data
            });
        }).catch((connectionError) => {
            console.log(connectionError);
            res.status(400).send(connectionError);
        });
    });
});

app.get('/api/verify', jwtMW, (req, res) => {
    var authHeader = req.headers['authorization'];
    var token = authHeader && authHeader.split(' ')[1];
    
    if(token){
        try {
            const decode = jwt.verify(token, secretKey);
            req.user = decode;
            console.log(req.user);
            console.log("user id " + req.user.id);
            return res.status(200).json({
                success: true,
                content: req.user.id
            });
        } catch(err){
            return res.status(400).json('Token not valid');
        }
        
    } else {
        return res.status(401).json("Unauthorized user.");
    }
});

function getUserID(token) {
    var tokenArray = token.split('.');
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
    console.log(err.name === 'UnauthorizedError');
    console.log(err);
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({
            success: false,
            officialErr: err,
            err: 'Username or password is incorrect 2'
        });
    } else {
        next(err);
    }
});

app.listen(PORT, () => {
    console.log(`Serving on port ${PORT}`);
});