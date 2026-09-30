# Python Blackjack OOP Demo

## Run

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Start the demo server:

```bash
python app.py
```

3. Open:

- http://127.0.0.1:5050

## Structure

- `blackjack/game.py`: OOP model (`Game`, `Dealer`, `Deck`, `Player`, `Card`)
- `blackjack/__init__.py`: exports `game` object and `create_game`
- `app.py`: Flask API + demo page
- `templates/index.html`: button + animated action timeline
- `static/style.css`: page styling

## Notes

- `game.start_rount()` is provided as alias and calls `game.start_round()`.
- Player and dealer actions are random (no strategy rules).
- Timeline is intentionally slowed (950ms per step) for visibility.
