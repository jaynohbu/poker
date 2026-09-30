from __future__ import annotations

from flask import Flask, jsonify, render_template, request

from blackjack import game

app = Flask(__name__, template_folder="templates", static_folder="static")


@app.get("/")
def index() -> str:
    return render_template("index.html")


@app.post("/api/start-game")
def start_game():
    payload = request.get_json(silent=True) or {}
    bet = payload.get("bet")
    if isinstance(bet, str) and bet.isdigit():
        bet = int(bet)
    if not isinstance(bet, int):
        bet = None

    result = game.start_rount(bet=bet)
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True, port=5050)
