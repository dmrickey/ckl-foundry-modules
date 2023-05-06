
const key = 'itemHints';

export const setItemHint = async (item, oldValue, newValue) => {
    const current = item.getItemDictionaryFlag(key);
    if (!current) {
        // if no current item hint
        await item.setItemDictionaryFlag(key, newValue);
    }
    else if (!current.includes(oldValue)) {
        // append new value to existing
        await item.setItemDictionaryFlag(key, `${current};${newValue}`);
    }
    else {
        // replace old value with new value
        await item.setItemDictionaryFlag(key, current.replace(oldValue, newValue));
    }
}
