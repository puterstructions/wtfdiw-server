var express = require('express'),
    fs = require('fs'),
    util = require('util'),
    formidable = require('formidable'),
    gcm = require('node-gcm'),
    firebase = require('firebase'),
    app = express(),
    config = {
        apiKey: 'AIzaSyBLCzU0yDC0tQa4HAmENDaSTkDTXjBxkoc',
        authDomain: 'wtfdiw-b7b5d.firebaseapp.com',
        databaseURL: 'https://wtfdiw-b7b5d.firebaseio.com',
        storageBucket: 'wtfdiw-b7b5d.appspot.com',
    },
    db,
    server,
    GCM_API_KEY = 'AIzaSyAcKTPBZP3sgohe2VY76eF6r8Ic55tFM_Q', // server key
    //GCM_API_KEY = 'AIzaSyCvxqkFVHrdkZQHZ2fv-PP_IRwe9-ddgdU', // android key
    TTL = 3,
    RETRY_TIMES = 4;

firebase.initializeApp(config);
db = firebase.database();

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
        sender = new gcm.Sender(GCM_API_KEY),
        message = new gcm.Message({
            collapseKey: 'wtfdiw',
            priority: 'high',
            delayWhileIdle: true,
            timeToLive: TTL,
            contentAvailable: true,
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
        });

    var userRef = db.ref('/users/' + fields.user);
    userRef.once('value', function(usnapshot) {
        var user = usnapshot.val(),
            devices = user.devices,
            d;
        for (d in devices) {
            deviceTokens.push(devices[d].registrationId);
        }

        var wantRef = db.ref('/wants/' + fields.user + '/' + fields.want);
        wantRef.once('value', function(wsnapshot) {
            var want = wsnapshot.val();
            message.addData('wantId', fields.want);
            message.addData('body', want.description);

            sender.send(message, deviceTokens, RETRY_TIMES, function(result) {
                res.end(util.inspect({
                    message: 'pushed notification',
                    devices: deviceTokens
                }));
            }, function(err) {
                res.end(util.inspect({
                    message: 'failed to push notification',
                    error: err
                }));
            });
        });
    });
}
