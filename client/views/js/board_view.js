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

Template.board_view.can_edit = function() {
    var opts = Session.get('current_view_options');
    var board = Boards.findOne({uri: opts.board_uri, members: Meteor.userId()});
    return board;
}

Template.board_view.can_admin = function() {
    var opts = Session.get('current_view_options');
    var board = Boards.findOne({uri: opts.board_uri, admins: Meteor.userId()});
    return board;
}

Template.board_view.events({
    /**
     * Focus edit board input when modal dialog shown
     */
    'click .edit-board-link' : function (event, template) {
        Meteor.setTimeout(function () {
        $("#edit-board-modal input").select().focus();
        }, 300);
    },

    /**
     * Same for add list dialog
     */
    'click .add-list-link' : function (event, template) {
        Meteor.setTimeout(function () {
        $("#board-new-list-modal input").focus();
        }, 300);
    },

    /**
     * Same for add member dialog
     */
    'click .add-member-link' : function (event, template) {
        Meteor.setTimeout(function () {
        $("#board-add-member-modal input").focus();
        }, 300);
    },
});


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
        $(".activity").css("height", "auto");
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

Template.board_members_list.members = function() {
    var opts = Session.get('current_view_options');
    var board = Boards.findOne({uri: opts.board_uri});
    if (!board) {
        return [];
    }

    var users = Meteor.users.find({_id: {$in: board.members, $not: {$in: board.admins}}});
    return users;
}


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

    /**
     * On <Enter>, save the board
     */
    'keypress #boardname' : function (event, template) {
        if (event.which == 13) {
            event.preventDefault();
            template.find('.save').click();
        }
    }
});

Template.edit_board_name.boardname = Template.board_view.boardname;


//### board_add_member

/**
 * Sets jquery-autocomplete
 */
Template.board_add_member.rendered =  function() {
        $( "#sharedname" ).autocomplete({
            source: function(req, response) {
                Meteor.call('findUsers', {
                    q: req.term,
                }, function (error, data) {
                    if (!error) {
                        console.log(data);
                        response(data);
                    } else {
                        alert("error searching, sorry");
                    }
                });
            },
            select: function( event, ui ) {
                var img = $('<span class="gravatar-mini"></span>');
                var gravatar_url = $.gravatar_url(ui.item.email, {'size': 30});
                img.html('<img src="' + gravatar_url + '" />');

                var div = $("#member-modal").find(".user");
                div.find(".gravatar").html(img.html());
                div.find(".name").html(ui.item.username);
            }
        }).data("autocomplete")._renderItem = function( ul, item ) {
            var img = $('<span class="gravatar-mini"></span>');
            var gravatar_url = $.gravatar_url(item.email, {'size': 30});
            img.html('<img src="' + gravatar_url + '" />');
            return $( "<li>" )
                .data( "item.autocomplete", item )
                .append('<a>' + img.html() + item.username + "</a>" )
                .appendTo(ul);
        };
}

Template.board_add_member.events({
    /**
     * When user click to update board name, send the petition to the server,
     * create the board, and show it
     */
    'click .save' : function (event, template) {
        var username = template.find("#sharedname").value;

        Meteor.call('findUsers', {q: username}, function (error, data) {
            if (error || data.length < 1 || !data[0].id) {
                Session.set("modal_form_errors", "Invalid username");
                return;
            }

            var userid = data[0].id;

            var opts = Session.get('current_view_options');
            var board = Boards.findOne({uri: opts.board_uri, members: userid});
            if (board) {
                Session.set("modal_form_errors", "already a member");
                return;
            }
            Boards.update({uri: opts.board_uri}, {$addToSet: {members: userid}});
            Session.set("modal_form_errors", "");

            template.find("#sharedname").value = "";

            // hide it
            $("#add-member-close").click();
        });
    },

    /**
     * On <Enter>, save the board
     */
    'keypress #sharedname' : function (event, template) {
        if (event.which == 13) {
            event.preventDefault();
            template.find('.save').click();
        }
    }
});


//### board_member_item

Template.board_member_item.can_remove_membership = function() {
    var opts = Session.get('current_view_options');

    return Template.board_view.can_admin() &&
        Boards.findOne({uri: opts.board_uri, admins: {$ne: this._id},
            owner: {$ne: this._id}, members: this._id});
}

Template.board_member_item.can_remove_from_admin = function() {
    var opts = Session.get('current_view_options');

    return Template.board_view.can_admin() &&
        Boards.findOne({uri: opts.board_uri, admins: this._id,
            owner: Meteor.userId(), members: this._id});
}

Template.board_member_item.can_make_admin = function() {
    var opts = Session.get('current_view_options');

    return Template.board_view.can_admin() &&
        Boards.findOne({uri: opts.board_uri, admins: {$ne: this._id},
            members: this._id});
}


Template.board_member_item.events({
    'click .remove-membership-action': function(event, template) {
        var opts = Session.get('current_view_options');
        Boards.update({uri: opts.board_uri}, {$pull: {'members': this._id}});
        event.preventDefault();
    },

    'click .remover-from-admin-action': function(event, template) {
        var opts = Session.get('current_view_options');
        Boards.update({uri: opts.board_uri}, {$pull: {'admins': this._id}});
        event.preventDefault();
    },

    'click .make-admin-action': function(event, template) {
        var opts = Session.get('current_view_options');
        Boards.update({uri: opts.board_uri}, {$addToSet: {'admins': this._id}});
        event.preventDefault();
    },
});
