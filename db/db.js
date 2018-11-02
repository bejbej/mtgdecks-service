module.exports = function () {
    const mongoose = require("mongoose");

    let card = () => {
        var card = mongoose.Schema({
            name: String,
            usd: String,
            updatedOn: Date,
        }, { versionKey: false });

        card.set("toJSON", {
            transform: function (document, ret) {
                delete ret._id;
            }
        });

        return mongoose.model("cardPrices", card);
    }

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
            notes: String,
            tags: [String]
        }, { versionKey: false });

        deck.set("toJSON", {
            transform: function (document, ret) {
                ret.id = ret._id;
                delete ret._id;
            }
        });

        return mongoose.model("decks", deck);
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

    var log = () => {
        var log = mongoose.Schema({
            date: Date,
            message: String
        }, { versionKey: false });

        return mongoose.model("log", log);
    }

    let init = async (connectionString) => {
        mongoose.Promise = Promise;
        await mongoose.connect(connectionString, { useMongoClient: true });
    }

    return {
        Card: card(),
        Deck: deck(),
        Log: log(),
        User: user(),
        init: init
    };
}();