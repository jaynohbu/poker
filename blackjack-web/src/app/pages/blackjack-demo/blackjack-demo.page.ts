import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

interface RoundEvent {
  actor: string;
  action: string;
  card: string;
  player_hand: string[];
  dealer_hand: string[];
  player_value: number;
  dealer_value: number;
}

interface RoundSummary {
  winner: string;
  message: string;
  player_bet: number;
  balance_left: number;
}

type SuitKey = 'spade' | 'heart' | 'diamond' | 'club';

interface CardView {
  code: string;
  rank: string;
  suit: string;
  suitClass: `card-view--${SuitKey}`;
}

interface CodeExplanation {
  title: string;
  points: string[];
}

interface ClassCodeBlock {
  className: string;
  functionName: string;
  lines: string[];
}

@Component({
  selector: 'app-blackjack-demo-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="shell">
      <a class="back" routerLink="/demos">← Back</a>
      <h1>Blackjack OOP Demo Random actions</h1>
      <p class="lead">Python Game.start_rount() simulation with random player/dealer actions.</p>
      <section class="explain-box">
        <h2>What this does</h2>
        <p>
          This demo runs one blackjack round where actions are random (not strategy-based), then replays each step slowly.
          You can watch cards being dealt, see hit/stand choices, and track winner, bet, and remaining balance.
        </p>
      </section>

      <section class="controls">
        <label>
          Bet
          <input type="number" min="1" [value]="bet()" (input)="onBetChange($event)" />
        </label>
        <label>
          Playback
          <select [value]="playbackMs()" (change)="onPlaybackChange($event)">
            <option value="1400">Normal</option>
            <option value="2200">Slow</option>
            <option value="3200">Very Slow</option>
          </select>
        </label>
        <button type="button" [disabled]="running()" (click)="startGame()">
          {{ running() ? 'Running...' : 'Start Game' }}
        </button>
      </section>

      <section class="hands">
        <article>
          <h2>Dealer</h2>
          <div class="card-row">
            @for (card of dealerCards(); track card.code + $index) {
              <div class="card-view" [class]="'card-view ' + card.suitClass">
                <span class="card-rank">{{ card.rank }}</span>
                <span class="card-suit">{{ card.suit }}</span>
              </div>
            }
            @if (dealerCards().length === 0) {
              <p class="card-empty">-</p>
            }
          </div>
          <p>Value: {{ dealerValue() }}</p>
        </article>
        <article>
          <h2>Player</h2>
          <div class="card-row">
            @for (card of playerCards(); track card.code + $index) {
              <div class="card-view" [class]="'card-view ' + card.suitClass">
                <span class="card-rank">{{ card.rank }}</span>
                <span class="card-suit">{{ card.suit }}</span>
              </div>
            }
            @if (playerCards().length === 0) {
              <p class="card-empty">-</p>
            }
          </div>
          <p>Value: {{ playerValue() }}</p>
        </article>
      </section>

      <section class="summary">
        <p>Bet: {{ summary()?.player_bet ?? '-' }}</p>
        <p>Balance left: {{ summary()?.balance_left ?? '-' }}</p>
        <p>
          Winner:
          <span class="winner-value" [class.winner-dealer]="summary()?.winner?.toLowerCase() === 'dealer'">
            {{ summary()?.winner ?? '-' }}
          </span>
        </p>
        <p>Result: {{ summary()?.message ?? status() }}</p>
      </section>

      <section class="execution">
        <article class="exec-panel">
          <h3>Timeline</h3>
          <ul class="timeline">
            @for (item of timeline(); track $index; let idx = $index) {
              <li [class.active]="idx === activeTimelineIndex()">{{ item }}</li>
            }
          </ul>
        </article>

        <article class="exec-panel">
          <h3>Executing Code</h3>
          <pre class="code-view"><code>
@for (line of executingCode(); track $index) {
{{ line }}
}
          </code></pre>
          <div class="object-explain">
            <h4>{{ codeExplanation().title }}</h4>
            <ul>
              @for (point of codeExplanation().points; track $index) {
                <li>{{ point }}</li>
              }
            </ul>
          </div>
        </article>
      </section>
    </main>
  `,
  styles: [
    ':host { display:block; min-height:100vh; min-height:100svh; min-height:100dvh; color:#fff8e7; }',
    '.shell { width:min(920px,94vw); margin:0 auto; padding:1.2rem 0 2rem; overflow-x:hidden; }',
    '.back { color:#fff8e7; text-decoration:none; }',
    '.lead { color:#fffbf1d2; }',
    '.explain-box { border:1px solid #ffffff2f; border-radius:12px; background:#00000020; padding:0.8rem; margin:0.7rem 0 1rem; }',
    '.explain-box h2 { margin:0 0 0.35rem; font-size:1rem; }',
    '.explain-box p { margin:0; line-height:1.5; color:#f7f0df; }',
    '.controls { display:flex; gap:0.8rem; align-items:end; margin:1rem 0; flex-wrap:wrap; }',
    'label { display:grid; gap:0.3rem; }',
    'input, select, button { border:1px solid #ffffff44; border-radius:10px; padding:0.55rem 0.7rem; }',
    'input { background:#0f1f1a; color:#fff8e7; }',
    'select { background:#0f1f1a; color:#fff8e7; }',
    'button { background:#f8b84c; color:#15362d; font-weight:700; }',
    '.hands { display:grid; gap:0.8rem; grid-template-columns:repeat(2,minmax(0,1fr)); margin-bottom:0.9rem; align-items:start; }',
    '.hands article, .summary p { border:1px solid #ffffff2f; border-radius:12px; background:#00000020; padding:0.7rem; margin:0; }',
    '.hands article, .exec-panel { min-width:0; }',
    '.card-row { display:flex; flex-wrap:wrap; gap:0.45rem; min-height:66px; margin-bottom:0.45rem; }',
    '.card-empty { margin:0; color:#f7f0dfc4; }',
    '.card-view { width:48px; height:64px; border-radius:8px; border:1px solid #0000002a; background:linear-gradient(180deg,#ffffff,#f4f4f4); box-shadow:0 3px 10px #00000033; display:flex; flex-direction:column; align-items:center; justify-content:center; }',
    '.card-rank { font-weight:800; line-height:1; font-size:1rem; }',
    '.card-suit { font-size:0.92rem; line-height:1; margin-top:0.2rem; }',
    '.card-view--spade .card-rank, .card-view--spade .card-suit { color:#10171f; }',
    '.card-view--club .card-rank, .card-view--club .card-suit { color:#10171f; }',
    '.card-view--heart .card-rank, .card-view--heart .card-suit { color:#ba2f2f; }',
    '.card-view--diamond .card-rank, .card-view--diamond .card-suit { color:#ba2f2f; }',
    '.summary { display:grid; gap:0.6rem; grid-template-columns:repeat(2,minmax(0,1fr)); margin-bottom:1rem; }',
    '.winner-value { font-weight:700; }',
    '.winner-dealer { color:#ff8f8f; }',
    '.execution { display:grid; gap:0.8rem; grid-template-columns:repeat(2,minmax(0,1fr)); align-items:start; }',
    '.exec-panel { border:1px solid #ffffff2f; border-radius:12px; background:#0000002a; padding:0.8rem; }',
    '.exec-panel h3 { margin:0 0 0.6rem; }',
    '.timeline { margin:0; padding:0.2rem 1.1rem 0.2rem 1.2rem; min-height:220px; max-height:300px; overflow:auto; }',
    '.timeline li { margin-bottom:0.35rem; color:#f7f0df; }',
    '.timeline li.active { color:#ffd477; font-weight:700; }',
    '.code-view { margin:0; border-radius:10px; border:1px solid #ffffff22; background:#060b12; color:#d9ebff; padding:0.7rem; min-height:220px; max-height:300px; overflow:auto; font-size:0.82rem; line-height:1.55; }',
    '.object-explain { margin-top:0.7rem; border:1px solid #ffffff22; border-radius:10px; padding:0.6rem; background:#0b1019; }',
    '.object-explain h4 { margin:0 0 0.4rem; font-size:0.9rem; color:#ffd477; }',
    '.object-explain ul { margin:0; padding-left:1.05rem; display:grid; gap:0.3rem; }',
    '.object-explain li { color:#d9ebff; line-height:1.45; }',
    '@media (max-width:760px){ :host { min-height:100dvh; } .shell { width:min(100%,94vw); padding:1rem 0 1.6rem; } .controls { align-items:stretch; } label { min-width:0; } input, select, button { width:100%; box-sizing:border-box; } .hands,.summary,.execution { grid-template-columns:1fr; } .card-row { min-height:74px; align-items:flex-start; } .code-view { min-height:260px; max-height:260px; } .timeline { min-height:220px; max-height:220px; } }',
  ],
})
export class BlackjackDemoPage {
  private readonly apiBaseUrl = environment.apiBaseUrl;
  protected readonly bet = signal(50);
  protected readonly running = signal(false);
  protected readonly playbackMs = signal(1400);
  protected readonly status = signal('Click start to simulate one round.');
  protected readonly timeline = signal<string[]>([]);
  protected readonly activeTimelineIndex = signal(-1);
  protected readonly executingCode = signal<string[]>(executionLinesForBlock(defaultClassCodeBlocks()[0], 0, defaultClassCodeBlocks().length));
  protected readonly codeExplanation = signal<CodeExplanation>({
    title: 'Object Collaboration (Round Start)',
    points: [
      'Game object controls WHEN the round starts.',
      'Dealer object performs HOW cards are distributed.',
      'Deck object provides actual cards on request.',
      'Player and Dealer objects own their own hands.',
    ],
  });
  protected readonly summary = signal<RoundSummary | null>(null);
  protected readonly dealerCards = signal<CardView[]>([]);
  protected readonly playerCards = signal<CardView[]>([]);
  protected readonly dealerValue = signal('-');
  protected readonly playerValue = signal('-');

  protected onBetChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = Number(target.value || 0);
    this.bet.set(Number.isFinite(value) && value > 0 ? Math.floor(value) : 1);
  }

  protected onPlaybackChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = Number(target.value || 1400);
    this.playbackMs.set(Number.isFinite(value) && value > 0 ? value : 1400);
  }

  protected async startGame(): Promise<void> {
    if (this.running()) return;

    this.running.set(true);
    this.timeline.set([]);
    this.activeTimelineIndex.set(-1);
    this.summary.set(null);
    this.dealerCards.set([]);
    this.playerCards.set([]);
    this.status.set('Round started...');

    try {
      const response = await fetch(`${this.apiBaseUrl}/blackjack/start-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bet: this.bet() }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json() as { events: RoundEvent[]; summary: RoundSummary };
      await this.playEventsSlowly(data.events || []);
      this.summary.set(data.summary);
      this.status.set(data.summary?.message ?? 'Round finished.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.status.set(`Failed to start game from server. (${message})`);
    } finally {
      this.running.set(false);
    }
  }

  private async playEventsSlowly(events: RoundEvent[]): Promise<void> {
    for (const event of events) {
      const blocks = classCodeBlocksFor(event);
      this.timeline.update((items) => {
        const next = [...items, this.describe(event)];
        this.activeTimelineIndex.set(next.length - 1);
        return next;
      });
      this.codeExplanation.set(explanationFor(event));
      for (let index = 0; index < blocks.length; index += 1) {
        this.executingCode.set(executionLinesForBlock(blocks[index], index, blocks.length));
        await delay(this.playbackMs());
      }
      this.dealerCards.set(toCardViews(event.dealer_hand));
      this.playerCards.set(toCardViews(event.player_hand));
      this.dealerValue.set(String(event.dealer_value));
      this.playerValue.set(String(event.player_value));
    }
  }

  private describe(event: RoundEvent): string {
    const card = event.card ? ` (${event.card})` : '';
    return `${event.actor} -> ${event.action}${card}`;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function explanationFor(event: RoundEvent): CodeExplanation {
  if (event.action === 'deal') {
    return {
      title: 'Object Collaboration (Dealing Step)',
      points: [
        'Game asks Dealer to deal cards for this phase.',
        'Dealer requests one card from Deck.',
        'Deck returns a card object (rank+suit).',
        'Dealer passes that card to Player or keeps it for Dealer hand.',
      ],
    };
  }

  if (event.action === 'hit') {
    return {
      title: 'Object Collaboration (Hit Action)',
      points: [
        `${event.actor} object decided random action = hit.`,
        'Deck provides next card via draw().',
        `${event.actor} receives and stores the card in its own hand.`,
        'Game records state snapshot into timeline/event log.',
      ],
    };
  }

  return {
    title: 'Object Collaboration (Stand Action)',
    points: [
      `${event.actor} object decided random action = stand.`,
      'No new card is requested from Deck in this step.',
      'Turn control moves back to Game flow for next actor or settlement.',
      'State is logged so UI can replay this decision clearly.',
    ],
  };
}

function executionLinesForBlock(block: ClassCodeBlock, index: number, total: number): string[] {
  return [
    `# ${index + 1} / ${total}`,
    `# ${block.className}.${block.functionName}()`,
    '',
    ...block.lines,
  ];
}

function classCodeBlocksFor(event: RoundEvent): ClassCodeBlock[] {
  if (event.action === 'deal') {
    return [
      {
        className: 'Game',
        functionName: 'start_round',
        lines: [
          'def start_round(self):',
          '    self.dealer.deal_opening(self.deck, self.player, log_event)',
          '    self._play_random_turn(self.player, log_event)',
        ],
      },
      {
        className: 'Dealer',
        functionName: 'deal_opening',
        lines: [
          'def deal_opening(self, deck, player, log_event):',
          '    card = deck.draw()',
          `    ${event.actor.toLowerCase()}.receive_card(card)`,
          '    log_event(actor, "deal", card)',
        ],
      },
      {
        className: 'Deck',
        functionName: 'draw',
        lines: [
          'def draw(self):',
          '    return self.cards.pop()',
        ],
      },
      {
        className: event.actor,
        functionName: 'receive_card',
        lines: [
          'def receive_card(self, card):',
          '    self.hand.append(card)',
          '    return self.hand',
        ],
      },
    ];
  }

  if (event.action === 'hit') {
    return [
      {
        className: 'Game',
        functionName: '_play_random_turn',
        lines: [
          `def _play_random_turn(self, ${event.actor.toLowerCase()}, log_event):`,
          '    action = random.choice(["hit", "stand"])',
          '    if action == "hit":',
          '        card = self.deck.draw()',
          `        ${event.actor.toLowerCase()}.receive_card(card)`,
        ],
      },
      {
        className: 'Deck',
        functionName: 'draw',
        lines: [
          'def draw(self):',
          '    return self.cards.pop()',
        ],
      },
      {
        className: event.actor,
        functionName: 'receive_card',
        lines: [
          'def receive_card(self, card):',
          '    self.hand.append(card)',
          '    return self.hand',
        ],
      },
    ];
  }

  return [
    {
      className: 'Game',
      functionName: '_play_random_turn',
      lines: [
        `def _play_random_turn(self, ${event.actor.toLowerCase()}, log_event):`,
        '    action = random.choice(["hit", "stand"])',
        '    if action == "stand":',
        '        log_event(actor, "stand")',
        '        return',
      ],
    },
  ];
}

function defaultClassCodeBlocks(): ClassCodeBlock[] {
  return [
    {
      className: 'Game',
      functionName: 'start_round',
      lines: [
        'def start_round(self):',
        '    self.dealer.deal_opening(self.deck, self.player, log_event)',
        '    self._play_random_turn(self.player, log_event)',
      ],
    },
    {
      className: 'Dealer',
      functionName: 'deal_opening',
      lines: [
        'def deal_opening(self, deck, player, log_event):',
        '    card = deck.draw()',
        '    player.receive_card(card)',
        '    log_event(actor, "deal", card)',
      ],
    },
  ];
}

function toCardViews(cards: string[]): CardView[] {
  return cards.map((code) => mapCard(code));
}

function mapCard(code: string): CardView {
  const suitCode = (code.slice(-1) || 'S').toUpperCase();
  const rank = code.slice(0, -1) || '?';
  const suitMap: Record<string, { symbol: string; key: SuitKey }> = {
    S: { symbol: '♠', key: 'spade' },
    H: { symbol: '♥', key: 'heart' },
    D: { symbol: '♦', key: 'diamond' },
    C: { symbol: '♣', key: 'club' },
  };
  const suit = suitMap[suitCode] ?? suitMap['S'];
  return {
    code,
    rank,
    suit: suit.symbol,
    suitClass: `card-view--${suit.key}`,
  };
}
