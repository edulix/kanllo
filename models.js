/**
 * Boards
 *
 * Format:
 * {
 *     name: String,
 *     description: String,
 *     owner_id: String,
 *     admins_id: [String, ...],
 *     members_id: [String, ...],
 *     lists_id: [String, ...],
 *     created_at: Number,
 *     creator_id: String,
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
 *     cards_id: [String, ...],
 *     created_at: Number,
 *     creator_id: String,
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
 *     members_id: [String, ...],
 *     subscribed_ids: [String, ..],
 *     created_at: Number,
 *     creator_id: String,
 *     uri: String,
 * }
 */
Cards = new Meteor.Collection("cards");
