const mongoose=require("mongoose");

const registrationSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
});

const Register=new mongoose.model("Register",registrationSchema);

module.exports=Register;