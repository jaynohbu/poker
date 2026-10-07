import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { BlackjackComparePage, PAIRED_ROUND_SIMULATOR } from './blackjack-compare.page';
import { PlayedRound } from './blackjack-simulation';

const round: PlayedRound = {
    openingAction: 'stand',
    playerHands: [['10♠', '8♥']],
    dealerHand: ['10♦', '7♣'],
    result: 'win',
    profit: 1,
    frames: [
      { playerHands: [['10♠']], dealerHand: [], message: '첫 카드' },
      { playerHands: [['10♠', '8♥']], dealerHand: ['10♦', '?'], message: '히든 카드' },
      { playerHands: [['10♠', '8♥']], dealerHand: ['10♦', '7♣'], message: '결과 확인' },
    ],
};

describe('BlackjackComparePage playback', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'key,action,expected_return\nhard|18|10|+0|stand,stand,1',
    }));
    await TestBed.configureTestingModule({
      imports: [BlackjackComparePage],
      providers: [
        provideRouter([]),
        { provide: PAIRED_ROUND_SIMULATOR, useValue: vi.fn(() => ({ random: round, monteCarlo: round })) },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  async function createPage() {
    const fixture = TestBed.createComponent(BlackjackComparePage);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();
    return fixture;
  }

  it('auto-starts with card faces, replays at 1.4 seconds per step and holds results for 3 seconds', async () => {
    const fixture = await createPage();
    const root = fixture.nativeElement as HTMLElement;
    const completed = () => root.querySelector('.scoreboard article:last-child strong')?.textContent?.trim();

    expect(root.querySelectorAll('.card-view')).toHaveLength(2);
    expect(completed()).toBe('0');
    await vi.advanceTimersByTimeAsync(1399);
    fixture.detectChanges();
    expect(root.querySelectorAll('.card-view')).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    fixture.detectChanges();
    expect(root.querySelectorAll('.card-back')).toHaveLength(2);
    expect(completed()).toBe('0');
    await vi.advanceTimersByTimeAsync(1400);
    fixture.detectChanges();
    expect(completed()).toBe('1');
    expect(root.querySelectorAll('.card-back')).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(2999);
    fixture.detectChanges();
    expect(root.querySelectorAll('.outcome')).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    fixture.detectChanges();
    expect(root.querySelectorAll('.outcome')).toHaveLength(0);
  });

  it('pauses mid-hand, resumes the next step, and restarts without duplicate timers', async () => {
    const fixture = await createPage();
    const root = fixture.nativeElement as HTMLElement;
    const pause = root.querySelector<HTMLButtonElement>('.toolbar button')!;
    pause.click();
    await vi.advanceTimersByTimeAsync(10000);
    fixture.detectChanges();
    expect(root.querySelectorAll('.card-view')).toHaveLength(2);
    pause.click();
    fixture.detectChanges();
    expect(root.querySelectorAll('.card-back')).toHaveLength(2);
    root.querySelector<HTMLButtonElement>('.toolbar button.secondary')!.click();
    fixture.detectChanges();
    expect(root.querySelectorAll('.card-view')).toHaveLength(2);
    expect(vi.getTimerCount()).toBe(1);
    fixture.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('uses the selected slower playback delay and cancels pending fetch startup on navigation', async () => {
    const fixture = await createPage();
    const root = fixture.nativeElement as HTMLElement;
    const select = root.querySelector<HTMLSelectElement>('select')!;
    select.value = '3200';
    select.dispatchEvent(new Event('change'));
    await vi.advanceTimersByTimeAsync(1400);
    fixture.detectChanges();
    expect(root.querySelectorAll('.card-back')).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(3199);
    fixture.detectChanges();
    expect(root.querySelectorAll('.outcome')).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1);
    fixture.detectChanges();
    expect(root.querySelectorAll('.outcome')).toHaveLength(2);
    fixture.destroy();

    let resolveFetch!: (response: { ok: boolean; text: () => Promise<string> }) => void;
    vi.mocked(fetch).mockImplementation(() => new Promise((resolve) => {
      resolveFetch = (response) => resolve(response as Response);
    }));
    const destroyedFixture = TestBed.createComponent(BlackjackComparePage);
    destroyedFixture.detectChanges();
    destroyedFixture.destroy();
    resolveFetch({ ok: true, text: async () => 'key,action,expected_return\nhard|18|10|+0|stand,stand,1' });
    await vi.advanceTimersByTimeAsync(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
