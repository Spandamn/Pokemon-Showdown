'use strict';

exports.BattleStatuses = {
	aelita: {
		exists: true,
		onStart: function (target, source) {
			this.add('c|%Aelita|Transfer, Aelita. Scanner, Aelita. Virtualization!');
			this.boost({spe: 1}, source);
		},
		onFaint: function () {
			this.add('c|%Aelita|CODE: LYOKO. Tower deactivated...');
		},
	},
	andy: {
		exists: true,
		onUpdate: function (pokemon) {
			let name = toId(pokemon.name);
			if (pokemon.template.isMega) {
				if (name === 'andy' && pokemon.getAbility().id === 'magicbounce') {
					pokemon.setAbility('Huge Power'); //change to adaptability if to strong
					this.add('-ability', pokemon, 'Huge Power'); //change to adaptability if to strong
				}
			}
		},
		onStart: function () {
			this.add('c|@AndrewGoncel >_>|AHAM!!!');
		},
		onFaint: function () {
			this.add('c|@AndrewGoncel >_>|>_>');
		},
		onSwitchOut: function () {
			this.add('c|@AndrewGoncel >_>|:<');
		},
		
	},
	articblast: {
		exists: true,
		onStart: function () {
			this.add('c|%Articblast|THIS IS MY TRASH FRIEND');
		},
		onFaint: function () {
			this.add('c|%Articblast|o');
		},
	},
	astara: {
		exists: true,
		onStart: function () {
			this.add('c|%Ast☆arA|I\'d rather take a nap, I hope you won\'t be a petilil shit, Eat some rare candies and get on my level.');
		},
		onFaint: function () {
			let sentences = ['/me twerks into oblivion', 'good night ♥', 'Astara Vista Baby'];
			this.add('c|%Ast☆arA|' + sentences[this.random(3)]);
		},
	},
	auzbat: {
		exists: true,
		onStart: function () {
			this.add('c|%AuzBat|Smith is better than Kohli');
		},
		onFaint: function () {
			this.add('c|%AuzBat|... at least Smith doesn\'t average less than 14 in England');
		},
	},
	beowulf: {
		exists: true,
		onSwitchIn: function () {
			this.add('c|@Beowulf|Grovel peasant, you are in the presence of the RNGesus');
		},
		onFaint: function () {
			this.add('c|@Beowulf|There is no need to be mad');
		},
	},
	ev: {
		exists: true,
		onStart: function () {
			this.add('c|~EV|nice boosts');
		},
		onFaint: function () {
			this.add('c|~EV|muk off');
		},
	},
	level51: {
		exists: true,
		onStart: function () {
			this.add('c|@Level 51|Calculating chance of victory!');
		},
		onFaint: function () {
			this.add('c|@Level 51|IndexError: list index out of range');
		},
	},
	megazard: {
		exists: true,
		onStart: function () {
			this.add('c|%Megazard|Thank you for choosing Drampa™');
		},
		onFaint: function () {
			this.add('c|%Megazard|Please send any feedback to your local Drampa™ distributor.');
		},
		onSwitchOut: function () {
			this.add('c|%Megazard|The Drampa™ product is not under warranty.');
		},
	},
	hoeenhero: {
		exists: true,
		onStart: function () {
			this.add('c|@HoeenHero|I have cheat codes!');
		},
		onFaint: function () {
			this.add('c|@HoeenHero|No! My cheats wern\'t enough ;-;');
		},
	},
	imas: {
		exists: true,
		onStart: function () {
			this.add('c|%imas|hlo im flyboy220');
		},
		onFaint: function () {
			this.add('c|%imas|bg no re');
		},
		onSwitchOut: function () {
			this.add('c|%imas|ok');
		},
	},
	innovamania: {
		exists: true,
		onStart: function (pokemon) {
			let sentences = ['Don\'t take this seriously', 'These Black Glasses sure look cool', 'Ready for some fun?( ͡° ͜ʖ ͡°)', '( ͡° ͜ʖ ͡°'];
			this.add('c|@innovamania|' + sentences[this.random(4)]);
			this.boost({atk: 6, def: 6, spa: 6, spd: 6, spe: 6, accuracy: 6}, pokemon);
		},
		onFaint: function () {
			let sentences = ['Did you rage quit?', 'How\'d you lose with this set?'];
			this.add('c|@innovamania|' + sentences[this.random(2)]);
		},
	},
	kalalokki: {
		exists: true,
		onStart: function () {
			this.add('c|%kalalokki|(•_•)');
			this.add('c|%Kalalokki|( •_•)>⌐■-■');
			this.add('c|%Kalalokki|(⌐■_■)');
			this.setWeather('raindance');
		},
		onFaint: function () {
			this.add('c|%kalalokki|(•_•)');
			this.add('c|%Kalalokki|( •_•)>⌐■-■');
			this.add('c|%Kalalokki|(x_x)');
		},
	},
	kamikaze: {
		exists: true,
		onStart: function () {
			this.add('c|&kamikaze|Omae Wa Mou Shindeiru');
		},
		onFaint: function () {
			this.add('c|&kamikaze|NANI!');
		},
	},
	panpawn: {
		exists: true,
		onStart: function () {
			this.add('c|%panpawn|hello darkness my old friend,,,');
		},
		onFaint: function () {
			this.add('c|%panpawn|how RUDE ;_;7');
		},
		onSwitchOut: function () {
			this.add('c|%panpawn|... >:^(');
		},
	},
	scotteh: {
		exists: true,
		onStart: function () {
			this.add('c|&Scotteh|─────▄▄████▀█▄');
			this.add('c|&Scotteh|───▄██████████████████▄');
			this.add('c|&Scotteh|─▄█████.▼.▼.▼.▼.▼.▼.▼');
		},
		onFaint: function () {
			this.add('-message', '▄███████▄.▲.▲.▲.▲.▲.▲');
			this.add('-message', '█████████████████████▀▀');
		},
	},
	teremiare: {
		exists: true,
		onStart: function () {
			this.add('c|@Teremiare|(>\'o\')>');
		},
		onFaint: function () {
			this.add('c|@Teremiare|<(\'o\'<)');
		},
	},
	trickster: {
		exists: true,
		onStart: function () {
			this.add('c|@Trickster|(◕‿◕✿)');
		},
		onFaint: function () {
			this.add('c|@Trickster|(✖﹏✖✿)');
		},
		onSwitchOut: function () {
			this.add('c|@Trickster|(◠﹏◠✿)');
		},
	},
	xfix: {
		exists: true,
		onStart: function () {
			this.add('c|@xfix|apparently pomeg berry can be used as sturdy if you hold down+B');
		},
		onFaint: function (pokemon) {
			if (pokemon.pomegBerryTriggered) {
				this.add('c|@xfix|shouldn\'t pomeg berry protect from **all** hits... cheater');
			} else {
				this.add('c|@xfix|or was it about Pokemon capture... i get confused sometimes, next time i will be more prepared');
			}
		},
		onDamagePriority: -100,
		onDamage: function (damage, target, source, effect) {
			if (target.item === 'pomegberry' && target.hp === target.maxhp && damage >= target.hp && effect && effect.effectType === 'Move') {
				target.pomegBerryTriggered = true;
				this.add('-item', target, 'Pomeg Berry');
				return target.hp - 1;
			}
		},
		onTryHit: function (pokemon, target, move) {
			if (pokemon.item === 'pomegberry' && move.ohko) {
				pokemon.pomegBerryTriggered = true;
				this.add('-immune', pokemon, '[msg]', '[from] item: Pomeg Berry');
				return null;
			}
		},
	},
	zod: {
		exists: true,
		onStart: function () {
			this.add('c|%Zod|Get ready to go full out!');
		},
		onFaint: function (pokemon) {
			this.add(`c|%Zod|I'm sorry ${pokemon.side.foe.name}, but you're off the team for the rest of the season.`);
		},
		onSwitchOut: function () {
			this.add('c|%Zod|Pause the music I need some water');
		},
	},
};
