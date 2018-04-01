'use strict';

exports.BattleMovedex = {
	/**
	 * Artificial priority
	 *
	 */
	pursuit: {
		inherit: true,
		beforeTurnCallback: function (pokemon, target) {
			let linkedMoves = pokemon.getLinkedMoves();
			if (linkedMoves.length && !linkedMoves.disabled) {
				if (linkedMoves[0] === 'pursuit' && linkedMoves[1] !== 'pursuit') return;
				if (linkedMoves[0] !== 'pursuit' && linkedMoves[1] === 'pursuit') return;
			}

			target.side.addSideCondition('pursuit', pokemon);
			if (!target.side.sideConditions['pursuit'].sources) {
				target.side.sideConditions['pursuit'].sources = [];
			}
			target.side.sideConditions['pursuit'].sources.push(pokemon);
		},
	},
	mefirst: {
		inherit: true,
		onTryHit: function (target, pokemon) {
			let action = this.willMove(target);
			if (action) {
				let noMeFirst = [
					'chatter', 'counter', 'covet', 'focuspunch', 'mefirst', 'metalburst', 'mirrorcoat', 'struggle', 'thief',
				];
				// Mod-specific: Me First copies the first move in the link
				let move = this.getMove(action.linked ? action.linked[0] : action.move);
				if (move.category !== 'Status' && !noMeFirst.includes(move)) {
					pokemon.addVolatile('mefirst');
					this.useMove(move, pokemon, target);
					return null;
				}
			}
			return false;
		},
	},

	/**
	 *	Sucker Punch
	 *	Will miss on two linked Status moves
	 *
	 */

	suckerpunch: {
		inherit: true,
		onTry: function (source, target) {
			let action = this.willMove(target);
			if (!action || action.choice !== 'move') {
				this.attrLastMove('[still]');
				this.add('-fail', source);
				return null;
			}
			if (target.volatiles.mustrecharge && target.volatiles.mustrecharge.duration < 2) {
				// Duration may not be lower than 2 if Sucker Punch is used as a low-priority move
				// i.e. if Sucker Punch is linked with a negative priority move
				this.attrLastMove('[still]');
				this.add('-fail', source);
				return null;
			}
			if (!action.linked && action.move.category === 'Status' && action.move.id !== 'mefirst') {
				this.attrLastMove('[still]');
				this.add('-fail', source);
				return null;
			}

			for (let i = 0; i < action.linked.length; i++) {
				let linkedMove = this.getMove(action.linked[i]);
				if (linkedMove.category !== 'Status' || linkedMove.id === 'mefirst') return;
			}
			this.attrLastMove('[still]');
			this.add('-fail', source);
			return null;
		},
	},

	/**
	 * Mimic and Sketch
	 * When any of them is linked, the link will get updated for the new move
	 * They will copy the last absolute single move used by the foe.
	 *
	 **/

	sketch: {
		inherit: true,
		onHit: function (target, source) {
			let disallowedMoves = ['chatter', 'sketch', 'struggle'];
			let lastMove = target.getLastMoveAbsolute();
			if (source.transformed || !lastMove || disallowedMoves.includes(lastMove) || source.moves.indexOf(lastMove) >= 0) return false;
			let sketchIndex = source.moves.indexOf('sketch');
			if (sketchIndex < 0) return false;
			let move = this.getMove(lastMove);
			let sketchedMove = {
				move: move.name,
				id: move.id,
				pp: move.pp,
				maxpp: move.pp,
				target: move.target,
				disabled: false,
				used: false,
			};
			source.moveSlots[sketchIndex] = sketchedMove;
			source.baseMoveSlots[sketchIndex] = sketchedMove;
			this.add('-activate', source, 'move: Sketch', move.name);
		},
	},
	mimic: {
		inherit: true,
		onHit: function (target, source) {
			let disallowedMoves = ['chatter', 'mimic', 'sketch', 'struggle', 'transform'];
			let lastMove = target.getLastMoveAbsolute();
			if (source.transformed || !lastMove || disallowedMoves.includes(lastMove) || source.moves.indexOf(lastMove) >= 0) return false;
			let mimicIndex = source.moves.indexOf('mimic');
			if (mimicIndex < 0) return false;
			let move = this.getMove(lastMove);
			source.moveSlots[mimicIndex] = {
				move: move.name,
				id: move.id,
				pp: move.pp,
				maxpp: move.pp,
				target: move.target,
				disabled: false,
				used: false,
				virtual: true,
			};
			this.add('-start', source, 'Mimic', move.name);
		},
	},

	/**
	 * Copycat and Mirror Move
	 * Copy/call the last absolute move used by the target
	 *
	 */

	copycat: {
		inherit: true,
		onHit: function (pokemon) {
			let noCopycat = ['assist', 'banefulbunker', 'bestow', 'chatter', 'circlethrow', 'copycat', 'counter', 'covet', 'destinybond', 'detect', 'dragontail', 'endure', 'feint', 'focuspunch', 'followme', 'helpinghand', 'mefirst', 'metronome', 'mimic', 'mirrorcoat', 'mirrormove', 'naturepower', 'protect', 'ragepowder', 'roar', 'sketch', 'sleeptalk', 'snatch', 'struggle', 'switcheroo', 'thief', 'transform', 'trick', 'whirlwind'];
			let lastMove = pokemon.getLastMoveAbsolute();
			if (!lastMove || noCopycat.includes(lastMove) || this.getMove(lastMove).isZ) {
				return false;
			}
			this.useMove(lastMove, pokemon);
		},
	},
	mirrormove: {
		inherit: true,
		onTryHit: function (target, pokemon) {
			let lastMove = target.getLastMoveAbsolute();
			if (!lastMove || !this.getMove(lastMove).flags['mirror']) {
				return false;
			}
			this.useMove(lastMove, pokemon, target);
			return null;
		},
	},
	// Yo Kris fam, i've updated the code till here; mind doin the rest?
	/**
	 * Disable, Encore and Torment
	 * Disabling effects
	 *
	 */

	disable: {
		inherit: true,
		effect: {
			duration: 4,
			noCopy: true, // doesn't get copied by Baton Pass
			onStart: function (pokemon) {
				let lastMove = pokemon.getLastMoveAbsolute();
				if (!this.willMove(pokemon)) {
					this.effectData.duration++;
				}
				if (!lastMove) {
					this.debug('pokemon hasn\'t moved yet');
					return false;
				}
				let moves = pokemon.moveset;
				for (let i = 0; i < moves.length; i++) {
					if (moves[i].id === lastMove) {
						if (!moves[i].pp) {
							this.debug('Move out of PP');
							return false;
						} else {
							this.add('-start', pokemon, 'Disable', moves[i].move);
							this.effectData.move = lastMove;
							return;
						}
					}
				}
				this.debug('Move doesn\'t exist ???');
				return false;
			},
			onResidualOrder: 14,
			onEnd: function (pokemon) {
				this.add('-end', pokemon, 'Disable');
			},
			onBeforeMovePriority: 7,
			onBeforeMove: function (attacker, defender, move) {
				if (move.id === this.effectData.move) {
					this.add('cant', attacker, 'Disable', move);
					return false;
				}
			},
			onDisableMove: function (pokemon) {
				let moves = pokemon.moveset;
				for (let i = 0; i < moves.length; i++) {
					if (moves[i].id === this.effectData.move) {
						pokemon.disableMove(moves[i].id);
					}
				}
			},
		},
	},
	encore: {
		inherit: true,
		effect: {
			duration: 3,
			onStart: function (target) {
				let noEncore = {encore:1, mimic:1, mirrormove:1, sketch:1, struggle:1, transform:1};
				let lastMove = target.getLastMoveAbsolute();
				let moveIndex = target.moves.indexOf(lastMove);
				if (!lastMove) {
					// it failed
					delete target.volatiles['encore'];
					return false;
				}
				if (target.hasLinkedMove(lastMove)) {
					// TODO: Check instead whether the last executed move was linked
					let linkedMoves = target.getLinkedMoves();
					if (noEncore[linkedMoves[0]] || noEncore[linkedMoves[1]] || target.moveset[0].pp <= 0 || target.moveset[1].pp <= 0) {
						// it failed
						delete target.volatiles['encore'];
						return false;
					}
					this.effectData.move = linkedMoves;
				} else {
					if (noEncore[lastMove] || (target.moveset[moveIndex] && target.moveset[moveIndex].pp <= 0)) {
						// it failed
						delete target.volatiles['encore'];
						return false;
					}
					this.effectData.move = lastMove;
				}
				this.effectData.turnsActivated = {};
				this.add('-start', target, 'Encore');
				if (!this.willMove(target)) {
					this.effectData.duration++;
				}
			},
			onOverrideDecision: function (pokemon, target, move) {
				if (!this.effectData.turnsActivated[this.turn]) {
					// Initialize Encore effect for this turn
					this.effectData.turnsActivated[this.turn] = 0;
				} else if (this.effectData.turnsActivated[this.turn] >= (Array.isArray(this.effectData.move) ? this.effectData.move.length : 1)) {
					// Finish Encore effect for this turn
					return;
				}
				this.effectData.turnsActivated[this.turn]++;
				if (!Array.isArray(this.effectData.move)) {
					let nextDecision = this.willMove(pokemon);
					if (nextDecision) this.queue.splice(this.queue.indexOf(nextDecision), 1);
					if (move.id !== this.effectData.move) return this.effectData.move;
					return;
				}

				// Locked into a link
				switch (this.effectData.turnsActivated[this.turn]) {
				case 1: {
					if (!this.willMove(pokemon)) {
						let pseudoDecision = {choice: 'move', move: this.effectData.move[1], targetLoc: this.currentDecision.targetLoc, pokemon: this.currentDecision.pokemon, targetPosition: this.currentDecision.targetPosition, targetSide: this.currentDecision.targetSide};
						this.queue.unshift(pseudoDecision);
					}
					if (this.effectData.move[0] !== move.id) return this.effectData.move[0];
					return;
				}

				case 2:
					if (this.effectData.move[1] !== move.id) return this.effectData.move[1];
					return;
				}
			},
			onResidualOrder: 13,
			onResidual: function (target) {
				// early termination if you run out of PP
				let lastMove = target.getLastMoveAbsolute();

				let index = target.moves.indexOf(lastMove);
				if (index === -1) return; // no last move

				if (target.hasLinkedMove(lastMove)) {
					// TODO: Check instead whether the last executed move was linked
					if (target.moveset[0].pp <= 0 || target.moveset[1].pp <= 0) {
						delete target.volatiles.encore;
						this.add('-end', target, 'Encore');
					}
				} else {
					if (target.moveset[index].pp <= 0) {
						delete target.volatiles.encore;
						this.add('-end', target, 'Encore');
					}
				}
			},
			onEnd: function (target) {
				this.add('-end', target, 'Encore');
			},
			onDisableMove: function (pokemon) {
				if (!this.effectData.move) return; // ??
				if (!Array.isArray(this.effectData.move)) {
					if (!pokemon.hasMove(this.effectData.move)) return;
					for (let i = 0; i < pokemon.moveset.length; i++) {
						if (pokemon.moveset[i].id !== this.effectData.move) {
							pokemon.disableMove(pokemon.moveset[i].id);
						}
					}
				} else {
					for (let i = 0; i < this.effectData.move.length; i++) {
						if (!pokemon.hasMove(this.effectData.move[i])) return;
					}
					for (let i = this.effectData.move.length; i < pokemon.moveset.length; i++) {
						if (this.effectData.move.indexOf(pokemon.moveset[i].id) >= 0) continue;
						pokemon.disableMove(pokemon.moveset[i].id);
					}
				}
			},
		},
	},
	torment: {
		inherit: true,
		effect: {
			onStart: function (pokemon) {
				this.add('-start', pokemon, 'Torment');
			},
			onEnd: function (pokemon) {
				this.add('-end', pokemon, 'Torment');
			},
			onDisableMove: function (pokemon) {
				let lastMove = pokemon.lastMove;
				if (lastMove === 'struggle') return;

				if (Array.isArray(lastMove)) {
					for (let i = 0; i < lastMove.length; i++) {
						pokemon.disableMove(lastMove[i]);
					}
				} else {
					pokemon.disableMove(lastMove);
				}
			},
		},
	},

	/**
	 * Spite and Grudge
	 * Decrease the PP of the last absolute move used by the target
	 * Also, Grudge's effect won't be removed by its linked move, if any
	 *
	 */

	grudge: {
		inherit: true,
		effect: {
			onStart: function (pokemon) {
				this.add('-singlemove', pokemon, 'Grudge');
			},
			onFaint: function (target, source, effect) {
				this.debug('Grudge detected fainted pokemon');
				if (!source || !effect) return;
				if (effect.effectType === 'Move') {
					let lastMove = source.getLastMoveAbsolute();
					for (let i = 0; i < source.moveset.length; i++) {
						if (source.moveset[i].id === lastMove) {
							source.moveset[i].pp = 0;
							this.add('-activate', source, 'Grudge', this.getMove(lastMove).name);
						}
					}
				}
			},
			onBeforeMovePriority: 100,
			onBeforeMove: function (pokemon) {
				if (pokemon.moveThisTurn) return; // Second stage of a Linked move
				this.debug('removing Grudge before attack');
				pokemon.removeVolatile('grudge');
			},
		},
	},
	spite: {
		inherit: true,
		onHit: function (target) {
			let lastMove = target.getLastMoveAbsolute();
			if (target.deductPP(lastMove, 4)) {
				this.add("-activate", target, 'move: Spite', lastMove, 4);
				return;
			}
			return false;
		},
	},

	/**
	 * Rollout and Ice Ball
	 *
	 */

	rollout: {
		inherit: true,
		// Mod-specific: default mechanics
	},
	iceball: {
		inherit: true,
		// Mod-specific: default mechanics
	},

	/**
	 * Other moves that check `pokemon.lastMove`
	 * (may behave counter-intuitively if left unmodded)
	 *
	 **/

	conversion2: {
		inherit: true,
		onHit: function (target, source) {
			let lastMove = target.getLastMoveAbsolute();
			if (!lastMove) return false;
			let possibleTypes = [];
			let attackType = this.getMove(lastMove).type;
			for (let type in this.data.TypeChart) {
				if (source.hasType(type) || target.hasType(type)) continue;
				let typeCheck = this.data.TypeChart[type].damageTaken[attackType];
				if (typeCheck === 2 || typeCheck === 3) {
					possibleTypes.push(type);
				}
			}
			if (!possibleTypes.length) {
				return false;
			}
			let type = possibleTypes[this.random(possibleTypes.length)];

			if (!source.setType(type)) return false;
			this.add('-start', source, 'typechange', type);
		},
	},
	destinybond: {
		inherit: true,
		effect: {
			onStart: function (pokemon) {
				this.add('-singlemove', pokemon, 'Destiny Bond');
			},
			onFaint: function (target, source, effect) {
				if (!source || !effect) return;
				if (effect.effectType === 'Move' && !effect.isFutureMove) {
					this.add('-activate', target, 'Destiny Bond');
					source.faint();
				}
			},
			onBeforeMovePriority: 100,
			onBeforeMove: function (pokemon, target, move) {
				// Second stage of a Linked move does not remove Destiny Bond
				if (pokemon.moveThisTurn) return;
				this.debug('removing Destiny Bond before attack');
				pokemon.removeVolatile('destinybond');
			},
		},
	},
	trumpcard: {
		inherit: true,
		basePowerCallback: function (pokemon) {
			let move = pokemon.getMoveData(pokemon.getLastMoveAbsolute()); // Account for calling Trump Card via other moves
			switch (move.pp) {
			case 0:
				return 200;
			case 1:
				return 80;
			case 2:
				return 60;
			case 3:
				return 50;
			default:
				return 40;
			}
		},
	},
	uproar: {
		inherit: true,
		// Mod-specific: default mechanics
	},

	/**
	 * Moves that check `pokemon.moveThisTurn`
	 * (may behave counter-intuitively if left unmodded)
	 *
	 **/

	 fusionbolt: {
		inherit: true,
		onBasePower: function (basePower, pokemon) {
			let actives = pokemon.side.active;
			for (let i = 0; i < actives.length; i++) {
				if (actives[i] && actives[i].checkMoveThisTurn('fusionflare')) {
					this.debug('double power');
					return this.chainModify(2);
				}
			}
		},
	 },
	 fusionflare: {
		inherit: true,
		onBasePower: function (basePower, pokemon) {
			let actives = pokemon.side.active;
			for (let i = 0; i < actives.length; i++) {
				if (actives[i] && actives[i].checkMoveThisTurn('fusionbolt')) {
					this.debug('double power');
					return this.chainModify(2);
				}
			}
		},
	 },

	/**
	 * Moves that should clean the house after running
	 * (but aren't doing so in standard for whatever reason)
	 */

	beatup: {
		inherit: true,
		onAfterMove: function (pokemon) {
			pokemon.removeVolatile('beatup');
		},
	},
	triplekick: {
		inherit: true,
		onAfterMove: function (pokemon) {
			pokemon.removeVolatile('triplekick');
		},
	},

	/**
	 * Moves that should clean the house if they aren't run
	 *
	 */

	 furycutter: {
		inherit: true,
		effect: {
			duration: 2,
			onStart: function () {
				this.effectData.multiplier = 1;
			},
			onRestart: function () {
				if (this.effectData.multiplier < 4) {
					this.effectData.multiplier <<= 1;
				}
				this.effectData.duration = 2;
			},
			onBeforeMove: function (pokemon, target, move) {
				if (move.id !== 'furycutter') pokemon.removeVolatile('furycutter');
			},
		},
	 },

	/**
	 * First Law of PokÃ©mon Simulation:
	 * Always make sure that Sky Drop works
	 *
	 */

	 skydrop: {
		inherit: true,
		effect: {
			duration: 2,
			onDragOut: false,
			onSourceDragOut: false,
			onFoeModifyPokemon: function (defender) {
				if (defender !== this.effectData.source) return;
				defender.trapped = true;
			},
			onFoeBeforeMovePriority: 11,
			onFoeBeforeMove: function (attacker, defender, move) {
				if (attacker === this.effectData.source) {
					this.debug('Sky drop nullifying.');
					return null;
				}
			},
			onRedirectTarget: function (target, source, source2) {
				if (source !== this.effectData.target) return;
				if (this.effectData.source.fainted) return;
				return this.effectData.source;
			},
			onAnyAccuracy: function (accuracy, target, source, move) {
				// both user and target of Sky Drop avoid moves, yet
				// not moves targetting themselves (Linked)

				if (target !== this.effectData.target && target !== this.effectData.source) {
					return;
				}
				if (source === this.effectData.target && target === this.effectData.source) {
					return;
				}
				if (source === target) return;

				if (move.id === 'gust' || move.id === 'twister') {
					return;
				}
				if (move.id === 'skyuppercut' || move.id === 'thunder' || move.id === 'hurricane' || move.id === 'smackdown' || move.id === 'thousandarrows' || move.id === 'helpinghand') {
					return;
				}
				if (source.hasAbility('noguard') || target.hasAbility('noguard')) {
					return;
				}
				if (source.volatiles['lockon'] && target === source.volatiles['lockon'].source) return;
				return 0;
			},
			onAnyBasePower: function (basePower, target, source, move) {
				if (target !== this.effectData.target && target !== this.effectData.source) {
					return;
				}
				if (source === this.effectData.target && target === this.effectData.source) {
					return;
				}
				if (move.id === 'gust' || move.id === 'twister') {
					return this.chainModify(2);
				}
			},
			onFaint: function (target) {
				if (target.volatiles['skydrop'] && target.volatiles['twoturnmove'].source) {
					this.add('-end', target.volatiles['twoturnmove'].source, 'Sky Drop', '[interrupt]');
				}
			},
		},
	},
};
