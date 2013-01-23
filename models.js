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
  insert: function (userId, board) {
    return false; // no cowboy inserts -- use createBoard method
  },
  update: function (userId, boards, fields, modifier) {
    return _.all(boards, function (board) {
      if (userId !== board.owner && board.admins.indexOf(userId) == -1) {
        return false; // not the owner
      }

      var allowed = ["name", "description", "lists_id", ];
      if (_.difference(fields, allowed).length)
        return false; // tried to write to forbidden field

      // TODO: A good improvement would be to validate the type of the new
      // value of the field (and if a string, the length.) In the
      // future Meteor will have a schema system to makes that easier.
      return true;
    });
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
        if (!this.userId) {
            throw new Meteor.Error(400, "Anonymous user");
        }
        options = options || {};
        if (!(typeof options.name === "string" && options.name.length > 3 &&
            options.name.length < 140))
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
    },

    createList: function (board_id, name) {
        var board = Boards.findOne(
            {$and: [
                {_id: board_id},
                {members: this.userId},
            ]});

        if (!board) {
            throw new Meteor.Error(400, "Invalid permissions");
        }


        if (!(typeof name === "string" && name.length > 3 && name.length < 140)) {
            throw new Meteor.Error(400, "Invalid name");
        }

        var listId = Lists.insert({
            name: name,
            cards: [],
            created_at: new Date().getTime(),
            creator: this.userId,
        });

        Boards.update({_id: board_id}, {$addToSet: {lists: listId}});
        return listId;
    },

    createCard: function (list_id, name) {
        var board = Boards.findOne(
            {$and: [
                {lists: list_id},
                {members: this.userId},
            ]});

        if (!board) {
            throw new Meteor.Error(400, "Invalid permissions");
        }


        if (!(typeof name === "string" && name.length > 3 && name.length < 140)) {
            throw new Meteor.Error(400, "Invalid name");
        }

        var uri = randomId();

        var cardId = Cards.insert({
            name: name,
            description: "",
            members: [],
            subscribed: [],
            created_at: new Date().getTime(),
            creator: this.userId,
            uri: uri,
        });

        Lists.update({_id: list_id}, {$addToSet: {cards: cardId}});
        return uri;
    },
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

Lists.allow({
    insert: function (userId, list) {
        /* use createList instead */
        return false;
    },
    update: function (userId, lists, fields, modifier) {
        return _.all(lists, function (list) {

            // For now, all members can edit lists
            var board = Boards.findOne(
                {$and: [
                    {lists: list._id},
                    {members: userId},
                ]});

            // no permissions in this board or board for this list doesn't exist
            if (!board) {
                return false;
            }

            // check all cards exist
            for (var card_id in board.cards) {
                if (Cards.find({_id: card_id}).count() != 1) {
                    return false;
                }
            }

            // check name is valid
            if (!(typeof list.name === "string" && list.name.length > 3
                && list.name.length < 140)) {
                return false;
            }

            var allowed = ["name", "cards", ];
            if (_.difference(fields, allowed).length) {
                return false; // tried to write to forbidden field
            }

            // TODO: A good improvement would be to validate the type of the new
            // value of the field (and if a string, the length.) In the
            // future Meteor will have a schema system to makes that easier.
                return true;
        });
    },
    remove: function (userId, lists) {
        return ! _.any(lists, function (list) {
            var board = Boards.findOne({lists: list._id});
            return board && board.owner == userId;
        });
    }
});

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

Cards.allow({
    insert: function (userId, card) {
        /* use createCard instead */
        return false;
    },
    update: function (userId, cards, fields, modifier) {
        return _.all(cards, function (card) {

            // Find the list containing this card
            var list = Lists.findOne({cards: card._id});
            if (!list) {
                return false;
            }

            // For now, all members can edit cards
            var board = Boards.findOne(
                {$and: [
                    {lists: list._id},
                    {members: userId},
                ]});

            if (!board) {
                return false;
            }

            // check name is valid
            if (!(typeof list.name === "string" && list.name.length > 3
                && list.name.length < 140)) {
                return false;
            }


            // check all members exist and are valid
            for (var member_id in card.members) {
                if (board.members.indexOf(member_id) == -1) {
                    return false;
                }
            }
            // same for suscribed members
            for (var member_id in card.members) {
                if (board.members.indexOf(member_id) == -1) {
                    return false;
                }
            }

            var allowed = ["name", "description", "members", "suscribed", ];
            if (_.difference(fields, allowed).length) {
                return false; // tried to write to forbidden field
            }

            // TODO: A good improvement would be to validate the type of the new
            // value of the field (and if a string, the length.) In the
            // future Meteor will have a schema system to makes that easier.
                return true;
        });
    },
    remove: function (userId, cards) {
        return ! _.any(cards, function (card) {
            // Find the list containing this card
            var list = Lists.findOne({cards: card._id});
            if (!list) {
                return false;
            }

            var board = Boards.findOne({lists: list._id});
            return board && board.owner == userId;
        });
    }
});


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
