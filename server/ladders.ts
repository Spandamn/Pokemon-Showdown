/**
 * Matchmaker
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * This keeps track of challenges to battle made between users, setting up
 * matches between users looking for a battle, and starting new battles.
 *
 * @license MIT
 */

import { User } from './users';
import { roomSettings } from './chat-commands/room-settings';

// eslint-disable-next-line no-undef
const LadderStore: typeof LadderStoreT = (typeof Config === 'object' && Config.remoteladder ?
	require('./ladders-remote') :
	require('./ladders-local')).LadderStore;

const SECONDS = 1000;
const PERIODIC_MATCH_INTERVAL = 60 * SECONDS;

import type {ChallengeType} from './room-battle';

/**
 * This represents a user's search for a battle under a format.
 */
class BattleReady {
	readonly userid: ID;
	readonly players: User | User[];
	readonly formatid: string;
	readonly teams: string | string[];
	readonly hidden: boolean;
	readonly inviteOnly: boolean;
	readonly rating: number;
	readonly challengeType: ChallengeType;
	readonly time: number;
	constructor(
		players: User | User[],
		formatid: string,
		settings: User['battleSettings'],
		rating: number,
		challengeType: ChallengeType,
	) {
		this.players = challengeType === 'multi' ? Object.assign([], players) : players;
		this.userid = Array.isArray(players) ? players[1].id : players.id;
		this.formatid = formatid;
		this.teams = challengeType === 'multi' && settings.teammateSettings ? [settings.team, settings.teammateSettings.team] : settings.team;
		this.hidden = settings.hidden; 
		this.inviteOnly = settings.inviteOnly;
		this.rating = rating;
		this.challengeType = challengeType;
		this.time = Date.now();
	}
}

/**
 * formatid:userid:BattleReady
 */
const searches = new Map<string, Map<string, BattleReady>>();

class Challenge {
	readonly from: ID;
	teammate?: ID;
	readonly to: string;
	toTeammate?: string;
	readonly formatid: string;
	readonly ready: BattleReady;
	constructor(ready: BattleReady, to: User | User[]) {
		this.from = ready.userid;
		this.to = Array.isArray(to) ? to[0].id : to.id;
		this.formatid = ready.formatid;
		if (ready.challengeType === 'multi' && Array.isArray(ready.players)) {
			this.teammate = ready.players[1].id;
			if (Array.isArray(to)) this.toTeammate = to[1].id;
		}
		this.ready = ready;
	}
}
/**
 * formatid:userid:BattleReady
 */
const challenges = new Map<string, Challenge[]>();

/**
 * This keeps track of searches for battles, creating a new battle for a newly
 * added search if a valid match can be made, otherwise periodically
 * attempting to make a match with looser restrictions until one can be made.
 */
class Ladder extends LadderStore {
	constructor(formatid: string) {
		super(formatid);
	}

	async prepBattle(connection: Connection, challengeType: ChallengeType, team: string | null = null, isRated = false, teammateCon: Connection | null = null, teammateTeam: string | null = null) {
		// all validation for a battle goes through here
		const user = connection.user;
		const userid = user.id;
		let teammate, teammateid;
		if (teammateCon) {
			teammate = teammateCon.user;
			teammateid = teammate.id;
		}
		if (team === null) team = user.battleSettings.team;
		if (teammate && teammateTeam === null) teammateTeam = teammate.battleSettings.team;
		const popupMessage = function (message: string) {
			if (challengeType === 'multi') {
				connection.popup(message);
				teammateCon?.popup(message);
			} else {
				connection.popup(message);
			}
		}
		if (Rooms.global.lockdown && Rooms.global.lockdown !== 'pre') {
			let message = `The server is restarting. Battles will be available again in a few minutes.`;
			if (Rooms.global.lockdown === 'ddos') {
				message = `The server is under attack. Battles cannot be started at this time.`;
			}
			popupMessage(message);
			return null;
		}
		if (Punishments.isBattleBanned(user) || teammate && Punishments.isBattleBanned(teammate)) {
			popupMessage(`You or a teammate are barred from starting any new games until your battle ban expires.`);
			return null;
		}
		const gameCount = user.games.size;
		if (Monitor.countConcurrentBattle(gameCount, connection)) {
			return null;
		}
		if (Monitor.countPrepBattle(connection.ip, connection)) {
			return null;
		}

		try {
			this.formatid = Dex.validateFormat(this.formatid);
		} catch (e) {
			popupMessage(`Your selected format is invalid:\n\n- ${e.message}`);
			return null;
		}

		let rating = 0;
		let valResult;
		if (isRated && !Ladders.disabled) {
			const uid = user.id;
			[valResult, rating] = await Promise.all([
				TeamValidatorAsync.get(this.formatid).validateTeam(team, {removeNicknames: !!(user.locked || user.namelocked)}),
				this.getRating(uid),
			]);
			if (uid !== user.id) {
				// User feedback for renames handled elsewhere.
				return null;
			}
			if (!rating) rating = 1;
		} else {
			if (Ladders.disabled) {
				connection.popup(`The ladder is temporarily disabled due to technical difficulties - you will not receive ladder rating for this game.`);
				rating = 1;
			}
			const validator = TeamValidatorAsync.get(this.formatid);
			valResult = await validator.validateTeam(team, {removeNicknames: !!(user.locked || user.namelocked)});
		}

		if (valResult.charAt(0) !== '1') {
			connection.popup(
				`Your team was rejected for the following reasons:\n\n` +
				`- ` + valResult.slice(1).replace(/\n/g, `\n- `)
			);
			return null;
		}

		const regex = /(?:^|])([^|]*)\|([^|]*)\|/g;
		let matches: any = [regex.exec(team)];
		if (challengeType === 'multi' && teammateTeam) matches.push(regex.exec(teammateTeam));
		let unownWord = '', unownWord2 = '';
		for (let i in matches) {
			let match = matches[i];
			while (match) {
				let nickname = match[1];
				const speciesid = toID(match[2] || match[1]);
				if (speciesid.length <= 6 && speciesid.startsWith('unown')) {
					if (i === '1') {
						unownWord += speciesid.charAt(5) || 'a';
					} else {
						unownWord2 += speciesid.charAt(5) || 'a';
					}
				}
				if (nickname) {
					const curUser = (i === '1' ? connection : teammateCon || connection);
					nickname = Chat.nicknamefilter(nickname, curUser.user);
					if (!nickname || nickname !== match[1]) {
						curUser.popup(
							`Your team was rejected for the following reason:\n\n` +
							`- Your Pokémon has a banned nickname: ${match[1]}`
						);
						(i === '1' && teammateCon ? teammateCon : connection).popup(`Your teammate fucked up`);
						return null;
					}
				}
				match = regex.exec(team);
			}
		}
		if (unownWord) {
			const filtered = Chat.nicknamefilter(unownWord, user);
			if (!filtered || filtered !== unownWord) {
				connection.popup(
					`Your team was rejected for the following reason:\n\n` +
					`- Your Unowns spell out a banned word: ${unownWord.toUpperCase()}`
				);
				return null;
			}
		}
		let rating2 = 0;
		let valResult1, valResult2;
		if (isRated && !Ladders.disabled && challengeType !== 'multi') {
			const uid = user.id;
			[valResult1, rating2] = await Promise.all([
				TeamValidatorAsync.get(this.formatid).validateTeam(team, {removeNicknames: !!(user.locked || user.namelocked)}),
				this.getRating(uid),
			]);
			if (uid !== user.id) {
				// User feedback for renames handled elsewhere.
				return null;
			}
			if (!rating2) rating2 = 1;
		} else if (challengeType === 'multi') {
			if (Ladders.disabled) {
				connection.popup(`The ladder is temporarily disabled due to technical difficulties - you will not receive ladder rating for this game.`);
				rating2 = 1;
			}
			const validator = TeamValidatorAsync.get(this.formatid);
			valResult1 = await validator.validateTeam(team, {removeNicknames: !!(user.locked || user.namelocked)});
			valResult2 = await validator.validateTeam(teammateTeam, {removeNicknames: !!(teammate.locked || teammate.namelocked)});
		}

		if (valResult1 && valResult1.charAt(0) !== '1') {
			connection.popup(
				`Your team was rejected for the following reasons:\n\n` +
				`- ` + valResult1.slice(1).replace(/\n/g, `\n- `)
			);
			return null;
		}
		if (teammateCon && valResult2 && valResult2.charAt(0) !== '1') {
			teammateCon.popup(
				`Your team was rejected for the following reasons:\n\n` +
				`- ` + valResult2.slice(1).replace(/\n/g, `\n- `)
			);
			return null;
		}
		if (challengeType === 'multi' && teammate) {
			user.battleSettings.team = valResult1.slice(1);
			teammate.battleSettings.team = valResult2.slice(1);
			user.battleSettings.inviteOnly = false;
			user.battleSettings.hidden = false;
			teammate.battleSettings.inviteOnly = false;
			teammate.battleSettings.hidden = false;
			user.battleSettings.teammateSettings = teammate.battleSettings;
			teammate.battleSettings.teammateSettings = user.battleSettings;
			return new BattleReady([user, teammate], this.formatid, user.battleSettings, rating, challengeType);
		}
		const settings = {...user.battleSettings, team: valResult1?.slice(1) as string};
		user.battleSettings.inviteOnly = false;
		user.battleSettings.hidden = false;
		return new BattleReady(user, this.formatid, settings, rating, challengeType);
	}

	static getChallenging(user: User) {
		const userChalls = Ladders.challenges.get(user.id);
		if (userChalls) {
			for (const chall of userChalls) {
				if (chall.from === user.id) return chall;
			}
		}
		return null;
	}

	static cancelChallenging(user: User) {
		const chall = Ladder.getChallenging(user);
		if (chall) {
			Ladder.removeChallenge(chall);
			return true;
		}
		return false;
	}
	static rejectChallenge(user: User, targetUsername: string) {
		const targetUser = Users.get(targetUsername);
		if (!targetUser) return;
		const chall = Ladder.getChallenging(targetUser);
		if (chall && chall.to === user.id) {
			Ladder.removeChallenge(chall);
			return true;
		}
		return false;
	}
	static clearChallenges(username: string) {
		const userid = toID(username);
		const userChalls = Ladders.challenges.get(userid);
		const user = Users.get(userid);
		if (userChalls) {
			for (const chall of userChalls.slice()) {
				let otherUserid;
				if (chall.from === user?.id) {
					otherUserid = chall.to;
				} else {
					otherUserid = chall.from;
				}
				Ladder.removeChallenge(chall, true);
				const otherUser = Users.get(otherUserid);
				if (otherUser) Ladder.updateChallenges(otherUser);
			}
			if (user) Ladder.updateChallenges(user);
			return true;
		}
		return false;
	}
	async makeChallenge(connection: Connection, targetUser: User, teammate?: User) {
		const user = connection.user;
		const chall = Ladder.getChallenging(user);
		if (targetUser === user) {
			connection.popup(`You can't battle yourself. The best you can do is open PS in Private Browsing (or another browser) and log into a different username, and battle that username.`);
			return false;
		}
		if (Ladder.getChallenging(user) && teammate) {
			connection.popup(`You are already challenging someone. Cancel that challenge before challenging someone else.`);
			return false;
		}
		if (targetUser.settings.blockChallenges && !user.can('bypassblocks', targetUser)) {
			connection.popup(`The user '${targetUser.name}' is not accepting challenges right now.`);
			Chat.maybeNotifyBlocked('challenge', targetUser, user);
			return false;
		}
		if (teammate && teammate.settings.blockChallenges && !user.can('bypassblocks', teammate)) {
			connection.popup(`The user '${teammate.name}' is not accepting challenges right now.`);
			Chat.maybeNotifyBlocked('challenge', teammate, user);
			return false;
		}
		if (Date.now() < user.lastChallenge + 10 * SECONDS) {
			// 10 seconds ago, probable misclick
			connection.popup(`You challenged less than 10 seconds after your last challenge! It's cancelled in case it's a misclick.`);
			return false;
		}
		if (chall && Dex.getFormat(chall.formatid).gameType === "multi" && teammate !== connection.user) {
			const ready = await this.prepBattle(connection, "multi");
			if (!ready) return false;
			Ladder.addChallenge(new Challenge(ready, targetUser));
			user.lastChallenge = Date.now();
			return true;
		}
		const currentChallenges = Ladders.challenges.get(targetUser.id);
		if (currentChallenges && currentChallenges.length >= 3 && !user.autoconfirmed) {
			connection.popup(
				`This user already has 3 pending challenges.\n` +
				`You must be autoconfirmed to challenge them.`
			);
			return false;
		}
		const ready = await this.prepBattle(connection, 'challenge');
		if (!ready) return false;
		// If our target is already challenging us in the same format,
		// simply accept the pending challenge instead of creating a new one.
		const targetChalls = Ladders.challenges.get(targetUser.id);
		if (targetChalls) {
			for (const chall of targetChalls) {
				if (chall.from === targetUser.id &&
					chall.to === user.id &&
					chall.formatid === this.formatid) {
					if (Ladder.removeChallenge(chall)) {
						Ladders.match(chall.ready, ready);
						return true;
					}
				}
			}
		}
		Ladder.addChallenge(new Challenge(ready, targetUser));
		user.lastChallenge = Date.now();
		return true;
	}
	static async acceptChallenge(connection: Connection, targetUser: User, asTeammate: boolean | null) {
		const chall = Ladder.getChallenging(targetUser);
		if (chall && asTeammate && !chall.teammate) {
			chall.teammate = connection.user.id;
			targetUser.connections[0].popup(`${connection.user.name} has accepted you team invite!`);
		}
		if ((!chall || chall.to !== connection.user.id) && !asTeammate) {
			connection.popup(`${targetUser.id} is not challenging you. Maybe they cancelled before you accepted?`);
			return false;
		}
		const ladder = Ladders(chall.formatid);
		const ready = await ladder.prepBattle(connection, 'challenge');
		if (!ready) return false;
		if (Ladder.removeChallenge(chall)) {
			Ladders.match(chall.ready, ready);
		}
		return true;
	}

	static addChallenge(challenge: Challenge, skipUpdate = false) {
		let challs1 = Ladders.challenges.get(challenge.from);
		if (!challs1) Ladders.challenges.set(challenge.from, challs1 = []);
		let challs2 = Ladders.challenges.get(challenge.to);
		if (!challs2) Ladders.challenges.set(challenge.to, challs2 = []);
		challs1.push(challenge);
		challs2.push(challenge);
		if (!skipUpdate) {
			const fromUser = Users.get(challenge.from);
			if (fromUser) Ladder.updateChallenges(fromUser);
			const toUser = Users.get(challenge.to);
			if (toUser) Ladder.updateChallenges(toUser);
		}
	}

	static removeChallenge(challenge: Challenge, skipUpdate = false) {
		const fromChalls = Ladders.challenges.get(challenge.from);
		// the challenge may have been cancelled
		if (!fromChalls) return false;
		const fromIndex = fromChalls.indexOf(challenge);
		if (fromIndex < 0) return false;
		fromChalls.splice(fromIndex, 1);
		if (!fromChalls.length) Ladders.challenges.delete(challenge.from);
		const toChalls = Ladders.challenges.get(challenge.to)!;
		toChalls.splice(toChalls.indexOf(challenge), 1);
		if (!toChalls.length) Ladders.challenges.delete(challenge.to);
		if (!skipUpdate) {
			const fromUser = Users.get(challenge.from);
			if (fromUser) Ladder.updateChallenges(fromUser);
			const toUser = Users.get(challenge.to);
			if (toUser) Ladder.updateChallenges(toUser);
		}
		return true;
	}
	static updateChallenges(user: User, connection: Connection | null = null) {
		if (!user.connected) return;
		let challengeTo = null;
		const challengesFrom: {[k: string]: string} = {};
		const userChalls = Ladders.challenges.get(user.id);
		if (userChalls) {
			for (const chall of userChalls) {
				if (chall.from === user.id) {
					challengeTo = {
						to: chall.to,
						format: chall.formatid,
					};
				} else {
					challengesFrom[chall.from] = chall.formatid;
				}
			}
		}
		(connection || user).send(`|updatechallenges|` + JSON.stringify({
			challengesFrom,
			challengeTo,
		}));
	}

	cancelSearch(user: User) {
		const formatid = toID(this.formatid);

		const formatTable = Ladders.searches.get(formatid);
		if (!formatTable) return false;
		if (!formatTable.has(user.id)) return false;
		formatTable.delete(user.id);

		Ladder.updateSearch(user);
		return true;
	}

	static cancelSearches(user: User) {
		let cancelCount = 0;

		for (const formatTable of Ladders.searches.values()) {
			const search = formatTable.get(user.id);
			if (!search) continue;
			formatTable.delete(user.id);
			cancelCount++;
		}

		Ladder.updateSearch(user);
		return cancelCount;
	}

	getSearcher(search: BattleReady) {
		const formatid = toID(this.formatid);
		const user = Users.get(search.userid);
		if (!user || !user.connected || user.id !== search.userid) {
			const formatTable = Ladders.searches.get(formatid);
			if (formatTable) formatTable.delete(search.userid);
			if (user?.connected) {
				user.popup(`You changed your name and are no longer looking for a battle in ${formatid}`);
				Ladder.updateSearch(user);
			}
			return null;
		}
		return user;
	}

	static getSearches(user: User) {
		const userSearches = [];
		for (const [formatid, formatTable] of Ladders.searches) {
			if (formatTable.has(user.id)) userSearches.push(formatid);
		}
		return userSearches;
	}
	static updateSearch(user: User, connection: Connection | null = null) {
		let games: {[k: string]: string} | null = {};
		let atLeastOne = false;
		for (const roomid of user.games) {
			const room = Rooms.get(roomid);
			if (!room) {
				Monitor.warn(`while searching, room ${roomid} expired for user ${user.id} in rooms ${[...user.inRooms]} and games ${[...user.games]}`);
				user.games.delete(roomid);
				continue;
			}
			const game = room.game;
			if (!game) {
				Monitor.warn(`while searching, room ${roomid} has no game for user ${user.id} in rooms ${[...user.inRooms]} and games ${[...user.games]}`);
				user.games.delete(roomid);
				continue;
			}
			games[roomid] = game.title + (game.allowRenames ? '' : '*');
			atLeastOne = true;
		}
		if (!atLeastOne) games = null;
		const searching = Ladders.getSearches(user);
		(connection || user).send(`|updatesearch|` + JSON.stringify({
			searching,
			games,
		}));
	}
	hasSearch(user: User) {
		const formatid = toID(this.formatid);
		const formatTable = Ladders.searches.get(formatid);
		if (!formatTable) return false;
		return formatTable.has(user.id);
	}

	/**
	 * Validates a user's team and fetches their rating for a given format
	 * before creating a search for a battle.
	 */
	async searchBattle(user: User, connection: Connection) {
		if (!user.connected) return;

		const format = Dex.getFormat(this.formatid);
		if (!format.searchShow) {
			connection.popup(`Error: Your format ${format.id} is not ladderable.`);
			return;
		}

		const oldUserid = user.id;
		const search = await this.prepBattle(connection, format.rated ? 'rated' : 'unrated', null, format.rated !== false);

		if (oldUserid !== user.id) return;
		if (!search) return;

		this.addSearch(search, user);
	}

	/**
	 * Verifies whether or not a match made between two users is valid. Returns
	 */
	matchmakingOK(search1: BattleReady, search2: BattleReady, user1: User, user2: User) {
		const formatid = toID(this.formatid);
		if (!user1 || !user2) {
			// This should never happen.
			Monitor.crashlog(new Error(`Matched user ${user1 ? search2.userid : search1.userid} not found`), "The matchmaker");
			return false;
		}

		// users must be different
		if (user1 === user2) return false;

		if (Config.fakeladder) {
			user1.lastMatch = user2.id;
			user2.lastMatch = user1.id;
			return true;
		}

		// users must have different IPs
		if (user1.latestIp === user2.latestIp) return false;

		// users must not have been matched immediately previously
		if (user1.lastMatch === user2.id || user2.lastMatch === user1.id) return false;

		// search must be within range
		let searchRange = 100;
		const elapsed = Date.now() - Math.min(search1.time, search2.time);
		if (formatid === 'gen8ou' || formatid === 'gen8oucurrent' ||
				formatid === 'gen8oususpecttest' || formatid === 'gen8randombattle') {
			searchRange = 50;
		}

		searchRange += elapsed / 300; // +1 every .3 seconds
		if (searchRange > 300) searchRange = 300 + (searchRange - 300) / 10; // +1 every 3 sec after 300
		if (searchRange > 600) searchRange = 600;
		if (Math.abs(search1.rating - search2.rating) > searchRange) return false;

		user1.lastMatch = user2.id;
		user2.lastMatch = user1.id;
		return true;
	}

	/**
	 * Starts a search for a battle for a user under the given format.
	 */
	addSearch(newSearch: BattleReady, user: User) {
		const formatid = newSearch.formatid;
		let formatTable = Ladders.searches.get(formatid);
		if (!formatTable) {
			formatTable = new Map();
			Ladders.searches.set(formatid, formatTable);
		}
		if (formatTable.has(user.id)) {
			user.popup(`Couldn't search: You are already searching for a ${formatid} battle.`);
			return;
		}

		// In order from longest waiting to shortest waiting
		for (const search of formatTable.values()) {
			const searcher = this.getSearcher(search);
			if (!searcher) continue;
			const matched = this.matchmakingOK(search, newSearch, searcher, user);
			if (matched) {
				formatTable.delete(search.userid);
				Ladder.match(search, newSearch);
				return;
			}
		}

		formatTable.set(newSearch.userid, newSearch);
		Ladder.updateSearch(user);
	}

	/**
	 * Creates a match for a new battle for each format in this.searches if a
	 * valid match can be made. This is run periodically depending on
	 * PERIODIC_MATCH_INTERVAL.
	 */
	static periodicMatch() {
		// In order from longest waiting to shortest waiting
		for (const [formatid, formatTable] of Ladders.searches) {
			const matchmaker = Ladders(formatid);
			let longest: [BattleReady, User] | null = null;
			for (const search of formatTable.values()) {
				if (!longest) {
					const longestSearcher = matchmaker.getSearcher(search);
					if (!longestSearcher) continue;
					longest = [search, longestSearcher];
					continue;
				}
				const searcher = matchmaker.getSearcher(search);
				if (!searcher) continue;

				const [longestSearch, longestSearcher] = longest;
				const matched = matchmaker.matchmakingOK(search, longestSearch, searcher, longestSearcher);
				if (matched) {
					formatTable.delete(search.userid);
					formatTable.delete(longestSearch.userid);
					Ladder.match(longestSearch, search);
					return;
				}
			}
		}
	}

	static match(ready1: BattleReady, ready2: BattleReady) {
		if (ready1.formatid !== ready2.formatid) throw new Error(`Format IDs don't match`);
		if (Array.isArray(ready1.players) && Array.isArray(ready2.players) && ready1.challengeType === "multi" && ready2.challengeType === "multi") {
			const team1 = ready1.players;
			const team2 = ready2.players;
			for (let player of team1) {
				if (!player) {
					team1[team1.indexOf(player) ^ 1].popup(`Sorry, your teammate ${team1[player].id} went offline before your battle could start.`);
					team2[0].popup(`Sorry, your opponent ${team1[player].id} went offline before your battle could start.`);
					team2[0].popup(`Sorry, your opponent ${team1[player].id} went offline before your battle could start.`);
					return false;
				}
			}
			for (let player of team2) {
				if (!player) {
					team2[team2.indexOf(player) ^ 1].popup(`Sorry, your teammate ${team2[player].id} went offline before your battle could start.`);
					team1[0].popup(`Sorry, your opponent ${team1[player].id} went offline before your battle could start.`);
					team1[0].popup(`Sorry, your opponent ${team1[player].id} went offline before your battle could start.`);
					return false;
				}
			}
			Rooms.createBattle(ready1.formatid, {
				p1: team1[0],
				p3: team1[1],
				p1team: ready1.teams[0],
				p3team: ready1.teams[1],
				p1rating: ready1.rating,
				p1hidden: ready1.hidden,
				p1inviteOnly: ready1.inviteOnly,
				p2: team2[0],
				p2team: ready2.teams[0],
				p4team: ready2.teams[0],
				p2rating: ready2.rating,
				p2hidden: ready2.hidden,
				p2inviteOnly: ready2.inviteOnly,
				rated: Math.min(ready1.rating, ready2.rating),
				challengeType: ready1.challengeType,
			});
			return;
		}
		const user1 = Users.get(ready1.userid);
		const user2 = Users.get(ready2.userid);
		if (!user1) {
			if (!user2) return false;
			user2.popup(`Sorry, your opponent ${ready1.userid} went offline before your battle could start.`);
			return false;
		}
		if (!user2) {
			user1.popup(`Sorry, your opponent ${ready2.userid} went offline before your battle could start.`);
			return false;
		}
		Rooms.createBattle(ready1.formatid, {
			p1: user1,
			p1team: ready1.teams,
			p1rating: ready1.rating,
			p1hidden: ready1.hidden,
			p1inviteOnly: ready1.inviteOnly,
			p2: user2,
			p2team: ready2.teams,
			p2rating: ready2.rating,
			p2hidden: ready2.hidden,
			p2inviteOnly: ready2.inviteOnly,
			rated: Math.min(ready1.rating, ready2.rating),
			challengeType: ready1.challengeType,
		});
	}
}

function getLadder(formatid: string) {
	return new Ladder(formatid);
}

const periodicMatchInterval = setInterval(
	() => Ladder.periodicMatch(),
	PERIODIC_MATCH_INTERVAL
);

export const Ladders = Object.assign(getLadder, {
	BattleReady,
	LadderStore,
	Ladder,

	cancelSearches: Ladder.cancelSearches,
	updateSearch: Ladder.updateSearch,
	rejectChallenge: Ladder.rejectChallenge,
	acceptChallenge: Ladder.acceptChallenge,
	cancelChallenging: Ladder.cancelChallenging,
	clearChallenges: Ladder.clearChallenges,
	updateChallenges: Ladder.updateChallenges,
	visualizeAll: Ladder.visualizeAll,
	getSearches: Ladder.getSearches,
	match: Ladder.match,

	searches,
	challenges,
	periodicMatchInterval,

	// tells the client to ask the server for format information
	formatsListPrefix: LadderStore.formatsListPrefix,
	disabled: false as boolean | 'db',
});
