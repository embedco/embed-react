# Embed Connect React SDK

This SDK makes it easy to connect end-user accounts to integrations like Dropbox, Slack, HubSpot, and more. For a detailed overview of the auth flow, refer to [the docs](https://docs.useembed.com/). If you're _not_ using React (or a React-based framework like Next.js), use the [JavaScript SDK](https://github.com/embedhq/embed-js) instead.

[![npm latest package](https://img.shields.io/npm/v/@embedhq/react/latest.svg)](https://www.npmjs.com/package/@embedhq/react)

[**Visit the Embed website ▸**](https://useembed.com/)

[**Read the documentation ▸**](https://docs.useembed.com/)

[**View the API reference ▸**](https://docs.useembed.com/api-reference)

## Installation

Download the SDK from NPM.

```bash
npm install @embedhq/react
```

## Usage

First, generate a [session token](https://docs.useembed.com/guides/step-by-step-guides/auth-flow) server-side, then use it to call the `connect()` function exposed by the `useEmbedConnect` hook as shown below.

```jsx
import { useEmbedConnect } from "@embedhq/react";

export function MyComponent() {
  const { connect } = useEmbedConnect();

  async function initiateAuthFlow() {
    try {
      const response = await connect("SESSION_TOKEN");
      console.log(response.connectionId);
    } catch (err) {
      console.error(err);
    }
  }

  return <button onClick={initiateAuthFlow}>Connect</button>;
}
```
