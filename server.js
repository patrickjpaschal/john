var express = require("express");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("./models");
var PORT = process.env.PORT || 5000;;
var app = express();
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
var mongUri =
    process.env.MONGODB_URI ||
    process.env.MONGOHQ_URL ||
    'mongodb://localhost/mlbLatestNews';
mongoose.connect(mongUri, function (err, res) {
    if (err) {
    console.log ('ERROR connecting to: ' + mongUri + '. ' + err);
    } else {
    console.log ('Succeeded connected to: ' + mongUri);
    }
  });
app.get("/scrape", function(req, res) {
  axios.get("http://www.mlb.com/").then(function(response) {
    var $ = cheerio.load(response.data);
    console.log('hello')
    console.log($(".p-headline-stack:nth-child(2) .p-headline-stack__link").length)
    $(".l-grid__col--transparent .p-headline-stack:nth-child(2) .p-headline-stack__link").each(function(i, element) {

     console.log(i)
     console.log(element.attribs.href)
     console.log(element.children[0].data)
     let pusher = {
         title: element.children[0].data,
         link: element.attribs.href
     }
     console.log(pusher)
     db.Article.create(pusher).then(function(dbArticle){
         console.log(dbArticle)
     })
    });
    // Send a message to the client
    res.send("Scrape Complete");
  });
});
app.get("/articles", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});
app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});
app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});
