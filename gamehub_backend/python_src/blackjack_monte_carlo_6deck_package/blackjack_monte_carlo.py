#!/usr/bin/env python3
"""
6-deck Blackjack Monte Carlo runner.

Model:
- 6 decks (312 cards)
- Dealer stands on soft 17 (S17)
- Blackjack pays 3:2
- No surrender
- Double on initial two cards
- Double after split (DAS)
- Re-split up to 4 hands
- Split aces receive one card each
- True Count uses Hi-Lo and is clamped to -10..+10 in the key table
- The key's action is forced as the FIRST decision.
- Subsequent decisions use a fixed basic-strategy continuation policy.

Important:
The CSV state is compressed. It does not contain the exact shoe composition.
For each trial this program creates a plausible 6-deck shoe whose Hi-Lo
composition is adjusted toward the requested True Count. Therefore results
are Monte Carlo estimates for this compressed-state model, not an exact
enumeration of every possible physical shoe matching that count.

Usage:
  python blackjack_monte_carlo.py
  python blackjack_monte_carlo.py --simulations 1000
  python blackjack_monte_carlo.py --simulations 38416 --workers 8
  python blackjack_monte_carlo.py --keys blackjack_monte_carlo_6deck_keys.csv

Output:
  blackjack_monte_carlo_results.csv
"""

import argparse
import csv
import math
import os
import random
import shlex
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

CARD_VALUES = [1,2,3,4,5,6,7,8,9,10]
FULL_SHOE = (
    [1] * 24 +
    [2] * 24 + [3] * 24 + [4] * 24 + [5] * 24 +
    [6] * 24 + [7] * 24 + [8] * 24 + [9] * 24 +
    [10] * 96
)

def hilo(card):
    if 2 <= card <= 6:
        return 1
    if card == 1 or card == 10:
        return -1
    return 0

def hand_total(cards):
    total = sum(11 if c == 1 else c for c in cards)
    aces = cards.count(1)
    while total > 21 and aces:
        total -= 10
        aces -= 1
    usable_ace = (1 in cards and total <= 21 and sum(11 if c == 1 else c for c in cards) == total)
    return total, usable_ace

def dealer_play(cards, shoe):
    while True:
        total, soft = hand_total(cards)
        if total > 21:
            return total
        if total > 17 or total == 17:  # S17
            return total
        cards.append(shoe.pop())

def remove_card(shoe, card, rng):
    idxs = [i for i, c in enumerate(shoe) if c == card]
    if not idxs:
        return False
    shoe.pop(rng.choice(idxs))
    return True

def construct_initial_hand(hand_type, hand_value, rng):
    """Create one representative two-card hand matching the compressed state."""
    if hand_type == "pair":
        v = 1 if str(hand_value) == "A" else int(hand_value)
        return [v, v]

    total = int(hand_value)

    if hand_type == "soft":
        other = total - 11
        if 2 <= other <= 9:
            return [1, other]
        raise ValueError(f"Unsupported soft total: {total}")

    # Hard hand: choose randomly among legal two-card combinations that match total.
    candidates = []
    for a in CARD_VALUES:
        for b in CARD_VALUES:
            t, soft = hand_total([a, b])
            if t == total and not soft and not (a == b):
                candidates.append((a, b))
    # Pair hands are represented separately; fall back if needed.
    if not candidates:
        for a in CARD_VALUES:
            for b in CARD_VALUES:
                t, soft = hand_total([a, b])
                if t == total and not soft:
                    candidates.append((a, b))
    if not candidates:
        raise ValueError(f"No two-card hard hand for total {total}")
    return list(rng.choice(candidates))

def adjust_shoe_to_true_count(shoe, target_tc, rng):
    """
    Approximate requested Hi-Lo true count by removing cards from a full shoe.
    This intentionally models a compressed count state rather than exact history.
    """
    if target_tc == 0:
        # Give zero-count states some realistic depletion.
        remove_n = rng.randint(40, 180)
        removed = []
        for _ in range(remove_n):
            if not shoe:
                break
            removed.append(shoe.pop(rng.randrange(len(shoe))))
        return shoe

    # Random penetration: roughly 1.5 to 5 decks dealt.
    dealt = rng.randint(78, 260)
    target_running = int(round(target_tc * max((312 - dealt) / 52.0, 0.5)))

    removed_count = 0
    attempts = 0
    while len(shoe) > 52 and attempts < dealt * 20:
        attempts += 1
        current_running = -sum(hilo(c) for c in shoe)  # full shoe starts at zero
        need = target_running - current_running
        if need > 0:
            preferred = [c for c in shoe if hilo(c) == -1]  # removing high card raises running count
        elif need < 0:
            preferred = [c for c in shoe if hilo(c) == 1]
        else:
            preferred = shoe
        if not preferred:
            preferred = shoe
        c = rng.choice(preferred)
        shoe.remove(c)
        removed_count += 1
        if removed_count >= dealt:
            break
    return shoe

def basic_action(cards, dealer_up, can_double=False, can_split=False):
    total, soft = hand_total(cards)

    # Simple pair strategy for continuation after splits.
    if can_split and len(cards) == 2 and cards[0] == cards[1]:
        p = cards[0]
        if p in (1, 8):
            return "split"
        if p in (2, 3) and dealer_up in (2,3,4,5,6,7):
            return "split"
        if p == 4 and dealer_up in (5,6):
            return "split"
        if p == 6 and dealer_up in (2,3,4,5,6):
            return "split"
        if p == 7 and dealer_up in (2,3,4,5,6,7):
            return "split"
        if p == 9 and dealer_up in (2,3,4,5,6,8,9):
            return "split"

    if soft:
        if total >= 19:
            return "stand"
        if total == 18:
            if can_double and dealer_up in (2,3,4,5,6):
                return "double"
            return "stand" if dealer_up in (2,7,8) else "hit"
        if total == 17 and can_double and dealer_up in (3,4,5,6):
            return "double"
        if total in (15,16) and can_double and dealer_up in (4,5,6):
            return "double"
        if total in (13,14) and can_double and dealer_up in (5,6):
            return "double"
        return "hit"

    if total >= 17:
        return "stand"
    if 13 <= total <= 16:
        return "stand" if dealer_up in (2,3,4,5,6) else "hit"
    if total == 12:
        return "stand" if dealer_up in (4,5,6) else "hit"
    if total == 11:
        return "double" if can_double and dealer_up != 1 else "hit"
    if total == 10:
        return "double" if can_double and dealer_up in (2,3,4,5,6,7,8,9) else "hit"
    if total == 9:
        return "double" if can_double and dealer_up in (3,4,5,6) else "hit"
    return "hit"

def settle(player_cards, dealer_cards, bet=1.0, blackjack_eligible=True):
    pt, _ = hand_total(player_cards)
    dt, _ = hand_total(dealer_cards)
    if pt > 21:
        return -bet
    if dt > 21:
        return bet

    p_bj = blackjack_eligible and len(player_cards) == 2 and pt == 21
    d_bj = len(dealer_cards) == 2 and dt == 21
    if p_bj and d_bj:
        return 0.0
    if p_bj:
        return 1.5 * bet
    if d_bj:
        return -bet

    if pt > dt:
        return bet
    if pt < dt:
        return -bet
    return 0.0

def play_hand(cards, dealer_up, dealer_hole, shoe, first_action, rng, split_depth=0):
    """Return total reward for this player hand; split can produce multiple hands."""
    bet = 1.0
    action = first_action
    blackjack_eligible = split_depth == 0

    while True:
        total, _ = hand_total(cards)
        if total > 21:
            return -bet

        can_double = len(cards) == 2
        can_split = len(cards) == 2 and cards[0] == cards[1] and split_depth < 3

        if action == "split":
            if not can_split:
                action = basic_action(cards, dealer_up, can_double, False)
                continue
            pair_card = cards[0]
            if len(shoe) < 2:
                return 0.0
            hand1 = [pair_card, shoe.pop()]
            hand2 = [pair_card, shoe.pop()]
            if pair_card == 1:
                # One card only after split aces.
                dealer_cards = [dealer_up, dealer_hole]
                dealer_play(dealer_cards, shoe)
                return (
                    settle(hand1, dealer_cards, 1.0, False) +
                    settle(hand2, dealer_cards, 1.0, False)
                )
            a1 = basic_action(hand1, dealer_up, True, hand1[0] == hand1[1])
            a2 = basic_action(hand2, dealer_up, True, hand2[0] == hand2[1])
            # Each branch gets its own copy because they represent alternative
            # hands in the same split round and consume from the shoe sequentially.
            r1 = play_hand(hand1, dealer_up, dealer_hole, shoe, a1, rng, split_depth + 1)
            r2 = play_hand(hand2, dealer_up, dealer_hole, shoe, a2, rng, split_depth + 1)
            return r1 + r2

        if action == "double":
            if can_double:
                bet = 2.0
                if shoe:
                    cards.append(shoe.pop())
                break
            action = basic_action(cards, dealer_up, False, can_split)
            continue

        if action == "stand":
            break

        if action == "hit":
            if not shoe:
                break
            cards.append(shoe.pop())
            total, _ = hand_total(cards)
            if total > 21:
                return -bet
            action = basic_action(
                cards, dealer_up,
                can_double=False,
                can_split=(len(cards) == 2 and cards[0] == cards[1])
            )
            continue

        raise ValueError(f"Unknown action: {action}")

    dealer_cards = [dealer_up, dealer_hole]
    dealer_play(dealer_cards, shoe)
    return settle(cards, dealer_cards, bet, blackjack_eligible)

def ci95_margin_wilson(wins, n):
    if n <= 0:
        return float("inf")
    z = 1.96
    p = wins / n
    z2 = z * z
    denom = 1.0 + z2 / n
    center = (p + z2 / (2.0 * n)) / denom
    radius = (z / denom) * math.sqrt((p * (1.0 - p) / n) + (z2 / (4.0 * n * n)))
    _ = center
    return radius


def simulate_one(row, simulations, seed, ci_target=None, min_simulations=0, max_simulations=None, batch_size=256):
    rng = random.Random(seed)
    wins = losses = pushes = 0
    reward_sum = 0.0
    reward_sq_sum = 0.0

    hand_type = row["hand_type"]
    hv_raw = row["hand_value"]
    hand_value = hv_raw if hand_type == "pair" else int(hv_raw)
    dealer_up = 1 if row["dealer_card"] == "A" else int(row["dealer_card"])
    tc = int(row["true_count"])
    forced_action = row["action"]

    def run_one_trial():
        nonlocal wins, losses, pushes, reward_sum, reward_sq_sum
        shoe = list(FULL_SHOE)
        player = construct_initial_hand(hand_type, hand_value, rng)

        # Remove visible player cards and dealer up-card before count adjustment.
        ok = True
        for c in player + [dealer_up]:
            if not remove_card(shoe, c, rng):
                ok = False
                break
        if not ok:
            return False

        adjust_shoe_to_true_count(shoe, tc, rng)
        rng.shuffle(shoe)

        if not shoe:
            return False
        dealer_hole = shoe.pop()

        reward = play_hand(player, dealer_up, dealer_hole, shoe, forced_action, rng)
        reward_sum += reward
        reward_sq_sum += reward * reward

        if reward > 0:
            wins += 1
        elif reward < 0:
            losses += 1
        else:
            pushes += 1
        return True

    if ci_target is None:
        for _ in range(simulations):
            run_one_trial()
        stop_reason = "fixed_simulations"
    else:
        max_total = max_simulations if max_simulations is not None else max(simulations, min_simulations)
        completed = 0
        while completed < max_total:
            step = min(batch_size, max_total - completed)
            for _ in range(step):
                run_one_trial()
            completed += step

            n_now = wins + losses + pushes
            if n_now < max(1, min_simulations):
                continue

            margin_now = ci95_margin_wilson(wins, n_now)
            if margin_now <= ci_target:
                break

        n_now = wins + losses + pushes
        if n_now >= max(1, min_simulations) and ci95_margin_wilson(wins, n_now) <= ci_target:
            stop_reason = "ci_target_reached"
        else:
            stop_reason = "max_simulations_reached"

    n = wins + losses + pushes
    if n == 0:
        return None

    win_rate = wins / n
    # 95% normal-approximation CI for win probability.
    se = math.sqrt(max(win_rate * (1.0 - win_rate), 0.0) / n)
    margin = 1.96 * se
    ci_low = max(0.0, win_rate - margin)
    ci_high = min(1.0, win_rate + margin)

    expected_return = reward_sum / n
    if n > 1:
        variance = max((reward_sq_sum - n * expected_return * expected_return) / (n - 1), 0.0)
        reward_se = math.sqrt(variance / n)
    else:
        reward_se = 0.0

    return {
        **row,
        "simulations": n,
        "wins": wins,
        "losses": losses,
        "pushes": pushes,
        "win_rate": round(win_rate, 8),
        "ci95_low": round(ci_low, 8),
        "ci95_high": round(ci_high, 8),
        "ci95_margin": round(margin, 8),
        "ci95_target": "" if ci_target is None else round(ci_target, 8),
        "stop_reason": stop_reason,
        "expected_return": round(expected_return, 8),
        "expected_return_ci95_low": round(expected_return - 1.96 * reward_se, 8),
        "expected_return_ci95_high": round(expected_return + 1.96 * reward_se, 8),
    }

def load_keys(path, limit=None):
    with open(path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if limit:
        rows = rows[:limit]
    return rows


def load_checkpoint_results(path, valid_keys):
    checkpoint = Path(path)
    if not checkpoint.exists() or checkpoint.stat().st_size == 0:
        return {}

    completed = {}
    with checkpoint.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            key = row.get("key")
            if key and key in valid_keys and key not in completed:
                completed[key] = row
    return completed


def append_checkpoint_row(path, row, fieldnames):
    checkpoint = Path(path)
    write_header = not checkpoint.exists() or checkpoint.stat().st_size == 0
    with checkpoint.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if write_header:
            writer.writeheader()
        writer.writerow(row)
        f.flush()
        os.fsync(f.fileno())


def _to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def build_progress_snapshot(done, total, started_at, rows):
    elapsed_sec = max(time.time() - started_at, 1e-9)
    pending = max(total - done, 0)
    keys_per_sec = done / elapsed_sec if done > 0 else 0.0
    eta_sec = pending / keys_per_sec if keys_per_sec > 0 else float("inf")

    reason_counts = {}
    sim_values = []
    ci_values = []

    for row in rows:
        reason = row.get("stop_reason", "")
        if reason:
            reason_counts[reason] = reason_counts.get(reason, 0) + 1

        sim = _to_int(row.get("simulations"))
        if sim is not None:
            sim_values.append(sim)

        ci = _to_float(row.get("ci95_margin"))
        if ci is not None:
            ci_values.append(ci)

    sim_min = min(sim_values) if sim_values else ""
    sim_max = max(sim_values) if sim_values else ""
    sim_mean = (sum(sim_values) / len(sim_values)) if sim_values else ""

    ci_min = min(ci_values) if ci_values else ""
    ci_max = max(ci_values) if ci_values else ""
    ci_mean = (sum(ci_values) / len(ci_values)) if ci_values else ""

    return {
        "timestamp_epoch": round(time.time(), 3),
        "completed_keys": done,
        "total_keys": total,
        "pending_keys": pending,
        "elapsed_sec": round(elapsed_sec, 3),
        "keys_per_sec": round(keys_per_sec, 6),
        "eta_sec": "" if math.isinf(eta_sec) else round(eta_sec, 3),
        "stop_reason_ci_target_reached": reason_counts.get("ci_target_reached", 0),
        "stop_reason_max_simulations_reached": reason_counts.get("max_simulations_reached", 0),
        "stop_reason_fixed_simulations": reason_counts.get("fixed_simulations", 0),
        "simulations_min": sim_min,
        "simulations_max": sim_max,
        "simulations_mean": "" if sim_mean == "" else round(sim_mean, 3),
        "ci95_margin_min": "" if ci_min == "" else round(ci_min, 8),
        "ci95_margin_max": "" if ci_max == "" else round(ci_max, 8),
        "ci95_margin_mean": "" if ci_mean == "" else round(ci_mean, 8),
    }


def append_progress_snapshot(path, snapshot, fieldnames):
    target = Path(path)
    write_header = not target.exists() or target.stat().st_size == 0
    with target.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if write_header:
            writer.writeheader()
        writer.writerow(snapshot)
        f.flush()
        os.fsync(f.fileno())


def find_running_similar_job(args):
    """Return True if a matching blackjack_monte_carlo.py process is already active."""
    if not args:
        return False

    target_keys = os.path.abspath(args.keys)
    target_output = os.path.abspath(args.output)
    target_checkpoint = os.path.abspath(args.checkpoint or f"{args.output}.checkpoint.csv")
    target_snapshot = os.path.abspath(args.snapshot_path or f"{args.output}.progress.csv")
    should_resume = bool(args.resume)

    try:
        proc = subprocess.run(
            ["ps", "-eo", "pid,args"],
            capture_output=True,
            text=True,
            check=True,
        )
    except (OSError, subprocess.CalledProcessError):
        return False

    for line in proc.stdout.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        parts = stripped.split(None, 1)
        if len(parts) < 2:
            continue
        pid_str, cmdline = parts
        if not pid_str.isdigit():
            continue
        try:
            pid = int(pid_str)
        except ValueError:
            continue
        if pid == os.getpid():
            continue
        if "blackjack_monte_carlo.py" not in cmdline:
            continue

        try:
            tokens = shlex.split(cmdline)
        except ValueError:
            continue

        def flag_value(name):
            try:
                i = tokens.index(name)
                if i + 1 < len(tokens):
                    return tokens[i + 1]
            except ValueError:
                pass
            return None

        keys = flag_value("--keys")
        output = flag_value("--output")
        checkpoint = flag_value("--checkpoint")
        snapshot = flag_value("--snapshot-path")
        resume = "--resume" in tokens

        if not keys or not output:
            continue

        effective_checkpoint = os.path.abspath(checkpoint or f"{output}.checkpoint.csv")
        effective_snapshot = os.path.abspath(snapshot or f"{output}.progress.csv")

        same_keys = os.path.abspath(keys) == target_keys
        same_output = os.path.abspath(output) == target_output
        same_checkpoint = effective_checkpoint == target_checkpoint
        same_snapshot = effective_snapshot == target_snapshot
        same_resume = resume == should_resume

        if same_keys and same_output and same_checkpoint and same_snapshot and same_resume:
            return True

    return False


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--keys", default="blackjack_monte_carlo_6deck_keys.csv")
    p.add_argument("--output", default="blackjack_monte_carlo_results.csv")
    p.add_argument("--checkpoint", default=None,
                   help="Checkpoint CSV path. Defaults to <output>.checkpoint.csv")
    p.add_argument("--snapshot-path", default=None,
                   help="Progress snapshot CSV path. Defaults to <output>.progress.csv")
    p.add_argument("--snapshot-every", type=int, default=100,
                   help="Write progress snapshot every N completed keys. Set 0 to disable.")
    p.add_argument("--resume", action="store_true",
                   help="Resume from checkpoint by skipping keys already completed.")
    p.add_argument("--simulations", type=int, default=1000,
                   help="Trials per key. Use 38416 for about ±0.5 percentage-point worst-case 95%% CI.")
    p.add_argument("--ci-target", type=float, default=None,
                   help="Per-key stop target for 95%% CI half-width on win_rate (Wilson). Example: 0.005")
    p.add_argument("--min-simulations", type=int, default=1000,
                   help="Minimum trials/key before CI-based early stop can trigger.")
    p.add_argument("--max-simulations", type=int, default=38416,
                   help="Maximum trials/key in CI mode.")
    p.add_argument("--batch-size", type=int, default=256,
                   help="Trials processed per CI check in CI mode.")
    p.add_argument("--workers", type=int, default=max(1, (os.cpu_count() or 2) - 1))
    p.add_argument("--limit", type=int, default=None,
                   help="Only run first N keys; useful for benchmarking.")
    p.add_argument("--seed", type=int, default=20260926)
    p.add_argument("--force", action="store_true",
                   help="Force a duplicate launch even if the same run is already active.")
    args = p.parse_args()

    if not args.force and find_running_similar_job(args):
        print(
            "Another Monte Carlo run with the same keys/output is already running. "
            "Use --force to override this guard.",
            file=sys.stderr,
        )
        raise SystemExit(1)

    rows = load_keys(args.keys, args.limit)
    total = len(rows)
    checkpoint_path = args.checkpoint or f"{args.output}.checkpoint.csv"
    snapshot_path = args.snapshot_path or f"{args.output}.progress.csv"
    valid_keys = {row["key"] for row in rows}

    completed_by_key = {}
    if args.resume:
        completed_by_key = load_checkpoint_results(checkpoint_path, valid_keys)

    pending_rows = [row for row in rows if row["key"] not in completed_by_key]
    pending_total = len(pending_rows)

    print(f"Keys: {total:,}")
    if args.resume:
        print(f"Resume mode: ON ({len(completed_by_key):,} completed, {pending_total:,} pending)")
        print(f"Checkpoint: {checkpoint_path}")
    else:
        print("Resume mode: OFF")
        print(f"Checkpoint: {checkpoint_path}")
    if args.snapshot_every > 0:
        print(f"Progress snapshots: every {args.snapshot_every:,} keys -> {snapshot_path}")
    else:
        print("Progress snapshots: OFF")
    if args.ci_target is None:
        print("Mode: fixed simulations per key")
        print(f"Simulations/key: {args.simulations:,}")
        print(f"Total planned trials: {total * args.simulations:,}")
    else:
        print("Mode: CI-based adaptive stopping per key")
        print(f"CI target half-width: {args.ci_target}")
        print(f"Min simulations/key: {args.min_simulations:,}")
        print(f"Max simulations/key: {args.max_simulations:,}")
        print(f"Batch size: {args.batch_size:,}")
        print(f"Planned worst-case trials: {total * args.max_simulations:,}")
    print(f"Workers: {args.workers}")
    print("Rules: 6-deck, S17, BJ 3:2, DAS, no surrender, split up to 4 hands")
    print()

    start = time.time()
    index_by_key = {row["key"]: i for i, row in enumerate(rows)}
    results_by_index = {index_by_key[key]: row for key, row in completed_by_key.items()}
    checkpoint_fieldnames = None
    completed_count = len(results_by_index)
    progress_fieldnames = [
        "timestamp_epoch",
        "completed_keys",
        "total_keys",
        "pending_keys",
        "elapsed_sec",
        "keys_per_sec",
        "eta_sec",
        "stop_reason_ci_target_reached",
        "stop_reason_max_simulations_reached",
        "stop_reason_fixed_simulations",
        "simulations_min",
        "simulations_max",
        "simulations_mean",
        "ci95_margin_min",
        "ci95_margin_max",
        "ci95_margin_mean",
    ]

    if pending_total == 0:
        print("All keys already completed in checkpoint. Writing final output...")

    with ProcessPoolExecutor(max_workers=args.workers) as ex:
        futures = {
            ex.submit(
                simulate_one,
                row,
                args.simulations,
                args.seed + i * 1000003,
                args.ci_target,
                args.min_simulations,
                args.max_simulations,
                args.batch_size,
            ): i
            for i, row in enumerate(pending_rows)
        }
        done = completed_count
        for fut in as_completed(futures):
            result = fut.result()
            if result is not None:
                idx = index_by_key[result["key"]]
                results_by_index[idx] = result

                if checkpoint_fieldnames is None:
                    checkpoint_fieldnames = list(result.keys())
                append_checkpoint_row(checkpoint_path, result, checkpoint_fieldnames)

            done += 1
            if done == 1 or done % max(1, total // 20) == 0 or done == total:
                elapsed = time.time() - start
                rate = (done - completed_count) / elapsed if elapsed else 0
                eta = (total - done) / rate if rate else 0
                print(f"{done:>6,}/{total:,} keys  elapsed={elapsed/60:.1f}m  ETA={eta/60:.1f}m")

            if args.snapshot_every > 0 and (done == total or done % args.snapshot_every == 0):
                current_rows = [results_by_index[i] for i in range(total) if i in results_by_index]
                snapshot = build_progress_snapshot(done, total, start, current_rows)
                append_progress_snapshot(snapshot_path, snapshot, progress_fieldnames)

    out_rows = [results_by_index[i] for i in range(total) if i in results_by_index]

    fieldnames = list(out_rows[0].keys()) if out_rows else []
    with open(args.output, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(out_rows)

    elapsed = time.time() - start
    print()
    print(f"Finished in {elapsed/60:.2f} minutes")
    print(f"Saved: {args.output}")

if __name__ == "__main__":
    main()
