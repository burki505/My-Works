//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
// const bcrypt = require("bcrypt");

// const saltRounds = 10;          //hashlanmiş şifrenin gucunu boylece bcrpypt içinde arttırıyoruz


const app = express();



app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));


app.use(express.static("public"));

//passport js use section
app.use(session({
    secret: "ourlittlesecret.",
    resave: false,
    saveUninitialized: false
}));

//passport initialize
app.use(passport.initialize());
app.use(passport.session());





mongoose.connect("mongodb://localhost:27017/userDB",{ useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false});

// const userSchema = {
//     email : "String",
//     password : "String"
// };

//yukardaki normal seyler için kullanılabilir ama schema fonksiyonlarını kullanacagımız icin assagıdakini kullanmak gerek
const userSchema = new mongoose.Schema({
    email : String,
    password : String,
    googleId : String,
    secret: String
});

//for hash and save the users to the database
userSchema.plugin(passportLocalMongoose);

//adding findorcreate plugin
userSchema.plugin(findOrCreate);

//encryption için secret key olusturuyoruz normalde process.env de vardı.encrpt olacak alanı encrptedFields ile seciyoruz


//User model
const User = new mongoose.model("User",userSchema);

//passport documentation npm
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

//google auth
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



app.get("/",function(req,res){
    res.render("home");
}); 

//authentication through google similar with local below
app.get("/auth/google", passport.authenticate('google', {

    scope: ['profile']

}));


app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


app.get("/login",function(req,res){
    res.render("login");
}); 

app.get("/register",function(req,res){
    res.render("register");
}); 


app.get("/submit",function(req,res){

    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
});

app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;

    //passport hides user informations in req so we dont need to initialize again here
    User.findById(req.user.id,function(err,foundUser){
        if(err) console.log(err);

        else{
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                });
            }
        }
    });
});

//after getting auth we are here to get.if we are not logged we cant reach it by url /secrets.when we react outh we will search by find method that users have secrets
app.get("/secrets",function(req,res){
   User.find({"secret": {$ne: null}},function(err,foundUser){
    if(err) console.log(err);

    else{
        if(foundUser){
            res.render("secrets", {usersWithSecrets: foundUser});
        }
    }
   });
});




app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
});

app.post("/register",function(req,res){


    //user authentication
    User.register({username: req.body.username},req.body.password,function(err,user){
        if(err) {
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });



    
    // //password hashlame
    // bcrypt.hash(req.body.password,saltRounds,function(err,hash){
    //     const newUser = new User({
    //         email : req.body.username,
    //         password : hash
    //     });
    
    //     //if there is no error then we will redirect to secrets page
    //     newUser.save(function(err){
    //         if(err) res.send(err);
    //         else{
    //             res.render("secrets");
    //         }
    //     });
    // });
    
  
});

app.post("/login",function(req,res){


    const user = new User({
        username: req.body.username,
        password: req.body.password
    });


    req.login(user,function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });




















    // const username = req.body.username;
    // const password = req.body.password;

    // User.findOne({email : username},function(err,foundUser){

    //     if(err){
    //         console.log(err);
    //     }
    //     //error yoksa kullanıcının varlıgında password sorgulanır eşitse login yapılır
    //     else{
    //         if(foundUser){
    //             //girdigimiz sifreyle databasedaki şifreyi karsılastırıyozu
    //             bcrypt.compare(password, foundUser.password, function(err, result) {
    //                 if(result){
    //                     res.render("secrets");
    //                 }
    //             });
    //         }
    //     }

    // });
});



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
