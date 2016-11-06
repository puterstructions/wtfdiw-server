var config = {
    apiKey: 'AIzaSyCa77pheg0bKgodo9Y3UZeWE7pZwKTWbFE',
    authDomain: 'puterstructions-wtfdiw.firebaseapp.com',
    databaseURL: 'https://puterstructions-wtfdiw.firebaseio.com',
    storageBucket: 'puterstructions-wtfdiw.appspot.com',
    messagingSenderId: '573855873198'
};
firebase.initializeApp(config);

var database = firebase.database(),
    userEl,
    wantEl,
    submitBtnEl;

document.addEventListener('DOMContentLoaded', function() {
  if (!window.localStorage.getItem('wtfdiw_token')) {
    console.log('Not yet signed in');
    document.getElementById('signInUI').style.display = 'block';
  }
});

function onSignIn(googleUser) {
  console.log('Signed in');
  window.localStorage.setItem('wtfdiw_token', googleUser.getAuthResponse().id_token);

  document.getElementById('signInUI').style.display = 'none';
  document.getElementById('signedInUI').style.display = 'block';
  document.getElementById('signedInEmail').innerText = googleUser.getBasicProfile().getEmail();

  loadUsers();
}

function signOut() {
  gapi.auth2.getAuthInstance().signOut().then(function () {
    window.localStorage.removeItem('wtfdiw_token');
    window.location.reload();
  });
}

function loadUsers() {
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
}

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
