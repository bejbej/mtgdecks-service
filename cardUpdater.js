module.exports = function cardUpdater(schema) {
    var http = require("request-promise");
    var q = require("q");

    getExternalSets = () => {
        var deferred = q.defer();
        http.get("https://api.deckbrew.com/mtg/sets").then(response => {
            deferred.resolve(JSON.parse(response));
        }, deferred.reject);
        return deferred.promise;
    }

    getLocalSets = () => {
        var deferred = q.defer();
        schema.Set.find({}).then(documents => {
            deferred.resolve(documents.map(document => document._doc.name));
        }, deferred.reject);
        return deferred.promise;
    }

    mapCard = (card) => {
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

    mapSet = (set) => {
        return {
            name: set.id
        }
    }

    addSet = (set) => {
        var deferred = q.defer();
        http.get(set.cards_url).then(response => {
            var promises = JSON.parse(response).filter(card => card.types).map(mapCard).map(saveCard);
            q.all(promises).then(() => {
                saveSet(set).then(deferred.resolve, deferred.reject);
            }, deferred.reject);
        }, deferred.reject)
        return deferred.promise;
    }

    saveSet = (set) => {
        var deferred = q.defer();
        var set = mapSet(set);
        schema.Set.findOneAndUpdate({ name: set.name }, set, { upsert: true }).then(deferred.resolve, deferred.reject);
        return deferred.promise;
    }

    saveCard = (card) => {
        var deferred = q.defer();
        schema.Card.findOneAndUpdate({ name: card.name }, card, { upsert: true }).then(deferred.resolve, deferred.reject);
        return deferred.promise;
    }

    this.exec = () => {
        var deferred = q.defer();

        q.all([getExternalSets(), getLocalSets()]).then(function (data) {
            var externalSets = data[0];
            var localSets = data[1];

            if (externalSets.length === localSets.length) {
                deferred.resolve("Card database is up to date");
                return;
            }

            var promises = externalSets.filter(set => {
                return !localSets.some(localSet => localSet === set.id)
            }).map(addSet);

            q.all(promises).then(deferred.resolve, deferred.reject);
        }, deferred.reject);

        return deferred.promise;
    }
}
