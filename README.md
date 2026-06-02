# Frinter Core - Discord Bot (`AICORE_bot`)

This repository contains the Discord Bot for the **Frinter Core** community. It manages onboarding, rules acceptance, automated role assignment (such as the `Builder` role), and basic logging for member joins and leaves.

## Repository Structure

```
AICORE_bot/
├── .gitignore
├── README.md
└── discord-bot/
    ├── package.json
    └── src/
        ├── config.ts  # Role definitions, categories, channels, and message templates
        ├── index.ts   # Bot main event loop
        └── setup.ts   # Guild setup script (creates roles and channels)
```

## Setup & Configuration

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **Discord Bot Token**: Create an application at the [Discord Developer Portal](https://discord.com/developers/applications), add a bot, and make sure to enable the **Server Members Intent** under the Bot tab.
- **Discord Server (Guild)**: Create a Discord server where you have administrative permissions. Make sure **Developer Mode** is enabled in your Discord client settings to copy IDs.

### 2. Environment Variables
The bot loads environment variables from a `.env.local` file located two directories up from the running script's directory (specifically, in the root of the monorepo).

Create or update your `.env.local` file (at the monorepo root) with the following details:

```env
DISCORD_TOKEN="YOUR_DISCORD_BOT_TOKEN"
DISCORD_GUILD_ID="YOUR_DISCORD_SERVER_ID"
```

### 3. Installation
Navigate into the `discord-bot` directory and install dependencies:

```bash
cd discord-bot
npm install
```

### 4. Guild Initialization (Setup)
Run the setup script to automatically create roles, categories, channels, and post the interactive rules rules embed with the Join button:

```bash
npm run setup
```

### 5. Running the Bot
Start the bot to listen for interactions (like when a member clicks the rule acceptance button) and log joins/leaves:

```bash
npm start
```

## How Onboarding Works
1. When a new user joins, they only see the `#rules` channel under `📋 ONBOARDING`.
2. They click the "**I accept the rules**" button.
3. The bot assigns them the `Builder` role.
4. They are greeted in the `#welcome` channel, and all general Polish/English builder channels (`🇵🇱 POLSKA`, `🌍 GLOBAL (EN)`) become visible to them.
5. All actions are logged to the private `#admin-logs` channel.
