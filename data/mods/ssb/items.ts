export const BattleItems: {[k: string]: ModdedItemData} = {
	// phiwings99
	boatiumz: {
		name: "Boatium Z",
		isNonstandard: "Custom",
		onTakeItem: false,
		zMove: "Ghost of 1v1 Past",
		zMoveFrom: "Moongeist Beam",
		itemUser: ["Froslass"],
		gen: 8,
		desc: "If held by a Froslass with Moongeist Beam, it can use Ghost of 1v1 Past.",
	},
	// Robb576
	modium6z: {
		name: "Modium-6 Z",
		isNonstandard: "Custom",
		onTakeItem: false,
		zMove: "Integer Overflow",
		zMoveFrom: "Photon Geyser",
		itemUser: ["Necrozma-Ultra"],
		gen: 8,
		desc: "If held by a Robb576 with Photon Geyser, it can use Integer Overflow.",
	},
	// Custom support for Perish Song's ability (Snowstorm)
	safetygoggles: {
		inherit: true,
		onImmunity(type, pokemon) {
			if (['sandstorm', 'hail', 'snowstorm', 'powder'].includes(type)) return false;
		},
		desc: "Holder is immune to powder moves and damage from Sandstorm Hail, and Snowstorm.",
	},
};

exports.BattleItems = BattleItems;
