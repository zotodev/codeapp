# zapp

`zapp` is a thin npm wrapper around `@microsoft/power-apps-cli`.

Run the Power Apps CLI as:

```bash
npx zapp
```

instead of:

```bash
npx power-apps
```

The CLI implementation comes from Microsoft's official `@microsoft/power-apps-cli` package.

## Usage (standalone)

If you only have this `packages/zapp` folder, use **npm** from inside it:

```bash
cd packages/zapp
npm install
```

Then run:

```bash
npx zapp --help
npx zapp push
npx zapp add-data-source
```

Examples:

```bash
npx zapp init
npx zapp run
npx zapp list-codeapps
```

**Requirements:** Node.js 22+

## How it works

The `bin` field exposes the `zapp` command:

```json
{
  "bin": {
    "zapp": "./bin/zapp.js"
  }
}
```

`bin/zapp.js` imports the official Microsoft CLI entrypoint:

```js
#!/usr/bin/env node

import '@microsoft/power-apps-cli/dist/Bin.js';
```

This package does not copy or vendor Microsoft's CLI code — it only provides a different executable name.
