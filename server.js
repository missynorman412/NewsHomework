      var express    = require('express');
      var exphbs     = require('express-handlebars');
      var bodyParser = require('body-parser');
      var logger     = require('morgan');
      var mongoose   = require('mongoose');
      var cheerio    = require('cheerio');
       
      // Local dependencies
      var Article    = require('../models/Article.js');
      var Comment    = require('../models/Comment.js');

      var app    = express();
      var hbs    = exphbs.create({ defaultLayout: 'main', extname: '.hbs' });
      var PORT   = process.env.PORT || 3000;
 
// Handlebars init
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
if (process.env.PORT) app.enable('view cache');  // Disable view cache for local testing

// Morgan for logging
app.use(logger('dev'));

// Body parser init
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());

// Route for static content
app.use(express.static(process.cwd() + '/public'));

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/week18Populater");



// Render main site index
app.get('/', (req, res) => {
  rp('http://www.nytimes.com/pages/todayspaper').then(html => {
    const $ = cheerio.load(html),
          promises = [];

    $('h3').each(function(i, element) {
      const link    = $(element).find('a').attr('href'),
            title   = $(element).find('a').text().trim(),
            summary = $(element).next().next().text().trim();

      if (title) {
        promises.unshift(new Promise((resolve, reject) => {
          Article.update(
            { link: link },   // only create new entry if link does not exist in Articles
            { $setOnInsert:
              {
                link: link,
                title: title,
                summary: summary
              }                 
            },
            {
              upsert: true,
              setDefaultsOnInsert: true
            }
          ).then(article => 
            resolve(article)
          );
        }));
      }
    });

    // When all updates are resolved, continue
    Promise.all(promises).then(() => 
      Article.find({}).sort({ date: 1 }).limit(1).populate('comments').exec((err, doc) => 
        res.render('index', {article: doc[0]})
      )
    );
  });
});


// Additional routes
app.get('/articles', (req, res) => {
  Article.find({}).sort({ date: 1 }).limit(10).populate('comments').exec((err, docs) => 
    res.json(docs)
  )
});

app.get('/comments/:id', (req, res) => {
  Article.findById(req.params.id).populate('comments').exec((err, doc) => 
    res.json(doc.comments)
  )
});

app.post('/', (req, res) => {
  Comment.create({comment: req.body.comment}).then(comment => {
    console.log(comment);
    Article.findByIdAndUpdate(
      req.body.id,
      { $push: { "comments": comment._id } }
    ).then(() => 
      res.json(comment)
    )
  })
});

app.delete('/', (req, res) => {
  Article.findById(req.body.id).then(article => {
    const promises = [];

    for (const id of article.comments) {
      promises.push(new Promise((resolve, reject) => {
        Comment.remove({ _id: id}).then(data => resolve(data));
      }));
    }

    Promise.all(promises).then(data => {
      article.comments = [];
      article.save().then(() => res.json(data));
    });
  })
});



// Init server
app.listen(PORT, function () {
  console.log(`App listening on port ${PORT}`);
});