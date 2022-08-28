# Go Variants
A place to play Go variants, brought to you by the OGF community.

## Set up

### Install and run the database

Follow [these instructions](https://www.mongodb.com/docs/manual/administration/install-community/)
to install MongoDB Community Edition and start `mongod`

### Install and run the app

In the root of this repo, run

```
yarn install
```

This will install dependencies in the three main subdirectories in `packages/`: `client/`, `server/` and `shared/`.

To run the app, you can run

```
yarn run build
yarn start
```

This will start two dev servers.  One is a React server listening on `localhost:3000`, and the other is an Express server listening on `localhost:3001`.

## Creating a new variant

This PR has a simple example showing how to add tic-tac-toe to the repo: https://github.com/benjaminpjones/govariants/pull/27

There are two main files to be concerned with: `shared/tictactoe/TicTacToe.ts` and `client/tictactoe/TicTacToeView.ts`.  The former specifies the rules of the game while the latter specifies how to render it on the client.

Disclaimer: the structure of the repo is changing rapidly, so the above PR may be outdated.  Feel free to reach out in the [forums thread](https://forums.online-go.com/t/collective-development-of-a-server-for-variants/43682) if you need help creating a variant.
