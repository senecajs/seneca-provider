"use strict";
/* Copyright © 2021 Richard Rodger, MIT License. */
Object.defineProperty(exports, "__esModule", { value: true });
function provider(options) {
    const seneca = this;
    const providerMap = {};
    Object.entries(options.provider).forEach(([name, p]) => {
        p.name = name;
        providerMap[name] = p;
    });
    seneca
        .fix('sys:provider')
        .message('get:key', get_key)
        .message('list:provider', list_provider);
    async function get_key(msg) {
        let p = providerMap[msg.provider];
        if (null == p) {
            return { ok: false, why: 'unknown-provider' };
        }
        let kd = p.keys[msg.key];
        if (null == kd) {
            return { ok: false, why: 'unknown-key' };
        }
        return { ok: true, value: kd.value };
    }
    async function list_provider(_msg) {
        return {
            ok: true, list: Object.values(providerMap).map((p) => ({
                name: p.name,
                keys: Object.keys(p.keys)
            }))
        };
    }
}
// Default options.
const defaults = {
    provider: {}
};
Object.assign(provider, { defaults });
exports.default = provider;
if ('undefined' !== typeof (module)) {
    module.exports = provider;
}
//# sourceMappingURL=provider.js.map