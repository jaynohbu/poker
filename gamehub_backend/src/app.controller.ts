import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('blackjack/start-game')
  startBlackjackGame(@Body() payload: { bet?: unknown }): { events: RoundEvent[]; summary: RoundSummary } {
    const bet = normalizeBet(payload?.bet);
    return simulateRound(bet);
  }
}

type RoundEvent = {
  actor: 'Player' | 'Dealer';
  action: 'deal' | 'hit' | 'stand';
  card: string;
  player_hand: string[];
  dealer_hand: string[];
  player_value: number;
  dealer_value: number;
};

type RoundSummary = {
  winner: 'player' | 'dealer' | 'none';
  message: string;
  player_bet: number;
  balance_left: number;
};

const SUITS = ['S', 'H', 'D', 'C'] as const;
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;

function normalizeBet(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return 50;
  return Math.max(1, Math.min(1000, Math.floor(parsed)));
}

function simulateRound(bet: number): { events: RoundEvent[]; summary: RoundSummary } {
  const deck = buildDeck();
  const player: string[] = [];
  const dealer: string[] = [];
  const events: RoundEvent[] = [];
  const startingBalance = 1000;

  const log = (actor: 'Player' | 'Dealer', action: 'deal' | 'hit' | 'stand', card = '') => {
    events.push({
      actor,
      action,
      card,
      player_hand: [...player],
      dealer_hand: [...dealer],
      player_value: handValue(player),
      dealer_value: handValue(dealer),
    });
  };

  dealCard(player, deck, 'Player', 'deal', log);
  dealCard(dealer, deck, 'Dealer', 'deal', log);
  dealCard(player, deck, 'Player', 'deal', log);
  dealCard(dealer, deck, 'Dealer', 'deal', log);

  runRandomTurn(player, deck, 'Player', log);
  runRandomTurn(dealer, deck, 'Dealer', log);

  const summary = settleRound(handValue(player), handValue(dealer), bet, startingBalance);
  return { events, summary };
}

function buildDeck(): string[] {
  const deck: string[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(`${rank}${suit}`);
    }
  }
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function runRandomTurn(
  hand: string[],
  deck: string[],
  actor: 'Player' | 'Dealer',
  log: (actor: 'Player' | 'Dealer', action: 'deal' | 'hit' | 'stand', card?: string) => void,
): void {
  const steps = randomInt(1, 4);
  for (let i = 0; i < steps; i += 1) {
    if (handValue(hand) >= 21) break;
    if (Math.random() < 0.45) {
      log(actor, 'stand');
      return;
    }
    dealCard(hand, deck, actor, 'hit', log);
  }
  if (handValue(hand) <= 21) log(actor, 'stand');
}

function dealCard(
  hand: string[],
  deck: string[],
  actor: 'Player' | 'Dealer',
  action: 'deal' | 'hit',
  log: (actor: 'Player' | 'Dealer', action: 'deal' | 'hit' | 'stand', card?: string) => void,
): void {
  const card = deck.pop() ?? 'AS';
  hand.push(card);
  log(actor, action, card);
}

function handValue(hand: string[]): number {
  let total = 0;
  let aces = 0;
  for (const card of hand) {
    const rank = card.slice(0, -1);
    if (rank === 'A') {
      total += 11;
      aces += 1;
      continue;
    }
    if (rank === 'K' || rank === 'Q' || rank === 'J') {
      total += 10;
      continue;
    }
    total += Number.parseInt(rank, 10);
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

function settleRound(playerValue: number, dealerValue: number, bet: number, startingBalance: number): RoundSummary {
  if (playerValue > 21 && dealerValue > 21) {
    return { winner: 'none', message: 'Both busted. Bet returned.', player_bet: bet, balance_left: startingBalance };
  }
  if (playerValue > 21) {
    return { winner: 'dealer', message: 'Player busted.', player_bet: bet, balance_left: startingBalance - bet };
  }
  if (dealerValue > 21) {
    return { winner: 'player', message: 'Dealer busted.', player_bet: bet, balance_left: startingBalance + bet };
  }
  if (playerValue > dealerValue) {
    return { winner: 'player', message: 'Player has higher hand.', player_bet: bet, balance_left: startingBalance + bet };
  }
  if (playerValue < dealerValue) {
    return { winner: 'dealer', message: 'Dealer has higher hand.', player_bet: bet, balance_left: startingBalance - bet };
  }
  return { winner: 'none', message: 'Push. Bet returned.', player_bet: bet, balance_left: startingBalance };
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
