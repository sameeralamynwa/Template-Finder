const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express()
app.locals.moment = require('moment');
const mongoose = require("mongoose");
const bodyparser = require("body-parser");
const res = require("express/lib/response");
const { query } = require("express");
const { userInfo } = require("os");
const session = require("express-session");
const MongoDBSession = require("connect-mongodb-session")(session);


// mongoose.connect('mongodb://localhost/TemplateFinderDatabase', {useNewUrlParser: true});
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true});

const port = process.env.PORT || 5000;
// const port = 5000;

app.use('/static', express.static('static'));
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

const store = new MongoDBSession({
    // uri: 'mongodb://localhost/TemplateFinderDatabase', //,
    uri: process.env.MONGODB_URI,
    collection: 'mysessions'
});

app.use(session({
    secret: "my-secret-key",
    saveUninitialized: false,
    resave: false,
    store: store
}));

const isAuth = (req, res, next) => {
    if(req.session.isAuth == true){
        next();
    }
    else{
        res.redirect('/login');
    }
}

let ContributeSchema = new mongoose.Schema({
    name: String,
    email: String,
    topic: String,
    code: String,
});

let RegistrationSchema = new mongoose.Schema({
    name: String,
    handle: String,
    email: String,
    password: String,
});

let ContributeSchemaModel = mongoose.model('ContributionTable', ContributeSchema);
let RegistrationSchemaModel = mongoose.model('RegistrationTable', RegistrationSchema);

app.get('/', function (req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle
    }
    res.status(200).render('home.pug', params);
});

app.get('/contribute', function (req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle
    }
    res.status(200).render('contribute.pug', params);
});

app.get('/login', function (req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle
    }
    res.status(200).render('login.pug', params);
});

app.post('/contribute', function (req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle
    }
    if(params.isAuth != true){
        return res.status(200).render('registrationform.pug');
    }
    let ContributionData = new ContributeSchemaModel(req.body);
    ContributionData.save().then(()=>{
        res.status(200).render('success.pug', params);
    }).catch(()=>{
        res.status(404).send("We are really sorry. Your response could not be saved in our database.");
    })
});

app.get('/register', function (req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle
    }
    res.status(200).render('registrationform.pug', params);
});

app.post('/register', function (req, res) {
    let {name, handle, email, password} = req.body;
    name = name.trim();
    handle = handle.trim();
    email = email.trim();
    passsword = password.trim();

    if(name == "" || handle == "" || email == "" || password == ""){
        return res.status(404).end("Empty input fields");
    }

    RegistrationSchemaModel.find({email}).then(result => {
        if(result.length){
            res.status(404).end("A user already exists with this email.");
        }
        else{
            const newUser = new RegistrationSchemaModel({
                name,
                handle,
                email,
                password
            });
        }
    }).catch(error => {
        console.log(error);
        res.status(404).end("An error occured while fetching the information for existing users.");
    });

    RegistrationSchemaModel.find({handle}).then(result => {
        if(result.length){
            res.status(404).end("A user already exists with this handle.");
        }
        else{
            const newUser = new RegistrationSchemaModel({
                name,
                handle,
                email,
                password
            });
            newUser.save().then(result => {
                res.status(200).render('successregistration.pug');
            }).catch(error => {
                res.status(404).end("An error occured while saving the information for the user.");
            })
        }
    }).catch(error => {
        console.log(error);
        res.status(404).end("An error occured while fetching the information for existing users.");
    });

});

app.post('/login', function (req, res) {
    let {handle, password} = req.body;
    console.log(req.body);
    RegistrationSchemaModel.find({handle}).then(result => {
        if(result.length){
            const databasePassword = result[0].password;
            if(databasePassword == password){
                req.session.isAuth = true;
                req.session.handle = handle;
                res.status(200).render('loginsuccess.pug', {isAuth: true, handle: handle});
            }
            else{
                res.status(404).end("Incorrect password.");
            }
        }
        else{
            res.status(404).end("No such handle exists.");
        }
    }).catch(error => {
        console.log(error);
        res.status(404).end("An error occured while fetching the information for existing users.");
    });

});

app.get('/logout', function(req, res) {
    req.session.destroy((error) => {
        if(error){
            throw error;
        }
        res.redirect('/');
    })
});

app.get('/about', function (req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle
    }
    res.status(200).render('about.pug', params);
});

app.get('/explore', function (req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle
    }
    res.status(200).render('explore.pug', params);
});

app.get('/explore/minimumandmaximumspanningtree', function (req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle
    }
    res.status(200).render('algospanningtree.pug', params);
});

app.get('/explore/dijkstraalgorithmwithmultipleedges', function (req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle
    }
    res.status(200).render('algodijkstra.pug', params);
});

app.get('/explore/fractionclass', function (req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle
    }
    res.status(200).render('fractionclass.pug', params);
});

app.listen(port, function () {
    console.log(`Listening at port ${port}`);
});