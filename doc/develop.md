# Developing this repository

How to build, test and release `@seneca/provider` itself. For using
the plugin, start at [tutorial.md](tutorial.md).

Node.js 24 or later is required (`engines.node: ">=24"`).


## Layout

```
src/          TypeScript sources          -> dist/
  provider.ts       the plugin
  provider-doc.ts   message descriptions for seneca-doc
  tsconfig.json     project config for src

test/         tests and fixtures          -> dist-test/
  *.test.js         tests (plain JavaScript, node:test)
  api-server.js     Express fixture server
  provider.messages.ts  seneca-msg-test spec -> dist-test/
  env.json          fixture for @seneca/env
  tsconfig.json     project config for test

doc/          documentation
```

There is no root `tsconfig.json`. `src` and `test` are separate
TypeScript projects, each with its own config, built together by
`tsc --build`.

Build state (`*.tsbuildinfo`) is written to `.tsbuildinfo/`, outside
both output directories, and is git-ignored.


## Commands

```sh
npm run build          # tsc --build src test
npm test               # node --enable-source-maps --test test/**/*.test.js
npm run test-coverage  # as above, with --experimental-test-coverage
npm run watch          # tsc --build src test -w
npm run reset          # clean, reinstall, build, test
```

Run a single test by name:

```sh
TEST_PATTERN=child-provider npm run test-some
```


## Tests run against the build

Tests are plain `.js` and require `../dist/provider` — the compiled
output, not `src/`. **`npm test` does not build first**, so run
`npm run build` after editing anything in `src/` or you will be
testing stale code. `npm run reset` does both.

`--enable-source-maps` means stack traces and coverage still report
against the original TypeScript. A failure inside the plugin points at
`src/provider.ts:<line>`, and `npm run test-coverage` reports on
`src/*.ts` with real TypeScript line numbers.

TypeScript files that are test *fixtures* rather than tests live in
`test/` and compile to `dist-test/`. `test/provider.messages.ts` is
the only one at present; tests require it as
`../dist-test/provider.messages`.

The test glob is explicit (`test/**/*.test.js`) rather than a bare
`node --test`. Node's default glob treats every file under a `test/`
directory as a test, which would execute `api-server.js` as a test
file and hang on its listening socket.


## Build output is committed

`dist/` and `dist-test/` are tracked in git. Rebuild before committing
so they do not drift from `src/`. The build is deterministic — a clean
rebuild produces byte-identical output — so a dirty `dist/` in
`git status` means real source changes, not noise.

`dist-test/` is tracked but **not published**: `files` in
`package.json` lists `dist`, `src/**/*.ts` and `LICENSE` only. Verify
with `npm pack --dry-run`.


## Documentation

Two separate things share the `doc/` directory.

**Prose documentation**, organised on
[Diátaxis](https://diataxis.fr) lines:

| File | Purpose |
|---|---|
| [tutorial.md](tutorial.md) | Learning — one guided path, start to finish. |
| [guide.md](guide.md) | Tasks — recipes for specific goals. |
| [api.md](api.md), [options.md](options.md) | Reference — complete and dry. |
| [concepts.md](concepts.md) | Explanation — design and trade-offs. |
| develop.md | This file: working on the repo itself. |

Keep each file to one purpose. Reference material does not teach;
tutorials do not enumerate options; explanation does not give
instructions. `README.md` is an orientation hub — new detail belongs
in one of the files above, not in the README.

**seneca-doc fragments**, which are content injected into `README.md`
by `npm run doc`:

- `doc/build.md` — how to author them.
- `doc/intro.md`, `doc/support.md`, `doc/save_product.md` — fragment
  content, referenced from `src/provider-doc.ts`.

`npm run doc` regenerates the regions of `README.md` between the
`<!--START:...-->` and `<!--END:...-->` markers from
`src/provider-doc.ts`. Do not hand-edit inside those markers.

Two known gaps: `src/provider-doc.ts` has no description for
`get:keymap`, and the descriptions it does carry have not been
regenerated into `README.md`, which still shows "No description
provided."


## Releasing

```sh
npm run repo-publish        # clean, install, build, test, doc, tag, publish
npm run repo-publish-quick  # skip the clean reinstall
```

Both end in `repo-tag`, which commits, tags `v<version>` from
`package.json`, and pushes.
