# Franklin Screens Project Boilerplate
This project is based on [helix-project-boilerplate](https://github.com/adobe/helix-project-boilerplate). 
The tutorial guide to use this boilerplate code is present [here](https://main--screens-franklin-documentation--hlxscreens.hlx.live/developer/tutorial).
## Environments
- Preview: https://main--{repo}--{owner}.hlx.page/
- Live: https://main--{repo}--{owner}.hlx.live/

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development

1. Create a new repository based on the `franklin-screens-project-boilerplate` template and add a mountpoint in the `fstab.yaml`
1. Add the [helix-bot](https://github.com/apps/helix-bot) to the repository
1. Install the [Helix CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/helix-cli`
1. Start Franklin Proxy: `hlx up` (opens your browser at `http://localhost:3000`)
1. Open the `{repo}` directory in your favorite IDE and start coding :)
