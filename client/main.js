// Client-side JavaScript, bundled and sent to client.

Accounts.ui.config({
  passwordSignupFields: 'USERNAME_AND_EMAIL'
});

// Current view is set here. Used in reactive template "content" to load the
// corresponding view
Session.set('current_view', 'board_list');
Session.set('current_view_options', {});

Session.set('modal_form_errors', '');

// Always be subscribed to the todos for the selected list
Meteor.subscribe("boards");

// Suscribe to cards and list if we have a board
Meteor.autosubscribe(function () {
    if (Session.get('current_view') == "board_view") {
        var board_uri = Session.get('current_view_options').board_uri;
        var board = Boards.findOne({uri: board_uri});
        if (board) {
            console.log("subscribing to lists and cards");
            Meteor.subscribe("lists", board_uri);
            Meteor.subscribe("cards", board_uri);
        }
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

//### home_anonymous view

Template.home_anonymous.events({
    'click .sign_in_activate': function(event) {
        event.preventDefault();
        $("#login-sign-in-link")[0].click();
    }
});

//### board_list view

Template.board_list.can_remove_board = function(uri) {
    return Boards.findOne({uri: uri}).owner == Meteor.userId();
}

Template.board_list.events({
    'click .remove_board': function(event, template) {
        Session.set('current_view_options', {
            board_uri: event.currentTarget.attributes["board-uri"].value,
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
            }, function (error, board_uri) {
                console.log("board_uri = " + board_uri);
                if (!error) {
                    Router.showBoard(board_uri);
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
    var opts = Session.get('current_view_options');
    var board = Boards.findOne({uri: opts.board_uri});

    return (board) ? board.name : "";
}

Template.remove_board.events({
    'click .remove': function(event, template) {
        var opts = Session.get('current_view_options');
        var board = Boards.findOne({uri: opts.board_uri});
        if (board) {
            Boards.remove({uri: board.uri});
        }
    }
})

//### board_view

Template.board_view.boardname = Template.remove_board.boardname;

Template.board_view.board_lists = function() {
    var opts = Session.get('current_view_options');
    var board = Boards.findOne({uri: opts.board_uri});

    if (!board) {
        return [];
    }
    var list_ids = board.lists;
    return Lists.find({_id: {$in: list_ids}});
}

//### Routing

var AppRouter = Backbone.Router.extend({
    routes: {
        "": "board_list",
        "boards": "board_list",
        "board/:board_uri": "board",
    },

    // routing internal functions

    board_list: function() {
        Session.set("current_view", "board_list");
        Session.set("current_view_options", {});
    },

    board: function (board_uri) {
        Session.set("current_view_options", {board_uri: board_uri});
        Session.set("current_view", "board_view");
    },

    // navigation shortcuts

    showBoardList: function() {
        this.navigate("boards", true);
    },

    showBoard: function(board_uri) {
        this.navigate("board/" + board_uri, true);
    }
});

Router = new AppRouter;

Meteor.startup(function () {
  Backbone.history.start({pushState: true});
});
