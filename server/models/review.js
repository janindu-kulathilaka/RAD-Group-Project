const mongoose =require("mongoose");

const reviewSchema=new mongoose.Schema({

  fullName: {type:String, required:true},
  checkIn: {type:Date, required:true},
  checkOut: {type:Date, required:true},
  desctiption: {type:String, required:true}
});

const Review=mongoose.model("Review",reviewSchema);

module.exports=Review;