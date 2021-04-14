//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");


const app = express();

console.log(process.env.API_KEY);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB",{ useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false});

// const userSchema = {
//     email : "String",
//     password : "String"
// };

//yukardaki normal seyler için kullanılabilir ama schema fonksiyonlarını kullanacagımız icin assagıdakini kullanmak gerek
const userSchema = new mongoose.Schema({
    email : "String",
    password : "String"
});

//encryption için secret key olusturuyoruz normalde process.env de vardı.encrpt olacak alanı encrptedFields ile seciyoruz
//bunları yazdıktan sonra tekrar loginde veya registerda tanımlamaya gerek yok cünku her find veya save fonksiyonu calıstıgında burası calısacak

userSchema.plugin(encrypt,{secret: process.env.SECRET,encryptedFields : ["password"]});

//User model
const User = new mongoose.model("User",userSchema);



app.get("/",function(req,res){
    res.render("home");
}); 

app.get("/login",function(req,res){
    res.render("login");
}); 

app.get("/register",function(req,res){
    res.render("register");
}); 

app.post("/register",function(req,res){
    const newUser = new User({
        email : req.body.username,
        password : req.body.password
    });

    //if there is no error then we will redirect to secrets page
    newUser.save(function(err){
        if(err) res.send(err);
        else{
            res.render("secrets");
        }
    });
});

app.post("/login",function(req,res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email : username},function(err,foundUser){

        if(err){
            console.log(err);
        }
        //error yoksa kullanıcının varlıgında password sorgulanır eşitse login yapılır
        else{
            if(foundUser){
                if(foundUser.password === password){
                    res.render("secrets");
                }
            }
        }

    });
});



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
