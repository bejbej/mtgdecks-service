module.exports = function (mongoose) {
    var cardGroup = mongoose.Schema({
        _id: false,
        name: {
            type: String,
            required: true,
            default: ""
        },
        cardBlob: mongoose.Schema.Types.Mixed
    });

    var deck = mongoose.Schema({
        name: {
            type: String,
            required: true,
            default: ""
        },
        cardGroups: [cardGroup]
    }, { versionKey: false });

    deck.set("toJSON", {
        transform: function (document, ret) {
            ret.id = ret._id;
            delete ret._id;
        }
    });

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

    var set = mongoose.Schema({
        name: String,
    }, { versionKey: false });

    return {
        Deck: mongoose.model("decks", deck),
        Card: mongoose.model("cards", card),
        Set: mongoose.model("sets", set)
    };
};