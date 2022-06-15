"use strict";
/* Copyright © 2021 Richard Rodger, MIT License. */
Object.defineProperty(exports, "__esModule", { value: true });
function provider(options) {
    const seneca = this;
    const injectVars = seneca.export('env/injectVars');
    const providerMap = {};
    Object.entries(options.provider).forEach(([name, p]) => {
        p.name = name;
        // Inject environment variables if defined by @seneca/env
        if (injectVars) {
            p = injectVars(p);
        }
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
    const cmdBuilder = {
        list: (seneca, cmdspec, entspec, spec) => {
            let pat = {
                role: 'entity',
                cmd: cmdspec.name,
                zone: 'provider',
                base: spec.provider.name,
                name: entspec.name
            };
            let canon = 'provider/' + spec.provider.name + '/' + entspec.name;
            let action = async function (msg, meta) {
                let entize = (data) => this.entity(canon).data$(data);
                return cmdspec.action.call(this, entize, msg, meta);
            };
            seneca.message(pat, action);
            Object.defineProperty(action, 'name', { value: 'list_' + entspec.name });
        }
    };
    const { Value } = seneca.valid;
    const validateSpec = seneca.valid({
        provider: {
            name: String
        },
        entity: Value({
            cmd: Value({
                action: Function
            }, {})
        }, {})
    });
    function entityBuilder(seneca, spec) {
        spec = validateSpec(spec);
        for (let entname in spec.entity) {
            let entspec = spec.entity[entname];
            entspec.name = entname;
            for (let cmdname in entspec.cmd) {
                let cmdspec = entspec.cmd[cmdname];
                cmdspec.name = cmdname;
                cmdBuilder[cmdname](seneca, cmdspec, entspec, spec);
            }
        }
    }
    return {
        exports: {
            entityBuilder
        }
    };
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