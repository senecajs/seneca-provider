declare type Provider = {
    name: string;
    keys: Record<string, KeyDesc>;
};
declare type KeyDesc = {
    value: string;
};
declare type ProviderOptions = {
    provider: Record<string, Provider>;
};
declare function provider(this: any, options: ProviderOptions): void;
export default provider;
