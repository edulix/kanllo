
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

Meteor.publish('lists', function () {
    return Lists.find();
});

Meteor.publish('cards', function () {
    return Cards.find();
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