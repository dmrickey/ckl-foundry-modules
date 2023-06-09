export type DocumentConstructor = Pick<typeof Document, keyof typeof Document> &
    (new (...args: any[]) => Document<any, any>);

export type ToObjectFalseType<T> = T extends {
    toObject: (source: false) => infer U;
}
    ? U
    : T;
