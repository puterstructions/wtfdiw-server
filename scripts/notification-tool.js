var userEl,
    wantEl;

function onSignIn(googleUser) {
  Cookies.set('wtfdiw_token', googleUser.getAuthResponse().id_token);

  document.getElementById('signInUI').style.display = 'none';
  document.getElementById('signedInUI').style.display = 'block';
  document.getElementById('signedInEmail').innerText = googleUser.getBasicProfile().getEmail();

  userEl = document.getElementById('user'),
  wantEl = document.getElementById('want'),

  loadUsers();
}

function signOut() {
  gapi.auth2.getAuthInstance().signOut().then(function () {
    Cookies.remove('wtfdiw_token');
    window.location.reload();
  });
}

function loadUsers() {
    $.getJSON('/users', function(users) {
        var u,
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

        $.getJSON('/wants/' + userEl.value, function(wants) {
            var w,
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
    if (wantEl.selectedIndex) {
        document.getElementById('submitBtn').disabled = false;
    }
}
