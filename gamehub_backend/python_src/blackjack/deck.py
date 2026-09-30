import random
from dataclasses import dataclass, field

from .card import Card

SUITS = ["S", "H", "D", "C"]
RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]


@dataclass
class Deck:
    cards: list[Card] = field(default_factory=list)

    def __post_init__(self) -> None:
        if self.cards:
            return
        self.cards = [Card(rank, suit) for suit in SUITS for rank in RANKS]
        random.shuffle(self.cards)

    def draw(self) -> Card:
        if not self.cards:
            self.__post_init__()
        return self.cards.pop()
