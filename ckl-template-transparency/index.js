const handleMeasuredTemplateUpdate = async (id) => {
    const template = canvas.templates.get(id);
    if (!template) return;

    // const grid = canvas.grid.getHighlightLayer(`Template.${id}`);
    console.log('template', template);

    const borderOpacity = template.document.getFlag('world', 'borderOpacity')
    if (borderOpacity !== undefined) {
        template.template.alpha = borderOpacity;
        template.refresh();
    }

    // const fillOpacity = template.document.getFlag('world', 'fillOpacity')
    // if (fillOpacity !== undefined) {
    //     grid.alpha = fillOpacity;
    // }
}

const addTransparencyToTemplate = async (template) => {
    if (!template) return;

    const borderOpacity = template.document.getFlag('world', 'borderOpacity')
    if (template.template.alpha !== borderOpacity) {
        template.template.alpha = borderOpacity;
    }
}

const addTransparencyToGrid = async (id) => {
    // todo
}

Hooks.once("init", async function () {
    function addTransparency(wrapped, ...args) {
        wrapped(...args);
        console.log('this', this);
        addTransparencyToTemplate(this);
    }

    // libWrapper.register("ckl-template-transparency", "MeasuredTemplate.prototype.draw", addTransparency, "WRAPPER");
    // libWrapper.register("ckl-template-transparency", "MeasuredTemplate.prototype.refresh", addTransparency, "WRAPPER");
    libWrapper.register("ckl-template-transparency", "MeasuredTemplate.prototype.render", addTransparency, "WRAPPER");
    // libWrapper.register("ckl-template-transparency", "MeasuredTemplate.prototype._onUpdate", addTransparency, "WRAPPER");
    // libWrapper.register("ckl-template-transparency", "MeasuredTemplate.prototype.highlightGrid", addTransparency, "WRAPPER");

    // Hooks.on('updateMeasuredTemplate', async (document, change, options, userId) => {
    //     await handleMeasuredTemplateUpdate(document.data._id);
    // });
});

const getMethods = (obj) => {
    let properties = new Set()
    let currentObj = obj
    do {
        Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
    } while ((currentObj = Object.getPrototypeOf(currentObj)))
    return [...properties.keys()].filter(item => typeof obj[item] === 'function').filter(x => !x.includes('proto')).filter(x => !x.includes('construct'));
}

var methods = [
    "highlightGrid",
    "draw",
    "_drawControlIcon",
    "_drawRulerText",
    "refresh",
    "_getCircleShape",
    "_getConeShape",
    "_getRectShape",
    "_getRayShape",
    "_drawRotationHandle",
    "_refreshRulerText",
    "rotate",
    "_canControl",
    "_canConfigure",
    "_canView",
    "_onUpdate",
    "_onDelete",
    "_onDragLeftStart",
    "_onDragLeftMove",
    "_onDragLeftDrop",
    "_onDragLeftCancel",
    "destroy",
    "addChild",
    "can",
    "_canHUD",
    "_canCreate",
    "_canDrag",
    "_canHover",
    "_canUpdate",
    "_canDelete",
    "clear",
    "clone",
    "_onCreate",
    "control",
    "_onControl",
    "release",
    "_onRelease",
    "_updateRotation",
    "_getShiftedPosition",
    "activateListeners",
    "_createInteractionManager",
    "_onHoverIn",
    "_onHoverOut",
    "_onClickLeft",
    "_onClickLeft2",
    "_onClickRight",
    "_onClickRight2",
    "update",
    "delete",
    "getFlag",
    "setFlag",
    "unsetFlag",
    "TMFXaddFilters",
    "TMFXupdateFilters",
    "TMFXaddUpdateFilters",
    "TMFXdeleteFilters",
    "TMFXhasFilterType",
    "TMFXhasFilterId",
    "_TMFXsetFlag",
    "_TMFXsetAnimeFlag",
    "_TMFXunsetFlag",
    "_TMFXunsetAnimeFlag",
    "_TMFXgetSprite",
    "_TMFXgetPlaceablePadding",
    "_TMFXcheckSprite",
    "_TMFXgetMaxFilterRank",
    "_TMFXsetRawFilters",
    "_TMFXunsetRawFilters",
    "_TMFXgetPlaceableType",
    "onChildrenChange",
    "addChildAt",
    "swapChildren",
    "getChildIndex",
    "setChildIndex",
    "getChildAt",
    "removeChild",
    "removeChildAt",
    "removeChildren",
    "sortChildren",
    "updateTransform",
    "calculateBounds",
    "getLocalBounds",
    "_calculateBounds",
    "render",
    "renderAdvanced",
    "_render",
    "containerUpdateTransform",
    "getChildByName",
    "_recursivePostUpdateTransform",
    "getBounds",
    "toGlobal",
    "toLocal",
    "setParent",
    "setTransform",
    "enableTempParent",
    "disableTempParent",
    "displayObjectUpdateTransform",
    "_renderCached",
    "_initCachedDisplayObject",
    "_renderCachedCanvas",
    "_initCachedDisplayObjectCanvas",
    "_calculateCachedBounds",
    "_getCachedLocalBounds",
    "_destroyCachedDisplayObject",
    "_cacheAsBitmapDestroy",
    "getGlobalPosition",
    "eventNames",
    "listeners",
    "listenerCount",
    "emit",
    "on",
    "once",
    "removeListener",
    "removeAllListeners",
    "off",
    "addListener",
    "__defineGetter__",
    "__defineSetter__",
    "hasOwnProperty",
    "__lookupGetter__",
    "__lookupSetter__",
    "isPrototypeOf",
    "propertyIsEnumerable",
    "toString",
    "valueOf",
    "toLocaleString",
    "extend"
];

