export const planMeta = {
  starter: { name: "Starter", price: "₹999", description: "Everything you need to launch", limit: "1 workspace" },
  growth: { name: "Growth", price: "₹2,499", description: "For growing brands and teams", limit: "3 team members" },
  scale: { name: "Scale", price: "₹5,999", description: "Advanced operations and support", limit: "Unlimited team" },
} as const;

export type Plan = keyof typeof planMeta;
