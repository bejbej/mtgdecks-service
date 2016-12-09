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

    return {
        Deck: mongoose.model("decks", deck)
    };
};