module.exports = function () {
    const mongoose = require("mongoose");

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

    let init = async (connectionString) => {
        mongoose.Promise = Promise;
        await mongoose.connect(connectionString, { useMongoClient: true });
    }

    return {
        Deck: deck(),
        User: user(),
        init: init
    };
}();