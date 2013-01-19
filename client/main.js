// Client-side JavaScript, bundled and sent to client.

Accounts.ui.config({
  passwordSignupFields: 'USERNAME_AND_EMAIL'
});

// Current view is set here. Used in reactive template "content" to load the
// corresponding view
Session.set('current_view', 'board_list');

// Always be subscribed to the todos for the selected list.
Meteor.autosubscribe(function () {
    if (Meteor.userId()) {
        Meteor.subscribe("boards");
    }
});


///### Helpers


// Generic helpers
Handlebars.registerHelper('equal', function(a, b) {
    return a == b;
});


Handlebars.registerHelper('my_gravatar_url', function(size) {
    var email = userEmail(Meteor.user());
    if(email) {
        var ret = $.gravatar_url(email, {'size': size});
        return ret;
    }
    return "";
});

Handlebars.registerHelper('my_username', function(size) {
    return Meteor.user().username;
});


Handlebars.registerHelper('my_boards', function() {
    return Boards.find();
});

//### content view

Template.content.currentView = function() {
    console.log("current_view = " + Session.get('current_view'));
    return Session.get('current_view');
}

//### board_list view

