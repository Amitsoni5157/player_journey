# Player Journey Insights

While building this tool and playing around with the filters (specifically toggling between human and bot paths, and layering the heatmap), a few major gameplay patterns stood out immediately. 

Here are three practical insights a Level Designer can take away from this data.

## 1. The "Mine Pit" Traffic Jam (Map: GrandRift)

**What caught my eye:** 
When you turn on the heatmap for GrandRift, there is a massive, glowing red cluster of PvP deaths right in the center around the "Mine Pit." Meanwhile, outer areas like the Labour Quarters and Gas Station are basically empty. Tracking the timeline, players sprint straight to the Mine Pit off spawn and just die there within the first 3 minutes.

**Actionable steps:** 
We need to spread the action out. We can move the best loot drops to the outer edges (like the Maintenance Bay) or add physical cover blocking direct line-of-sight into the pit. This will bump up our **average match duration** metric and stop players from quitting after dying too early.

**Why a Level Designer should care:** 
If 80% of the map is ignored, we are wasting development time building those areas. Plus, a match that ends in a 3-minute meat grinder feels like an arena shooter, not a tactical extraction game.

## 2. Bots Are Just Target Practice on Bridges (Map: Ambrose Valley)

**What caught my eye:** 
If you filter the map to only show bots and look at the `BotKill` events, there's a heavy cluster right on the river crossings and main roads. Very few bots make it into the dense urban buildings.

**Actionable steps:** 
Adjust the bot navigation mesh so they stick to the riverbeds for cover, or literally just drop some broken trucks and sandbags on the bridges. This will increase the **average bot lifespan** and make PvE fights actually dangerous.

**Why a Level Designer should care:** 
Right now, players just sit in buildings on the high ground and farm bots as they cross the open bridges. This gives players free loot with zero risk, breaking the in-game economy and making the PvE loop boring.

## 3. High Storm Deaths in the Burnt Zone (Map: GrandRift)

**What caught my eye:** 
I noticed a weirdly high number of green "Storm Death" markers clustered in the top right quadrant (the Burnt Zone). When I watched the player paths on the timeline, players who loot up there try to run straight toward the safe zone but get stuck on the rocks and cliffs, eventually dying to the storm.

**Actionable steps:** 
Add a zipline connecting that cliff to the lower ground, or carve a clear walking path through the rocks. This will lower the **non-combat death rate** and push those players into late-game PvP fights instead.

**Why a Level Designer should care:** 
Dying to the storm because you got stuck on a rock is one of the most frustrating things that can happen in an extraction shooter. It leads directly to rage-quits and hurts our day-1 retention metrics.
