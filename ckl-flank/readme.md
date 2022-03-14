Mod for pf1 that automatically determines flank bonuses for allies based on token placement and which token is being targeted.

## todo
- better handling for when the tokens-that-want-flanking are larger than medium (i.e. larger than one square)
- fill in pack flanking method for hunters (or other random characters that somehow get it)
- start filling in method that determines if a token _can't_ be flanked
- update adjacency logic to use bounds instead of grid calculations
  - ```
    const token1Range = me.bounds.pad(/* grid size / 2 */);
    const token2Range = tokenDoc.object.bounds;
    return token1Range.intersects(token2Range);
    ```
  - make sure this works with small (and smaller tokens)
- update isSharingSquare logic to use bounds instead of grid calculations
  - ```
    const token1Range = me.bounds.pad(-5);
    const token2Range = tokenDoc.object.bounds;
    return token1Range.intersects(token2Range);
    ```
  - make sure this works with small (and smaller tokens)
