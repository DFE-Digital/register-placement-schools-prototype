# Register of placement schools prototype

The ‘Register of placement schools’ is a proof of concept for DfE and, more specifically, the Schools Group to provide a canonical list of placement schools held in the ‘Register trainee teachers’ service.

This prototype is based on the:

- [GOV.UK Design System](https://design-system.service.gov.uk/)
- [GOV.UK Prototype Kit](https://prototype-kit.service.gov.uk/docs/)

## Requirements

- Node.js - version 22.x.x

## Installation

- Clone this repository to a folder on your computer
- Open Terminal
- In Terminal, change the path to the repository
- Type `npm install` to install the dependencies

## Working locally

- In Terminal, change the path to the repository
- Type `npm run dev`  and start the application

## Generating data

TBC

## Environment variables

The prototype uses environment variables to help configure the application. These include:

| Variable | Type | Description |
| --- | --- | --- |
| `OS_PLACES_API_KEY` | string | The API key needed to access the Ordnance Survey Places API |
| `GOOGLE_MAPS_API_KEY` | string | The API key needed to access the Google Maps API |

## Tools

If you’re using [Visual Studio (VS) Code](https://code.visualstudio.com/) for prototyping, we recommend you install the following extensions:

- [GOV.UK Design System snippets](https://marketplace.visualstudio.com/items?itemName=simonwhatley.govuk-design-system-snippets)
- [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)
- [Nunjucks for VS Code](https://marketplace.visualstudio.com/items?itemName=ronnidc.nunjucks)
- [Nunjucks snippets](https://marketplace.visualstudio.com/items?itemName=luwenjiechn.nunjucks-vscode-snippets)

We also recommend you update your VS Code settings to make sure you’re trimming whitespace: `Files: Trim Trailing Whitespace`.
