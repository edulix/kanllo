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
}