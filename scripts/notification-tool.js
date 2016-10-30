var config = {
    apiKey: 'AIzaSyBLCzU0yDC0tQa4HAmENDaSTkDTXjBxkoc',
    authDomain: 'wtfdiw-b7b5d.firebaseapp.com',
    databaseURL: 'https://wtfdiw-b7b5d.firebaseio.com',
    storageBucket: 'wtfdiw-b7b5d.appspot.com'
};
firebase.initializeApp(config);

var database = firebase.database(),
    userEl,
    wantEl,
    submitBtnEl;

document.addEventListener('DOMContentLoaded', function() {
    userEl = document.getElementById('user');
    wantEl = document.getElementById('want');
    submitBtnEl = document.getElementById('submitBtn');

    var usersRef = database.ref('/users');
    usersRef.on('value', function(snapshot) {
        var users = snapshot.val(),
            u,
            usr,
            userOptions = ['<option value="">Select a user</option>'];
        for (u in users) {
            usr = users[u];
            userOptions.push([
                '<option value="',
                u,
                '">',
                usr.name,
                ' (',
                u,
                ')</option>'
            ].join(''));
        }
        userEl.innerHTML = userOptions.join('');
        userEl.disabled = false;
    });
});

function selectUser() {
    var sel = userEl.selectedIndex;
    if (sel) {
        wantEl.innerHTML = '<option>Loading...</option>';

        var wantsRef = database.ref('/wants/' + userEl.value);
        wantsRef.on('value', function(snapshot) {
            var wants = snapshot.val(),
                w,
                wnt,
                wantOptions = ['<option value="">Select a want</option>'];
            for (w in wants) {
                wnt = wants[w];
                wantOptions.push([
                    '<option value="',
                    w,
                    '">',
                    wnt.description,
                    ' (',
                    w,
                    ')</option>'
                ].join(''));
            }
            wantEl.innerHTML = wantOptions.join('');
            wantEl.disabled = false;
        });
    }
}

function selectWant() {
    var sel = wantEl.selectedIndex;
    if (sel) {
        submitBtnEl.disabled = false;
    }
}
