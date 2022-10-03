var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var geocoder = require('geocoder');
var { isLoggedIn, checkUserCampground, checkUserComment, isAdmin, isSafe } = middleware; // destructuring assignment

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//INDEX - show all campgrounds
router.get("/", function(req, res){
  if(req.query.search && req.xhr) {
      const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      // Get all campgrounds from DB
      Campground.find({name: regex, permission:true}, function(err, allCampgrounds){
         if(err){
            console.log(err);
         } else {
            res.status(200).json(allCampgrounds);
         }
      });
  } else {
      // Get all campgrounds from DB
      Campground.find({permission: true}, function(err, allCampgrounds){
         if(err){
             console.log(err);
         } else {
            if(req.xhr) {
              res.json(allCampgrounds);
            } else {
              res.render("campgrounds/index",{campgrounds: allCampgrounds, page: 'campgrounds'});
            }
         }
      });
  }
});

//CREATE - add new campground to DB
router.post("/", isLoggedIn, function(req, res){
  // get data from form and add to campgrounds array
  var name = req.body.name;
  var image = req.body.image;
  var desc = req.body.description;
  var author = {
      id: `${req.user._id}`,
      username: req.user.username
  }
  var cost = req.body.cost;
  var rating = {
    totalRating: 0,
    totalUsers: 0,
    users: [] 
  };
  // geocoder.geocode(req.body.location, function (err, data) {
  //   if (err || data.status === 'ZERO_RESULTS') {
  //     req.flash('error', 'Invalid address');
  //     return res.redirect('back');
  //   }
  //   console.log(data)
  //   var lat = data.results[0].geometry.location.lat;
  //   var lng = data.results[0].geometry.location.lng;
    var location = req.body.location.split(`"`)[1];
    // console.log(location)
    var newCampground = {name: name, image: image, description: desc, cost: cost, author:author, location: location, adminCheck: false, permission: false, ratings: rating};
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
  });


//NEW - show form to create new campground
router.get("/new", isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW - shows more info about one campground
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            console.log(err);
            req.flash('error', 'Sorry, that campground does not exist!');
            return res.redirect('/campgrounds');
        }
        // console.log(foundCampground)
        console.log("Request is by :-" + req.user);
        var rating;
        if(req.user)
        {
            foundCampground.ratings.users.forEach(ele => {
            if (ele.id.toString()===req.user._id.toString())
            {
              rating = ele.rate;
            }
          })
        }
        console.log("Rating" + rating)
        let avg = foundCampground.ratings.totalUsers == 0 ? 0 : (foundCampground.ratings.totalRating / foundCampground.ratings.totalUsers);
        // console.log('Total Users' + foundCampground)
        //render show template with that campground
        res.render("campgrounds/show", {
          campground: foundCampground,
          currentUser: req.user,
          rating: rating ? rating : null,
          avgRating: avg
        });
    });
});

// EDIT - shows edit form for a campground
router.get("/:id/edit", isLoggedIn, checkUserCampground, function(req, res){
  //render edit template with that campground
  res.render("campgrounds/edit", {campground: req.campground});
});

// PUT - updates campground in the database
router.put("/:id", function(req, res){
  
    var location = req.body.location.split(`"`)[1];
    var newData = {name: req.body.name, image: req.body.image, description: req.body.description, cost: req.body.cost, location: location};
    Campground.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });


// DELETE - removes campground and its comments from the database
router.delete("/:id", isLoggedIn, checkUserCampground, function(req, res) {
    Comment.remove({
      _id: {
        $in: req.campground.comments
      }
    }, function(err) {
      if(err) {
          req.flash('error', err.message);
          res.redirect('/');
      } else {
          req.campground.remove(function(err) {
            if(err) {
                req.flash('error', err.message);
                return res.redirect('/');
            }
            req.flash('error', 'Campground deleted!');
            res.redirect('/campgrounds');
          });
      }
    })
});

router.post('/rating/:campID', isLoggedIn, function (req, res) {
    let campID = req.params.campID;
    let rating = req.query.star;
    console.log(campID + " " + rating)
    Campground.findById(campID)
                .then(camp => {
                                var oldRating;
                                camp.ratings.users.forEach(element => {
                                    if(element.id.toString()===req.user._id.toString())
                                    {
                                      oldRating = element.rate;
                                    }
                                });

                                if(oldRating)
                                {
                                      console.log("OLD" + oldRating)
                                     camp.ratings.users = camp.ratings.users.filter(cp => cp.id.toString() !== req.user._id.toString())
                                     camp.ratings.totalRating = parseFloat(camp.ratings.totalRating) - parseFloat(oldRating)
                                     camp.ratings.totalUsers--;
                                     console.log("Subtraction " + camp.ratings.totalRating);
                                }
                               
                                 
                                camp.ratings.users = camp.ratings.users.concat({ id: req.user._id, rate: rating })
                                camp.ratings.totalRating = parseFloat(camp.ratings.totalRating) + parseFloat(rating)
                                camp.ratings.totalUsers++;
                                console.log(camp.ratings)
                                camp.save()
                                    .then(result => console.log("Update Successfull"))
                                    .catch(err => console.log(err))
                              })
                .catch(err => console.log(err))

     
})

module.exports = router;

