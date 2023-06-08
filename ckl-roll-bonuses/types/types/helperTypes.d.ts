type DocumentConstructor = Pick<typeof Document, keyof typeof Document> &
    (new (...args: any[]) => Document<any, any>);
