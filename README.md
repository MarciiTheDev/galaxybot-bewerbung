# GalaxyBot Bewerbung

## Getting started

### Install dependencies

```bash
bun install
```

### Set variables

In order for the code to work we need some env variables so go to the root of the project and create a `.env` file with the following variables:
- `DATABASE_USER` - The database user to authenticate with
- `DATABASE_PASSWORD` - The password for the database user
- `DATABASE_NAME` - The name of the database to use
- `DATABASE_HOST` - The host address of the postgres instance
- `DATABASE_PORT` - (Optional) The port of the postgres instance (default:  `5432`)
- `DISCORD_TOKEN` - The Bot's token

**NOTE:** This project uses postgres as database server.

Then sync the database via:

```bash
bun run sync
```


Finally run the bot:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.13. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
