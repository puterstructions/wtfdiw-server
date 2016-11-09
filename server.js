var express = require('express'),
    cookieParser = require('cookie-parser'),
    fs = require('fs'),
    request = require('request'),
    util = require('util'),
    formidable = require('formidable'),
    firebase = require('firebase'),
    FCM = require('fcm-push'),
    CLIENT_ID = '573855873198-rvh7nl5r9pl8ai9d48rbkp247nrmme28.apps.googleusercontent.com',
    fcm,
    app = express(),
    config = {
        apiKey: 'AIzaSyCa77pheg0bKgodo9Y3UZeWE7pZwKTWbFE',
        authDomain: 'puterstructions-wtfdiw.firebaseapp.com',
        databaseURL: 'https://puterstructions-wtfdiw.firebaseio.com',
        storageBucket: 'puterstructions-wtfdiw.appspot.com',
        messagingSenderId: '573855873198',
    },
    db,
    messaging,
    server,
    FCM_API_KEY = 'AIzaSyCX9cL4jjLr6f45H5CIZe_9BJz-v6fioHk',
    TTL = 3,
    RETRY_TIMES = 4;

firebase.initializeApp(config);
db = firebase.database();
fcm = new FCM(FCM_API_KEY);

server = app.listen(3000, function() {
    console.log(' - server started up on port 3000');
});

app.use('/scripts', express.static(__dirname + '/scripts'));
app.use(cookieParser());
app.use('/api', function(req, res, next) {
    function validateAuthorization(error, response, body) {
        if (isValidAuthorization(error, response, body)) {
            next();
        }
        else {
            res.writeHead(401);
            res.end();
        }
    }

    var token = req.cookies['wtfdiw_token'];
    if (token) {
        request('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + token, validateAuthorization);
    }
    else {
        validateAuthorization('Missing token', null, null);
    }
});

function isValidAuthorization(error, response, body) {
    if (error || response.statusCode != 200) {
        console.log('Request, auth result: error=' + error);
        return false;
    }

    var result = JSON.parse(body),
        clientId = result['aud'],
        email = (result['email'] || ''),
        isValid = (clientId == CLIENT_ID && email.endsWith('@puterstructions.com'));

    console.log('Request, auth result: email=' + email + ', client=' + clientId + ' valid=' + isValid);
    return isValid;
}

app.get('/', function(req, res) {
    fs.readFile('form.html', function(err, data) {
        res.writeHead(200, {
            'Content-Type': 'text/html',
            'Content-Length': data.length
        });
        res.write(data);
        res.end();
    });
});

app.get('/api/users', function(req, res) {
  returnDbData(req, res, '/users');
});

app.get('/api/wants/:userId', function(req, res) {
  returnDbData(req, res, '/wants/' + req.params['userId']);
});

function returnDbData(req, res, fbPath) {
  db.ref(fbPath).once('value', function(snapshot) {
    var data = JSON.stringify(snapshot.val());
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    });
    res.write(data);
    res.end();
  });
};

app.post('/api/notify', function(req, res) {
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
        res.writeHead(200, {
            'content-type': 'text/plain'
        });
        pushNotification(fields, res);
        //res.write('received the data:\n\n');
        //res.end(util.inspect({
        //    fields: fields,
        //    files: files
        //}));
    });
});

function pushNotification(fields, res) {
    var deviceTokens = [],
        message = {
            collapseKey: 'wtfdiw',
            priority: 'high',
            data: {
                title: 'WTFDIW',
                icon: 'ic_launcher',
                ledColor: [0, 22, 49, 96],
                //vibratePattern: [2000,1000,500,500],
                actions: [{
                    icon: 'ic_stat_action_thumb_up',
                    title: 'Yes',
                    callback: 'voteYes',
                    foreground: false
                }, {
                    icon: 'ic_stat_action_thumb_down',
                    title: 'No',
                    callback: 'voteNo',
                    foreground: false
                }, {
                    icon: 'ic_stat_action_schedule',
                    title: 'Later',
                    callback: 'dismissVote',
                    foreground: false
                }]
            }
        };

    var devicesRef = db.ref('/devices/' + fields.user);
    devicesRef.once('value', function(dsnapshot) {
        var devices = dsnapshot.val(),
            d;
        for (d in devices) {
            deviceTokens.push(devices[d].registrationId);
        }

        var wantRef = db.ref('/wants/' + fields.user + '/' + fields.want);
        wantRef.once('value', function(wsnapshot) {
            var want = wsnapshot.val();
            message.data.wantId = fields.want;
            message.data.body = want.description;

            var dt,
                device,
                sent = 0;
            for (dt in deviceTokens) {
                device = deviceTokens[dt];
                message.to = device;
                asyncPush(device, message, res)
                    .then(function() {
                        sent++;
                        if (sent === deviceTokens.length) {
                            res.end();
                        }
                    });
            }
        });
    });
}

function asyncPush(device, message, res) {
    return fcm.send(message, function(err, response) {
        if (err) {
            res.write(util.inspect({
                message: 'failed to push notification',
                error: err
            }));
        }
        res.write(util.inspect({
            message: 'pushed notification',
            device: device,
            response: response
        }) + "\n\n");
    });
}
