
//### board_view_list

Template.board_view_list.card_list = function() {
    var cards = Cards.find({_id: {$in: this.cards}});
    return sort_by_ids(cards, this.cards);
}

Template.board_view_list.show_new_card_form = function() {
    return Session.equals('show_new_card_form', this._id);
}

Template.board_view_list.can_edit = function() {
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

            // reset form
            template.find("#listname").value = '';

            // hide it
            $("#new-list-close").click();
        } else {
            Session.set("modal_form_errors", "Name needs to be 5-140 characters long");
        }
    },

    /**
     * On <Enter>, create the list
     */
    'keypress #listname' : function (event, template) {
        if (event.which == 13) {
            event.preventDefault();
            template.find('.save').click();
        }
    }
});

Template.board_new_list.boardname = Template.board_view.boardname;


//### board_list_name

Template.board_list_name.edit_name = function() {
    return Session.equals('show_edit_list_name', this._id);
}

/**
 * Select form text input when rerendered
 */
Template.board_list_name.rendered = function () {
    if (Session.equals('show_edit_list_name', this.data._id)) {
        this.find("input.listname").select();
        this.find("input.listname").focus();
    }
}

Template.board_list_name.can_edit = Template.board_view_list.can_edit;

Template.board_list_name.events({
    /**
     * Saves the new list name
     */
    'click .save' : function (event, template) {
        var name = template.find("input.listname").value;
        Lists.update({_id: this._id}, {$set: {name: name}});
        event.preventDefault();
        event.stopPropagation();
        Session.set('show_edit_list_name', '');
    },

    /**
     * Closes the list name save form
     */
    'click .close' : function (event, template) {
        event.stopPropagation();
        Session.set('show_edit_list_name', '');
    },

    /**
     * Show the list name edit form when user clicks in the list name
     */
    'click .name' : function (event, template) {
        Session.set('show_edit_list_name', this._id);
    },

    /**
     * Saves on <Enter> pressed, closes the form on <Esc>
     */
    'keyup .listname' : function (event, template) {
        if (event.which == 27) { // <Esc>
            Session.set('show_edit_list_name', '');
        }
    },
});