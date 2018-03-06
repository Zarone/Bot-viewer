var express = require('express');
var handlebars = require('express-handlebars');
var logger = require('morgan');
var TF2Items = require('tf2-items');

var Item = require('./app/item.js')

var config = require('./config.json');

var Items = new TF2Items({
    apiKey: config.steamApiKey
});

Items.init(function(err) {
    if (err) {
        console.log(err);
        process.exit(1);
    }
});

var hbs = handlebars.create({ defaultLayout: 'main' });
var app = express();

app.use(logger('dev'));
app.use(require('body-parser').urlencoded({ extended: true }));

app.disable('X-Powered-By');
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.render('home');
});

app.use(function (err, req, res, next) {
    console.log(err);
    res.status(err.status || 500).json({ response: { success: false } });
});

var server = app.listen(3000, function () {
    console.log('Listening on port 3000');
});

function createSummary(items) {
    var summary = {};

    for (let i = 0; i < items.length; i++) {
        var item = Item.getItem(inventory[i]);
        var name = Items.schema.getDisplayName(item);

        summary[name] = (summary[name] || 0) + 1;
    }

    return summary;
}