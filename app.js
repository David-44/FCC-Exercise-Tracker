'use strict';

const express = require('express'),
    dotenv = require('dotenv'),
    process = require('process'),
    mongoose = require('mongoose'),
    path = require('path'),
    bodyParser = require('body-parser');




/*************** Initialisation and Middlewares *****************/

dotenv.config(); // reads local environment file
const port = process.env.PORT,
    dbConnect = process.env.DB_CONNECT;

const app = express();

// bodyparser used by post requests
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));





/*************************** Router **************************/

const router = express.Router();

// loading express router
app.use('/api/exercise', router);

// GET requests

router.get(['/log'], (req, res) => {
  // getting all variables from the quesry string
  let {userId, from, to ,limit} = req.query;

  // changing these variables to something usable if they exist
  let fromDate = from ? new Date(from) : new Date(0),
      toDate = to ? new Date(to) : new Date(),
      duration = limit || 9999999;


  if (userId) {
    User.find({username: userId}, (err, users) => {
      if (err) { throw err; }
      if (users.length == 0) { res.send('invalid userId'); }

      let exercises = users[0].exercises.filter(exercise => {
        let d = exercise.date.getTime();
        return d > fromDate.getTime() && d < toDate.getTime() && exercise.duration <= duration;
      });
      res.json(exercises);

    });
  } else {
    res.send('No userId');
  }

});


app.get('*',function (req, res) {
  res.redirect('/');
});




// POST requests

// Posting a new user
router.post('/new-user', (req, res) => {
  User.find({username: req.body.username}, (err, users) => {
    if (err) {throw err;}
    if (users.length == 0) {
      let username = new User( {username: req.body.username, exercises: []});
      username.save(err => {
        if (err) { throw err; }
        res.send("User " + req.body.username + " added");
      });
    } else {
      res.send("user already exists");
    }
  });
});


// posting a new exercise
router.post('/add', (req, res) => {
  let {user, description, duration, date} = req.body;
  // let exercise = new Exercise({ description, duration, date });
  let exercise = {
    description, duration, date
  }
  // User.findOneAndUpdate({username: user}, {$push: {exercises: exercise}});
  User.find({username: user}, (err, users) => {
    if (err) {throw err;}
    if (users.length == 0) { res.send("could not find user");}
    let exercise = new Exercise({ description, duration, date });
    users[0].exercises.push(exercise);
    users[0].save(err => {
      if (err) { throw err; }
      res.send("Exercise added to user " + user);
    });
  });
});





/******************** database initialisation ****************/

// Creating the schemas and models

// Exercise representation
let exerciseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },

  duration: {
    type: Number,
    required: true
  },

  date: {
    type: Date,
    required: true
  }
});

// user representation
let userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },

  // Exercises as an array
  exercises: [exerciseSchema]

});

let Exercise = new mongoose.model('Exercise', exerciseSchema);
let User = new mongoose.model('User', userSchema);






// Used to setup the auto reconnect to fire every 5 minutes
// useNewUrlParser is a required option
const mongooseOptions = {
  useNewUrlParser: true,
  autoReconnect: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 30000
};

// establishes connection, takes URI directly from process.env
mongoose.connect(dbConnect, mongooseOptions, err => {
  if (err) {
    console.log('Unable to connect to the server. Please start the server. Error:', err);
  }
});

const db = mongoose.connection;

// disconnects on error in order to force an auto reconnect
db.on('error', error => {
  console.error('Error in MongoDb connection: ' + error);
  mongoose.disconnect();
});




/******************* Server Start ************************/

app.listen(port, () => {
  console.log('Server listening on ' + port);
});
