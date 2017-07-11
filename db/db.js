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
        User: user(),
        init: init
    };
}();