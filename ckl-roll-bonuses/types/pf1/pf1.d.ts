export { }

declare global {
    abstract class BaseDocument {
        items: BaseDocument[];
    }

    class D20RollPF {
        /**
         *
         * @param formula - The string that should resolve to a number
         * @param {RollData} rollData - The roll data used for resolving any variables in the formula
         */
        static safeTotal(formula: string | number, rollData: Object): number;
    }

    class ActorPF extends Document {
        /**
         * Gets the actor's roll data.
         * @param {{refresh - pass true to force the roll data to recalculate }}
         */
        getRollData(): RollData;
        // getRollData({ refresh: boolean = false }): RollData; // todo ?

        itemFlags: Flags;
    }

    interface DictionaryFlag {
        [key: string]: Flag
    }

    interface DictionaryFlags {
        [key: string]: DictionaryFlag,
    }

    type Flag = string | number;

    interface Flags {
        dictionary: DictionaryFlags,

        /**
         * The tags for Items that are active with a boolean flag
         */
        boolean: string[],
    }

    interface ItemAction { }

    interface ItemPF extends Document {
        /**
         * Gets value for the given dictionary flag key
         * @param key
         */
        getItemDictionaryFlag(key: string): string | number;

        /**
         * Gets the Item's dictionary flags.
         */
        getItemDictionaryFlags(): DictionaryFlags;
    }

    /**
     * Roll Data used for resolving formulas
     */
    interface RollData {
        [key: string]: any,
    }

    interface pf1 {
        components: {
            ItemAction: { new(): ItemAction }
        };
        config: {
            abilities,
            savingThrows,
            skills,
            spellSchools
        };
        dice: {
            D20RollPF: { new(): D20RollPF }
        };
        documents: {
            actor: {
                ActorPF: { new(): ActorPF }
            },
            item: {
                ItemPF: { new(): ItemPF }
            }
        };
    }
}
