const route = require('./Routers/route');
const mongoose = require('mongoose');
const createdb = require('./db_control');
//Before activating must connect to mongodb to interface
//Connecting code [mongod --dbpath=data --bind_ip 127.0.0.1] at mongodb directory

// mongoose.connect('mongodb://27017/', {useNewUrlParser: true})
// .then(()=>console.log('mongodb connected'))
// .catch(err => console.log(err));
createdb.createdb();
route.startbot();
