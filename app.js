const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express()
app.locals.moment = require('moment');
const bcrypt = require("bcrypt");
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
    // uri: 'mongodb://localhost/TemplateFinderDatabase',
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

let TopicSchema = new mongoose.Schema({
    name: String,
    sourcecode: [],
    problem: [],
    problemlink: []
});

let ContributeSchemaModel = mongoose.model('ContributionTable', ContributeSchema);
let RegistrationSchemaModel = mongoose.model('RegistrationTable', RegistrationSchema);
let TopicSchemaModel = mongoose.model('TopicSchema', TopicSchema);


app.get('/', function (req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle,
        title: '- Search for implementations of numerous algorithms and data structures'
    }
    res.status(200).render('home.pug', params);
});

app.get('/contribute', function (req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle,
        title: '- Contribute'
    }
    res.status(200).render('contribute.pug', params);
});

app.get('/login', function (req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle,
        title: '- Login'
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
        handle: req.session.handle,
        title: '- Register'
    }
    res.status(200).render('registrationform.pug', params);
});

app.post('/register', async function (req, res) {
    let {name, handle, email, password} = req.body;
    name = name.trim();
    handle = handle.trim();
    email = email.trim();
    passsword = password.trim();

    if(name == "" || handle == "" || email == "" || password == ""){
        return res.status(404).end("Empty input fields");
    }

    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);

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

app.post('/login', async function (req, res) {
    console.log(req.body);
    const user = await RegistrationSchemaModel.find({handle: req.body.handle});
    console.log(user);
    if(user.length){
        bcrypt.compare(req.body.password, user[0].password, function(err, result) {
            if (result) {
                req.session.isAuth = true;
                req.session.handle = req.body.handle;
                res.status(200).render('loginsuccess.pug', {isAuth: true, handle: req.body.handle});
            }
            else {
                res.status(404).end("Incorrect password.");
            }
          });
    }
    else{
        res.status(404).end("No such handle exists.");
    }
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
        handle: req.session.handle,
        title: '- About'
    }
    res.status(200).render('about.pug', params);
});

function convertToPath(word){
    word = word.toLowerCase();
    word = word.replace(" ", "-");
    return word;
}

function convertToName(word){
    word = word.replace("-", " ");
    const list = word.split(" ");
    for (var i = 0; i < list.length; i++) {
        list[i] = list[i].charAt(0).toUpperCase() + list[i].slice(1);
    }
    return list.join(" ");
}

app.get('/explore', function (req, res) {
    let name = []
    let path = []
    TopicSchemaModel.find().then(result => {
        if(result.length){
            for(let i = 0; i < result.length; ++i){
                name.push(result[i].name);
                path.push(convertToPath(result[i].name));
            }
        }
        else{
            res.status(404).end("No topics added");
        }
        let params = {
            isAuth: req.session.isAuth,
            handle: req.session.handle,
            title: '- Explore',
            name: name,
            path: path
        }
        res.status(200).render('explore.pug', params);
    }).catch(error => {
        console.log(error);
        res.status(404).end("An error occured while fetching the information for all topics.");
    });
});

app.get('/explore/:path', function(req, res) {
    let path = req.params.path;
    let name = convertToName(path);
    TopicSchemaModel.find({name}).then(result => {
        if(result.length == 0){
            res.status(404).end("No such topic");
        }
        let codes = {
            cpp: result[0].sourcecode[0],
            java: result[0].sourcecode[1],
            python: result[0].sourcecode[2]
        }
        let params = {
            isAuth: req.session.isAuth,
            handle: req.session.handle,
            sourcecode: codes,
            title: `- ${result[0].name}`,
            name: name,
            problem: result[0].problem,
            problemlink: result[0].problemlink
        }
        res.status(200).render('codetemplate.pug', params);
    }).catch(error => {
        console.log(error);
        res.status(404).end("An error occured while fetching the information for existing topic.");
    });
})

app.get('/explore/binary-exponentiation', function(req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle,
        title: '- Binary Exponentiation'
    }
    res.status(200).render('codebinaryexponentiation.pug', params);
})

app.get('/explore/euclid-algorithm', function(req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle,
        title: '- Euclid Algorithm'
    }
    res.status(200).render('codeeuclidalgorithm.pug', params);
})

app.get('/explore/sieve-of-eratosthenes', function(req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle,
        title: '- Sieve of Eratosthenes'
    }
    res.status(200).render('codesieveoferatosthenes.pug', params);
})

app.get('/explore/prime-sieve-linear', function(req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle,
        title: '- Linear Sieve'
    }
    res.status(200).render('codeprimesievelinear.pug', params);
})

app.get('/explore/factorization', function(req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle,
        title: '- Factorization'
    }
    res.status(200).render('codefactorization.pug', params);
})

app.get('/explore/binary-tree-inorder', function(req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle,
        title: '- Binary Tree Inorder Traversal'
    }
    res.status(200).render('codebinarytreeinorder.pug', params);
})

app.get('/explore/binary-tree-preorder', function(req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle,
        title: '- Binary Tree Preorder Traversal'
    }
    res.status(200).render('codebinarytreepreorder.pug', params);
})

app.get('/explore/design-hashset', function(req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle,
        title: '- Hashset Implementation'
    }
    res.status(200).render('codedesignhashset.pug', params);
})

app.get('/explore/stack-using-queue', function(req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle,
        title: '- Stack using Queue'
    }
    res.status(200).render('codestackusingqueue.pug', params);
})

app.get('/explore/string-hashing', function(req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle,
        title: '- String Hashing'
    }
    res.status(200).render('codestringhashing.pug', params);
})

app.get('/explore/rabin-karp', function(req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle,
        title: '- Rabin-Karp for String Matching'
    }
    res.status(200).render('coderabinkarp.pug', params);
})

app.get('/explore/expression-parsing', function(req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle,
        title: '- Expression Parsing'
    }
    res.status(200).render('codeexpressionparsing.pug', params);
})

app.get('/explore/binomial-coefficients', function(req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle,
        title: '- Binomial Coefficients'
    }
    res.status(200).render('codebinomialcoefficients.pug', params);
})

app.get('/explore/bracket-sequences', function(req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle,
        title: '- Bracket Sequences'
    }
    res.status(200).render('codebracketsequences.pug', params);
})

app.get('/explore/minimumandmaximumspanningtree', function (req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle,
        title: '- Minimum and Maximum Spanning Tree'
    }
    res.status(200).render('codespanningtree.pug', params);
});

app.get('/explore/dijkstraalgorithmwithmultipleedges', function (req, res) {
    const params = {
        isAuth: req.session.isAuth,
        handle: req.session.handle,
        title: '- Dijkstra Algirithm with Multiple Edges'
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