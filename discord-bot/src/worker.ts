import {
  InteractionType,
  InteractionResponseType,
  verifyKey,
} from "discord-interactions";
import { ACCEPT_BUTTON, WELCOME_MESSAGE_TEMPLATE } from "./config.js";

export const BUILDER_ROLE_NAME = "Builder";
export const WELCOME_CHANNEL_NAME = "witaj";
export const ADMIN_LOG_CHANNEL_NAME = "admin-logs";

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

export function buildAssignRoleRequest(): RequestInit {
  return { method: "PUT" };
}

// Fetch the Builder role ID by name
async function getBuilderRoleId(env: Env): Promise<string | null> {
  const res = await discordFetch(`/guilds/${env.DISCORD_GUILD_ID}/roles`, env);
  if (!res.ok) return null;
  const roles = await res.json() as { id: string; name: string }[];
  const builderRole = roles.find((r) => r.name === BUILDER_ROLE_NAME);
  return builderRole ? builderRole.id : null;
}

// Fetch a channel ID by name (supports text type=0 and forum type=15)
async function getChannelId(env: Env, channelName: string): Promise<string | null> {
  const res = await discordFetch(`/guilds/${env.DISCORD_GUILD_ID}/channels`, env);
  if (!res.ok) {
    console.error(`getChannelId: failed to fetch channels, status ${res.status}`);
    return null;
  }
  const channels = await res.json() as { id: string; name: string; type: number }[];
  // type 0 = GUILD_TEXT, type 5 = GUILD_ANNOUNCEMENT, type 15 = GUILD_FORUM
  const TEXT_TYPES = [0, 5, 15];
  const channel = channels.find((c) => c.name === channelName && TEXT_TYPES.includes(c.type));
  if (!channel) {
    console.error(`getChannelId: channel "${channelName}" not found. Available: ${channels.map(c => `${c.name}(type${c.type})`).join(", ")}`);
  }
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
            console.log(`[ONBOARD] User ${userId} clicked accept rules`);

            const roleId = await getBuilderRoleId(env);
            if (!roleId) {
              console.error("[ONBOARD] Builder role not found on server!");
              return;
            }
            console.log(`[ONBOARD] Found Builder role: ${roleId}`);

            if (member.roles.includes(roleId)) {
              console.log(`[ONBOARD] User ${userId} already has Builder role, skipping`);
              return;
            }

            // Assign the role
            const assignRes = await discordFetch(
              `/guilds/${env.DISCORD_GUILD_ID}/members/${userId}/roles/${roleId}`,
              env,
              buildAssignRoleRequest()
            );

            if (assignRes.ok || assignRes.status === 204) {
              console.log(`[ONBOARD] Successfully assigned Builder role to ${userId}`);

              // Send welcome message in #witaj
              const welcomeChannelId = await getChannelId(env, WELCOME_CHANNEL_NAME);
              if (welcomeChannelId) {
                const msgRes = await discordFetch(`/channels/${welcomeChannelId}/messages`, env, {
                  method: "POST",
                  body: JSON.stringify({ content: WELCOME_MESSAGE_TEMPLATE(userId) })
                });
                if (!msgRes.ok) {
                  console.error(`[ONBOARD] Failed to send welcome msg: ${msgRes.status} ${await msgRes.text()}`);
                } else {
                  console.log(`[ONBOARD] Welcome message sent to #${WELCOME_CHANNEL_NAME}`);
                }
              } else {
                console.error(`[ONBOARD] Welcome channel "${WELCOME_CHANNEL_NAME}" not found.`);
              }

              // Send admin log
              const logChannelId = await getChannelId(env, ADMIN_LOG_CHANNEL_NAME);
              if (logChannelId) {
                await discordFetch(`/channels/${logChannelId}/messages`, env, {
                  method: "POST",
                  body: JSON.stringify({
                    content: `[ONBOARD] <@${userId}> (${member.user.username}, ${userId}) zaakceptował regulamin — ${new Date().toISOString()}`
                  })
                });
              }
            } else {
              const errText = await assignRes.text();
              console.error(`[ONBOARD] Failed to assign ${BUILDER_ROLE_NAME} role to ${userId}: HTTP ${assignRes.status} — ${errText}`);
            }
          } catch (e) {
            console.error("[ONBOARD] Exception during role/message handling:", e);
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
