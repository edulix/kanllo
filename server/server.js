
// Publish collections

Meteor.publish('boards', function () {
    return Boards.find(
        {$or: [
            {is_public: true},
            {invited: this.userId},
            {owner: this.userId},
            {members: this.userId},
            {admins: this.userId},
        ]});
});

Meteor.publish('lists', function (board_uri) {
    var board = Boards.findOne({uri: board_uri});
    console.log("lists publish: board = ");
    console.log(board.lists);

    return Lists.find({_id: {$in: board.lists}});
});

Meteor.publish('cards', function (board_uri) {
    var board = Boards.findOne({uri: board_uri});
    var card_ids = [];
    var lists = Lists.find({_id: {$in: board.lists}}).forEach(function (l) {
        card_ids.concat(l.cards);
    });
    return Cards.find({_id: {$in: card_ids}});
});

// Accounts configuration

Accounts.emailTemplates.siteName = "Kanllo";
Accounts.emailTemplates.from = Accounts.emailTemplates.siteName + " admins <admins@kanllo.wadobo.com>";
Accounts.emailTemplates.enrollAccount.subject = function (user) {
    return "Welcome to " + Accounts.emailTemplates.siteName + ", " + user.profile.name;
};
// Accounts.ui.config({
//   passwordSignupFields: 'USERNAME_AND_EMAIL'
// });