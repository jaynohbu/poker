import random
from dataclasses import dataclass

from .participant import Participant


@dataclass
class Player(Participant):
    balance: int = 1000
    current_bet: int = 0

    def place_bet(self, requested_bet: int | None) -> int:
        bet = requested_bet if requested_bet is not None else random.randint(10, 100)
        bet = max(1, min(bet, self.balance))
        self.balance -= bet
        self.current_bet = bet
        return bet
