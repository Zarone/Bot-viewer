var utils = require('./utils.js');

exports.getItem = function (item) {
    let parsed = {
        defindex: getDefindex(item),
        quality: getQuality(item),
        craftable: isCraftable(item),
        killstreak: isKillstreak(item),
        australium: isAustralium(item),
    };

    var effect = getEffect(item);

    if (effect) {
        parsed.effect = effect;
    }

    if (isSkin(item)) {
        parsed.quality = 'Decorated Weapon';
    }

    if (item.assetid) {
        parsed.id = item.assetid;
    }

    return parsed;
}

function isKey(item) {
    return item.market_hash_name === 'Mann Co. Supply Crate Key' && isUnique(item);
}

function isUnique(item) {
    return getQuality(item) == 'Unique';
}

function getQuality(item) {
    return getTag('Quality', item);
}

function isCraftable(item) {
    return hasDescription('( Not Usable in Crafting )', item);
}

function getEffect(item) {
    if (isUnique(item)) {
        return null;
    }
    const descriptions = item.descriptions;
    if (!descriptions) {
        return null;
    }

    for (let i = 0; i < descriptions.length; i += 1) {
        let value = descriptions[i].value;
        if (value[0] === "\u2605") { // Unusual star in inv
            return value.substr(18); // Remove "★ Unusual Effect: "
        }
    }

    return null;
}

function particleEffect(item) {
    const descriptions = item.descriptions;
    if (!descriptions) {
        return null;
    }

    for (let i = 0; i < descriptions.length; i++) {
        let value = descriptions[i].value;
        if (value[0] === '\u2605') {
            return value.substr(18);
        }
    }

    return null;
}

function isKillstreak(item) {
    if (hasDescriptionStartingWith('Killstreaker: ', item)) {
        return 3;
    } else if (hasDescriptionStartingWith('Sheen:', item)) {
        return 2;
    } else if (hasDescriptionStartingWith('Killstreaks Active', item)) {
        return 1;
    }
    return 0;
}

function isAustralium(item) {
    if (getTag('Quality', item) != 'Strange') {
        return false;
    }

    return item.market_hash_name.indexOf('Australium ') != -1;
}

function hasDescriptionStartingWith(desc, item) {
    const descriptions = item.descriptions;
    if (!descriptions) {
        return null;
    }

    return descriptions.some(function (d) {
        return d.value.startsWith(desc);
    });
}

function hasDescription(desc, item) {
    const descriptions = item.descriptions;
    if (!descriptions) {
        return null;
    }

    return !descriptions.some(function (d) {
        return d.value == desc;
    });
}

function getTag(category, item) {
    const tags = item.tags;
    if (!tags) {
        return null;
    }

    for (let i = 0; i < tags.length; i++) {
        // This will be used for both inventory items from the steam-tradeoffer-manager, and items from offers.
        if (tags[i].category === category || tags[i].category_name === category) {
            return tags[i].localized_tag_name || tags[i].name;
        }
    }

    return null;
}

function getAction(action, item) {
    const actions = item.actions;
    if (!actions) {
        return null;
    }

    for (let i = 0; i < actions.length; i++) {
        if (actions[i].name == action) {
            return actions[i].link;
        }
    }

    return null;
}

function getDefindex(item) {
    let link = getAction('Item Wiki Page...', item);

    var query = utils.stringToObject(link.substring(link.indexOf('?') + 1));
    return parseInt(query.id);
}

function isSkin(item) {
    const wears = ["Factory New", "Minimal Wear", "Field-Tested", "Well-Worn", "Battle Scarred"];

    for (let i = 0; i < wears.length; i++) {
        const wear = wears[i];
        if (item.market_name.indexOf(wear) !== -1) {
            return true;
        }
    }

    return false;
}