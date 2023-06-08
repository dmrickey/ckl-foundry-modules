import { truthiness } from "./truthiness.mjs";

// todo update to use actor.itemFlags.dictionary or item.system.flags.dictionary
/**
 *
 * @param {BaseDocument} doc - Item or Actor
 * @param {string} key
 * @returns
 */
const getDocDFlags = (doc, key) => {
    // if doc is an actor
    if (doc.items) {
        const flags = doc.items
            .map(i => i.isActive && i.getItemDictionaryFlag(key))
            .filter(truthiness);
        return flags;
    }

    // else read the flag off the item
    return [doc.getItemDictionaryFlag(key)].filter(truthiness);
}

/**
 * @param {BaseDocument} doc
 * @param {string} keyStart
 * @returns {{[key: string]: (number | string)[]}}
 */
const getDocDFlagsStartsWith = (doc, keyStart) => {
    if (doc instanceof pf1.documents.actor.ActorPF) {
        const found = {};
        Object.entries(doc.itemFlags.dictionary).forEach(([itemTag, flags]) => {
            Object.entries(flags).forEach(([flag, value]) => {
                if (flag.startsWith(keyStart)) {
                    found[flag] ||= [];
                    found[flag].push(value);
                }
            });
        });

        return found;
    }

    if (doc instanceof pf1.documents.item.ItemPF) {
        const found = {};
        Object.entries(doc.getItemDictionaryFlags()).forEach(([flag, value]) => {
            if (flag.startsWith(keyStart)) {
                found[flag] = [value];
            }
        });
        return found;
    }

    return {};
}

/**
 * @param {DictionaryFlags} dFlags
 * @param {...string} flags
 * @returns {Object} - { foundKey1: [values from different items], foundKey2: [...], ...}
 */
const getFlagsFromDFlags = (dFlags, ...flags) => {
    const found = {};
    for (const item in (dFlags || {})) {
        flags.forEach((flag) => {
            if (dFlags[item].hasOwnProperty(flag)) {
                found[flag] ||= [];
                found[flag].push(dFlags[item][flag]);
            }
        });
    }
    return found;
}

// item.system.flags.boolean - note to self for later
// todo swap this to actor.itemFlags.boolean[flag].sources.length
const countBFlag = (items, flag) => (items || []).filter((item) => item.isActive && item.hasItemBooleanFlag(flag)).length;

// todo swap like individual method
const countBFlags = (items, ...flags) => {
    const count = Object.fromEntries(flags.map((flag) => [flag, 0]));

    (items || []).forEach((item) => {
        if (!item.isActive) return;

        flags.forEach((flag) => {
            if (item.hasItemBooleanFlag(flag)) {
                count[flag]++;
            }
        });
    });

    return count;
}

const hasAnyBFlag = (
    /** @type {{ itemFlags: { boolean: { [x: string]: string; }; }; }} */ actor,
     /** @type {string[]} */ ...flags
) => flags.some((flag) => !!actor?.itemFlags?.boolean?.[flag]);

export {
    countBFlag,
    countBFlags,
    getDocDFlagsStartsWith,
    getFlagsFromDFlags,
    getDocDFlags,
    hasAnyBFlag,
}

export class KeyedDFlagHelper {
    /** @type {{[key: string]: Flag[]}} */
    #byFlag = {};

    #sumByFlag = null;

    /** @type {{[key: string]: DictionaryFlag}} - Keyed by item tag, and contains each flag/value */
    #byItem = {};

    /** @type {string[]} */
    #flags = [];

    // * @returns {Object} - { foundKey1: [values from different items], foundKey2: [...], ...}
    /**
     * @param {DictionaryFlags} dFlags
     * @param {...string} flags
     */
    constructor(dFlags, ...flags) {
        this.#flags = flags;
        for (const item in (dFlags || {})) {
            flags.forEach((flag) => {
                this.#byFlag[flag] ||= [];
                if (dFlags[item].hasOwnProperty(flag)) {
                    this.#byFlag[flag].push(dFlags[item][flag]);

                    this.#byItem[item] ||= {};
                    this.#byItem[item][flag] = dFlags[item][flag];
                }
            });
        }
    }

    /**
     *
     * @returns {DictionaryFlags}
     */
    getDFlagsWithAllFlagsByItem() {
        /** @type {DictionaryFlags} */
        const result = {};
        Object.entries(this.#byItem).forEach(([key, value]) => {
            if (Object.keys(value).length === this.#flags.length) {
                result[key] = value;
            }
        });
        return result;
    }

    /**
     * @param {RollData} rollData
     */
    #calculateSums(rollData) {
        const sums = {};
        Object.entries(this.#byFlag).forEach(([key, value]) => {
            sums[key] = value
                .map((x) => RollPF.safeTotal(x, rollData))
                .reduce((acc, current) => acc + current, 0);
        });
        return sums;
    }
    /**
     * Gets the keyed sums for each flag
     * @param {RollData} rollData
     * @returns {{[key: string]: number}} Totals, keyed by flag
     */
    sumEntries(rollData = {}) {
        return this.#sumByFlag ??= this.#calculateSums(rollData);
    }

    /**
     * Gets the sum of all values for the given flag.
     * @param {string} flag - The flag to fetch the total for
     * @param {RollData} rollData
     * @returns {number} - The total for the given flag
     */
    sumOfFlag(flag, rollData = {}) {
        return this.sumEntries(rollData)[flag];
    }

    sumAll(rollData = {}) {
        return Object.values(this.sumEntries(rollData)).reduce((sum, current) => sum + current, 0);
    }
}
