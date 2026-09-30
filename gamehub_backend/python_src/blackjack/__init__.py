from .card import Card
from .dealer import Dealer
from .deck import Deck
from .game import Game
from .player import Player


def create_game(player_name: str = "Player", starting_balance: int = 1000) -> Game:
    return Game(player=Player(name=player_name, balance=starting_balance), dealer=Dealer(name="Dealer"), deck=Deck())


# Exported shared game object requested by user.
game = create_game()

__all__ = ["Card", "Game", "Dealer", "Deck", "Player", "create_game", "game"]
