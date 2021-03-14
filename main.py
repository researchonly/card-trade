from flask import Flask, render_template
from entity import Game
import json

app = Flask(__name__)

player_suit = {}
suit_counter = -1
game = Game()
ready_ls = [False] * 4
started = False
reveal_stage = False
reveal_counter = 0
suit_player = {}


@app.route('/')
def main():
    return render_template('index.html')


@app.route('/buy/<p1>/<p2>')
def buy(p1, p2):
    game.buy(p1, suit_player[int(p2)])
    return ""


@app.route('/sell/<p1>/<p2>')
def sell(p1, p2):
    game.sell(p1, suit_player[int(p2)])
    return ""


@app.route('/ready/<pid>')
def ready(pid):
    ready_ls[int(pid)] = True
    return ""


@app.route('/login/<name>')
def login(name):
    global suit_counter
    if name not in player_suit:
        if suit_counter < 4:
            suit_counter += 1
        player_suit[name] = suit_counter
        suit_player[suit_counter] = name
    return json.dumps({'started': started, 'suit': player_suit[name]})


@app.route('/start')
def start():
    global started
    game.start(player_suit)
    started = True
    return ""


@app.route('/reveal/<player>/<suit>')
def reveal(player, suit):
    global reveal_counter, reveal_stage
    reveal_counter += 1
    game.reveal(player, int(suit))
    if reveal_counter % 4 == 0:
        reveal_stage = False
    return ""


@app.route('/update/<player>')
def update(player):
    global reveal_stage
    if started:
        if reveal_stage:
            private_cards = []
            for p in game.players.values():
                private_cards.append(p.private_cards.tolist())
            return json.dumps({'show': True, 'initial_cards': private_cards})
        else:
            info = game.get_update(player)
            if 'finished' in info:
                return json.dumps(info)
            info['ready'] = ready_ls
            return json.dumps(info)
    else:
        return json.dumps({'pause': True})


@app.route('/nextround')
def next_round():
    global ready_ls, reveal_stage
    ready_ls = [False] * 4
    # ready_ls = [True] * 4
    reveal_round = [0, 5, 10, 15, 20, 25]
    if game.round in reveal_round:
        reveal_stage = True
    else:
        game.next_card()
    return ""


@app.route('/set/<player>/<ask>/<bid>')
def set_price(player, ask, bid):
    game.set_price(player, int(ask), int(bid))
    return ""


app.run(port=80)
