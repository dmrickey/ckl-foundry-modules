import { MODULE_NAME } from "../consts.mjs";
import { hasAnyBFlag, getDocDFlagsStartsWith, KeyedDFlagHelper } from "../util/flag-helpers.mjs";
import { registerItemHint } from "../util/item-hints.mjs";
import { localize } from "../util/localize.mjs";
import { signed } from "../util/to-signed-string.mjs";

const selfKeen = 'keen-self';
const keenAll = 'keen-all';
const keenId = ({ id }) => `keen_${id}`;

const critOffsetSelf = 'crit-offset-self';
const critOffsetAll = 'crit-offset-all';
const critOffsetId = ({ id }) => `crit-offset_${id}`;

// register keen
registerItemHint((/** @type {{ create: (arg0: any, arg1: any[], arg2: {}) => any; }} */ hintcls, /** @type {any} */ _actor, /** @type {{ system: { flags: { boolean: any; }; }; }} */ item, /** @type {any} */ _data) => {
    const bFlags = Object.entries(item.system?.flags?.boolean ?? {})
        .filter(([_, value]) => !!value)
        .map(([key, _]) => key);

    const keens = bFlags.filter(flag => flag.startsWith('keen'));

    const hints = [];
    if (!keens.length) return;

    hints.push(hintcls.create(localize('keen'), [], {}));

    return hints;
});

// register crit mod - making assumptions that there aren't really positives and negatives on the same "buff"
registerItemHint((
    /** @type {{ create: (arg0: any, arg1: any[], arg2: {}) => any; }} */ hintcls,
    /** @type {ActorPF} */actor,
    /** @type {BaseDocument} */ item,
    /** @type {any} */ _data,
) => {
    const dFlags = getDocDFlagsStartsWith(item, 'crit-offset');
    const values = Object.values(dFlags)
        .flatMap((x) => x)
        .map((x) => RollPF.safeTotal(x, actor.getRollData()));

    if (!values.length) {
        return;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);

    const mod = Math.abs(min) > Math.abs(max)
        ? min
        : max;

    if (mod === 0) {
        return;
    }

    const label = localize('crit-offset', { mod: signed(mod) });
    const hint = hintcls.create(label, [], {});

    return hint;
});

/**
 * @param {() => any} wrapped
 */
function critRange(wrapped) {
    const current = wrapped();
    const item = this.action.item;

    const isBroken = !!item.system.broken;
    if (isBroken) {
        return 20;
    }

    const hasKeen = item.hasItemBooleanFlag(selfKeen)
        || hasAnyBFlag(item.parentActor, keenAll, keenId(item), keenId(this.action));

    let range = hasKeen
        ? current * 2 - 21
        : current;

    const flags = [critOffsetAll, critOffsetId(item), critOffsetId(this.action)];
    const mod = new KeyedDFlagHelper(item.parentActor.itemFlags.dictionary, ...flags)
        .sumAll(this.rollData)
        + new KeyedDFlagHelper(item.system.flags.dictionary, critOffsetSelf)
            .sumAll(this.rollData);

    range += mod;
    range = Math.clamped(range, 2, 20);
    return range;
}

Hooks.once('setup', () => {
    libWrapper.register(MODULE_NAME, 'pf1.actionUse.ChatAttack.prototype.critRange', critRange, libWrapper.WRAPPER);
});
