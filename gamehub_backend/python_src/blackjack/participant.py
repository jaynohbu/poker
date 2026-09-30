from dataclasses import dataclass, field

from .card import Card


@dataclass
class Participant:
    name: str
    cards: list[Card] = field(default_factory=list)

    def reset_hand(self) -> None:
        self.cards.clear()

    def receive_card(self, card: Card) -> None:
        self.cards.append(card)

    def hand_value(self) -> int:
        total = sum(card.value for card in self.cards)
        aces = sum(1 for card in self.cards if card.rank == "A")
        while total > 21 and aces > 0:
            total -= 10
            aces -= 1
        return total

    def hand_labels(self) -> list[str]:
        return [card.label() for card in self.cards]
