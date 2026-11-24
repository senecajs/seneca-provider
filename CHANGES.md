# Changes

## 5.0.0 2026-11-20

First entry of this change log. Earlier versions are on npm and in the git history.

* Seneca 4: the peer dependency is `seneca` `^4.0.0` (was `>=3||>=4.0.0-rc2`).
  Seneca 3 users stay on `@seneca/provider@4`.
* The entity peer dependency is `@seneca/entity` `^29.0.0` (was `seneca-entity`
  `>=26`). A peer dependency on `seneca-entity` made npm install seneca-entity 28,
  which stops a Seneca 4 process at startup with `plugin_gubu_shape`. Load the
  entity plugin by its full name: `seneca.use('@seneca/entity')`.
* The `@seneca/env` peer dependency is `^0.6.0` (was `>=0.4`) and is optional. The
  plugin uses its `env/injectVars` export only when `@seneca/env` is loaded.
* The `seneca-promisify` peer dependency is removed. Seneca 4 has it built in; do
  not call `use('promisify')` (D4).
* The `node-fetch` peer dependency is removed. Node.js 24 has a global `fetch`;
  the fallback to `require('node-fetch')` runs only where it is missing.
* Node.js 24 or later (`engines.node` `>=24`), as in 4.0.0.
* The option `entity.pin` is open again: extra pattern properties such as
  `{ sys: 'entity', tier: 'external' }` are accepted, as documented. Seneca 4
  closes plain-object defaults and rejected them with `invalid_plugin_option`
  (B13). The defaults are built with the `valid` builders that Seneca passes.
* The resolved plugin options no longer contain `init$: true`. Seneca 3 added it
  to the defaults of every plugin; Seneca 4 does not.
* Tests run on Seneca 4 with `seneca-msg-test` 5, load `@seneca/entity` and
  `@seneca/env` by full name (B14) and no longer use `promisify`. The `maintain`
  test skips the check `check_default` in a pull request or tag build, and
  `url_pkgjson` on Windows (DEC-27).
* The `doc` script and the `seneca-doc` development dependency are removed. The
  tests do not use them, and the README sections they generated are kept as
  they are.
* `publishConfig.access` is `public`, and `CHANGES.md` is in the package.
