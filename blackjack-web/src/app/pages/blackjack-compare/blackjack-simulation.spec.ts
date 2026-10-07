import {
  basicStrategyAction,
  Card,
  chooseMonteCarloAction,
  createEmptyStats,
  handValue,
  parseStrategyCsv,
  simulatePairedRound,
  StrategyTable,
  updateStats,
} from './blackjack-simulation';

describe('blackjack simulation helpers', () => {
  it('parses expected-return rows and rejects malformed strategy files', () => {
    const table = parseStrategyCsv(
      'key,action,expected_return\nhard|11|6|+0|hit,hit,0.1\nhard|11|6|+0|double,double,0.4',
    );

    expect(table.get('hard|11|6|+0')).toEqual({ hit: 0.1, double: 0.4 });
    expect(() => parseStrategyCsv('key,action\nstate,hit')).toThrow('필수 열');
    expect(() => parseStrategyCsv('key,action,expected_return\nstate,invalid,1')).toThrow('잘못된');
  });

  it('counts soft aces as eleven when possible and reduces them when needed', () => {
    expect(handValue([card(1), card(6)])).toEqual({ total: 17, soft: true });
    expect(handValue([card(1), card(6), card(9)])).toEqual({ total: 16, soft: false });
  });

  it('selects the available action with the best expected return', () => {
    const table: StrategyTable = new Map([
      ['hard|11|6|+0', { hit: 0.2, stand: 0.1, double: 0.5 }],
    ]);

    expect(chooseMonteCarloAction(table, [card(5), card(6)], card(6), 0)).toBe('double');
    expect(() => chooseMonteCarloAction(table, [card(5), card(6)], card(6), 1)).toThrow('없는 상황');
  });

  it('applies the basic split rule for a pair of eights', () => {
    expect(basicStrategyAction([card(8), card(8)], card(10), true, true)).toBe('split');
  });

  it('updates round totals and maintains the overall return', () => {
    const updated = updateStats(createEmptyStats(), {
      openingAction: 'stand',
      playerHands: [['10♠', '8♥']],
      dealerHand: ['10♦', '7♣'],
      result: 'win',
      profit: 1,
      frames: [],
    });

    expect(updated).toEqual({ rounds: 1, wins: 1, losses: 0, pushes: 0, profit: 1 });
  });

  it('simulates both approaches from a shared initial six-deck deal', () => {
    const table = completeStrategyTable();
    const pair = simulatePairedRound(table, () => 0.5);

    expect(pair.random.playerHands).toHaveLength(1);
    expect(pair.monteCarlo.openingAction).toBe('stand');
    expect(pair.random.result).toMatch(/^(win|loss|push)$/);
    expect(pair.monteCarlo.dealerHand.length).toBeGreaterThanOrEqual(2);
    expect(pair.random.frames.slice(0, 4)).toEqual(pair.monteCarlo.frames.slice(0, 4));
    expect(pair.random.frames[0].playerHands[0]).toHaveLength(1);
    expect(pair.random.frames[3].dealerHand[1]).toBe('?');
    for (const round of [pair.random, pair.monteCarlo]) {
      const lastFrame = round.frames[round.frames.length - 1];
      expect(lastFrame.playerHands).toEqual(round.playerHands);
      expect(lastFrame.dealerHand).toEqual(round.dealerHand);
      expect(lastFrame.dealerHand).not.toContain('?');
    }
  });

  it('records player and dealer draws as immutable one-card replay steps', () => {
    const pair = simulatePairedRound(completeStrategyTable(), () => 0.1);

    const frames = pair.random.frames;
    const hitFrames = frames.filter((frame) => frame.message.startsWith('플레이어 hit'));
    expect(hitFrames.length).toBeGreaterThan(0);
    expect(frames[3].playerHands[0]).toHaveLength(2);
    expect(hitFrames[0].playerHands[0]).toHaveLength(3);
    expect(hitFrames[0].dealerHand[1]).toBe('?');
    const reveal = frames.find((frame) => frame.message === '딜러 히든 카드 공개');
    expect(reveal?.dealerHand).toHaveLength(2);
    expect(reveal?.dealerHand).not.toContain('?');
  });
});

function card(value: number): Card {
  return { value, rank: value === 1 ? 'A' : String(value), suit: '♠' };
}

function completeStrategyTable(): StrategyTable {
  const table: StrategyTable = new Map();
  const types = [
    ['hard', Array.from({ length: 17 }, (_, index) => String(index + 4))],
    ['soft', Array.from({ length: 8 }, (_, index) => String(index + 13))],
    ['pair', ['A', ...Array.from({ length: 9 }, (_, index) => String(index + 2))]],
  ];
  for (const [type, hands] of types as [string, string[]][]) {
    for (const hand of hands) {
      for (const dealer of ['A', ...Array.from({ length: 9 }, (_, index) => String(index + 2))]) {
        for (let count = -10; count <= 10; count += 1) {
          const countKey = `${count >= 0 ? '+' : ''}${count}`;
          const actions = type === 'pair' ? { stand: 1, hit: 0, double: -1, split: -2 } : { stand: 1, hit: 0, double: -1 };
          table.set(`${type}|${hand}|${dealer}|${countKey}`, actions);
        }
      }
    }
  }
  return table;
}
