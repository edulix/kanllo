
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
    return Lists.find({board_uri: board_uri});
});

Meteor.publish('cards', function (board_uri) {
    return Cards.find({board_uri: board_uri});
});

Meteor.publish('users', function () {
    return Meteor.users.find();
});


// Accounts configuration

Accounts.emailTemplates.siteName = "Kanllo";
Accounts.emailTemplates.from = Accounts.emailTemplates.siteName + " admins <admins@kanllo.wadobo.com>";
Accounts.emailTemplates.enrollAccount.subject = function (user) {
    return "Welcome to " + Accounts.emailTemplates.siteName + ", " + user.profile.name;
};