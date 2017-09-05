var express = require('express');
var app = express();
var request = require('request');
const bodyParser = require('body-parser');
var moment = require('moment');

var apiKey = process.env.weatherAPI; // API key for worldweatheronline.com

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')

app.get('/', function (req, res) {
  res.render('index', {weather: null, error: null});
})

// return the day of the week given day number of the week
function dayOfWeekAsString(dayIndex) {
    return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][dayIndex];
}

// handle post request from client
// request body should have city name or zip code, and week of date
app.post('/', function (req, res) {
  let city = req.body.city;
  let dateFrom = req.body.weekof;

  // use moment.js to get the end date of the week, and format it to API acceptable form
  let endOfWeek = moment(dateFrom,"YYYY-MM-DD").add(6 ,'days');
  let dateTo =  endOfWeek.format('YYYY') + '-' + endOfWeek.format('MM') + '-' + endOfWeek.format('DD');
  let url = 'https://api.worldweatheronline.com/premium/v1/past-weather.ashx?q='+city+'&date='+dateFrom+'&enddate='+dateTo+'&tp=24&key='+apiKey+'&format=json';

  // make request to the API
  request(url, function (err, response, body) {
    // if there is no error extract the needed results from the response and send it to client
    if (!err && response.statusCode == 200) {

        // parse the json result
        var result = JSON.parse(body);
        if(result.data.weather == undefined) {
          res.render('index', {weather: null, error: 'Error, please try again'})
        } else {
            var arr = [];
            var loc = result.data.request[0].type + " : " + result.data.request[0].query;
            result.data.weather.forEach(function(weather) {
            var dat = weather.date;
            arr.push({date: dat, day: dayOfWeekAsString(new Date(dat).getDay()),desc: weather.hourly[0].weatherDesc[0].value,
                        img: weather.hourly[0].weatherIconUrl[0].value, maxtempF: weather.maxtempF, mintempF: weather.mintempF});
            });
            res.render('index',{weather: arr,location: loc,error: null});
          }

    } else {
       console.log(err, response.statusCode, body);
        res.render('index', {weather: null, error: 'Error, please try again'});
    }
  });
})

var server = app.listen(3000, function () {
var host = server.address().address;
var port = server.address().port;
    console.log('Your app listening at http://%s:%s', host, port);
});
