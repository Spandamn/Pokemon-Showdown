'use strict';

const RandomTeams = require('../../data/random-teams');

class RandomStaffBrosTeams extends RandomTeams {
	randomStaffBrosTeam() {
		let team = [];
		let variant = (this.random(2) === 1);
		let sets = {
			'Aelita': {
				species: 'Porygon-Z', ability: 'Protean', item: 'Life Orb', gender: 'N',
				moves: [['boomburst', 'moonblast'][this.random(2)], 'quiverdance', 'chatter'],
				signatureMove: "Energy Field",
				evs: {hp:4, spa:252, spe:252}, nature: 'Modest',
			},
			'Andy >_>': {
				species: 'Absol', ability: 'Justified', item: 'Absolite', gender: 'M',
				moves: ['Swords Dance', 'Sucker Punch', ['U-Turn', 'Knock Off'][this.random(2)]],
				signatureMove: "Pilfer",
				evs: {hp:252, atk: 252, spe:4}, nature: 'Adamant',
			},
			'Articblast': {
				species: 'Garbodor', ability: 'Speed Boost', item: 'Choice Band', gender: 'M',
				moves: ['acidspray', 'knockoff', 'earthquake'],
				signatureMove: "Trashalanche",
				evs: {atk: 252, spd:4, spe:252}, nature: 'Adamant',
			},
			'Astara': {
				species: 'Jirachi', ability: 'Cursed Body', item: ['Leftovers', 'Sitrus Berry'][this.random(2)], gender: 'F', shiny: true,
				moves: ['psystrike', 'moonblast', 'nastyplot', 'scald', 'recover'],
				signatureMove: 'Star Bolt Desperation',
				evs: {hp:4, spa:252, spe:252}, nature: 'Modest',
			},
			'AuzBat': {
				species: 'Golbat', ability: 'Regenerator', item: 'Eviolite', gender: 'M',
				moves: ['toxic', 'defog', ['superfang', 'bravebird'][this.random(2)]],
				signatureMove: "Fat Bat",
				evs: {hp:212, spd:240, spe:56}, nature: 'Careful',
			},
			'Beowulf': {
				species: 'Beedrill', ability: 'Download', item: 'Beedrillite', gender: 'M',
				moves: ['spikyshield', 'gunkshot', ['sacredfire', 'boltstrike', 'diamondstorm'][this.random(3)]],
				signatureMove: "Buzzing of the Storm",
				evs: {def:4, atk:252, spe:252}, nature: 'Jolly',
			},
			'EV': {
				species: 'Muk-Alola', ability: 'Unaware', item: 'Black Sludge', gender: 'M', // ask gender
				moves: [['Gunk Shot', 'Poison Jab'][this.random(2)], 'Recover', 'Coil'],
				signatureMove: 'Dark Aggro',
				evs: {hp: 252, spa: 252, spd: 4}, nature: 'Adamant',
			},
			'HoeenHero': {
				species: 'Ludicolo', ability: 'Swift Swim', item: 'Damp Rock', gender: 'M',
				moves: [['Hydro Pump', 'Scald'][this.random(2)], 'Giga Drain', 'Ice Beam'],
				signatureMove: 'Scripting',
				evs: {def: 4, spa: 252, spe: 252}, nature: 'Modest',
			},
			'imas': {
				species: 'Skarmory', ability: 'Flash Feather', item: 'imasium Z', gender: 'M',
				moves: ['Swords Dance', 'Taunt', 'Roost'],
				signatureMove: 'Accele Squawk',
				evs: {hp: 252, atk: 252, spe: 4}, nature: 'Adamant',
			},
			'innovamania': {
				species: 'Arceus', ability: 'Pick Up', item: 'Black Glasses', gender: 'M',
				moves: [['holdhands', 'trickortreat'][this.random(2)], ['swordsdance', 'agility'][this.random(2)], 'celebrate'],
				signatureMove: "Rage Quit",
				evs: {hp:4, atk:252, spe:252}, nature: 'Jolly',
			},
			'Joim': {
				species: 'Zapdos', ability:'Tinted Lens', item: 'Life Orb', gender: 'N',
				moves: ['Roost', 'Hurricane', ['Thunderbolt', 'Quiver Dance'][this.random(2)]],
				signatureMove: 'Retirement',
				evs: {hp: 4, spa: 252, spe: 252}, nature: 'Modest', //ask nature
			},
			'Kalalokki': {
				species: 'Wingull', ability: 'Swift Swim', item: ['Waterium Z', 'Electrium Z', 'Flyinium Z'][this.random(3)], gender: 'M',
				moves: ['hurricane', 'thunder', 'waterspout'],
				signatureMove: "Maelström",
				evs: {spa:252, spd:4, spe:252}, nature: 'Modest',
			},
			'kamikaze': {
				species: 'Staraptor', ability: 'Flash Feather', item: 'Choice Band', gender: 'M',
				moves: ['Brave Bird', 'Close Combat', ['Double Edge', 'U-Turn'][this.random(2)]],
				signatureMove: 'Kamikaze Rebirth',
				evs: {hp: 252, atk: 148, spe: 108}, nature: 'Adamant',
			},
			'Level 51': {
				species: 'Porygon2', ability: 'Trace', item: 'Eviolite',
				moves: ['Recover', ['Night Shade', 'Seismic Toss'][this.random(2)], ['Nature\'s Madness', 'Cosmic Power', 'Cotton Guard'][this.random(3)]],
				signatureMove: 'Next Level Strats',
				evs: {hp: 236, def: 220, spd: 48, spe: 4}, nature: 'Calm',
			},
			'Megazard': {
				species: 'Drampa', ability: 'Insensible', item: 'Leftovers', gender: 'M',
				moves: ['Roost', 'Calm Mind', 'Lava Plume'],
				signatureMove: 'Dragon\'s Wrath',
				evs: {hp: 248, def: 8, spd: 252}, nature: 'Calm',
			},
			'MochaMint': {
				species: 'Deerling', ability: 'Sturdy', item: 'Eviolite', gender: 'M', //needs confirmation
				moves: ['Protect', 'Nuzzle', 'U-Turn'],
				signatureMove: 'Car Accident',
				evs: {hp: 252, def: 4, spe: 252}, nature: 'Jolly',
			},
			'panpawn': {
				species: 'Cyndaquil', ability: 'Flash Fire', item: 'Leftovers', gender: 'M',
				moves: ['Eruption', 'Extrasensory', 'Facade'],
				signatureMove: 'LaFireBlaze420',
				nature: 'Adamant',
			},
			'Scotteh': {
				species: 'Suicune', ability: 'Fur Coat', item: 'Leftovers', gender: 'N',
				moves: ['Slack Off', 'Amnesia', 'Steam Eruption'],
				signatureMove: 'Geomagnetic Storm',
				evs: {def: 252, spa: 4, spe: 252}, nature: 'Bold',
			},
			'Temporaryanonymous': {
				species: 'Doublade', ability: 'Tough Claws', item: 'Eviolite',
				gender: 'M',
				moves: ['Swords Dance', 'Gear Grind', ['Sacred Sword', 'X-Scissor', 'Knock off'][this.random(3)]],
				signatureMove: 'SPOOPY EDGE CUT',
				evs: {atk: 252, hp: 252, def: 4}, nature: 'Adamant',
			},
			'Teremiare': {
				species: 'Zorua', ability: 'Super Prankster', item: 'Red Card', gender: 'M',
				moves: ['Topsy-Turvy', 'Taunt', 'Memento'],
				signatureMove: 'Baton Thief',
				evs: {hp: 252, def: 4, spe: 252}, nature: 'Timid',
			},
			'Trickster': {
				species: 'Hoopa', ability: 'Shadow Shield', item: 'Figy Berry',
				gender: 'M',
				moves: ['Inferno', 'Zap cannon', ['Dynamic Punch', 'Grass Whistle'][this.random(2)]],
				signatureMove: 'Event Horizon',
				evs: {hp: 252, atk: 4, spa: 252}, ivs: {spe: 0}, nature: 'Quiet', 
			},
			'xfix': {
				species: 'Xatu', ability: ['Magic Bounce', 'Prankster'][this.random(2)], item: 'Pomeg Berry', gender: 'M',
				moves: ['Substitute', ['Roost', 'Strength Sap'][this.random(2)], 'Thunder Wave'],
				signatureMove: 'glitzer popping',
				evs: {hp: 4, def: 252, spd: 252}, nature: 'Calm',
			},
			'Zod': {
				species: 'Oricorio-Pom-Pom', ability: 'Drizzle', item: 'Leftovers', gender: 'M', //needs confirmation
				moves: ['Quiver Dance', 'Thunder', 'Hurricane'],
				signatureMove: 'Cheerleading Squad',
				evs: {spa: 252, spd: 4, spe: 252}, nature: 'Modest',
			},
		};

		// Generate the team randomly.
		let pool = Object.keys(sets);
		while (team.length < 6 && pool.length) {
			let name = this.sampleNoReplace(pool);
			let set = sets[name];
			set.level = 100;
			set.name = name;
			if (!set.ivs) {
				set.ivs = {hp:31, atk:31, def:31, spa:31, spd:31, spe:31};
			} else {
				for (let iv in {hp:31, atk:31, def:31, spa:31, spd:31, spe:31}) {
					set.ivs[iv] = iv in set.ivs ? set.ivs[iv] : 31;
				}
			}
			// Assuming the hardcoded set evs are all legal.
			if (!set.evs) set.evs = {hp:84, atk:84, def:84, spa:84, spd:84, spe:84};
			set.moves = [this.sampleNoReplace(set.moves), this.sampleNoReplace(set.moves), this.sampleNoReplace(set.moves)].concat(set.signatureMove);
			team.push(set);
		}

		return team;
	}
}

module.exports = RandomStaffBrosTeams;
