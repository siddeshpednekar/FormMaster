// const mongoose=require("mongoose");
// mongoose.connect("mongodb://127.0.0.1:27017/siddesh").then(()=>{
//   console.log("db connection successfull....");
// }).catch((e)=>{
//   console.log("db connection unsuccessfull...");
// })
var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database:"formmaster",
  connectionLimit:10
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  con.query("select * from register",(e,r)=>{
    if(e){
      throw e;
    }

    console.log(r);
  })
});

module.exports=con;