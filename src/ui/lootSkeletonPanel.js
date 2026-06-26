import { CSS } from "../config/palette.js";
import { LOOT_EQUIPMENT_SLOTS, LOOT_STAT_KEYS } from "../config/items.js";
import {
  createLootState,
  equipLootItem,
  getLootViewerData,
  grantStarterLoot,
  unequipLootSlot,
} from "../sim/lootModel.js";
import { FORGE_UPGRADE_GOLD_COST, getForgeViewerData, upgradeLootItem } from "../sim/forgeModel.js";

const el = (tag, styles = {}, text = "") => {
  const node = document.createElement(tag);
  Object.assign(node.style, styles);
  if (text) node.textContent = text;
  return node;
};

export class LootSkeletonPanel {
  constructor(root, { getState, onChange, getHero, getRewards, onDebugReward } = {}) {
    this.getState = getState || (() => this.state);
    this.onChange = onChange || (() => {});
    this.state = createLootState(this.getState?.());
    this.getHero = getHero || (() => null);
    this.getRewards = getRewards || (() => ({ claimedCount: 0, recent: [] }));
    this.onDebugReward = onDebugReward || null;
    this.selectedForgeItemId = null;
    this.forgeMessage = "";
    this.rewardMessage = "";
    this.root = el("div", {
      position: "absolute",
      right: "14px",
      bottom: "76px",
      width: "300px",
      maxHeight: "58vh",
      overflowY: "auto",
      zIndex: "18",
      padding: "12px",
      border: `1px solid ${CSS.gold}`,
      borderRadius: "8px",
      background: "rgba(7,8,6,0.88)",
      color: CSS.bone,
      font: "12px ui-sans-serif, system-ui",
      boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
    });
    root.appendChild(this.root);
    this.render();
  }

  mutate(fn) {
    const result = fn(this.state);
    this.state = createLootState(this.state);
    this.onChange(this.state);
    this.render();
    return result;
  }

  refresh() {
    this.state = createLootState(this.getState?.());
    this.render();
  }

  activeHero() {
    return this.getHero?.() || null;
  }

  heroGold() {
    return Number(this.activeHero()?.gold || 0);
  }

  grantTestGold(amount = 50) {
    const hero = this.activeHero();
    if (!hero) {
      this.forgeMessage = "No active hero for Gold.";
      this.render();
      return;
    }
    hero.gold = Number(hero.gold || 0) + amount;
    this.forgeMessage = `Dev grant: +${amount} Gold.`;
    this.onChange(this.state);
    this.render();
  }

  claimDebugReward(sourceType = "mission") {
    if (!this.onDebugReward) return;
    const summary = this.onDebugReward(sourceType);
    this.state = createLootState(this.getState?.());
    const itemText = summary?.items?.length ? summary.items.map((item) => `${item.name} (${item.rarity})`).join(", ") : "";
    const itemPart = itemText ? summary.shouldSpawnWorldDrop ? ` Item dropped: ${itemText}.` : ` + ${itemText}.` : "";
    this.rewardMessage = summary ? `Claimed +${summary.goldGranted || 0} Gold.${itemPart}` : "Reward claim failed.";
    this.render();
  }

  selectForgeItem(itemId) {
    this.selectedForgeItemId = itemId;
    this.forgeMessage = "";
    this.render();
  }

  upgradeForgeStat(statKey) {
    const hero = this.activeHero();
    const gold = this.heroGold();
    this.mutate((state) => {
      const res = upgradeLootItem(state, this.selectedForgeItemId, statKey, { availableGold: gold });
      if (res.ok && hero) {
        hero.gold = gold - res.cost;
        this.forgeMessage = `${res.item.name} +${res.upgradeLevel}: ${statKey} ${res.oldValue} -> ${res.newValue}.`;
      } else {
        const labels = { gold: "Not enough Gold.", max: "Item is at max upgrade.", stat: "Choose an existing stat.", missing: "Select an item." };
        this.forgeMessage = labels[res.reason] || "Upgrade failed.";
      }
      return res;
    });
  }

  button(label, onClick) {
    const button = el("button", {
      margin: "6px 6px 0 0",
      padding: "5px 8px",
      borderRadius: "6px",
      border: `1px solid ${CSS.gold}`,
      background: "rgba(200,161,74,0.16)",
      color: CSS.bone,
      cursor: "pointer",
      font: "700 11px 'Cinzel', serif",
    }, label);
    button.onclick = onClick;
    return button;
  }

  renderRewards() {
    const rewards = this.getRewards?.() || { claimedCount: 0, recent: [] };
    const wrap = el("div", {
      marginTop: "10px",
      padding: "8px",
      borderRadius: "7px",
      border: "1px solid rgba(110,230,90,0.28)",
      background: "rgba(110,230,90,0.055)",
    });
    wrap.appendChild(el("div", { color: CSS.gold, fontWeight: "700", marginBottom: "4px" }, "Reward Log v1"));
    wrap.appendChild(el("div", { color: CSS.ash, fontSize: "11px", lineHeight: "1.35" },
      `${rewards.claimedCount || 0} reward claim${rewards.claimedCount === 1 ? "" : "s"} recorded. Common rewards auto-claim; important items can drop in-world.`));
    if (this.onDebugReward) {
      wrap.appendChild(this.button("Grant mission reward", () => this.claimDebugReward("mission")));
      wrap.appendChild(this.button("Spawn chest reward", () => this.claimDebugReward("chest")));
      wrap.appendChild(this.button("Spawn elite reward", () => this.claimDebugReward("elite")));
      wrap.appendChild(this.button("Spawn legendary test drop", () => this.claimDebugReward("legendary")));
    }
    if (this.rewardMessage) wrap.appendChild(el("div", { color: CSS.gold, fontSize: "11px", lineHeight: "1.35", marginTop: "5px" }, this.rewardMessage));
    const recent = Array.isArray(rewards.recent) ? rewards.recent.slice(0, 4) : [];
    if (!recent.length) {
      wrap.appendChild(el("div", { color: CSS.ash, marginTop: "6px" }, "No mission rewards claimed yet."));
      return wrap;
    }
    for (const summary of recent) {
      const itemNames = summary.items?.map((item) => `${item.name} (${item.rarity})`).join(", ") || "";
      const itemText = itemNames
        ? summary.delivery === "pickup" ? ` | Item picked up: ${itemNames}` : summary.shouldSpawnWorldDrop ? ` | Item dropped: ${itemNames}` : ` | ${itemNames}`
        : "";
      const goldText = summary.goldGranted ? `+${summary.goldGranted} Gold` : "No Gold";
      wrap.appendChild(el("div", { color: CSS.bone, fontSize: "11px", lineHeight: "1.35", marginTop: "5px" },
        `${summary.sourceType}: ${goldText}${itemText}`));
    }
    return wrap;
  }

  renderForge() {
    let forgeData = getForgeViewerData(this.state, this.selectedForgeItemId);
    if (!forgeData.selectedItem && this.state.items[0]) {
      this.selectedForgeItemId = this.state.items[0].id;
      forgeData = getForgeViewerData(this.state, this.selectedForgeItemId);
    }
    const wrap = el("div", {
      marginTop: "10px",
      padding: "8px",
      borderRadius: "7px",
      border: `1px solid rgba(200,161,74,0.45)`,
      background: "rgba(200,161,74,0.07)",
    });
    wrap.appendChild(el("div", { color: CSS.gold, fontWeight: "700", marginBottom: "4px" }, "Forge v1"));
    wrap.appendChild(el("div", { color: CSS.ash, fontSize: "11px", lineHeight: "1.35" },
      `Dev skeleton: +1 to an existing stat, max +5. Cost ${FORGE_UPGRADE_GOLD_COST} Gold. Marrow unaffected.`));
    wrap.appendChild(el("div", { color: CSS.bone, fontSize: "11px", lineHeight: "1.35", marginTop: "5px" },
      `Active hero Gold: ${this.heroGold()}`));
    wrap.appendChild(this.button("Dev +50 Gold", () => this.grantTestGold(50)));

    if (!forgeData.selected) {
      wrap.appendChild(el("div", { color: CSS.ash, marginTop: "8px" }, "Grant or own an item to use the Forge."));
      if (this.forgeMessage) wrap.appendChild(el("div", { color: CSS.gold, marginTop: "6px", fontSize: "11px" }, this.forgeMessage));
      return wrap;
    }

    const selected = forgeData.selected;
    this.selectedForgeItemId = selected.item.id;
    wrap.appendChild(el("div", { color: CSS.bone, fontWeight: "700", marginTop: "8px" }, selected.item.name));
    wrap.appendChild(el("div", { color: CSS.ash, fontSize: "11px", lineHeight: "1.35" },
      `${selected.item.slot} | +${selected.upgradeLevel}/${selected.maxUpgradeLevel}`));
    if (selected.atMax) {
      wrap.appendChild(el("div", { color: CSS.gold, marginTop: "6px", fontSize: "11px" }, "Max upgrade reached."));
    } else if (!selected.upgradeableStats.length) {
      wrap.appendChild(el("div", { color: CSS.ash, marginTop: "6px", fontSize: "11px" }, "No existing stats can be upgraded."));
    } else {
      const choices = el("div", { marginTop: "4px" });
      for (const statKey of selected.upgradeableStats) choices.appendChild(this.button(`+1 ${statKey}`, () => this.upgradeForgeStat(statKey)));
      wrap.appendChild(choices);
    }
    if (this.forgeMessage) wrap.appendChild(el("div", { color: CSS.gold, marginTop: "6px", fontSize: "11px", lineHeight: "1.35" }, this.forgeMessage));
    return wrap;
  }

  render() {
    this.root.innerHTML = "";
    this.root.appendChild(el("div", {
      color: CSS.gold,
      font: "700 15px 'Cinzel', serif",
      letterSpacing: "1px",
      marginBottom: "6px",
    }, "Loot Skeleton v1"));
    this.root.appendChild(el("div", { color: CSS.ash, lineHeight: "1.35", marginBottom: "6px" },
      "Dev-only equipment test panel. This is not the Forge or final loot UI."));

    this.root.appendChild(this.button("Grant starter reward", () => {
      this.mutate((state) => grantStarterLoot(state));
    }));

    const data = getLootViewerData(this.state);
    const itemStats = data.itemStats;
    const setStats = data.setStats;
    const finalStats = data.totalStats;
    this.root.appendChild(el("div", {
      marginTop: "10px",
      padding: "7px",
      borderRadius: "6px",
      background: "rgba(110,230,90,0.08)",
      color: CSS.plague,
      lineHeight: "1.45",
    }, `Final: ${LOOT_STAT_KEYS.map((key) => `${key}: ${finalStats[key]}`).join(" | ")}`));
    this.root.appendChild(el("div", { color: CSS.ash, fontSize: "11px", lineHeight: "1.35", marginTop: "5px" },
      `Items: ${LOOT_STAT_KEYS.map((key) => `${key}: ${itemStats[key]}`).join(" | ")}`));
    this.root.appendChild(el("div", { color: CSS.gold, fontSize: "11px", lineHeight: "1.35", marginTop: "3px" },
      `Sets: ${LOOT_STAT_KEYS.map((key) => `${key}: ${setStats[key]}`).join(" | ")}`));

    const setLines = data.activeSetBonuses.length
      ? data.activeSetBonuses.map((bonus) => `${bonus.setName} ${bonus.label}`).join(" | ")
      : "No active set bonuses.";
    this.root.appendChild(el("div", { color: CSS.bone, fontSize: "11px", lineHeight: "1.35", marginTop: "5px" }, setLines));
    this.root.appendChild(this.renderRewards());
    this.root.appendChild(this.renderForge());

    const equipped = el("div", { marginTop: "10px" });
    equipped.appendChild(el("div", { color: CSS.gold, fontWeight: "700", marginBottom: "4px" }, "Equipped"));
    for (const slot of LOOT_EQUIPMENT_SLOTS) {
      const item = data.equippedItems[slot];
      const row = el("div", { color: item ? CSS.bone : CSS.ash, margin: "3px 0" },
        `${slot}: ${item ? item.name : "empty"}`);
      if (item) row.appendChild(this.button("Unequip", () => this.mutate((state) => unequipLootSlot(state, slot))));
      equipped.appendChild(row);
    }
    this.root.appendChild(equipped);

    const items = el("div", { marginTop: "10px" });
    items.appendChild(el("div", { color: CSS.gold, fontWeight: "700", marginBottom: "4px" }, `Inventory (${this.state.items.length})`));
    if (!this.state.items.length) items.appendChild(el("div", { color: CSS.ash }, "No skeleton items yet."));
    for (const item of this.state.items) {
      const card = el("div", {
        padding: "7px",
        margin: "6px 0",
        borderRadius: "6px",
        border: `1px solid ${CSS.rot}`,
        background: "rgba(255,255,255,0.03)",
      });
      card.appendChild(el("div", { color: CSS.bone, fontWeight: "700" }, item.name));
      card.appendChild(el("div", { color: CSS.ash, fontSize: "11px" },
        `${item.slot} | ${item.rarity} | ilvl ${item.itemLevel}${item.setId ? " | " + item.setId : ""}`));
      card.appendChild(el("div", { color: CSS.plague, fontSize: "11px", marginTop: "2px" },
        LOOT_STAT_KEYS.filter((key) => item.stats[key]).map((key) => `+${item.stats[key]} ${key}`).join(" | ") || "No stats"));
      if (this.state.equipped[item.slot] === item.id) {
        card.appendChild(el("div", { color: CSS.gold, fontSize: "11px", marginTop: "6px", fontWeight: "700" }, "Equipped"));
      } else {
        card.appendChild(this.button("Equip", () => this.mutate((state) => equipLootItem(state, item.id))));
      }
      card.appendChild(this.button(this.selectedForgeItemId === item.id ? "Forging" : "Forge", () => this.selectForgeItem(item.id)));
      items.appendChild(card);
    }
    this.root.appendChild(items);
  }
}
