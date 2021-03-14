name = prompt("Please enter your name", "");
suit = null;
max_spread = 10
var reveal_locked = false;
var trade_lock = false;

function lock_trades(lock) {
    if (trade_lock)
        return
    for (i = 0; i < 4; i++) {
        if (i != suit) {
            document.getElementsByName('buy')[i].disabled = lock;
            document.getElementsByName('sell')[i].disabled = lock;
        }
    }
    if (suit == 0) {
        document.getElementById('next').disabled = lock;
    }
}

function render(info) {
    if ('show' in info) {
        lock_trades(true);
        cards = info['initial_cards'][suit];
        for (i = 0; i < 4; i++) {
            document.getElementsByName('mycards')[i].innerHTML = cards[i];
            if (!reveal_locked) {
                if (cards[i] == 0) {
                    document.getElementsByName('mycards')[i].disabled = true;
                } else {
                    document.getElementsByName('mycards')[i].disabled = false;
                }
            }
        }
        return;
    }
    reveal_locked = false;

    ready = info['ready']
    ready_counter = 0
    for (i = 0; i < 4; i++) {
        document.getElementsByName('ready')[i].disabled = ready[i];
        ready_counter += ready[i];
    }
    if (ready_counter == 4) {
        lock_trades(false);
    } else {
        lock_trades(true);
    }

    trades = info['trades'];
    trade_msg = ''
    for (i = 0; i < trades.length; i++) {
        t = trades[i];
        type = t[5];
        price = '';
        if (type == 'buy') {
            price = t[6];
        } else {
            price = t[7];
        }
        trade_msg += '<div>' + t[2] + ' ' + t[1] + ' ' + type + ' ' + price + "</div>";
    }
    document.getElementById('trades').innerHTML = trade_msg;

    price = info['prices'];
    balance = info['balance'];
    inventory = info['inventory'];
    cards = info['cards'];
    round = info['round'];
    total_reveal = info['total_reveal'];
    last_reveal = info['last_reveal'];

    for (i = 0; i < 4; i++) {
        if (i != suit) {
            document.getElementsByName('buy')[i].innerHTML = '¢' + price[i][0] + '<br>BUY';
            document.getElementsByName('sell')[i].innerHTML = '¢' + price[i][1] + '<br>SELL';
        }
        document.getElementsByName('mycontracts')[i].innerHTML = inventory[i];
        document.getElementsByName('mycards')[i].innerHTML = cards[i];
        if (cards[i] == 0) {
            document.getElementsByName('mycards')[i].disabled = true;
        }
        document.getElementsByName('revealedcards')[i].innerHTML = total_reveal[i];
        if (last_reveal[i] > 0) {
            document.getElementsByName('cards')[i].className = 'cards action';
        } else {
            document.getElementsByName('cards')[i].className = 'cards';
        }
    }
    document.getElementById('balance').innerHTML = balance;
    document.getElementById('round').innerHTML = round;
    document.getElementById('cardsleft').innerHTML = info['card_left'];
}


function set_price() {
    ask = document.getElementsByName('ask')[suit].value
    bid = document.getElementsByName('bid')[suit].value
    if (Math.abs(ask - bid) > max_spread) {
        alert('max spread is: ' + max_spread);
    } else {
        fetch('/set/' + name + '/' + ask + '/' + bid)
    }
}

function ready() {
    document.getElementsByName('ready')[suit].disabled = true;
    fetch('/ready/' + suit);
}

function next_round() {
    fetch('/nextround');
}

function lock_reveal() {
    for (i = 0; i < 4; i++) {
        document.getElementsByName('mycards')[i].disabled = true;
    }
    reveal_locked = true;
}

function reveal0() {fetch('/reveal/' + name + '/0'); lock_reveal()}
function reveal1() {fetch('/reveal/' + name + '/1'); lock_reveal()}
function reveal2() {fetch('/reveal/' + name + '/2'); lock_reveal()}
function reveal3() {fetch('/reveal/' + name + '/3'); lock_reveal()}

function start() {
    document.getElementById('start').removeEventListener('click', start);
    document.getElementById('start').id = 'next';

    document.getElementById('next').innerHTML = 'NEXT ROUND';
    document.getElementById('next').addEventListener('click', next_round);
    fetch('/start').then(function () {
        next_round();
    });
}


function sync() {
    fetch('/update/' + name).then(function (response) {
        return response.json();
    }).then(function (info) {
        if (!('finished' in info)) {
            if (!('pause' in info)) {
                render(info);
            }
            setTimeout(sync, 1000);
        } else {
            total_reveal = info['total_reveal'];
            last_reveal = info['last_reveal'];
            document.getElementById('cardsleft').innerHTML = info['card_left'];
            document.getElementById('finalbalance').innerHTML = 'final balance: ' + info['final_balance'];

            for (i = 0; i < 4; i++) {
                document.getElementsByName('revealedcards')[i].innerHTML = total_reveal[i];
                if (last_reveal[i] > 0) {
                    document.getElementsByName('cards')[i].className = 'cards action';
                } else {
                    document.getElementsByName('cards')[i].className = 'cards';
                }
            }

            lock_trades(true);
            if (suit == 0) {
                document.getElementById('next').disabled = true;
                document.getElementById('next').innerHTML = 'FINISHED';
            }
        }
    });
}

function temp_lock(id) {
    document.getElementsByName('buy')[id].disabled = true;
    document.getElementsByName('sell')[id].disabled = true;
    trade_lock = true;
    setTimeout(function () {
        trade_lock = false;
        document.getElementsByName('buy')[id].disabled = false;
        document.getElementsByName('sell')[id].disabled = false;
    }, 1000);
}

function buy0() {fetch('/buy/' + name + '/0').then(function () {temp_lock(0)})}
function buy1() {fetch('/buy/' + name + '/1').then(function () {temp_lock(1)})}
function buy2() {fetch('/buy/' + name + '/2').then(function () {temp_lock(2)})}
function buy3() {fetch('/buy/' + name + '/3').then(function () {temp_lock(3)})}

function sell0() {fetch('/sell/' + name + '/0').then(function () {temp_lock(0)})}
function sell1() {fetch('/sell/' + name + '/1').then(function () {temp_lock(1)})}
function sell2() {fetch('/sell/' + name + '/2').then(function () {temp_lock(2)})}
function sell3() {fetch('/sell/' + name + '/3').then(function () {temp_lock(3)})}

function setup() {

    if (suit < 4) {
        document.getElementsByName('ask')[suit].value = 25;
        document.getElementsByName('bid')[suit].value = 25;
    }

    for (i = 0; i < 4; i++) {
        if (i != suit) {
            document.getElementsByName('buy')[i].disabled = true;
            document.getElementsByName('sell')[i].disabled = true;
        }
    }

    for (i = 0; i < 4; i++) {
        document.getElementsByName('ready')[i].disabled = true;
    }
    // 0, 1, 2, 3 are market makers, 4 is speculators
    if (suit < 4) {
        document.getElementsByName('ready')[suit].addEventListener('click', ready);
        document.getElementsByClassName('classtwo')[suit].style.display = 'none';
        document.getElementsByClassName('classone')[suit].style.display = 'grid';
        document.getElementsByName('set')[suit].disabled = false;
        document.getElementsByName('set')[suit].addEventListener('click', set_price);

        document.getElementsByName('mycards')[0].addEventListener('click', reveal0);
        document.getElementsByName('mycards')[1].addEventListener('click', reveal1);
        document.getElementsByName('mycards')[2].addEventListener('click', reveal2);
        document.getElementsByName('mycards')[3].addEventListener('click', reveal3);
    }

    document.getElementsByName('buy')[0].addEventListener('click', buy0);
    document.getElementsByName('buy')[1].addEventListener('click', buy1);
    document.getElementsByName('buy')[2].addEventListener('click', buy2);
    document.getElementsByName('buy')[3].addEventListener('click', buy3);

    document.getElementsByName('sell')[0].addEventListener('click', sell0);
    document.getElementsByName('sell')[1].addEventListener('click', sell1);
    document.getElementsByName('sell')[2].addEventListener('click', sell2);
    document.getElementsByName('sell')[3].addEventListener('click', sell3);


    document.getElementById('start').style.display = 'none';
    // 0 is the admin
    if (suit == 0) {
        for (i = 0; i < 4; i++) {
            document.getElementsByName('mycards').disabled = true;
        }
        document.getElementById('start').style.display = 'block';
        document.getElementById('start').addEventListener('click', start);
    }
    sync();
}

fetch('/login/' + name).then(function (response) {
    return response.json();
}).then(function (status) {
    suit = status['suit'];
    if (status['started']) {
        document.getElementById('start').removeEventListener('click', start);
        document.getElementById('start').id = 'next';

        document.getElementById('next').innerHTML = 'NEXT ROUND';
        document.getElementById('next').addEventListener('click', next_round);
    }
    setup();
});

document.getElementById('rounds').innerHTML = 33;
document.getElementById('maxspread').innerHTML = max_spread;

