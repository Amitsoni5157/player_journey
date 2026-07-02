/**
 * mapConfig.js
 * Map coordinate configuration for world-to-minimap transforms.
 * Based on the documented map config in player_data/README.md.
 */

export const MAP_CONFIGS = {
  AmbroseValley: {
    scale: 900,
    originX: -370,
    originZ: -473,
    image: "/minimaps/AmbroseValley_Minimap.png",
    label: "Ambrose Valley",
  },
  GrandRift: {
    scale: 581,
    originX: -290,
    originZ: -290,
    image: "/minimaps/GrandRift_Minimap.png",
    label: "Grand Rift",
  },
  Lockdown: {
    scale: 1000,
    originX: -500,
    originZ: -500,
    image: "/minimaps/Lockdown_Minimap.jpg",
    label: "Lockdown",
  },
};

export const MAP_IDS = Object.keys(MAP_CONFIGS);

export const EVENT_COLORS = {
  Position: "rgba(99,179,237,0.6)",
  BotPosition: "rgba(160,160,160,0.3)",
  Kill: "#ff4757",
  Killed: "#ff6b81",
  BotKill: "#ffa502",
  BotKilled: "#ff7f50",
  KilledByStorm: "#2ed573",
  Loot: "#eccc68",
};

export const EVENT_LABELS = {
  Position: "Movement (Human)",
  BotPosition: "Movement (Bot)",
  Kill: "Kill (PvP)",
  Killed: "Death (PvP)",
  BotKill: "Bot Kill",
  BotKilled: "Killed by Bot",
  KilledByStorm: "Storm Death",
  Loot: "Loot Pickup",
};

export const COMBAT_EVENTS = ["Kill", "Killed", "BotKill", "BotKilled", "KilledByStorm", "Loot"];
