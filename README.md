# Frinter Core - Discord Bot (`AICORE_bot`)

This repository contains the Discord Bot for the **Frinter Core** community. It manages onboarding, rules acceptance, automated role assignment (such as the `Builder` role), and basic logging for member joins and leaves.

The bot is deployed as a **Cloudflare Worker**.

## Repository Structure

```
AICORE_bot/
├── .gitignore
├── README.md
└── discord-bot/
    ├── package.json
    ├── wrangler.toml
    └── src/
        ├── config.ts  # Role definitions, categories, channels, and message templates
        ├── worker.ts  # Cloudflare Worker interaction endpoint
        └── setup.ts   # Guild setup script (creates roles and channels)
```

## Setup & Configuration

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **Discord Bot Token**: Create an application at the [Discord Developer Portal](https://discord.com/developers/applications), add a bot, and make sure to enable the **Server Members Intent** under the Bot tab.
- **Discord Server (Guild)**: Create a Discord server where you have administrative permissions. Make sure **Developer Mode** is enabled in your Discord client settings to copy IDs.
- **Cloudflare account** with Workers enabled.

### 2. Environment Variables
The setup script loads local variables from `.env.local`. The deployed Worker reads secrets from Cloudflare Workers.

Create or update `.env.local` with the following details:

```env
DISCORD_TOKEN="YOUR_DISCORD_BOT_TOKEN"
DISCORD_GUILD_ID="YOUR_DISCORD_SERVER_ID"
DISCORD_PUBLIC_KEY="YOUR_DISCORD_APPLICATION_PUBLIC_KEY"
```

Set the same values as Cloudflare Worker secrets:

```bash
cd discord-bot
npx wrangler secret put DISCORD_TOKEN
npx wrangler secret put DISCORD_GUILD_ID
npx wrangler secret put DISCORD_PUBLIC_KEY
```

### 3. Installation
Navigate into the `discord-bot` directory and install dependencies:

```bash
cd discord-bot
npm install
```

### 4. Guild Initialization (Setup)
Run the setup script to automatically create roles, categories, channels, and post the interactive rules embed with the Join button:

```bash
npm run setup
```

### 5. Local Worker Development
Start the Cloudflare Worker locally:

```bash
npm run dev
```

### 6. Deploying to Cloudflare
Deploy the Worker with Wrangler:

```bash
npm run deploy
```

After deployment, copy the Worker URL into the Discord application's **Interactions Endpoint URL**.

## How Onboarding Works
1. When a new user joins, they only see the `#zasady` channel under `📋 ONBOARDING`.
2. They click the "**I accept the rules**" button.
3. The bot assigns them the `Builder` role.
4. They are greeted in the `#witaj` channel, and all builder channels under `🇵🇱 POLSKA` become visible to them.
5. All actions are logged to the private `#admin-logs` channel.
