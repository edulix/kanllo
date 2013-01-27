///### Helpers

// Generic helpers
Handlebars.registerHelper('equal', function(a, b) {
    return a == b;
});


Handlebars.registerHelper('my_gravatar_url', function(size) {
    var email = userEmail(Meteor.user());
    if(email) {
        return $.gravatar_url(email, {'size': size});
    }

    return $.gravatar_url("nobody@example.com", {'size': size});
});

Handlebars.registerHelper('gravatar_url', function(size, user_id) {
    var email = userEmail(Meteor.users.findOne({_id: user_id}));
    if(email) {
        return $.gravatar_url(email, {'size': size});
    }

    return $.gravatar_url("nobody@example.com", {'size': size});
});

Handlebars.registerHelper('my_username', function(size) {
    return Meteor.user().username;
});


Handlebars.registerHelper('my_boards', function() {
    return Boards.find({members: Meteor.userId()});
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
