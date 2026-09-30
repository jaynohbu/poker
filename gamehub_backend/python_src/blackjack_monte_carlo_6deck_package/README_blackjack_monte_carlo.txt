Blackjack 6-Deck Monte Carlo

Files
1. blackjack_monte_carlo_6deck_keys.csv
   23,520 state/action keys.

2. blackjack_monte_carlo.py
   Parallel Monte Carlo runner using Python standard library only.

Recommended first test
python blackjack_monte_carlo.py --simulations 100 --limit 100

Small full run
python blackjack_monte_carlo.py --simulations 1000

High precision run
python blackjack_monte_carlo.py --simulations 38416

CI-based adaptive run (recommended)
python blackjack_monte_carlo.py --ci-target 0.005 --min-simulations 1000 --max-simulations 38416

Use a specific number of CPU workers
python blackjack_monte_carlo.py --simulations 38416 --workers 8

Output
blackjack_monte_carlo_results.csv

In CI mode, each key can stop early when the 95% CI half-width target is reached.
Result rows include:
- ci95_target
- stop_reason (ci_target_reached or max_simulations_reached)

Notes
- 95% confidence intervals are calculated after simulation.
- 38,416 trials/key gives about +/-0.5 percentage-point worst-case margin for a simple win proportion.
- The state table compresses the remaining shoe into a Hi-Lo True Count. Exact shoe composition is therefore approximated.
