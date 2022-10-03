var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var geocoder = require('geocoder');
var {
    isLoggedIn,
    checkUserCampground,
    checkUserComment,
    isAdmin,
    isSafe,
    isMaster
} = middleware; // destructuring assignment

router.get("/panel", isMaster, function (req, res, next) {
    // console.log("Admin Panel")
    // Get all campgrounds from DB
    Campground.find({adminCheck: false}) 
              .then(campground=> {
                                    console.log("Admin Panel")
                                    res.render("campgrounds/admin", {
                                      campgrounds: campground,
                                      page: 'Admin Panel'
                                    });
              })
              .catch(err => console.log(err))
});
router.get("/accept/:campID", isMaster, function (req, res, next) {
    // console.log("Admin Panel")
    // Get all campgrounds from DB
    const campID = req.params.campID;
    console.log(campID)
    Campground.findById(campID)
                .then(camp => {
                                camp.adminCheck = true;
                                camp.permission = true;
                                camp.save()
                                    .then(result => {
                                                        console.log("Permission Granted!")
                                    })
                                    .catch(err => console.log(err));
                                    
                })
                .then(result =>{
                                    res.redirect('/campgrounds')
                })
                .catch(err => console.log(err))
});

router.get("/decline/:campID", isMaster, function (req, res, next) {
    // console.log("Admin Panel")
    // Get all campgrounds from DB
    const campID = req.params.campID;
    console.log(campID)
    Campground.findByIdAndRemove(campID)
        .then(camp => {
                          console.log("Permission Declined!")             
                    })
        .then(result => {
            res.redirect('/campgrounds')
        })
        .catch(err => console.log(err))
});

module.exports = router