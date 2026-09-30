from dataclasses import dataclass
from typing import Callable

from .card import Card
from .deck import Deck
from .participant import Participant
from .player import Player


@dataclass
class Dealer(Participant):
    def deal_opening(self, deck: Deck, player: Player, log_event: Callable[[Participant, str, Card | None], None]) -> None:
        for _ in range(2):
            player_card = deck.draw()
            player.receive_card(player_card)
            log_event(player, "deal", player_card)

            dealer_card = deck.draw()
            self.receive_card(dealer_card)
            log_event(self, "deal", dealer_card)
