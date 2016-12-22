module.exports = function cardUpdater(schema) {
    var http = require("request-promise");
    var q = require("q");

    var getExternalSets = () => {
        var deferred = q.defer();
        http.get("https://api.deckbrew.com/mtg/sets").then(response => {
            deferred.resolve(JSON.parse(response));
        }, deferred.reject);
        return deferred.promise;
    }

    var getLocalSets = () => {
        var deferred = q.defer();
        schema.Set.find({}).then(documents => {
            deferred.resolve(documents.map(document => document._doc.name));
        }, deferred.reject);
        return deferred.promise;
    }

    var getCards = (url) => {
        var mapCard = (card) => {
            var types = ["creature", "artifact", "enchantment", "planeswalker", "land", "instant", "sorcery"];

            return {
                name: card.name,
                cmc: card.cmc,
                color: card.colors === undefined ? "colorless" : card.colors.length > 1 ? "multicolored" : card.colors[0],
                primaryType: types.filter(type => {
                    return card.types.some(cardType => cardType === type);
                })[0],
                multiverseId: card.editions.map(edition => {
                    return edition.multiverse_id;
                }).sort((a, b) => {
                    return a - b;
                }).pop()
            }
        }

        var getCardsRecursively = (url, page, cards, deferred) => {
            http.get(url + "&page=" + page).then(response => {
                var apiCards = JSON.parse(response)
                cards = cards.concat(apiCards.filter(card => card.types).map(mapCard));
                if (apiCards.length >= 100) {
                    getCardsRecursively(url, page + 1, cards, deferred);
                } else {
                    deferred.resolve(cards);
                }
            }, deferred.reject)
        }

        var deferred = q.defer();
        getCardsRecursively(url, 0, [], deferred);
        return deferred.promise;
    }

    var addSet = (set) => {
        var deferred = q.defer();
        getCards(set.cards_url).then(cards => {
            q.all(cards.map(saveCard)).then(() => {
                saveSet(set).then(deferred.resolve, deferred.reject);
            }, deferred.reject);
        }, deferred.reject);
        return deferred.promise;
    }

    var saveSet = (set) => {
        var mapSet = (set) => {
            return {
                name: set.id
            }
        }
        var deferred = q.defer();
        var set = mapSet(set);
        schema.Set.findOneAndUpdate({ name: set.name }, set, { upsert: true }).then(deferred.resolve, deferred.reject);
        return deferred.promise;
    }

    var saveCard = (card) => {
        var deferred = q.defer();
        schema.Card.findOneAndUpdate({ name: card.name }, card, { upsert: true }).then(deferred.resolve, deferred.reject);
        return deferred.promise;
    }

    this.exec = (limit) => {
        var deferred = q.defer();

        q.all([getExternalSets(), getLocalSets()]).then(results => {
            var externalSets = results[0];
            var localSets = results[1];

            if (externalSets.length === localSets.length) {
                deferred.resolve(0);
                return;
            }

            var promises = externalSets.filter(set => {
                return !localSets.some(localSet => localSet === set.id)
            }).slice(0, limit).map(addSet);

            q.all(promises).then(() => {
                deferred.resolve(promises.length)
            }, deferred.reject);
        }, deferred.reject);

        return deferred.promise;
    }
}
