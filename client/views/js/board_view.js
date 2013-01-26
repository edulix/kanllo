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

Template.board_view_list.can_add_card = function() {
    var opts = Session.get('current_view_options');
    var board = Boards.findOne({uri: opts.board_uri, members: Meteor.userId()});
    return board;
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


//### board_new_list

Template.board_new_list.events({
    /**
     * When user click to create the list, send the petition to the server,
     * create the list, and show it
     */
    'click .save' : function (event, template) {
        var name = template.find("#listname").value;
        if (name.length > 0 && name.length < 140) {
            Session.set("modal_form_errors", "");
            var opts = Session.get('current_view_options');

            Meteor.call('createList', {
                    board_uri: opts.board_uri,
                    name: name,
                }, function (error) {
                    if (error) {
                        alert("error creating the list, sorry");
                    }
                });

            // hide it
            $("#new-list-close").click();
        } else {
            Session.set("modal_form_errors", "Name needs to be 5-140 characters long");
        }
    },
});

Template.board_new_list.boardname = Template.board_view.boardname;