from __future__ import annotations

import random
from dataclasses import dataclass, field
from typing import Any

from .card import Card
from .dealer import Dealer
from .deck import Deck
from .participant import Participant
from .player import Player


@dataclass
class Game:
    player: Player
    dealer: Dealer
    deck: Deck = field(default_factory=Deck)

    def start_rount(self, bet: int | None = None) -> dict[str, Any]:
        return self.start_round(bet)

    def start_round(self, bet: int | None = None) -> dict[str, Any]:
        self.deck = Deck()
        self.player.reset_hand()
        self.dealer.reset_hand()

        events: list[dict[str, Any]] = []

        placed_bet = self.player.place_bet(bet)

        def log_event(actor: Participant, action: str, card: Card | None = None) -> None:
            events.append(
                {
                    "actor": actor.name,
                    "action": action,
                    "card": card.label() if card else "",
                    "player_hand": self.player.hand_labels(),
                    "dealer_hand": self.dealer.hand_labels(),
                    "player_value": self.player.hand_value(),
                    "dealer_value": self.dealer.hand_value(),
                }
            )

        self.dealer.deal_opening(self.deck, self.player, log_event)

        self._play_random_turn(self.player, log_event)
        self._play_random_turn(self.dealer, log_event)

        result = self._settle_round()
        summary = {
            "winner": result["winner"],
            "outcome": result["outcome"],
            "message": result["message"],
            "player_bet": placed_bet,
            "balance_left": self.player.balance,
            "player_value": self.player.hand_value(),
            "dealer_value": self.dealer.hand_value(),
            "player_hand": self.player.hand_labels(),
            "dealer_hand": self.dealer.hand_labels(),
        }

        return {"events": events, "summary": summary}

    def _play_random_turn(self, actor: Participant, log_event: Any) -> None:
        for _ in range(random.randint(1, 4)):
            if actor.hand_value() >= 21:
                break

            action = random.choice(["hit", "stand"])
            if action == "stand":
                log_event(actor, "stand")
                return

            card = self.deck.draw()
            actor.receive_card(card)
            log_event(actor, "hit", card)

        if actor.hand_value() <= 21:
            log_event(actor, "stand")

    def _settle_round(self) -> dict[str, str]:
        player_value = self.player.hand_value()
        dealer_value = self.dealer.hand_value()

        if player_value > 21 and dealer_value > 21:
            self.player.balance += self.player.current_bet
            return {"winner": "none", "outcome": "push", "message": "Both busted. Bet returned."}
        if player_value > 21:
            return {"winner": "dealer", "outcome": "lose", "message": "Player busted."}
        if dealer_value > 21:
            self.player.balance += self.player.current_bet * 2
            return {"winner": "player", "outcome": "win", "message": "Dealer busted."}

        if player_value > dealer_value:
            self.player.balance += self.player.current_bet * 2
            return {"winner": "player", "outcome": "win", "message": "Player has higher hand."}
        if player_value < dealer_value:
            return {"winner": "dealer", "outcome": "lose", "message": "Dealer has higher hand."}

        self.player.balance += self.player.current_bet
        return {"winner": "none", "outcome": "push", "message": "Push. Bet returned."}
