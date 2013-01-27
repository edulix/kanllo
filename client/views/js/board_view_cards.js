//### new_card_form

Template.new_card_form.rendered = function () {
    this.find("#add_task_description").focus();
}

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
        template.find("#add_task_description").value="";
    },

    /**
     * Saves on <Enter> pressed, closes the form on <Esc>
     */
    'keyup' : function (event, template) {
        console.log(event.which);
        if (event.which == 27) { // <Esc>
            Session.set('show_new_card_form', '');
        } else if (event.which == 13) { // <Enter>
            template.find('.save').click();
        }
    },
});

//### board_card_item

// drag & drop

function makeTaskDraggable(el) {
    $(el).draggable({
        containment: ".board",
        cursor: "move",
        start: dragTaskStart,
        stop: dragTaskStop,
        helper: dragTaskHelper
    });

    $(el).droppable({
        over: dropTaskOver,
    });
}

// task drag functions
function dragTaskHelper(e) {
    var helper = $(this).clone();
    helper.addClass("dragging");
    helper.width($(this).width());
    return helper;
}

function dragTaskStart(e, ui) {
    $(this).addClass("dragging-freeze");
}

function dragTaskStop(e, ui) {
    $(this).removeClass("dragging-freeze");

    var card_id = this.id.substr("board_card_".length);

    // Change model order attr and update
    var list = $(this).parent().parent().parent();
    var cards = list.find(".task:not(.dragging)").map(function(i, card) {
        return card.id.substr("board_card_".length);
    });

    var list_id = list[0].id.substr("board_list_".length);
    var opts = Session.get('current_view_options');

    // Find previous list in which the card was in
    var old_list = Lists.findOne({board_uri: opts.board_uri, cards: card_id});

    // Update the card listing
    Lists.update({_id: list_id}, {$set: {cards: cards.toArray()}});

    // Remove the card from previous list if appropiate
    if (old_list._id != list_id) {
        Lists.update({_id: old_list._id}, {$pull: {cards: card_id}});
    }
}

function dropTaskOver(e, ui) {
    var o1 = ui.draggable;
    var o2 = $(this);
    if (o1.hasClass("task")) {
        if (o1.attr("id") == o1.parent().children().last().attr("id")) {
            o1.insertAfter(o2);
        } else {
            o1.insertBefore(o2);
        }
    }
}

Template.board_card_item.rendered = function () {
    makeTaskDraggable(this.firstNode);

    // All the following code logic launches show card dialog when user enters
    // directly to a card url
    var card_uri = Session.get('show_card_form');

    if(!card_uri.startsWith("loading_")) {
        return;
    }
    card_uri = card_uri.substr("loading_".length);

    if (card_uri == this.data.uri)
    {
        Session.set('show_card_form', card_uri);
        $("#show-task-view")[0].click();
    }
}

Template.board_card_item.card_link = function () {
    var opts = Session.get('current_view_options');
    return "/board/" + opts.board_uri + "/card/" + this.uri;
}

Template.board_card_item.events({
    'click .task': function(event, template) {
        Session.set('show_card_form', this.uri);
        $('#show-task-view')[0].click();
    },
});

//### card_view

function getCard() {
    var card_uri = Session.get('show_card_form');
    return Cards.findOne({uri: card_uri});
}

Template.card_view.cardname = function() {
    console.log("Template.card_view.cardname, " + Session.get('show_card_form'));
    var card = getCard();
    console.log(card);
    if (!card) {
        return;
    }
    return card.name.trim();
}

function getListForCard() {
    var card = getCard();
    if (!card) {
        return;
    }
    return Lists.findOne({cards: card._id});
}

Template.card_view.listname = function() {
    var list = getListForCard();
    if (!list) {
        return;
    }
    return list.name;
}

Template.card_view.can_edit = function() {
    var opts = Session.get('current_view_options');
    return Boards.findOne({uri: opts.board_uri, members: Meteor.userId()});
}

Template.card_view.rendered = function() {
    // TODO: it's not being called
    $('#task-view-modal').on('hidden', function () {
        var opts = Session.get('current_view_options');
        Router.navigate('board/' + opts.board_uri);
    });
}

Template.card_view.edit_cardname = function() {
    return Template.card_view.can_edit() && Session.equals("show_edit_cardname_form", 'true');
}

Template.card_view.events({
    /**
     * Remove card
     */
    'click .remove-action': function(event, template) {
        var card = getCard();
        var list = getListForCard();
        if (!card || !list) {
            $('.close-task-view')[0].click();
            return;
        }

        Lists.update({_id: list._id}, {$pull: {cards: card._id}});
        Cards.remove({_id: card._id});

        $('.close-task-view')[0].click();
        Session.set('show_card_form', '');
    },

    /**
     * Show board again
     */
    'click .close-task-view' : function() {
        var opts = Session.get('current_view_options');
        Router.navigate('board/' + opts.board_uri);
    },

    /**
     * Start to edit card name
     */
    'click .taskname' : function (event, template) {
        Session.set('show_edit_cardname_form', 'true');
        Meteor.setTimeout(function () {
        $("#task-view-modal textarea").select().focus();
        }, 300);
    },

    /**
     * save card name
     */
    'click .save' : function(event) {
        var card = getCard();
        var cardname = $("#card_name_edit").val().trim();
        Cards.update({_id: card._id}, {$set: {name: cardname}});
        Session.set('show_edit_cardname_form', '');
        event.preventDefault();
    },

    /**
     * On <enter> save card name, on esc stop editting
     */
    'keypress #card_name_edit' : function (event, template) {
        if (event.which == 13) { // <enter>
            event.preventDefault();
            template.find('.save').click();
        } else if (event.which == 27) { // <esc> stops editting
            event.stopPropagation();
            template.find('.close-card-edit').click();
        }
    },

    /**
     * Stop editting
     */
    'click .close-card-edit' : function(event) {
        Session.set('show_edit_cardname_form', '');
        event.preventDefault();
    }
});