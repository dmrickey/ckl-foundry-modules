import { COMPENDIUM_ID, MODULE_ID } from "./CONSTS.mjs";

export const flankId = "g3ijMEUDDC5aCBJx";
export const outflankId = "O2kChp2l1YEb8poT";
export const menacingId = "7XL5eaPni2gclCrY";
export const flankMenacingAndOutflankId = "5ilpPsUueWFrpNZR";

const allBuffIds = [flankId, outflankId, menacingId, flankMenacingAndOutflankId];

const _coreId = (id) => `Compendium.${MODULE_ID}.${COMPENDIUM_ID}.${id}`;

const _getBuffDataAsync = async (buffId) => {
    const pack = game.packs.get(`${MODULE_ID}.${COMPENDIUM_ID}`);
    const item = await pack.getDocument(buffId);
    const buff = item.toObject();
    buff.flags ||= {};
    buff.flags.core ||= {};
    buff.flags.core.sourceId = _coreId(item._id);
    return buff;
}

const turnOnBuffAsync = async (token, buffId) => {
    const current = token.actor?.items.find((item) => item?.flags?.core?.sourceId === _coreId(buffId));
    if (!current) {
        const buff = await _getBuffDataAsync(buffId);
        buff.system.active = true;
        await token.actor.createEmbeddedDocuments("Item", [buff]);
    }
    else if (!current.system.active) {
        await current.update({ "system.active": true });
    }
}

const turnOffFlankAsync = async (token) => {
    const updates = [];
    for (const buffId of allBuffIds) {
        const item = token.actor?.items.find((item) => item?.flags?.core?.sourceId === _coreId(buffId));
        if (item?.system.active) {
            updates.push({ _id: item.id, "system.active": false });
        }
    }

    if (updates.length) {
        await token.actor.updateEmbeddedDocuments("Item", updates);
    }
}

export {
    turnOffFlankAsync,
    turnOnBuffAsync,
};
