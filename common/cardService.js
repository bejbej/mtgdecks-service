module.exports = function () {
    const Cache = require("./cache.js");
    const cache = new Cache(process.env.cardDefinitionExpirationMs || 0);
    const csv = require("./csv.js");
    const db = require("../db/db.js");
    const http = require("request-promise");
    const querystring = require("querystring");

    const cardPriceExpirationMs = process.env.cardPriceExpirationMs || 0;
    const cardPriceUri = process.env.cardPriceUri || "";
    const cardDefinitionUri = process.env.cardDefinitionUri || "";

    let getValidCardNames = async (cardNames) => {
        let cards = await cache.get("cards", async () => {
            let response = await http.get(cardDefinitionUri);
            response = response.substring(response.indexOf("`") + 1, response.lastIndexOf("`"));
            return csv.parse(response, "\t").reduce((dictionary, card) => {
                dictionary[card.name.toLowerCase()] = true;
                return dictionary;
            }, {});
        });
        return cardNames.filter(cardName => cards[cardName]);
    }

    let getKnownCards = async (cardNames) => {
        let cuttoffDate = new Date() - cardPriceExpirationMs;
        let cards = await db.Card.find({ name: { $in: cardNames }, updatedOn: { $gte: cuttoffDate } });
        return cards;
    }

    let getUnknownCards = async (cardNames) => {
        if (cardNames.length === 0) {
            return [];
        }

        let escapedCardNames = cardNames.map(cardName => querystring.escape(cardName.replace(/[\/\\^$*+?.()|[\]{}]/g, '\\$&')));
        let promises = escapedCardNames.map(cardName => {
            let query = "?order=usd&q=name:/^" + cardName + "($| \\/\\/)\/";
            return http.get(cardPriceUri + query)
                .then(response => {
                    return JSON.parse(response).data;
                })
                .catch(response => {
                    console.log(`${response.statusCode} - ${response.message}`);
                    return [];
                });
        });

        let apiCards = Array.flatten(await Promise.all(promises));
        let now = new Date();

        cards = cardNames.reduce((array, cardName) => {
            let apiCard = apiCards.find(x => x.name.toLowerCase().startsWith(cardName.toLowerCase()));

            if (apiCard) {
                array.push({
                    name: cardName,
                    usd: apiCard ? apiCard.usd : undefined,
                    updatedOn: now
                });
            }

            return array;
        }, []);

        await Promise.all(cards.map(save));

        return cards;
    }

    let save = (card) => {
        return db.Card.findOneAndUpdate({ name: card.name }, card, { upsert: true });
    }

    let except = (array1, array2) => {
        return array1.filter(element => array2.indexOf(element) === -1);
    }

    let get = async (cardNames) => {
        cardNames = cardNames.map(cardName => cardName.toLowerCase());
        let validCardNames = await getValidCardNames(cardNames);
        let knownCards = await getKnownCards(validCardNames);
        let unknownCardNames = except(validCardNames, (knownCards.map(card => card.name)));
        let unknownCards = await getUnknownCards(unknownCardNames);
        let cards = knownCards.concat(unknownCards);
        cards.forEach(card => card.updatedOn = undefined);

        if (validCardNames.length !== cards.length) {
            let failedCardNames = Array.except(validCardNames, cards.map(card => card.name))
            console.log("Can't determine the price for all cards.");
            console.log("All Card Names: " + validCardNames);
            console.log("Failed Card Names: " + failedCardNames);
        }

        return cards;
    }

    return {
        get: get
    }
}();