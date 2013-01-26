//### home_anonymous view

Template.home_anonymous.events({
    'click .sign_in_activate': function(event) {
        event.preventDefault();
        $("#login-sign-in-link")[0].click();
    }
});