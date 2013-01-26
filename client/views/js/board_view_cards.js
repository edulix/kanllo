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
