var express = require('express');
var gcm = require('node-gcm');
var firebase = require('firebase');
var app = express();

var config = {
    apiKey: 'AIzaSyBLCzU0yDC0tQa4HAmENDaSTkDTXjBxkoc',
    authDomain: 'wtfdiw-b7b5d.firebaseapp.com',
    databaseURL: 'https://wtfdiw-b7b5d.firebaseio.com',
    storageBucket: 'wtfdiw-b7b5d.appspot.com',
};
firebase.initializeApp(config);
var db = firebase.database();

var GCM_API_KEY = 'AIzaSyAcKTPBZP3sgohe2VY76eF6r8Ic55tFM_Q'; // server key
//var GCM_API_KEY = 'AIzaSyCvxqkFVHrdkZQHZ2fv-PP_IRwe9-ddgdU'; // android key
var TTL = 3;
var RETRY_TIMES = 4;

var server = app.listen(3000, function() {
    console.log(' - server started up on port 3000');
});

app.get('/', function(req, res) {
    res.send('nothing to see here');
});

app.get('/push', function(req, res) {
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
            body: 'Should I buy a couch?',
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
            }],
            wantId: '0'
        }
    });

    var ref = db.ref('/users/0/devices');
    ref.once('value', function(snapshot) {
        var val = snapshot.val(),
            v;
        for (v in val) {
            deviceTokens.push(val[v].registrationId);
        }
    });

    sender.send(message, deviceTokens, RETRY_TIMES, function(result) {
        res.status(200).send([
            'pushed notification',
            '<ul>',
            '  <li>',
            deviceTokens.join('</li><li>'),
            '  </li>',
            '</ul>'
        ].join(''));
    }, function(err) {
        res.status(500).send('failed to push notification ');
    });
});
