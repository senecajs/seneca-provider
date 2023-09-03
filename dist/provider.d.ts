import { AsyncLocalStorage } from 'node:async_hooks';
import FetchRetry from 'fetch-retry';
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
    entity: {
        pin: Record<string, string | number | boolean | null>;
    };
};
type ProviderUtilityOptions = {
    name: string;
    url: string;
    fetch?: any;
    debug: boolean;
    retry: boolean | {
        config: any;
    };
    config?: Record<string, any>;
};
declare function provider(this: any, options: ProviderOptions): {
    exports: {
        entityBuilder: (seneca: any, spec: any) => void;
        makeUtils: (utilopts: ProviderUtilityOptions) => {
            entityBuilder: (seneca: any, spec: any) => void;
            makeUrl: (suffix: string, q: any) => string;
            getJSON: (url: string, config?: any) => Promise<any>;
            postJSON: (url: string, config?: any) => Promise<any>;
            deleteJSON: (url: string, config?: any) => Promise<any>;
            fetcher: any;
            origFetcher: any;
            fetchRetry: typeof FetchRetry;
            asyncLocalStorage: AsyncLocalStorage<unknown>;
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
declare function makePattern(cmdspec: any, entspec: any, spec: any, options: any): any;
declare function makeAction(cmdspec: any, entspec: any, spec: any): (this: any, msg: any, meta: any) => Promise<any>;
declare function makeEntize(seneca: any, canon: any): (data: any, spec?: ModifySpec) => any;
declare function applyModifySpec(data: any, spec?: ModifySpec): any;
export default provider;
