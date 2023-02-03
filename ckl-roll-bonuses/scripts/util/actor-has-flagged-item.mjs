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
    return [doc.getItemDictionaryFlag(key)];
}

export { getItemDFlags }
