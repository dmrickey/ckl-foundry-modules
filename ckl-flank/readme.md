Mod for pf1 that automatically determines flank bonuses for allies based on token placement and which token is being targeted.

## todo
- better handling for when the tokens-that-want-flanking are larger than medium (i.e. larger than one square)
- fill in pack flanking method for hunters (or other random characters that somehow get it)
- start filling in method that determines if a token _can't_ be flanked
- refactor adjacency to something like this
  - ```
    const t1Range = token1.bounds.pad(pixel5Feet/2);
    const t2Range = token2.bounds;
    return t1Range.intersects(t2Range);
    ```
- refactor sharing to be something like this
  - ```
    const t1Range = token1.bounds.pad(-2);
    const t2Range = token2.bounds;
    return t1Range.intersects(t2Range);
    ```