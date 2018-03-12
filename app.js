var express = require('express');
var handlebars = require('express-handlebars');
var logger = require('morgan');
var TF2Items = require('tf2-items');
var fs = require('graceful-fs');
var async = require('async');
var Item = require('./app/item.js');

var config = require('./config.json');

var Items = new TF2Items({
    apiKey: config.steamApiKey
});

Items.init(function(err) {
    if (err) {
        console.log(err);
        process.exit(1);
    }
    console.log("klar");
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
    getMeta(function(err, data) {
        if (err) {
            res.send("Error");
            console.log(err);
            return;
        }
        var tableContent = [];
        var summary = createSummary(data.inventory);
        for (let i = 0; i < data.prices.length; i++) {
            const element = data.prices[i];
            buyPrice = currencyAsText(element.price.buy);
            sellPrice = currencyAsText(element.price.sell);
            var limit = data.limits[element.item.name]||1
            tableContent.push({
                "name": element.item.name,
                "buyPrice": buyPrice,
                "sellPrice": sellPrice,
                "amount": (summary[element.item.name]||0) + (limit == -1 ? "":"/" + limit)
            });
        }
        res.render('home', {data: JSON.stringify(tableContent)});
    })
    
});

app.use(function (err, req, res, next) {
    console.log(err);
    res.status(err.status || 500).json({ response: { success: false } });
});

var server = app.listen(3000, function () {
    console.log('Listening on port 3000');
});

function getMeta(callback){
    async.series({
        prices: function(callback) {
            getPrices(callback);
        },
        limits: function(callback) {
            getLimits(callback);
        },
        inventory: function(callback) {
            getInventory(callback);
        }
    }, callback);
}

function trunc(number, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.floor(number * factor) / factor;
};

function plural(word, count) {
    return count == 1 ? word : word + 's';
};

function decimalPlaces(num) {
    var match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
    if (!match) { return 0; }
    return Math.max(
        0,
        // Number of digits right of decimal point.
        (match[1] ? match[1].length : 0)
        // Adjust for scientific notation.
        - (match[2] ? +match[2] : 0));
}

function currencyAsText(currencies) {
    var text = '';

    if (currencies.keys && currencies.keys != 0) {
        text = currencies.keys + ' ' + plural('key', currencies.keys);
    }
    if (currencies.metal && currencies.metal != 0) {
        if (text != '') {
            text += ', ';
        }
        text += (decimalPlaces(currencies.metal) == 2 ? currencies.metal : trunc(currencies.metal, 2)) + ' ref';
    }
    if (text == '') {
        return '0 keys, 0 ref';
    }

    return text;
};

function createSummary(items) {
    var summary = {};

    for (let i = 0; i < items.length; i++) {
        var item = Item.getItem(items[i]);
        item.quality = Items.schema.getQuality(item.quality);
        var name = Items.schema.getDisplayName(item);

        summary[name] = (summary[name] || 0) + 1;
    }

    return summary;
}


function getPrices(callback) {
    fs.readFile('./temp/prices.json', function(err, data) {
        if (err) {
            callback(err);
            return;
        }

        callback(null, JSON.parse(data));
    });
}


function getLimits(callback) {
    fs.readFile('./temp/limits.json', function(err, data) {
        if (err) {
            callback(err);
            return;
        }

        callback(null, JSON.parse(data));
    });
}

function getInventory(callback) {
    fs.readFile('./temp/inventory.json', function(err, data) {
        if (err) {
            callback(err);
            return;
        }

        callback(null, JSON.parse(data));
    });
}