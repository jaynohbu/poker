from dataclasses import dataclass


@dataclass(frozen=True)
class Card:
    rank: str
    suit: str

    @property
    def value(self) -> int:
        if self.rank == "A":
            return 11
        if self.rank in {"K", "Q", "J"}:
            return 10
        return int(self.rank)

    def label(self) -> str:
        return f"{self.rank}{self.suit}"
