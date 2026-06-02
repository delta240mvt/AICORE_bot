import {
  InteractionType,
  InteractionResponseType,
  verifyKey,
} from "discord-interactions";
import { ACCEPT_BUTTON, WELCOME_MESSAGE_TEMPLATE } from "./config.js";

export interface Env {
  DISCORD_PUBLIC_KEY: string;
  DISCORD_TOKEN: string;
  DISCORD_GUILD_ID: string;
}

// Helper to make Discord API requests
async function discordFetch(endpoint: string, env: Env, init?: RequestInit) {
  const res = await fetch(`https://discord.com/api/v10${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bot ${env.DISCORD_TOKEN}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  return res;
}

// Fetch the Builder role ID by name
async function getBuilderRoleId(env: Env): Promise<string | null> {
  const res = await discordFetch(`/guilds/${env.DISCORD_GUILD_ID}/roles`, env);
  if (!res.ok) return null;
  const roles = await res.json() as { id: string; name: string }[];
  const builderRole = roles.find((r) => r.name === "Builder");
  return builderRole ? builderRole.id : null;
}

// Fetch a channel ID by name
async function getChannelId(env: Env, channelName: string): Promise<string | null> {
  const res = await discordFetch(`/guilds/${env.DISCORD_GUILD_ID}/channels`, env);
  if (!res.ok) return null;
  const channels = await res.json() as { id: string; name: string; type: number }[];
  // type 0 is GUILD_TEXT
  const channel = channels.find((c) => c.name === channelName && c.type === 0);
  return channel ? channel.id : null;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // 1. Verify the signature
    const signature = request.headers.get("x-signature-ed25519");
    const timestamp = request.headers.get("x-signature-timestamp");
    const body = await request.text();

    if (!signature || !timestamp) {
      return new Response("Missing signature", { status: 401 });
    }

    let isValidRequest = false;
    try {
      isValidRequest = await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
    } catch (e) {
      console.error("Signature verification threw an error:", e);
      return new Response("Internal Server Error", { status: 500 });
    }

    if (!isValidRequest) {
      console.error("Invalid request signature! Make sure DISCORD_PUBLIC_KEY is correct.");
      return new Response("Invalid request signature", { status: 401 });
    }

    let interaction;
    try {
      interaction = JSON.parse(body);
    } catch (e) {
      console.error("Failed to parse body as JSON:", e);
      return new Response("Bad Request", { status: 400 });
    }

    // 2. Handle Ping
    if (interaction.type === InteractionType.PING) {
      return new Response(JSON.stringify({ type: 1 }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. Handle Button Clicks
    if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
      const data = interaction.data;
      
      if (data.custom_id === ACCEPT_BUTTON.customId) {
        const member = interaction.member;
        const userId = member.user.id;
        
        ctx.waitUntil((async () => {
          try {
            const roleId = await getBuilderRoleId(env);
            if (!roleId) {
              console.error("Builder role not found.");
              return;
            }

            if (member.roles.includes(roleId)) {
              // User already has the role, no action needed
              return;
            }

            // Assign the role
            const assignRes = await discordFetch(
              `/guilds/${env.DISCORD_GUILD_ID}/members/${userId}/roles/${roleId}`,
              env,
              { method: "PUT", body: JSON.stringify({ reason: "Accepted rules via onboarding button" }) }
            );

            if (assignRes.ok) {
              // Send welcome message
              const welcomeChannelId = await getChannelId(env, "welcome");
              if (welcomeChannelId) {
                await discordFetch(`/channels/${welcomeChannelId}/messages`, env, {
                  method: "POST",
                  body: JSON.stringify({ content: WELCOME_MESSAGE_TEMPLATE(userId) })
                });
              }

              // Send admin log
              const logChannelId = await getChannelId(env, "admin-logs");
              if (logChannelId) {
                await discordFetch(`/channels/${logChannelId}/messages`, env, {
                  method: "POST",
                  body: JSON.stringify({ content: `[ONBOARD] ${member.user.username}#${member.user.discriminator} (${userId}) accepted rules at ${new Date().toISOString()}` })
                });
              }
            }
          } catch (e) {
            console.error("Failed to assign role or send messages", e);
          }
        })());

        // Acknowledge the interaction and send a reply visible only to the user (ephemeral)
        return Response.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "Witaj na pokładzie! Masz teraz dostęp do wszystkich kanałów.",
            flags: 64 // EPHEMERAL
          }
        });
      }
    }

    // Unhandled interaction
    return new Response("Unknown interaction", { status: 400 });
  },
};
