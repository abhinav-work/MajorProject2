var mongoose = require("mongoose");

var campgroundSchema = new mongoose.Schema({
   name: String,
   image: String,
   description: String,
   cost: Number,
   location: String,
   createdAt: { type: Date, default: Date.now },
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String
   },
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ],
   adminCheck: Boolean,
   permission: Boolean,
   ratings:{
                  totalRating: { type: Number},
                  totalUsers: {type: Number},
                  users: [
                           { 
                              id:{
                                     type: mongoose.Schema.Types.ObjectId,
                                     ref: 'User'
                                 },
                               rate: { type : Number}  
                  }]
   }
});

module.exports = mongoose.model("Campground", campgroundSchema);