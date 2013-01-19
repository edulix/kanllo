/**
 * Boards
 *
 * Format:
 * {
 *     name: String,
 *     description: String,
 *     lists_id: [String, ...],
 *
 *     owner: String,
 *     admins: [String, ...],
 *     members: [String, ...],
 *     invited: [String, ...],
 *
 *     created_at: Number,
 *     creator: String,
 *
 *     is_public: Boolean,
 *     labels: [String, ...],
 *     uri: String,
 * }
 */
Boards = new Meteor.Collection("boards"); 


/**
 * Lists
 *
 * Format:
 * {
 *     name: String,
 *     cards: [String, ...],
 *     created_at: Number,
 *     creator: String,
 * }
 */
Lists = new Meteor.Collection("lists");

/**
 * Cards
 *
 * Format:
 * {
 *     title: String,
 *     description: String,
 *     members: [String, ...],
 *     subscribed_ids: [String, ..],
 *     created_at: Number,
 *     creator: String,
 *     uri: String,
 * }
 */
Cards = new Meteor.Collection("cards");









/// User email
var userEmail = function (user)
{
    if (user.emails && user.emails.length)
        return user.emails[0].address;

    if (user.services && user.services.facebook && user.services.facebook.email)
        return user.services.facebook.email;

    if (user.services && user.services.google && user.services.google.email)
        return user.services.google.email;

    return null;
};
