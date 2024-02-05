"use strict";
/* Copyright © 2022-2023 Richard Rodger, MIT License. */
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: field manip utils:
// pick subsets, renames, ignore undefs, etc - see trello-provider for use case
const node_async_hooks_1 = require("node:async_hooks");
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
    const { Child } = seneca.valid;
    const validateSpec = seneca.valid({
        provider: {
            name: String
        },
        entity: Child({
            cmd: Child({
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
            fetcher = FetchRetry(fetcher);
        }
        else if (null != retry && 'object' === typeof retry) {
            fetcher = FetchRetry(fetcher, retry.config || {});
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
                // console.log('PROVIDER get', url, getConfig, sharedConfig, config)
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
            fetchRetry: FetchRetry,
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
/* FetchRetry
The MIT License (MIT)

Copyright (c) 2016 Jon K. Bernhardsen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
function FetchRetry(fetch, defaults) {
    defaults = defaults || {};
    if (typeof fetch !== 'function') {
        throw new Error('fetch must be a function');
    }
    if (typeof defaults !== 'object') {
        throw new Error('defaults must be an object');
    }
    if (defaults.retries !== undefined && !isPositiveInteger(defaults.retries)) {
        throw new Error('retries must be a positive integer');
    }
    if (defaults.retryDelay !== undefined && !isPositiveInteger(defaults.retryDelay) && typeof defaults.retryDelay !== 'function') {
        throw new Error('retryDelay must be a positive integer or a function returning a positive integer');
    }
    if (defaults.retryOn !== undefined && !Array.isArray(defaults.retryOn) && typeof defaults.retryOn !== 'function') {
        throw new Error('retryOn property expects an array or function');
    }
    var baseDefaults = {
        retries: 3,
        retryDelay: 1000,
        retryOn: [],
    };
    defaults = Object.assign(baseDefaults, defaults);
    return function fetchRetry(input, init) {
        var retries = defaults.retries;
        var retryDelay = defaults.retryDelay;
        var retryOn = defaults.retryOn;
        if (init && init.retries !== undefined) {
            if (isPositiveInteger(init.retries)) {
                retries = init.retries;
            }
            else {
                throw new Error('retries must be a positive integer');
            }
        }
        if (init && init.retryDelay !== undefined) {
            if (isPositiveInteger(init.retryDelay) || (typeof init.retryDelay === 'function')) {
                retryDelay = init.retryDelay;
            }
            else {
                throw new Error('retryDelay must be a positive integer or a function returning a positive integer');
            }
        }
        if (init && init.retryOn) {
            if (Array.isArray(init.retryOn) || (typeof init.retryOn === 'function')) {
                retryOn = init.retryOn;
            }
            else {
                throw new Error('retryOn property expects an array or function');
            }
        }
        // eslint-disable-next-line no-undef
        return new Promise(function (resolve, reject) {
            var wrappedFetch = function (attempt) {
                // As of node 18, this is no longer needed since node comes with native support for fetch:
                /* istanbul ignore next */
                var _input = typeof Request !== 'undefined' && input instanceof Request
                    ? input.clone()
                    : input;
                // console.log('RETRYFETCH fetch', _input, init)
                fetch(_input, init)
                    .then(function (response) {
                    if (Array.isArray(retryOn) && retryOn.indexOf(response.status) === -1) {
                        resolve(response);
                    }
                    else if (typeof retryOn === 'function') {
                        try {
                            // eslint-disable-next-line no-undef
                            return Promise.resolve(retryOn(attempt, null, response, { resource: _input, options: init }))
                                .then(function (retryOnResponse) {
                                if (retryOnResponse) {
                                    retry(attempt, null, response);
                                }
                                else {
                                    resolve(response);
                                }
                            }).catch(reject);
                        }
                        catch (error) {
                            reject(error);
                        }
                    }
                    else {
                        if (attempt < retries) {
                            retry(attempt, null, response);
                        }
                        else {
                            resolve(response);
                        }
                    }
                })
                    .catch(function (error) {
                    if (typeof retryOn === 'function') {
                        try {
                            // eslint-disable-next-line no-undef
                            Promise.resolve(retryOn(attempt, error, null, { resource: _input, options: init }))
                                .then(function (retryOnResponse) {
                                if (retryOnResponse) {
                                    retry(attempt, error, null);
                                }
                                else {
                                    reject(error);
                                }
                            })
                                .catch(function (error) {
                                reject(error);
                            });
                        }
                        catch (error) {
                            reject(error);
                        }
                    }
                    else if (attempt < retries) {
                        retry(attempt, error, null);
                    }
                    else {
                        reject(error);
                    }
                });
            };
            function retry(attempt, error, response) {
                var delay = (typeof retryDelay === 'function') ?
                    retryDelay(attempt, error, response) : retryDelay;
                setTimeout(function () {
                    wrappedFetch(++attempt);
                }, delay);
            }
            wrappedFetch(0);
        });
    };
}
;
function isPositiveInteger(value) {
    return Number.isInteger(value) && value >= 0;
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