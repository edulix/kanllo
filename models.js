// Utils

function randomId()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for(var i = 0; i < 15; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}


/**
 * Boards
 *
 * Format:
 * {
 *     name: String,
 *     description: String,
 *     lists: [String, ...],
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


Boards.allow({
  insert: function (userId, party) {
    return false; // no cowboy inserts -- use createBoard method
  },
  update: function (userId, boards, fields, modifier) {
//     return _.all(boards, function (board) {
//       if (userId !== board.owner && board.admins.indexOf(userId) == -1) {
//         return false; // not the owner
//       }
// 
//       var allowed = ["name", "description", "lists_id", ];
//       if (_.difference(fields, allowed).length)
//         return false; // tried to write to forbidden field
// 
//       // A good improvement would be to validate the type of the new
//       // value of the field (and if a string, the length.) In the
//       // future Meteor will have a schema system to makes that easier.
      return true;
//     });
  },
  remove: function (userId, boards) {
    return ! _.any(boards, function (board) {
      // deny if not the owner
      return board.owner !== userId;
    });
  }
});


Meteor.methods({
    createBoard: function (options)
    {
        options = options || {};
        if (!typeof options.name === "string" && options.name.length > 3 &&
            options.name.length < 140)
        {
            throw new Meteor.Error(400, "Invalid name");
        }

        var created_at = new Date().getTime();

        var todoListId = Lists.insert({
            name: "Todo",
            cards: [],
            created_at: created_at,
            creator: this.userId
        });

        var doingListId = Lists.insert({
            name: "Doing",
            cards: [],
            created_at: created_at,
            creator: this.userId
        });

        var doneListId = Lists.insert({
            name: "Done",
            cards: [],
            created_at: created_at,
            creator: this.userId
        });

        var uri = randomId();

        var boardId = Boards.insert({
            name: options.name,
            description: "",
            lists: [todoListId, doingListId, doneListId],
            owner: this.userId,
            admins: [this.userId],
            members: [this.userId],
            invited: [],
            created_at: created_at,
            creator: this.userId,
            is_public: true,
            labels: [],
            uri: uri
        });
        return uri;
    }
});

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
 *     name: String,
 *     description: String,
 *     members: [String, ...],
 *     subscribed: [String, ..],
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
