import { truthiness } from "./truthiness.mjs";

const getItemDFlags = (doc, key) => {
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

const getFlagsFromDFlags = (dFlags, ...flags) => {
    const results = [];
    for (const item in (dFlags || {})) {
        if (flags.every((flag) => dFlags[item].hasOwnProperty(flag))) {
            const obj = {};
            flags.forEach((flag) => obj[flag] = dFlags[item][flag]);
            results.push(obj);
        }
    }
    return results;
}

// item.system.flags.boolean - note to self for later
const countBFlag = (items, flag) => (items || []).filter((item) => item.isActive && item.hasItemBooleanFlag(flag)).length;

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


export { countBFlag, countBFlags, getFlagsFromDFlags, getItemDFlags }
