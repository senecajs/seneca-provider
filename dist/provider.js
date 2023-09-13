"use strict";
/* Copyright © 2022-2023 Richard Rodger, MIT License. */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: field manip utils:
// pick subsets, renames, ignore undefs, etc - see trello-provider for use case
const node_async_hooks_1 = require("node:async_hooks");
const fetch_retry_1 = __importDefault(require("fetch-retry"));
function provider(options) {
    const seneca = this;
    const { deep } = seneca.util;
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
        .message('get:keymap', get_keymap)
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
    async function get_keymap(msg) {
        let p = providerMap[msg.provider];
        if (null == p) {
            return { ok: false, why: 'unknown-provider' };
        }
        const keymap = seneca.util.deep(p.keys);
        return { ok: true, keymap: keymap };
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
        list: (seneca, cmdspec, entspec, spec, options) => {
            seneca.message(makePattern(cmdspec, entspec, spec, options), makeAction(cmdspec, entspec, spec));
        },
        load: (seneca, cmdspec, entspec, spec, options) => {
            seneca.message(makePattern(cmdspec, entspec, spec, options), makeAction(cmdspec, entspec, spec));
        },
        save: (seneca, cmdspec, entspec, spec, options) => {
            seneca.message(makePattern(cmdspec, entspec, spec, options), makeAction(cmdspec, entspec, spec));
        },
        remove: (seneca, cmdspec, entspec, spec, options) => {
            seneca.message(makePattern(cmdspec, entspec, spec, options), makeAction(cmdspec, entspec, spec));
        },
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
                cmdBuilder[cmdname](seneca, cmdspec, entspec, spec, options);
            }
        }
    }
    function makeUtils(utilopts) {
        // TODO: provider name for better errors
        utilopts.name = utilopts.name || '';
        const sharedConfig = utilopts.config || {};
        const asyncLocalStorage = new node_async_hooks_1.AsyncLocalStorage();
        let origFetcher = ('undefined' === typeof globalThis.fetch) ?
            (utilopts.fetch || require('node-fetch')) :
            globalThis.fetch;
        let fetcher = origFetcher;
        let retry = utilopts.retry;
        if (true === retry) {
            fetcher = (0, fetch_retry_1.default)(fetcher);
        }
        else if (null != retry && 'object' === typeof retry) {
            fetcher = (0, fetch_retry_1.default)(fetcher, retry.config || {});
        }
        function makeUrl(suffix, q) {
            let url = utilopts.url + suffix;
            if (q) {
                if ("string" === typeof q) {
                    url += "/" + encodeURIComponent(q);
                }
                else if ("object" === typeof q && 0 < Object.keys(q).length) {
                    url +=
                        "?" +
                            Object.entries(q)
                                .reduce((u, kv) => (u.append(kv[0], kv[1]), u), new URLSearchParams())
                                .toString();
                }
            }
            return url;
        }
        async function get(url, config) {
            const getConfig = deep(sharedConfig, config);
            const store = { config: getConfig };
            return asyncLocalStorage.run(store, async () => {
                const res = await fetcher(url, getConfig);
                // console.log('getJSON res', res.status)
                if (200 == res.status) {
                    const json = await res.json();
                    return json;
                }
                else {
                    const err = new Error('Provider ' + utilopts.name + ' ' + res.status);
                    err.provider = {
                        response: res,
                        options,
                        config,
                    };
                    throw err;
                }
            });
        }
        // NOTE: can also be used for PUT, set method:'PUT'
        async function post(url, config) {
            const postConfig = deep({
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                }
            }, config || {}, sharedConfig);
            postConfig.body =
                'string' === typeof config.body ? config.body :
                    JSON.stringify(config.body);
            const store = { config: postConfig };
            return asyncLocalStorage.run(store, async () => {
                const res = await fetcher(url, postConfig);
                if (200 <= res.status && res.status < 300) {
                    const json = await res.json();
                    return json;
                }
                else {
                    const err = new Error('Provider ' + utilopts.name + ' ' + res.status);
                    err.provider = {
                        response: res,
                        options,
                        config,
                    };
                    try {
                        err.provider.body = await res.json();
                    }
                    catch (e) {
                        err.provider.body = await res.text();
                    }
                    throw err;
                }
            });
        }
        async function deleteImpl(url, config) {
            const deleteConfig = deep({
                method: 'delete',
                headers: {
                    'Content-Type': 'application/json',
                }
            }, config, sharedConfig);
            const store = { config: deleteConfig };
            return asyncLocalStorage.run(store, async () => {
                const res = await fetcher(url, deleteConfig);
                if (200 <= res.status && res.status < 300) {
                    const json = await res.json();
                    return json;
                }
                else {
                    const err = new Error('Provider ' + utilopts.name + ' ' + res.status);
                    err.provider = {
                        response: res,
                        options,
                        config,
                    };
                    try {
                        err.provider.body = await res.json();
                    }
                    catch (e) {
                        err.provider.body = await res.text();
                    }
                    throw err;
                }
            });
        }
        return {
            entityBuilder,
            makeUrl,
            fetcher,
            origFetcher,
            fetchRetry: fetch_retry_1.default,
            asyncLocalStorage,
            get,
            post,
            delete: deleteImpl,
            getJSON: get,
            postJSON: post,
            deleteJSON: deleteImpl,
        };
    }
    return {
        exports: {
            entityBuilder,
            makeUtils
        }
    };
}
// For external testing
provider.intern = {
    makePattern,
    makeAction,
    makeEntize,
    applyModifySpec,
};
function makePattern(cmdspec, entspec, spec, options) {
    var _a;
    let pat = {
        cmd: cmdspec.name,
        zone: 'provider',
        base: spec.provider.name,
        name: entspec.name,
        ...(((_a = options === null || options === void 0 ? void 0 : options.entity) === null || _a === void 0 ? void 0 : _a.pin) || {})
    };
    return pat;
}
function makeAction(cmdspec, entspec, spec) {
    let canon = 'provider/' + spec.provider.name + '/' + entspec.name;
    let action = async function (msg, meta) {
        // let entize = (data: any) => this.entity(canon).data$(data)
        let entize = makeEntize(this, canon);
        let out = await cmdspec.action.call(this, entize, msg, meta);
        return out;
    };
    Object.defineProperty(action, 'name', { value: cmdspec.name + '_' + entspec.name });
    return action;
}
function makeEntize(seneca, canon) {
    // data -> Entity
    // Entity -> data
    return function entize(data, spec) {
        let isEnt = data &&
            'string' === typeof data.entity$ &&
            'function' === typeof data.data$;
        let out;
        if (isEnt) {
            let raw = data.data$(false);
            out = applyModifySpec(raw, spec);
        }
        else {
            data = applyModifySpec(data, spec);
            out = seneca.entity(canon).data$(data);
        }
        return out;
    };
}
function applyModifySpec(data, spec) {
    if (spec) {
        if (spec.field) {
            for (let field in spec.field) {
                let fieldSpec = spec.field[field];
                // TODO: add more operations
                // 'copy' is the default operation
                if (null != fieldSpec.src) {
                    data[field] = data[fieldSpec.src];
                }
            }
        }
    }
    return data;
}
// Default options.
const defaults = {
    provider: {},
    entity: {
        pin: { sys: 'entity' }
    }
};
Object.assign(provider, { defaults });
exports.default = provider;
if ('undefined' !== typeof (module)) {
    module.exports = provider;
}
//# sourceMappingURL=provider.js.map