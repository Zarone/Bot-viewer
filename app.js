var express = require('express');
var handlebars = require('express-handlebars');
var logger = require('morgan');
var TF2Items = require('tf2-items');
var fs = require('graceful-fs');

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
    var inventoryPath = "./temp/inventory.json";
    var pricesPath = "./temp/prices.json";
    var limitPath = "./temp/limits.json";
    var tableContent = [];
    fs.readFile(pricesPath, 'utf8', function(err, contents){
        var data = JSON.parse(contents);
        for (let i = 0; i < data.length; i++) {
            const element = data[i];

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

            buyPrice = currencyAsText(element.price.buy);
            sellPrice = currencyAsText(element.price.sell);

            tableContent.push({
                "name": element.item.name,
                "buyPrice": buyPrice,
                "sellPrice": sellPrice,
                "amount": 0,
            });
        };
        fs.readFile(inventoryPath, 'utf8', function(err, contents){
            var data = JSON.parse(contents);
            for (let i = 0; i < data.length; i++) {
                const element = data[i].name;
                for (let j = 0; j < tableContent.length; j++) {
                    if (tableContent[j].name == element) {
                        tableContent[j].amount++;
                    };
                };
            };
            fs.readFile(limitPath, 'utf8', function(err, contents){
                var data = JSON.parse(contents);
                for (let i = 0; i < tableContent.length; i++) {
                    if (data[tableContent[i].name] != -1) {
                        tableContent[i].amount = tableContent[i].amount + '/' + data[tableContent[i].name];
                    };
                };
                res.render('home', {data: JSON.stringify(tableContent)});
                //console.log(tableContent);
            });
        });
    });
    
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