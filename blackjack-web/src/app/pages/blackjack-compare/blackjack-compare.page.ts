import { isPlatformBrowser } from '@angular/common';
import { Component, InjectionToken, OnDestroy, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoundView } from './round-view.component';
import { StatsView } from './stats-view.component';
import {
  createEmptyStats,
  parseStrategyCsv,
  PlayedRound,
  PairedRound,
  RoundFrame,
  simulatePairedRound,
  SimulationStats,
  StrategyTable,
  updateStats,
} from './blackjack-simulation';

export const PAIRED_ROUND_SIMULATOR = new InjectionToken<(table: StrategyTable) => PairedRound>(
  'PAIRED_ROUND_SIMULATOR',
  { providedIn: 'root', factory: () => simulatePairedRound },
);

@Component({
  selector: 'app-blackjack-compare-page',
  standalone: true,
  imports: [RouterLink, RoundView, StatsView],
  template: `
    <main class="shell">
      <a class="back" routerLink="/demos">← 데모 목록</a>
      <header class="intro">
        <p class="eyebrow">6덱 블랙잭 · 자동 시뮬레이션</p>
        <h1>랜덤 플레이 vs Monte Carlo 전략</h1>
        <p>
          페이지를 열면 두 플레이어가 같은 셔플과 첫 패를 받아 동시에 플레이합니다.
          카드 배분과 행동을 천천히 재생하고, 라운드가 끝나면 승률을 갱신합니다.
        </p>
      </header>

      <section class="scoreboard" aria-label="실시간 승률 비교" aria-live="polite">
        <article class="score random-score">
          <span>랜덤 승률</span>
          <strong>{{ winRate(randomStats()) }}</strong>
          <small>{{ record(randomStats()) }}</small>
        </article>
        <article class="score advantage-score">
          <span>Monte Carlo 승률</span>
          <strong>{{ winRate(strategyStats()) }}</strong>
          <small>{{ record(strategyStats()) }}</small>
        </article>
        <article class="score">
          <span>승률 차이</span>
          <strong>{{ winRateDifference() }}</strong>
          <small>Monte Carlo − 랜덤</small>
        </article>
        <article class="score">
          <span>완료 라운드</span>
          <strong>{{ randomStats().rounds.toLocaleString() }}</strong>
          <small>두 방식에 같은 횟수 적용</small>
        </article>
      </section>

      <div class="toolbar">
        <p [class.error]="error()">{{ status() }}</p>
        <label class="speed-control">
          재생 속도
          <select [value]="playbackMs()" (change)="changePlaybackSpeed($event)">
            <option value="1400">보통 (1.4초 / 단계)</option>
            <option value="2200">느리게 (2.2초 / 단계)</option>
            <option value="3200">아주 느리게 (3.2초 / 단계)</option>
          </select>
        </label>
        <button type="button" [disabled]="!strategyTable()" (click)="toggleSimulation()">
          {{ running() ? '일시 정지' : '계속 진행' }}
        </button>
        <button class="secondary" type="button" [disabled]="!strategyTable()" (click)="restartSimulation()">
          처음부터 다시
        </button>
      </div>

      <section class="tables" aria-label="플레이 비교">
        <article class="table random-table">
          <header>
            <div>
              <p class="table-kicker">플레이어 A</p>
              <h2>무작위 행동</h2>
            </div>
            <span class="badge">50% hit / 50% stand</span>
          </header>
          <p class="table-desc">매 결정마다 hit 또는 stand를 동전 던지기처럼 무작위로 선택합니다.</p>
          <round-view [frame]="randomFrame()" [round]="randomRound()" />
          <stats-view [stats]="randomStats()" />
        </article>

        <article class="table strategy-table">
          <header>
            <div>
              <p class="table-kicker">플레이어 B</p>
              <h2>Monte Carlo 전략</h2>
            </div>
            <span class="badge">기대수익 최대 행동</span>
          </header>
          <p class="table-desc">현재 패·딜러 오픈 카드·true count에 맞는 CSV 결과 중 기대수익이 가장 높은 행동을 고릅니다.</p>
          <round-view [frame]="strategyFrame()" [round]="strategyRound()" />
          <stats-view [stats]="strategyStats()" />
        </article>
      </section>

      <section class="explanation">
        <h2>어떻게 비교하나요?</h2>
        <div class="explanation-grid">
          <article>
            <h3>같은 조건에서 시작</h3>
            <p>6덱을 매 라운드 새로 섞고, 두 방식은 같은 첫 두 장과 딜러 오픈 카드를 받습니다. 각자 남은 동일한 카드 순서의 복사본으로 이어서 플레이합니다.</p>
          </article>
          <article>
            <h3>승률 계산</h3>
            <p>승률은 승리한 라운드 수를 전체 라운드 수로 나눈 값입니다. 두 테이블의 재생이 끝난 뒤 함께 집계하며, 결과를 최소 3초간 보여줍니다. 무승부는 별도로 표시하고 순수익은 베팅 단위로 누적합니다.</p>
          </article>
          <article>
            <h3>Monte Carlo 데이터</h3>
            <p>완료된 23,520개 상태별 시뮬레이션 결과를 사용합니다. 처음 행동은 CSV의 expected return으로 고르고, 이후에는 시뮬레이터의 기본 전략을 따릅니다.</p>
          </article>
          <article>
            <h3>공통 규칙과 차이</h3>
            <p>딜러는 soft 17에서 멈추고, 블랙잭은 3:2로 지급합니다. Monte Carlo 방식은 double·split을 사용할 수 있지만 랜덤 플레이어는 hit/stand만 무작위로 선택합니다.</p>
          </article>
        </div>
        <p class="caveat">
          결과는 시뮬레이션 표본에 따른 추정치이며 실제 카지노 결과를 보장하지 않습니다.
          기존 OOP 데모와 달리 이 비교에서는 딜러까지 무작위로 행동하지 않습니다. 시뮬레이터의 true count는 플레이어 패와 딜러 오픈 카드로 계산하며, CSV 자체도 압축된 카운트 상태를 근사한 결과입니다.
        </p>
      </section>
    </main>
  `,
  styles: [`
    :host { display:block; min-height:100vh; color:#fff8e7; }
    .shell { width:min(1120px,94vw); margin:0 auto; padding:1.2rem 0 2.5rem; }
    .back { color:#fff8e7; text-decoration:none; }
    .intro { max-width:780px; margin:1.2rem 0 1.4rem; }
    .eyebrow,.table-kicker { margin:0 0 .3rem; color:#ffd477; font-size:.82rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; }
    h1 { margin:.2rem 0 .6rem; font-size:clamp(1.8rem,4vw,2.6rem); }
    .intro > p:last-child { margin:0; color:#fff8e7d9; line-height:1.6; }
    .scoreboard { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:.65rem; }
    .score,.table,.explanation { border:1px solid #ffffff30; border-radius:14px; background:#0719138c; }
    .score { display:grid; gap:.18rem; padding:.8rem 1rem; }
    .score span,.score small { color:#fff8e7c7; }
    .score strong { font-size:clamp(1.5rem,3vw,2rem); color:#ffe09a; font-variant-numeric:tabular-nums; }
    .advantage-score strong { color:#89e4b5; }
    .score small { font-size:.78rem; }
    .toolbar { display:flex; align-items:center; gap:.6rem; flex-wrap:wrap; margin:1rem 0; }
    .toolbar p { flex:1; min-width:220px; margin:0; color:#c5f4d8; }
    .toolbar p.error { color:#ffb5a9; }
    .speed-control { display:grid; gap:.25rem; font-size:.82rem; }
    select { border:1px solid #ffffff55; border-radius:9px; padding:.55rem; background:#14392d; color:#fff8e7; }
    button { border:0; border-radius:9px; padding:.6rem .9rem; background:#f8b84c; color:#15362d; font-weight:700; cursor:pointer; }
    button.secondary { border:1px solid #ffffff55; background:#ffffff12; color:#fff8e7; }
    button:disabled { cursor:not-allowed; opacity:.55; }
    .tables { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.8rem; }
    .table { padding:1rem; min-width:0; }
    .table > header { display:flex; justify-content:space-between; align-items:center; gap:.5rem; }
    .table h2 { margin:0; font-size:1.25rem; }
    .badge { border:1px solid #ffffff3a; border-radius:999px; padding:.3rem .55rem; color:#ffdfa0; font-size:.75rem; white-space:nowrap; }
    .table-desc { min-height:2.8rem; margin:.65rem 0; color:#fff8e7d4; line-height:1.45; font-size:.9rem; }
    .explanation { margin-top:1rem; padding:1rem; }
    .explanation h2 { margin:0 0 .75rem; }
    .explanation-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.7rem; }
    .explanation-grid article { padding:.7rem; border-radius:10px; background:#ffffff0b; }
    .explanation-grid h3 { margin:0 0 .3rem; font-size:1rem; color:#ffd477; }
    .explanation-grid p,.caveat { margin:0; color:#fff8e7d6; line-height:1.55; font-size:.9rem; }
    .caveat { margin-top:.8rem; color:#fff8e7aa; }
    @media (max-width:760px) {
      .scoreboard { grid-template-columns:repeat(2,minmax(0,1fr)); }
      .tables { grid-template-columns:1fr; }
      .table-desc { min-height:0; }
    }
    @media (max-width:480px) {
      .table > header { align-items:flex-start; flex-direction:column; }
      .explanation-grid { grid-template-columns:1fr; }
    }
  `],
})
export class BlackjackComparePage implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly simulate = inject(PAIRED_ROUND_SIMULATOR);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private runId = 0;
  private pendingPair: PairedRound | null = null;
  private frameIndex = 0;
  protected readonly strategyTable = signal<StrategyTable | null>(null);
  protected readonly randomStats = signal<SimulationStats>(createEmptyStats());
  protected readonly strategyStats = signal<SimulationStats>(createEmptyStats());
  protected readonly randomRound = signal<PlayedRound | null>(null);
  protected readonly strategyRound = signal<PlayedRound | null>(null);
  protected readonly randomFrame = signal<RoundFrame | null>(null);
  protected readonly strategyFrame = signal<RoundFrame | null>(null);
  protected readonly playbackMs = signal(1400);
  protected readonly running = signal(false);
  protected readonly status = signal('Monte Carlo 결과표를 불러오는 중...');
  protected readonly error = signal(false);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) void this.loadStrategyAndStart();
  }

  ngOnDestroy(): void {
    this.runId += 1;
    if (this.timer) clearTimeout(this.timer);
  }

  protected winRate(stats: SimulationStats): string {
    return `${stats.rounds ? ((stats.wins / stats.rounds) * 100).toFixed(1) : '0.0'}%`;
  }

  protected record(stats: SimulationStats): string {
    return `${stats.wins.toLocaleString()}승 · ${stats.losses.toLocaleString()}패 · ${stats.pushes.toLocaleString()}무`;
  }

  protected winRateDifference(): string {
    const difference = this.strategyStats().rounds
      ? (this.strategyStats().wins - this.randomStats().wins) / this.strategyStats().rounds * 100
      : 0;
    return `${difference > 0 ? '+' : ''}${difference.toFixed(1)}%p`;
  }

  protected toggleSimulation(): void {
    if (this.running()) {
      this.running.set(false);
      if (this.timer) clearTimeout(this.timer);
      this.status.set('일시 정지됨. 계속 진행하거나 처음부터 다시 시작할 수 있습니다.');
      return;
    }
    this.running.set(true);
    this.status.set('두 플레이어가 자동으로 플레이 중입니다.');
    this.runNextRound(this.runId);
  }

  protected changePlaybackSpeed(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const value = Number(target.value);
    if ([1400, 2200, 3200].includes(value)) this.playbackMs.set(value);
  }

  protected restartSimulation(): void {
    if (!this.strategyTable()) return;
    this.runId += 1;
    if (this.timer) clearTimeout(this.timer);
    this.randomStats.set(createEmptyStats());
    this.strategyStats.set(createEmptyStats());
    this.randomRound.set(null);
    this.strategyRound.set(null);
    this.randomFrame.set(null);
    this.strategyFrame.set(null);
    this.pendingPair = null;
    this.frameIndex = 0;
    this.running.set(true);
    this.error.set(false);
    this.status.set('두 플레이어가 자동으로 플레이 중입니다.');
    this.runNextRound(this.runId);
  }

  private async loadStrategyAndStart(): Promise<void> {
    try {
      const response = await fetch('/assets/blackjack-monte-carlo-results.csv');
      if (!response.ok) throw new Error(`CSV 요청 실패 (HTTP ${response.status})`);
      const csv = await response.text();
      if (this.runId !== 0) return;
      this.strategyTable.set(parseStrategyCsv(csv));
      this.running.set(true);
      this.status.set('두 플레이어가 자동으로 플레이 중입니다.');
      this.runNextRound(this.runId);
    } catch (cause) {
      this.error.set(true);
      const message = cause instanceof Error ? cause.message : '알 수 없는 오류';
      this.status.set(`시뮬레이션을 시작할 수 없습니다: ${message}`);
    }
  }

  private runNextRound(runId: number): void {
    if (!this.running() || runId !== this.runId) return;
    try {
      const table = this.strategyTable();
      if (!table) throw new Error('Monte Carlo 전략표가 로드되지 않았습니다.');
      if (!this.pendingPair) {
        this.pendingPair = this.simulate(table);
        this.frameIndex = 0;
        this.randomRound.set(null);
        this.strategyRound.set(null);
      }
      this.replayNextFrame(runId);
    } catch (cause) {
      this.running.set(false);
      this.error.set(true);
      const message = cause instanceof Error ? cause.message : '알 수 없는 오류';
      this.status.set(`시뮬레이션을 중단했습니다: ${message}`);
    }
  }

  private replayNextFrame(runId: number): void {
    const pair = this.pendingPair;
    if (!pair) return;
    const frameCount = Math.max(pair.random.frames.length, pair.monteCarlo.frames.length);
    this.randomFrame.set(pair.random.frames[Math.min(this.frameIndex, pair.random.frames.length - 1)]);
    this.strategyFrame.set(pair.monteCarlo.frames[Math.min(this.frameIndex, pair.monteCarlo.frames.length - 1)]);
    this.frameIndex += 1;
    const finished = this.frameIndex === frameCount;
    if (finished) {
      this.randomRound.set(pair.random);
      this.strategyRound.set(pair.monteCarlo);
      this.randomStats.update((stats) => updateStats(stats, pair.random));
      this.strategyStats.update((stats) => updateStats(stats, pair.monteCarlo));
      this.pendingPair = null;
    }
    this.timer = setTimeout(() => this.runNextRound(runId), finished ? Math.max(3000, this.playbackMs()) : this.playbackMs());
  }
}
