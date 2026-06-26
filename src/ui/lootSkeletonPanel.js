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

const RARITY_COLORS = {
  common: "#d8d8d8",
  uncommon: CSS.plague,
  rare: "#6ea8ff",
  epic: "#b66cff",
  legendary: CSS.gold,
  mythic: "#ff6edb",
};

const rarityColor = (rarity = "common") => RARITY_COLORS[String(rarity).toLowerCase()] || CSS.bone;

export function lootItemStatsText(item) {
  const stats = LOOT_STAT_KEYS
    .filter((key) => Number(item?.stats?.[key] || 0) !== 0)
    .map((key) => `+${Number(item.stats[key] || 0)} ${key}`);
  return stats.length ? stats.join(" | ") : "No stats";
}

export function lootPanelAccessData({ devMode = false, visible = false } = {}) {
  return {
    title: devMode ? "Loot Dev Panel" : "Inventory / Forge",
    subtitle: devMode
      ? "Dev-only equipment and reward controls. Player inventory/Forge flow is shown below."
      : "Manage equipment and upgrade owned items. Debug rewards stay hidden.",
    debugControlsVisible: !!devMode,
    toggleLabel: visible ? "Close Inventory / Forge" : "Inventory / Forge",
  };
}

export function lootPanelItemRows(state, selectedItemId = null) {
  const lootState = createLootState(state);
  return lootState.items.map((item) => ({
    id: item.id,
    name: item.name,
    slot: item.slot,
    rarity: item.rarity,
    rarityColor: rarityColor(item.rarity),
    itemLevel: item.itemLevel,
    upgradeLevel: item.upgradeLevel,
    maxUpgradeLevel: item.maxUpgradeLevel,
    setId: item.setId,
    statsText: lootItemStatsText(item),
    selected: item.id === selectedItemId,
    equipped: lootState.equipped[item.slot] === item.id,
  }));
}

export function lootPanelForgeState(state, selectedItemId = null, availableGold = 0) {
  if (!selectedItemId) {
    return {
      status: "missing",
      message: "Select an owned item to upgrade it.",
      canUpgrade: false,
      selected: null,
      upgradeableStats: [],
      availableGold: Number(availableGold || 0),
    };
  }
  const lootState = createLootState(state);
  const selectedItem = lootState.items.find((item) => item.id === selectedItemId) || null;
  const forgeData = selectedItem
    ? getForgeViewerData(lootState, selectedItem.id)
    : { selected: null };
  const selected = forgeData.selected;
  if (!selected) {
    return {
      status: "missing",
      message: "Select an owned item to upgrade it.",
      canUpgrade: false,
      selected: null,
      upgradeableStats: [],
      availableGold: Number(availableGold || 0),
    };
  }
  const canAfford = Number(availableGold || 0) >= selected.cost;
  let status = "ready";
  let message = `Choose one existing stat to upgrade for ${selected.cost} Gold.`;
  if (selected.atMax) {
    status = "max";
    message = "This item is fully upgraded.";
  } else if (!selected.upgradeableStats.length) {
    status = "stat";
    message = "This item has no upgradeable stats yet.";
  } else if (!canAfford) {
    status = "gold";
    message = `Need ${selected.cost} Gold. You have ${Number(availableGold || 0)}.`;
  }
  return {
    status,
    message,
    canUpgrade: status === "ready",
    selected,
    upgradeableStats: selected.upgradeableStats.map((statKey) => ({
      statKey,
      label: `+1 ${statKey}`,
      disabled: status !== "ready",
      reason: status === "gold" ? "Not enough Gold" : status === "max" ? "Max level" : status === "stat" ? "No stat" : "",
    })),
    availableGold: Number(availableGold || 0),
  };
}

export class LootSkeletonPanel {
  constructor(root, { getState, onChange, getHero, getRewards, onDebugReward, onDebugEliteEncounter, onDebugBonebowEncounter, onDebugPlaguewickEncounter, onDebugAcolyteEncounter, devMode = false, initialOpen = false } = {}) {
    this.getState = getState || (() => this.state);
    this.onChange = onChange || (() => {});
    this.state = createLootState(this.getState?.());
    this.getHero = getHero || (() => null);
    this.getRewards = getRewards || (() => ({ claimedCount: 0, recent: [] }));
    this.devMode = !!devMode;
    this.visible = !!initialOpen;
    this.onDebugReward = this.devMode ? onDebugReward || null : null;
    this.onDebugEliteEncounter = this.devMode ? onDebugEliteEncounter || null : null;
    this.onDebugBonebowEncounter = this.devMode ? onDebugBonebowEncounter || null : null;
    this.onDebugPlaguewickEncounter = this.devMode ? onDebugPlaguewickEncounter || null : null;
    this.onDebugAcolyteEncounter = this.devMode ? onDebugAcolyteEncounter || null : null;
    this.selectedForgeItemId = null;
    this.forgeMessage = "";
    this.rewardMessage = "";
    this.toggleButton = el("button", {
      position: "absolute",
      right: "156px",
      bottom: "18px",
      zIndex: "18",
      padding: "8px 10px",
      borderRadius: "8px",
      border: `1px solid ${CSS.gold}`,
      background: "rgba(7,8,6,0.88)",
      color: CSS.gold,
      cursor: "pointer",
      font: "800 11px 'Cinzel', serif",
      letterSpacing: "0.4px",
    });
    this.toggleButton.onclick = () => this.toggle();
    root.appendChild(this.toggleButton);
    this.root = el("div", {
      position: "absolute",
      right: "14px",
      bottom: "76px",
      width: "min(340px, calc(100vw - 28px))",
      maxWidth: "calc(100vw - 28px)",
      maxHeight: "min(68vh, calc(100vh - 132px))",
      overflowY: "auto",
      overflowX: "hidden",
      overscrollBehavior: "contain",
      scrollbarGutter: "stable",
      zIndex: "18",
      padding: "12px",
      border: `1px solid ${CSS.gold}`,
      borderRadius: "8px",
      background: "rgba(7,8,6,0.88)",
      color: CSS.bone,
      font: "12px ui-sans-serif, system-ui",
      boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
    });
    this.root.addEventListener("wheel", (event) => event.stopPropagation(), { passive: true });
    this.root.addEventListener("mousedown", (event) => event.stopPropagation());
    this.root.addEventListener("contextmenu", (event) => event.preventDefault());
    root.appendChild(this.root);
    this.render();
  }

  setOpen(on) {
    this.visible = !!on;
    this.root.style.display = this.visible ? "block" : "none";
    const data = lootPanelAccessData({ devMode: this.devMode, visible: this.visible });
    this.toggleButton.textContent = data.toggleLabel;
  }

  open() {
    this.setOpen(true);
    this.refresh();
  }

  close() {
    this.setOpen(false);
  }

  toggle() {
    this.visible ? this.close() : this.open();
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

  spawnDebugEliteEncounter() {
    if (!this.onDebugEliteEncounter) return;
    const enemy = this.onDebugEliteEncounter();
    this.rewardMessage = enemy ? `Elite spawned: ${enemy.name || enemy.eliteId || "Gate-Bruiser"}.` : "Elite spawn failed.";
    this.render();
  }

  spawnDebugBonebowEncounter() {
    if (!this.onDebugBonebowEncounter) return;
    const enemy = this.onDebugBonebowEncounter();
    this.rewardMessage = enemy ? `Bonebow spawned: ${enemy.name || "Bonebow"}.` : "Bonebow spawn failed.";
    this.render();
  }

  spawnDebugPlaguewickEncounter() {
    if (!this.onDebugPlaguewickEncounter) return;
    const enemy = this.onDebugPlaguewickEncounter();
    this.rewardMessage = enemy ? `Plaguewick spawned: ${enemy.name || "Plaguewick"}.` : "Plaguewick spawn failed.";
    this.render();
  }

  spawnDebugAcolyteEncounter() {
    if (!this.onDebugAcolyteEncounter) return;
    const enemy = this.onDebugAcolyteEncounter();
    this.rewardMessage = enemy ? `Acolyte spawned: ${enemy.name || "Ossuary Acolyte"}.` : "Acolyte spawn failed.";
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

  button(label, onClick, opts = {}) {
    const button = el("button", {
      margin: "6px 6px 0 0",
      padding: opts.large ? "7px 10px" : "5px 8px",
      minHeight: "28px",
      borderRadius: "6px",
      border: `1px solid ${opts.active ? CSS.plague : CSS.gold}`,
      background: opts.active ? "rgba(110,230,90,0.2)" : opts.disabled ? "rgba(143,136,111,0.08)" : "rgba(200,161,74,0.16)",
      color: opts.disabled ? CSS.ash : CSS.bone,
      cursor: opts.disabled ? "not-allowed" : "pointer",
      font: "700 11px 'Cinzel', serif",
      opacity: opts.disabled ? "0.62" : "1",
      whiteSpace: "normal",
      textAlign: "center",
    }, label);
    button.disabled = !!opts.disabled;
    button.title = opts.title || "";
    button.onclick = opts.disabled ? null : onClick;
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
    if (this.onDebugEliteEncounter) wrap.appendChild(this.button("Spawn elite encounter", () => this.spawnDebugEliteEncounter()));
    if (this.onDebugBonebowEncounter) wrap.appendChild(this.button("Spawn Bonebow", () => this.spawnDebugBonebowEncounter()));
    if (this.onDebugPlaguewickEncounter) wrap.appendChild(this.button("Spawn Plaguewick", () => this.spawnDebugPlaguewickEncounter()));
    if (this.onDebugAcolyteEncounter) wrap.appendChild(this.button("Spawn Acolyte", () => this.spawnDebugAcolyteEncounter()));
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
    const forgeState = lootPanelForgeState(this.state, this.selectedForgeItemId, this.heroGold());
    const wrap = el("div", {
      marginTop: "10px",
      padding: "8px",
      borderRadius: "7px",
      border: `1px solid ${forgeState.canUpgrade ? "rgba(200,161,74,0.55)" : "rgba(143,136,111,0.35)"}`,
      background: "rgba(200,161,74,0.07)",
    });
    wrap.appendChild(el("div", { color: CSS.gold, fontWeight: "700", marginBottom: "4px" }, "Forge v1"));
    wrap.appendChild(el("div", { color: CSS.ash, fontSize: "11px", lineHeight: "1.35" },
      `+1 to an existing stat, max +5. Cost ${FORGE_UPGRADE_GOLD_COST} Gold. Marrow unaffected.`));
    wrap.appendChild(el("div", { color: CSS.bone, fontSize: "11px", lineHeight: "1.35", marginTop: "5px" },
      `Active hero Gold: ${this.heroGold()}`));
    if (this.devMode) wrap.appendChild(this.button("Dev +50 Gold", () => this.grantTestGold(50)));

    if (!forgeState.selected) {
      wrap.appendChild(el("div", { color: CSS.ash, marginTop: "8px", lineHeight: "1.35" }, forgeState.message));
      if (this.forgeMessage) wrap.appendChild(el("div", { color: CSS.gold, marginTop: "6px", fontSize: "11px" }, this.forgeMessage));
      return wrap;
    }

    const selected = forgeState.selected;
    this.selectedForgeItemId = selected.item.id;
    wrap.appendChild(el("div", { color: rarityColor(selected.item.rarity), fontWeight: "800", marginTop: "8px" }, selected.item.name));
    wrap.appendChild(el("div", { color: CSS.ash, fontSize: "11px", lineHeight: "1.35" },
      `${selected.item.slot} | ${selected.item.rarity} | +${selected.upgradeLevel}/${selected.maxUpgradeLevel}`));
    wrap.appendChild(el("div", { color: forgeState.canUpgrade ? CSS.plague : forgeState.status === "gold" ? CSS.blood : CSS.gold, marginTop: "6px", fontSize: "11px", lineHeight: "1.35", fontWeight: "700" }, forgeState.message));
    if (forgeState.upgradeableStats.length) {
      const choices = el("div", { marginTop: "4px" });
      for (const option of forgeState.upgradeableStats) {
        choices.appendChild(this.button(option.label, () => this.upgradeForgeStat(option.statKey), {
          disabled: option.disabled,
          title: option.reason,
          large: true,
        }));
      }
      wrap.appendChild(choices);
    }
    if (this.forgeMessage) wrap.appendChild(el("div", { color: CSS.gold, marginTop: "6px", fontSize: "11px", lineHeight: "1.35" }, this.forgeMessage));
    return wrap;
  }

  render() {
    this.root.innerHTML = "";
    const access = lootPanelAccessData({ devMode: this.devMode, visible: this.visible });
    const header = el("div", { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "6px" });
    header.appendChild(el("div", {
      color: CSS.gold,
      font: "700 15px 'Cinzel', serif",
      letterSpacing: "1px",
    }, access.title));
    header.appendChild(this.button("Close", () => this.close()));
    this.root.appendChild(header);
    this.root.appendChild(el("div", { color: CSS.ash, lineHeight: "1.35", marginBottom: "6px" }, access.subtitle));

    if (this.devMode) this.root.appendChild(this.button("Grant starter reward", () => {
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
      const row = el("div", {
        color: item ? CSS.bone : CSS.ash,
        margin: "4px 0",
        padding: "5px 6px",
        borderRadius: "6px",
        border: `1px solid ${item ? "rgba(200,161,74,0.34)" : "rgba(143,136,111,0.18)"}`,
        background: item ? "rgba(200,161,74,0.06)" : "rgba(143,136,111,0.04)",
        lineHeight: "1.35",
      });
      row.appendChild(el("div", { fontSize: "11px", color: CSS.ash, textTransform: "uppercase", letterSpacing: "0.5px" }, slot));
      row.appendChild(el("div", { color: item ? rarityColor(item.rarity) : CSS.ash, fontWeight: "700" }, item ? item.name : "empty"));
      if (item) row.appendChild(this.button("Unequip", () => this.mutate((state) => unequipLootSlot(state, slot))));
      equipped.appendChild(row);
    }
    this.root.appendChild(equipped);

    const items = el("div", { marginTop: "10px" });
    items.appendChild(el("div", { color: CSS.gold, fontWeight: "700", marginBottom: "4px" }, `Inventory (${this.state.items.length})`));
    if (!this.state.items.length) items.appendChild(el("div", { color: CSS.ash }, "No skeleton items yet."));
    const itemRows = lootPanelItemRows(this.state, this.selectedForgeItemId);
    for (const row of itemRows) {
      const card = el("div", {
        padding: "8px",
        margin: "6px 0",
        borderRadius: "6px",
        border: `1px solid ${row.selected ? CSS.plague : row.equipped ? CSS.gold : row.rarityColor}`,
        background: row.selected
          ? "rgba(110,230,90,0.1)"
          : row.equipped
            ? "rgba(200,161,74,0.08)"
            : "rgba(255,255,255,0.03)",
        boxShadow: row.selected ? "0 0 0 1px rgba(110,230,90,0.22) inset" : "none",
      });
      const titleRow = el("div", { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" });
      titleRow.appendChild(el("div", { color: row.rarityColor, fontWeight: "800", lineHeight: "1.2" }, row.name));
      if (row.equipped) {
        titleRow.appendChild(el("div", {
          color: CSS.gold,
          border: `1px solid rgba(200,161,74,0.55)`,
          borderRadius: "999px",
          padding: "2px 6px",
          fontSize: "10px",
          fontWeight: "800",
          flexShrink: "0",
        }, "Equipped"));
      }
      card.appendChild(titleRow);
      card.appendChild(el("div", { color: CSS.ash, fontSize: "11px", lineHeight: "1.35", marginTop: "3px" },
        `${row.slot} | ${row.rarity} | ilvl ${row.itemLevel} | +${row.upgradeLevel}/${row.maxUpgradeLevel}${row.setId ? " | " + row.setId : ""}`));
      card.appendChild(el("div", { color: CSS.plague, fontSize: "11px", lineHeight: "1.35", marginTop: "3px" }, row.statsText));
      const actions = el("div", { display: "flex", flexWrap: "wrap", gap: "0 2px", marginTop: "2px" });
      if (row.equipped) {
        actions.appendChild(this.button("Unequip", () => this.mutate((state) => unequipLootSlot(state, row.slot))));
      } else {
        actions.appendChild(this.button("Equip", () => this.mutate((state) => equipLootItem(state, row.id))));
      }
      actions.appendChild(this.button(row.selected ? "Selected for Forge" : "Select for Forge", () => this.selectForgeItem(row.id), {
        active: row.selected,
      }));
      card.appendChild(actions);
      items.appendChild(card);
    }
    this.root.appendChild(items);
    this.setOpen(this.visible);
  }
}
