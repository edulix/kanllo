
// Publish collections

Meteor.publish('boards', function () {
  return Boards.find();
});

Meteor.publish('lists', function () {
  return Lists.find();
});

Meteor.publish('cards', function () {
  return Cards.find();
});

// Accounts configuration

Accounts.emailTemplates.siteName = "Kanllo";
Accounts.emailTemplates.from = "Kanllo admins <admins@kanllo.wadobo.com>";
Accounts.emailTemplates.enrollAccount.subject = function (user) {
    return "Welcome to Kanllo, " + user.profile.name;
};