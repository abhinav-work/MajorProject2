 const rateFunction = (x, rating) => {
     const campID = document.getElementById("campID").value;
     console.log(rating);
    console.log(campID)
     fetch('/campgrounds/rating/' + campID + "?star=" + rating, {
             method: 'POST'
         })
         .then(result => {
                            console.log("Fetched")
         })
         .catch(err => console.log(err))

 }