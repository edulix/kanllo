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
                return false; // not the owner or admin
            }

            var allowed = ["name", "description", "lists", "members", "admins"];
            if (_.difference(fields, allowed).length) {
                console.log("forbidden field");
                return false; // tried to write to forbidden field
            }

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
    /**
     * Creates a new board, with three empty lists by default:
     * Todo, Doing & Done
     */
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

        var uri = randomId();

        var todoListId = Lists.insert({
            board_uri: uri,
            name: "Todo",
            cards: [],
            created_at: created_at,
            creator: this.userId
        });

        var doingListId = Lists.insert({
            board_uri: uri,
            name: "Doing",
            cards: [],
            created_at: created_at,
            creator: this.userId
        });

        var doneListId = Lists.insert({
            board_uri: uri,
            name: "Done",
            cards: [],
            created_at: created_at,
            creator: this.userId
        });

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

    /**
     * Creates a list in a board if you have board edit perms
     */
    createList: function (options) {
        var board = Boards.findOne(
            {$and: [
                {uri: options.board_uri},
                {members: this.userId},
            ]});

        if (!board) {
            throw new Meteor.Error(400, "Invalid permissions");
        }


        if (!(typeof options.name === "string" && options.name.length > 0
            && options.name.length < 140))
        {
            throw new Meteor.Error(400, "Invalid name");
        }

        var listId = Lists.insert({
            board_uri: options.board_uri,
            name: options.name,
            cards: [],
            created_at: new Date().getTime(),
            creator: this.userId,
        });

        Boards.update({uri: options.board_uri}, {$addToSet: {lists: listId}});
        return listId;
    },

    /**
     * Removes a list and all its cards, if you have edit permissions in the
     * board
     */
    removeList: function (options) {
        var list = Lists.findOne({_id: options.list_id});

        if (!list) {
            throw new Meteor.Error(404, "List not found");
        }

        var board = Boards.findOne(
            {$and: [
                {uri: list.board_uri},
                {members: this.userId},
            ]});

        if (!board) {
            throw new Meteor.Error(400, "Invalid permissions");
        }

        Cards.remove({board_uri: board.uri, _id: {$in: list.cards}});
        Lists.remove({_id: list._id});
        Boards.update({uri: board.uri}, {$pull: {lists: options.list_id}});
    },

    /**
     * Creates a card in a board list, if you have board edit perms
     */
    createCard: function (list_id, name) {
        var board = Boards.findOne(
            {$and: [
                {lists: list_id},
                {members: this.userId},
            ]});

        if (!board) {
            throw new Meteor.Error(400, "Invalid permissions");
        }


        if (!(typeof name === "string" && name.length > 0 && name.length < 140)) {
            throw new Meteor.Error(400, "Invalid name");
        }

        var uri = randomId();

        var cardId = Cards.insert({
            board_uri: board.uri,
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

    /**
     * Find users by username
     */
    findUsers: function(options) {
        return Meteor.users.find({'username': {$regex: ".*" + options.q + ".*"}}).map(
            function(item) {
                var email = item.email;
                if (!item.email) {
                    email = "nobody@example.com";
                }
                return {username: item.username, email: email, id: item._id};
            }
        );
    },
});

/**
 * Lists
 *
 * Format:
 * {
 *     board_uri: String,
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
        // use removeList instead
        return false;
    }
});

/**
 * Cards
 *
 * Format:
 * {
 *     board_uri: String,
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

/**
 * Dedications
 * 
 * Format:
 * {
 *     created_at: Number,
 *     creator: String,
 *     starts_at: Number,
 *     duration: Number,     // in seconds. if -1, means it's running (should only be one per user)
 *     card_uri: String,
 *     board_uri: String,
 * }
 */

Dedications = new Meteor.Collection("dedications");

Dedications.allow({
    insert: function (userId, dedication) {
        /* use createDedication instead */
        return true;
    },
    update: function (userId, dedications, fields, modifier) {
        return true;
    },
    remove: function (userId, dedications) {
        return true;
    },
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
