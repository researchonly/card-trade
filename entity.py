import numpy as np
import json


class Game:

    def start(self, player_suit):
        self.card_dealer = CardDealer()
        self.players = {}

        initial_cards = self.card_dealer.initial_cards()
        i = 0
        for name in player_suit:
            suit = player_suit[name]
            self.players[name] = Player(suit, initial_cards[i] if suit < 4 else None)
            i += 1

        self.role = ['clubs', 'diamonds', 'hearts', 'spades']

        self.reveal_history = np.zeros((33, 4))
        self.trade_history = []

        self.round = 0
        self.reveal_counter = 0

        self.finished = False

    def set_price(self, p, ask, bid):
        self.players[p].ask = ask
        self.players[p].bid = bid

    def buy(self, name1, name2):
        p1 = self.players[name1]
        p2 = self.players[name2]
        p1.buy(p2)
        self.trade_history.append(
            [self.round, self.role[p2.suit], name1, self.role[p1.suit] if p1.suit < 4 else 'speculator1', '', 'buy',
             p2.ask, p2.bid])

    def sell(self, name1, name2):
        p1 = self.players[name1]
        p2 = self.players[name2]
        p1.sell(p2)

        self.trade_history.append(
            [self.round, self.role[p2.suit], name1, self.role[p1.suit] if p1.suit < 4 else 'speculator1', '', 'sell',
             p2.ask, p2.bid])

    def next_card(self):
        if self.round < 33:
            suit = self.card_dealer.reveal_card()
            self.reveal_history[self.round, suit] += 1
            self.round += 1
            return suit
        self.save_file()
        self.round += 1

    def reveal(self, p, suit):
        self.players[p].reveal_card(suit)
        self.reveal_history[self.round, suit] += 1
        self.reveal_counter += 1
        if self.reveal_counter % 4 == 0:
            self.round += 1
            return True
        return False

    def get_update(self, player):
        winner = self.card_dealer.cards[-1]
        winner_ls = [0] * 4
        winner_ls[winner] = 1
        if self.round > 33:
            return {'finished': True, 'final_balance': self.players[player].final_balance(winner),
                    'total_reveal': [13] * 4, 'last_reveal': winner_ls, 'card_left': 0}
        info = {'trades': self.trade_history[-20:][::-1], 'total_reveal': self.reveal_history.sum(axis=0).tolist(),
                'last_reveal': (self.reveal_history[self.round - 1] > 0).tolist(), 'round': self.round,
                'cards': self.players[player].private_cards.tolist(),
                'inventory': self.players[player].inventory.tolist(),
                'prices': [[p.ask, p.bid] for p in self.players.values() if p.suit < 4],
                'balance': self.players[player].balance,
                'card_left': 52 - self.reveal_history.sum()}
        return info

    def save_file(self):
        trade_string = 'round;market;player;role;price;type;buy;sell;cards revealed\n'
        reveal_string = 'round;clubs;diamonds;hearts;spades\n'
        for trade in self.trade_history:
            elements = [str(x) for x in trade]
            trade_string += ';'.join(elements) + '\n'
        for i in range(len(self.reveal_history)):
            reveal_string += str(i + 1) + ';'
            reveal_string += ';'.join(self.reveal_history[i].astype(int).astype(str)) + '\n'
        with open('trades.csv', 'w+') as f:
            f.write(trade_string)
        with open('reveal.csv', 'w+') as f:
            f.write(reveal_string)


class CardDealer:
    def __init__(self):
        self.cards = np.tile(np.arange(4), 13)
        np.random.shuffle(self.cards)
        self.index = 0

    def initial_cards(self):
        self.index = 23
        return self.cards[:24].reshape(4, 6)

    def reveal_card(self):
        self.index += 1
        return self.cards[self.index] if self.index < 52 else None


class Player:
    def __init__(self, suit, private_cards):
        # suit None for speculators
        self.balance = 0
        self.inventory = np.zeros(4)

        self.suit = suit
        self.private_cards = np.zeros(4)

        if suit < 4:
            self.ask, self.bid = 25, 25
            for suit in private_cards:
                self.private_cards[suit] += 1

    def reveal_card(self, suit):
        self.private_cards[suit] -= 1

    def buy(self, player):
        self.balance -= player.ask
        self.inventory[player.suit] += 1
        player.balance += player.ask
        player.inventory[player.suit] -= 1

    def sell(self, player):
        self.balance += player.bid
        self.inventory[player.suit] -= 1
        player.balance -= player.ask
        player.inventory[player.suit] += 1

    def final_balance(self, winner_suit):
        return self.balance + (self.inventory[winner_suit] * 100)
