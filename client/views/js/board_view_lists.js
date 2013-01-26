
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
    },

    /**
     * When user clicks to remove a list
     */
    'click .close.remove_list': function (event, template) {
        Meteor.call('removeList', {list_id: this._id}, function (error) {
            if (error) {
                alert("error removing the list, sorry");
            }
        });
    }
});

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
