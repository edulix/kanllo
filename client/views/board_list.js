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
