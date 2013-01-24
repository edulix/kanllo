// Client-side JavaScript, bundled and sent to client.

Accounts.ui.config({
  passwordSignupFields: 'USERNAME_AND_EMAIL'
});

// Current view is set here. Used in reactive template "content" to load the
// corresponding view
Session.set('current_view', 'board_list');
Session.set('current_view_options', {});

Session.set('modal_form_errors', '');
Session.set('show_new_card_form', '')

/**
 * Sesion var used to be able to get a new event call in a template everytime
 * the window is resized
 */
Session.set("window_resize", new Date());

// Always be subscribed to the todos for the selected list
Meteor.subscribe("boards");

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

Handlebars.registerHelper('gravatar_url', function(size, user_id) {
    var email = userEmail(Meteor.users.findOne({_id: user_id}));
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


/**
 * Useful function to sort a Meteor.cursor list of items by a list of ids
 */
function sort_by_ids(list_cursor, list_ids) {
    var lists = list_cursor.map(function (l) { return l;});
    var ordered_list = [];

    for(var i in list_ids) {
        for(var j in lists) {
            if (lists[j]._id == list_ids[i]) {
                ordered_list.push(lists[j]);
                break;
            }
        }
    }
    return ordered_list;
}

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

//### board_members_list

Template.board_members_list.admins = function() {
    var opts = Session.get('current_view_options');
    var board = Boards.findOne({uri: opts.board_uri});
    if (!board) {
        return [];
    }

    var users = Meteor.users.find({_id: {$in: board.admins}});
    return users;
}

Template.board_members_list.admins = function() {
    var opts = Session.get('current_view_options');
    var board = Boards.findOne({uri: opts.board_uri});
    if (!board) {
        return [];
    }

    var users = Meteor.users.find({_id: {$in: board.members}});
    return users;
}

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
    var lists = Lists.find({board_uri: opts.board_uri}).map(function (l) { return l;});
    return sort_by_ids(lists, list_ids);
}

//### board_window_resize

// this will resize the board when the window is resized
Template.board_window_resize.window_resize = function() {
    Session.get("window_resize"); // using it so that it's reacting to that

    // function depends also on number of boards
    var opts = Session.get('current_view_options');
    var board = Boards.findOne({uri: opts.board_uri});

    // if the dom has not yet been created, then stop
    if ($(".board").size() == 0 || !board) {
        Meteor.setTimeout(function() {
            Template.board_window_resize.window_resize();
        }, 1000);
        return;
    }
    console.log("rendered");

    var size = ($(window).height() - $(".board").offset().top - 30);
    $(".board").css("height",  size + "px");

    $(".cardoverflow").css("height", "auto");

    if ($(window).width() <= 480) {
        $("#list-list").css("width", "auto");
    } else {
        $(".right-menu").css("height", $(".board").height());
        var width = board.lists.length * 223;
        $("#list-list").css("width", width + "px");

        var cardSize = (size - 80);
        $(".cardoverflow").each(function() {
            if ($(this).height() > cardSize)
                $(this).css("height",  cardSize + "px");
        });

        // activity size
        var activity_height = size - $("footer").height() - $(".top-menu").height();
        $(".activity").css("height", activity_height + "px");
    }
}

Template.board_window_resize.rendered = function () {
    Template.board_window_resize.window_resize();
};


//### board_view_list

Template.board_view_list.card_list = function() {
    var cards = Cards.find({_id: {$in: this.cards}});
    return sort_by_ids(cards, this.cards);
}

Template.board_view_list.show_new_card_form = function() {
    return Session.get('show_new_card_form') == this._id;
}


Template.board_view_list.events({
    /**
     * When user clicks to add a new card
     */
    'click .newcard' : function (event, template) {
        Session.set('show_new_card_form', this._id);
    }
});


//### new_card_form

Template.new_card_form.events({
    /**
     * When user clicks to add a new card
     */
    'click .close' : function (event, template) {
        Session.set('show_new_card_form', '');
    },

    'click .save' : function (event, template) {
        var list_id = this._id;
        var name = template.find("#add_task_description").value;
        Meteor.call('createCard', list_id, name);
        Session.set('show_new_card_form', '');
    }
});

//### edit_board_name


Template.edit_board_name.events({
    /**
     * When user click to update board name, send the petition to the server,
     * create the board, and show it
     */
    'click .save' : function (event, template) {
        var name = template.find("#boardname").value;
        if (name.length > 5 && name.length < 140) {
            Session.set("modal_form_errors", "");


            var opts = Session.get('current_view_options');
            var board = Boards.findOne({uri: opts.board_uri});
            Boards.update({uri: opts.board_uri}, {$set: {'name': name}});

            // hide it
            $("#edit-board-close").click();
        } else {
            Session.set("modal_form_errors", "Name needs to be 5-140 characters long");
        }
    },
});

Template.edit_board_name.boardname = Template.board_view.boardname;

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
