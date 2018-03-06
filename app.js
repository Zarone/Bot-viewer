var express = require('express');
var handlebars = require('express-handlebars');
var logger = require('morgan');

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