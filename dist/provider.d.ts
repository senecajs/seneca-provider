type Provider = {
    name: string;
    keys: Record<string, KeyDesc>;
};
type KeyDesc = {
    value: string;
};
type ModifySpec = {
    field?: Record<string, {
        src: string;
    }>;
};
type ProviderOptions = {
    provider: Record<string, Provider>;
};
type ProviderUtilityOptions = {
    url: string;
    fetch?: any;
    debug: boolean;
};
declare function provider(this: any, options: ProviderOptions): {
    exports: {
        entityBuilder: (seneca: any, spec: any) => void;
        makeUtils: (utilopts: ProviderUtilityOptions, config?: any) => {
            makeUrl: (suffix: string, q: any) => string;
            makeConfig: (seneca: any) => void;
            getJSON: (url: string) => Promise<any>;
            postJSON: (url: string) => Promise<any>;
            deleteJSON: (url: string) => Promise<any>;
        };
    };
};
declare namespace provider {
    var intern: {
        makePattern: typeof makePattern;
        makeAction: typeof makeAction;
        makeEntize: typeof makeEntize;
        applyModifySpec: typeof applyModifySpec;
    };
}
declare function makePattern(cmdspec: any, entspec: any, spec: any): {
    role: string;
    cmd: any;
    zone: string;
    base: any;
    name: any;
};
declare function makeAction(cmdspec: any, entspec: any, spec: any): (this: any, msg: any, meta: any) => Promise<any>;
declare function makeEntize(seneca: any, canon: any): (data: any, spec?: ModifySpec) => any;
declare function applyModifySpec(data: any, spec?: ModifySpec): any;
export default provider;
