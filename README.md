# Register of placement schools prototype

The ‘Register of placement schools’ is a proof of concept for DfE and, more specifically, the Schools Group to provide a canonical list of placement schools held in the ‘Register trainee teachers’ service.

This prototype is based on the:

- [GOV.UK Design System](https://design-system.service.gov.uk/)
- [GOV.UK Prototype Kit](https://prototype-kit.service.gov.uk/docs/)

You can read more about this register on the [design history website](https://becoming-a-teacher.design-history.education.gov.uk/register-of-placement-schools/).

## Documentation

- [Architecture](ARCHITECTURE.md) - Technical architecture and application structure
- [Deployment](DEPLOYMENT.md) - Local and Heroku deployment instructions

## Getting started

1. Install dependencies: `npm install`
2. Create `.env` with at least `SESSION_SECRET` and any API keys you need (see `DEPLOYMENT.md`)
3. Run the prototype: `npm run dev`

The app runs at `http://localhost:3000`.

## Tools

If you’re using [Visual Studio (VS) Code](https://code.visualstudio.com/) for prototyping, we recommend you install the following extensions:

- [GOV.UK Design System snippets](https://marketplace.visualstudio.com/items?itemName=simonwhatley.govuk-design-system-snippets)
- [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)
- [Nunjucks for VS Code](https://marketplace.visualstudio.com/items?itemName=ronnidc.nunjucks)
- [Nunjucks snippets](https://marketplace.visualstudio.com/items?itemName=luwenjiechn.nunjucks-vscode-snippets)

We also recommend you update your VS Code settings to make sure you’re trimming whitespace: `Files: Trim Trailing Whitespace`.
