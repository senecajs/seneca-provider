declare function gateway(this: any, options: any): {
    exports: {
        handler: (json: any, ctx: any) => Promise<unknown>;
        parseJSON: (data: any) => any;
    };
};
declare namespace gateway {
    var defaults: {
        custom: {
            safe: boolean;
        };
        fixed: {};
        debug: boolean;
    };
}
export default gateway;
