import { CSS } from "../config/palette.js";
import { LOOT_EQUIPMENT_SLOTS, LOOT_STAT_KEYS } from "../config/items.js";
import {
  createLootState,
  equipLootItem,
  getLootViewerData,
  grantStarterLoot,
  unequipLootSlot,
} from "../sim/lootModel.js";

const el = (tag, styles = {}, text = "") => {
  const node = document.createElement(tag);
  Object.assign(node.style, styles);
  if (text) node.textContent = text;
  return node;
};

export class LootSkeletonPanel {
  constructor(root, { getState, onChange } = {}) {
    this.getState = getState || (() => this.state);
    this.onChange = onChange || (() => {});
    this.state = createLootState(this.getState?.());
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
    fn(this.state);
    this.onChange(this.state);
    this.render();
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
      items.appendChild(card);
    }
    this.root.appendChild(items);
  }
}
