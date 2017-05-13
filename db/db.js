module.exports = function () {
    var mongoose = require("mongoose");
    var q = require("q");

    var deck = () => {
        var cardGroup = mongoose.Schema({
            _id: false,
            cardBlob: mongoose.Schema.Types.Mixed,
            name: {
                type: String,
                required: true,
                default: ""
            }
        });

        var deck = mongoose.Schema({
            cardGroups: [cardGroup],
            name: {
                type: String,
                required: true,
                default: ""
            },
            owners: [String],
            notes: String
        }, { versionKey: false });

        deck.set("toJSON", {
            transform: function (document, ret) {
                ret.id = ret._id;
                delete ret._id;
            }
        });

        return mongoose.model("decks", deck);
    }

    var card = () => {
        var card = mongoose.Schema({
            name: String,
            cmc: Number,
            primaryType: String,
            color: String,
            multiverseId: Number,
            price: String
        }, { versionKey: false });

        card.set("toJSON", {
            transform: function (document, ret) {
                delete ret._id;
                delete ret.price;
            }
        });

        return mongoose.model("cards", card);
    }

    var set = () => {
        var set = mongoose.Schema({
            name: String,
        }, { versionKey: false });

        set.set("toJSON", {
            transform: (document, ret) => {
                delete ret._id;
            }
        });

        return mongoose.model("sets", set);
    }

    var user = () => {
        var user = mongoose.Schema({
            name: String,
            google: String
        }, { versionKey: false });

        user.set("toJSON", {
            transform: function (document, ret) {
                ret.id = ret._id;
                delete ret._id;
            }
        });

        return mongoose.model("users", user);
    }

    var init = (connectionString) => {
        mongoose.connect(connectionString);
        var db = mongoose.connection;

        var deferred = q.defer();
        db.on("error", deferred.reject);
        db.on("error", console.error.bind(console, "connection error:"));
        db.once("open", deferred.resolve);
        return deferred.promise;
    }

    return {
        Deck: deck(),
        Card: card(),
        Set: set(),
        User: user(),
        init: init
    };
}();