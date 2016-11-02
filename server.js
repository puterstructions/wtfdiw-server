var express = require('express'),
    fs = require('fs'),
    util = require('util'),
    formidable = require('formidable'),
    firebase = require('firebase'),
    FCM = require('fcm-push'),
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

// mount at local folder (to include html,js,css)
app.use('/', express.static(__dirname + '/'));

server = app.listen(3000, function() {
    console.log(' - server started up on port 3000');
});

//-------------------------------------
//- INDEX

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

app.post('/', function(req, res) {
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
                sent = 0;
            for (dt in deviceTokens) {
                message.to = deviceTokens[dt];
                fcm.send(message, function(err, response) {
                    if (err) {
                        res.write(util.inspect({
                            message: 'failed to push notification',
                            error: err
                        }));
                    }
                    res.write(util.inspect({
                        message: 'pushed notification',
                        device: deviceTokens[dt],
                        response: response
                    }));

                    sent++;
                    if (sent === deviceTokens.length) {
                        res.end();
                    }
                });
            }
        });
    });
}
