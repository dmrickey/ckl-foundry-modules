export { }
declare global {
    namespace Handlebars {
        function TemplateDelegate(
            templateData: { [key: string]: any },
            options: {
                allowProtoMethodsByDefault?: boolean,
                allowProtoPropertiesByDefault?: boolean,
            }
        ): string;
    }

    class EmbeddedCollection<T> implements Omit<Array<T>, "length"> {
        /**
         * Same as array.length
         */
        size: number;
        get(id: string): T;
    }
}
