// Client-side JavaScript, bundled and sent to client.

Accounts.ui.config({
  passwordSignupFields: 'USERNAME_AND_EMAIL'
});

// Current view is set here. Used in reactive template "content" to load the
// corresponding view
Session.set('current_view', 'board_list');
Session.set('current_view_options', {});

Session.set('modal_form_errors', '');
Session.set('show_new_card_form', '');
Session.set('show_edit_list_name', '');

Session.set('show_card_form', '');

/**
 * Sesion var used to be able to get a new event call in a template everytime
 * the window is resized
 */
Session.set("window_resize", new Date());

// Always be subscribed to the todos for the selected list
Meteor.subscribe("boards");

Meteor.subscribe("users");

// Suscribe to cards and list if we have a board
Meteor.autosubscribe(function () {
    if (Session.get('current_view') == "board_view") {
        var board_uri = Session.get('current_view_options').board_uri;
        var board = Boards.findOne({uri: board_uri});
        if (board) {
            Meteor.subscribe("lists", board_uri);
            Meteor.subscribe("cards", board_uri);
        }
    }
});

//### content view

Template.content.currentView = function() {
    return Session.get('current_view');
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
        console.log("calling to window resize");
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

    $(window).resize(function(evt) {
        Session.set("window_resize", new Date());
    });

    $(document).on('click', 'a.internal-link', function (evt) {
        var href = $(this).attr('href');
        evt.preventDefault();
        Router.navigate(href, true);
    });
});
