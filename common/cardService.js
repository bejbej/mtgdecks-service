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
            let trimmedResponse = response.substring(response.indexOf("`") + 1, response.lastIndexOf("`"));
            return csv.parse(trimmedResponse, "\t").reduce((dictionary, card) => {
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

        let promises = cardNames.map(cardName => {
            const escapedCardName = querystring.escape(cardName.replace(/[\/\\^$*+?.()|[\]{}]/g, "\\$&"));
            let uri = `${cardPriceUri}?order=usd&q=name:/^${escapedCardName}($| \\/\\/)\//`;
            return http.get(uri)
                .then(response => {
                    const cards = JSON.parse(response).data;
                    cards[0].name = cardName;
                    return cards;
                })
                .catch(response => {
                    let log = new db.Log();
                    log.date = new Date();
                    log.message = `${response.options.method} ${response.options.uri} - ${response.statusCode} - ${response.message}`;
                    log.save();
                    return [];
                });
        });

        let apiCards = Array.flatten(await Promise.all(promises));
        let now = new Date();
        let cards = apiCards
            .map(apiCard => {
                let prices = [apiCard.prices.usd, apiCard.prices.usd_foil, apiCard.prices.usd_etched].filter(x => x);
                return {
                    name: apiCard.name.toLowerCase(),
                    usd: prices.length > 0 ? Math.min(...prices) : null,
                    updatedOn: now
                };
            })
            .filter(card => card.usd != null);
        
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
        let knownCards = []//await getKnownCards(validCardNames);
        let unknownCardNames = except(validCardNames, (knownCards.map(card => card.name)));
        let unknownCards = await getUnknownCards(unknownCardNames);
        let cards = knownCards.concat(unknownCards);
        cards.forEach(card => card.updatedOn = undefined);
        return cards;
    }

    return {
        get: get
    }
}();