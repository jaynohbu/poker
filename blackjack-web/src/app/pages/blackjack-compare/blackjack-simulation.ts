export type BlackjackAction = 'hit' | 'stand' | 'double' | 'split';
export type RoundResult = 'win' | 'loss' | 'push';

export interface Card {
  rank: string;
  suit: string;
  value: number;
}

export interface PlayedRound {
  openingAction: string;
  playerHands: string[][];
  dealerHand: string[];
  result: RoundResult;
  profit: number;
  frames: RoundFrame[];
}

export interface RoundFrame {
  playerHands: string[][];
  dealerHand: string[];
  message: string;
}

export interface PairedRound {
  random: PlayedRound;
  monteCarlo: PlayedRound;
}

interface Replay {
  hands: Card[][];
  dealer: Card[];
  frames: RoundFrame[];
  record: (message: string, revealDealer?: boolean) => void;
}

export interface SimulationStats {
  rounds: number;
  wins: number;
  losses: number;
  pushes: number;
  profit: number;
}

interface PlayedHand {
  cards: Card[];
  bet: number;
  blackjackEligible: boolean;
}

export type StrategyTable = Map<string, Partial<Record<BlackjackAction, number>>>;

const ACTIONS: BlackjackAction[] = ['hit', 'stand', 'double', 'split'];
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function parseStrategyCsv(csv: string): StrategyTable {
  const [headerLine, ...dataLines] = csv.trim().split(/\r?\n/);
  const headers = headerLine?.split(',');
  const keyIndex = headers?.indexOf('key') ?? -1;
  const actionIndex = headers?.indexOf('action') ?? -1;
  const returnIndex = headers?.indexOf('expected_return') ?? -1;
  if (!headers || keyIndex < 0 || actionIndex < 0 || returnIndex < 0) {
    throw new Error('전략 CSV에 필수 열(key, action, expected_return)이 없습니다.');
  }

  const table: StrategyTable = new Map();
  for (const line of dataLines) {
    if (!line.trim()) continue;
    const fields = line.split(',');
    const fullKey = fields[keyIndex];
    const action = fields[actionIndex] as BlackjackAction;
    const expectedReturn = Number(fields[returnIndex]);
    const keyParts = fullKey?.split('|') ?? [];
    if (
      !fullKey ||
      !ACTIONS.includes(action) ||
      keyParts?.at(-1) !== action ||
      !Number.isFinite(expectedReturn)
    ) {
      throw new Error('전략 CSV에 잘못된 결과 행이 있습니다.');
    }
    const key = keyParts.slice(0, -1).join('|');
    const state = table.get(key) ?? {};
    state[action] = expectedReturn;
    table.set(key, state);
  }
  if (table.size === 0) throw new Error('전략 CSV에 읽을 수 있는 결과가 없습니다.');
  return table;
}

export function handValue(cards: Card[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    total += card.value === 1 ? 11 : card.value;
    if (card.value === 1) aces += 1;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return { total, soft: aces > 0 };
}

export function chooseMonteCarloAction(
  table: StrategyTable,
  player: Card[],
  dealerUp: Card,
  trueCount: number,
): BlackjackAction {
  const hand = handValue(player);
  const pair = player.length === 2 && player[0].value === player[1].value;
  const handType = pair ? 'pair' : hand.soft ? 'soft' : 'hard';
  const handKey = pair
    ? player[0].value === 1 ? 'A' : String(player[0].value)
    : String(hand.total);
  const dealerKey = dealerUp.value === 1 ? 'A' : String(dealerUp.value);
  const countKey = `${trueCount >= 0 ? '+' : ''}${trueCount}`;
  const state = table.get(`${handType}|${handKey}|${dealerKey}|${countKey}`);
  if (!state) {
    throw new Error(`전략 데이터에 없는 상황입니다: ${handType} ${handKey} vs ${dealerKey}, TC ${countKey}`);
  }

  const legalActions = pair
    ? ACTIONS
    : ACTIONS.filter((action) => action !== 'split');
  const available = legalActions
    .filter((action) => state[action] !== undefined)
    .sort((left, right) => (state[right] ?? -Infinity) - (state[left] ?? -Infinity));
  if (!available[0]) throw new Error('해당 상황에서 선택 가능한 Monte Carlo 행동이 없습니다.');
  return available[0];
}

export function basicStrategyAction(
  cards: Card[],
  dealerUp: Card,
  canDouble: boolean,
  canSplit = false,
): BlackjackAction {
  const { total, soft } = handValue(cards);
  const up = dealerUp.value;
  if (canSplit && cards.length === 2 && cards[0].value === cards[1].value) {
    const pair = cards[0].value;
    if (pair === 1 || pair === 8) return 'split';
    if ((pair === 2 || pair === 3) && up >= 2 && up <= 7) return 'split';
    if (pair === 4 && (up === 5 || up === 6)) return 'split';
    if (pair === 6 && up >= 2 && up <= 6) return 'split';
    if (pair === 7 && up >= 2 && up <= 7) return 'split';
    if (pair === 9 && [2, 3, 4, 5, 6, 8, 9].includes(up)) return 'split';
  }
  if (soft) {
    if (total >= 19) return 'stand';
    if (total === 18) {
      if (canDouble && up >= 2 && up <= 6) return 'double';
      return up === 2 || up === 7 || up === 8 ? 'stand' : 'hit';
    }
    if (total === 17 && canDouble && up >= 3 && up <= 6) return 'double';
    if ((total === 15 || total === 16) && canDouble && up >= 4 && up <= 6) return 'double';
    if ((total === 13 || total === 14) && canDouble && up >= 5 && up <= 6) return 'double';
    return 'hit';
  }
  if (total >= 17) return 'stand';
  if (total >= 13) return up >= 2 && up <= 6 ? 'stand' : 'hit';
  if (total === 12) return up >= 4 && up <= 6 ? 'stand' : 'hit';
  if (total === 11) return canDouble && up !== 1 ? 'double' : 'hit';
  if (total === 10) return canDouble && up >= 2 && up <= 9 ? 'double' : 'hit';
  if (total === 9) return canDouble && up >= 3 && up <= 6 ? 'double' : 'hit';
  return 'hit';
}

export function createEmptyStats(): SimulationStats {
  return { rounds: 0, wins: 0, losses: 0, pushes: 0, profit: 0 };
}

export function updateStats(stats: SimulationStats, result: PlayedRound): SimulationStats {
  return {
    rounds: stats.rounds + 1,
    wins: stats.wins + Number(result.result === 'win'),
    losses: stats.losses + Number(result.result === 'loss'),
    pushes: stats.pushes + Number(result.result === 'push'),
    profit: stats.profit + result.profit,
  };
}

export function simulatePairedRound(table: StrategyTable, random: () => number = Math.random): PairedRound {
  const shoe = createShuffledShoe(random);
  const player = [shoe.pop()!];
  const dealer = [shoe.pop()!];
  player.push(shoe.pop()!);
  dealer.push(shoe.pop()!);
  const visibleCards = [...player, dealer[0]];
  const runningCount = visibleCards.reduce((sum, card) => sum + hiLoValue(card), 0);
  const decksLeft = Math.max((312 - visibleCards.length) / 52, 0.5);
  const trueCount = Math.max(-10, Math.min(10, Math.round(runningCount / decksLeft)));
  const randomShoe = [...shoe];
  const strategyShoe = [...shoe];
  const randomReplay = createReplay(player, dealer);
  const strategyReplay = createReplay(player, dealer);
  const randomHand = playRandomHand(randomReplay.hands[0], randomShoe, random, randomReplay);
  const strategyAction = handValue(player).total === 21 && player.length === 2
    ? 'stand'
    : chooseMonteCarloAction(table, player, dealer[0], trueCount);
  const strategyHands = playStrategyHand(strategyReplay.hands[0], strategyShoe, dealer[0], strategyAction, strategyReplay);
  return {
    random: finishRound(randomHand, randomReplay.dealer, randomShoe, 'Random hit/stand', randomReplay),
    monteCarlo: finishRound(strategyHands, strategyReplay.dealer, strategyShoe, strategyAction, strategyReplay),
  };
}

function createReplay(player: Card[], dealer: Card[]): Replay {
  const frames: RoundFrame[] = [
    { playerHands: [[formatCard(player[0])]], dealerHand: [], message: '플레이어 첫 카드 배분' },
    { playerHands: [[formatCard(player[0])]], dealerHand: [formatCard(dealer[0])], message: '딜러 오픈 카드 배분' },
    { playerHands: [player.map(formatCard)], dealerHand: [formatCard(dealer[0])], message: '플레이어 두 번째 카드 배분' },
    { playerHands: [player.map(formatCard)], dealerHand: [formatCard(dealer[0]), '?'], message: '딜러 히든 카드 배분' },
  ];
  const hands = [[...player]];
  const dealerCards = [...dealer];
  return {
    hands,
    dealer: dealerCards,
    frames,
    record: (message, revealDealer = false) => {
      frames.push({
        playerHands: hands.map((hand) => hand.map(formatCard)),
        dealerHand: revealDealer ? dealerCards.map(formatCard) : [formatCard(dealerCards[0]), '?'],
        message,
      });
    },
  };
}

function createShuffledShoe(random: () => number): Card[] {
  const cards = SUITS.flatMap((suit) =>
    RANKS.flatMap((rank) =>
      Array.from({ length: 6 }, () => ({
        rank,
        suit,
        value: rank === 'A' ? 1 : ['J', 'Q', 'K'].includes(rank) ? 10 : Number(rank),
      })),
    ),
  );
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
  }
  return cards;
}

function playRandomHand(cards: Card[], shoe: Card[], random: () => number, replay: Replay): PlayedHand[] {
  while (handValue(cards).total < 21 && shoe.length > 0 && random() < 0.5) {
    cards.push(shoe.pop()!);
    replay.record(`플레이어 hit · ${formatCard(cards[cards.length - 1])}`);
  }
  replay.record(handValue(cards).total > 21 ? '플레이어 bust' : '플레이어 stand');
  return [{ cards, bet: 1, blackjackEligible: true }];
}

function playStrategyHand(
  cards: Card[],
  shoe: Card[],
  dealerUp: Card,
  firstAction: BlackjackAction,
  replay: Replay,
  splitDepth = 0,
  blackjackEligible = true,
): PlayedHand[] {
  if (firstAction === 'split' && cards.length === 2 && cards[0].value === cards[1].value && splitDepth < 2) {
    return splitHand(cards, shoe, dealerUp, splitDepth, replay);
  }
  let action = firstAction;
  while (handValue(cards).total <= 21 && shoe.length > 0) {
    if (action === 'stand') {
      replay.record('플레이어 stand');
      return [{ cards, bet: 1, blackjackEligible }];
    }
    if (action === 'double' && cards.length === 2) {
      cards.push(shoe.pop()!);
      replay.record(`플레이어 double · ${formatCard(cards[cards.length - 1])}`);
      return [{ cards, bet: 2, blackjackEligible }];
    }
    if (action !== 'hit') action = basicStrategyAction(cards, dealerUp, cards.length === 2);
    if (action === 'stand') {
      replay.record('플레이어 stand');
      return [{ cards, bet: 1, blackjackEligible }];
    }
    cards.push(shoe.pop()!);
    replay.record(`플레이어 hit · ${formatCard(cards[cards.length - 1])}`);
    if (handValue(cards).total > 21) return [{ cards, bet: 1, blackjackEligible }];
    action = basicStrategyAction(cards, dealerUp, false);
  }
  return [{ cards, bet: 1, blackjackEligible }];
}

function splitHand(cards: Card[], shoe: Card[], dealerUp: Card, splitDepth: number, replay: Replay): PlayedHand[] {
  if (shoe.length < 2) throw new Error('카드가 부족해 페어를 분할할 수 없습니다.');
  const pairCard = cards[0];
  const first = [cards[0]];
  const second = [cards[1]];
  replay.hands.splice(replay.hands.indexOf(cards), 1, first, second);
  replay.record('플레이어 split · 두 핸드로 분할');
  first.push(shoe.pop()!);
  replay.record('분할 핸드 1 · 카드 배분');
  second.push(shoe.pop()!);
  replay.record('분할 핸드 2 · 카드 배분');
  if (pairCard.value === 1) {
    return [
      { cards: first, bet: 1, blackjackEligible: false },
      { cards: second, bet: 1, blackjackEligible: false },
    ];
  }
  const firstAction = handValue(first).total < 21
    ? basicStrategyAction(first, dealerUp, true, first[0].value === first[1].value)
    : 'stand';
  const secondAction = handValue(second).total < 21
    ? basicStrategyAction(second, dealerUp, true, second[0].value === second[1].value)
    : 'stand';
  return [
    ...playStrategyHand(first, shoe, dealerUp, firstAction, replay, splitDepth + 1, false),
    ...playStrategyHand(second, shoe, dealerUp, secondAction, replay, splitDepth + 1, false),
  ];
}

function finishRound(
  playerHands: PlayedHand[],
  dealerHand: Card[],
  shoe: Card[],
  openingAction: string,
  replay: Replay,
): PlayedRound {
  replay.record('딜러 히든 카드 공개', true);
  while (handValue(dealerHand).total < 17 && shoe.length > 0) {
    dealerHand.push(shoe.pop()!);
    replay.record(`딜러 hit · ${formatCard(dealerHand[dealerHand.length - 1])}`, true);
  }
  replay.record(handValue(dealerHand).total > 21 ? '딜러 bust · 결과 확인' : '딜러 stand · 결과 확인', true);
  const dealerValue = handValue(dealerHand).total;
  const dealerNatural = dealerHand.length === 2 && dealerValue === 21;
  const profit = playerHands.reduce((total, hand) => {
    const playerValue = handValue(hand.cards).total;
    if (playerValue > 21) return total - hand.bet;
    if (dealerNatural) {
      return total + (hand.blackjackEligible && hand.cards.length === 2 && playerValue === 21 ? 0 : -hand.bet);
    }
    if (hand.blackjackEligible && hand.cards.length === 2 && playerValue === 21) return total + 1.5 * hand.bet;
    if (dealerValue > 21 || playerValue > dealerValue) return total + hand.bet;
    if (playerValue < dealerValue) return total - hand.bet;
    return total;
  }, 0);
  return {
    openingAction,
    playerHands: playerHands.map((hand) => hand.cards.map(formatCard)),
    dealerHand: dealerHand.map(formatCard),
    result: profit > 0 ? 'win' : profit < 0 ? 'loss' : 'push',
    profit,
    frames: replay.frames,
  };
}

function hiLoValue(card: Card): number {
  if (card.value >= 2 && card.value <= 6) return 1;
  return card.value === 1 || card.value === 10 ? -1 : 0;
}

function formatCard(card: Card): string {
  return `${card.rank}${card.suit}`;
}
