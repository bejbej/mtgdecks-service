module.exports = function (mongoose) {
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
            owners: [String]
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

    return {
        Deck: deck(),
        Card: card(),
        Set: set(),
        User: user()
    };
};