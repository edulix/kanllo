// Client-side JavaScript, bundled and sent to client.

Accounts.ui.config({
  passwordSignupFields: 'USERNAME_AND_EMAIL'
});

// Current view is set here. Used in reactive template "content" to load the
// corresponding view
Session.set('current_view', 'board_list');
Session.set('current_view_options', {});

Session.set('modal_form_errors', '');

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

Handlebars.registerHelper('modal_form_errors', function() {
    return Session.get('modal_form_errors');
});

//### content view

Template.content.currentView = function() {
    return Session.get('current_view');
}

//### board_list view

Template.board_list.can_remove_board = function(_id) {
    return Boards.findOne({_id: _id}).owner == Meteor.userId();
}

Template.board_list.events({
    'click .remove_board': function(event, template) {
        Session.set('current_view_options', {
            board_id: event.currentTarget.attributes["board-id"].value,
            board_name: event.currentTarget.attributes["board-name"].value,
        });
    }
});

//### new_board view

Template.new_board.events({
    /**
     * When user click to add a new board, send the petition to the server,
     * create the board, and show it
     */
    'click .save' : function (event, template) {
        var name = template.find("#boardname").value;
        if (name.length > 5 && name.length < 140) {
            Session.set("modal_form_errors", "");
            Meteor.call('createBoard', {
                name: name,
            }, function (error, board) {
                if (! error) {
                    // TODO: Use backbone router
                    // Session.set('current_view', 'board_view');
                    // Session.set('current_view_options', {board_uri: board.uri});
                } else {
                    alert("error creating the board, sorry");
                }
            });

            // hide it
            $("#new-board-close").click();
        } else {
            Session.set("modal_form_errors", "It needs a name (5-140 characters)");
        }
    },
});

//### remove_board view

Template.remove_board.boardname = function() {
    console.debug();
    return Session.get('current_view_options').board_name;
}

Template.remove_board.events({
    'click .remove': function(event, template) {
        var board_id = Session.get('current_view_options').board_id;
        Boards.remove({_id: board_id});
    }
})