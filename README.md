# Go Variants
A place to play Go variants.

## Set up

### Install and run the database

Follow [these instructions](https://www.mongodb.com/docs/manual/administration/install-community/)
to install MongoDB Community Edition and start `mongod`

### Install and run the app

Make sure you have [yarn installed](https://classic.yarnpkg.com/lang/en/docs/install/), then in the root of this repo, run:

```
yarn
```

This will install dependencies in the three main subdirectories in `packages/`: `client/`, `server/` and `shared/`.

To run the app, you can run

```
yarn build
yarn start
```

This will start two dev servers.  One is a Vue server listening on `localhost:5173`, and the other is an Express server listening on `localhost:3001`.

## Variant Demos

See https://github.com/govariantsteam/govariants/pull/249 for information about variant demos, can also be used to develop variants without setting up MongoDB.

## Creating a new variant

See `docs/variant-implementation.md` for a step-by-step guide. If you want a concrete reference, https://github.com/govariantsteam/govariants/pull/105 shows how chess was added earlier.

There are two main files to be concerned with: `shared/src/chess/chess.ts` and `vue-client/src/components/boards/ChessBoard.ts`.  The former specifies the rules of the game while the latter specifies how to render it on the client.

Disclaimer: the structure of the repo is changing rapidly, so the above PR may be outdated.  Feel free to reach out in the [forums thread](https://forums.online-go.com/t/collective-development-of-a-server-for-variants/43682) if you need help creating a variant.
