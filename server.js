const Binance = require('./BinanceProvider')
const SocketServer = require('./SocketServer')
const TechnicalIndicator = require('technicalindicators')

const tradeLifetime = 60
const trades = []

const pairs = {
    'BNBBTC': {},
    'BCHUSDT': {},
    'BTCUSDT': {},
    'ETHUSDT': {},
    'XRPUSDT': {},
    'EOSUSDT': {},
    'LTCUSDT': {},
    'TRXUSDT': {},
    'BNBUSDT': {},
    'ETCUSDT': {},
    'LINKUSDT': {},
    'ADAUSDT': {},
    'XTZUSDT': {},
    'DASHUSDT': {},
    'NEOUSDT': {}
}
const indicators = {

}

const socketServer = new SocketServer({port: 3989})
const binance = new Binance({}) 

socketServer.onConn = socket => {
    socket.emit('config', { 
        pairs: Object.keys(pairs),
        indicators: Object.keys(indicators)
    })
    socket.on('indicator:req', (data, res) => {
        try {
            const indicator = TechnicalIndicator[data.indicator]
            let result = indicator.calculate(data.payload)
            res({ indicator: data.indicator, result: result})
        } catch (e) {
            console.log(e)
            res(e)
        }
    })
    socket.on('symbol:change', async (data, res) => {
        console.log('symbol:change', data.symbol)
        socket.symbol = data.symbol
        socket.chartLoaded = false
        binance.api.futuresChart(data.symbol, data.interval ?? '1m', (symbol, interval, chart) => {
            console.log(symbol, interval)
            if (!socket.chartLoaded) {
                socket.chartLoaded = true
                socket.emit('symbol:chart', {symbol, chart})
            }
            let tick = binance.api.last(chart);
            if(!tick) {
                console.log(tick)
                return false
            }
            const price = chart[tick].close;

            if (!pairs[symbol]) pairs[symbol] = {
                cline: null
            }
            pairs[symbol].close = price
            // console.log('chart', chart)
            chart[tick].t = tick
            socket.emit('symbol:tick', chart[tick])
            // Optionally convert 'chart' object to array:
            // let ohlc = binance.ohlc(chart);
            // console.info(symbol, ohlc);
            // console.info(symbol+" last price: ")
        })
        // binance.subscribeCandlesticks({
        //     pair: data.symbol,
        //     interval: data.interval ?? '1m',
        //     response: (symbol, interval, chart) => {
        //         if (!socket.chartLoaded) {
        //             socket.chartLoaded = true
        //             socket.emit('symbol:chart', {symbol, chart})
        //         }
        //         let tick = binance.api.last(chart);
        //         if(!tick) {
        //             console.log(tick)
        //             return false
        //         }
        //         const price = chart[tick].close;

        //         if (!pairs[symbol]) pairs[symbol] = {
        //             cline: null
        //         }
        //         pairs[symbol].close = price
        //         // console.log('chart', chart)
        //         chart[tick].t = tick
        //         socket.emit('symbol:tick', chart[tick])
        //         // Optionally convert 'chart' object to array:
        //         // let ohlc = binance.ohlc(chart);
        //         // console.info(symbol, ohlc);
        //         // console.info(symbol+" last price: ")
        //     }
        // })
    })
    socket.on('trade:start', trade => {
        console.log('trade:start', trade)
        trade.closed = false
        trade.inited = Date.now()
        trade.time = trade.time
        trade.start_price = pairs[trade.symbol].close
        socket.emit('trade:start', trade)
        trade.socket = socket
        trades.push(trade)
    })
}


setInterval(async () => {
    for (const trade of trades) {
        if (!trade.closed) {
            trade.delta = (Date.now() - trade.inited) / 1000

            if (trade.delta >= trade.time * 60) { 
                const currentPrice = pairs[trade.symbol].close
                console.log(`delta > ${tradeLifetime} closing trade`)
                trade.closed = true
                if (trade.side == 'buy') {
                    if (currentPrice > trade.start_price) {
                        trade.win = 'y'
                    } else {
                        trade.win = 'n'
                    }
                } else {
                    if (currentPrice <= trade.start_price) {
                        trade.win = 'y'
                    } else {
                        trade.win = 'n'
                    }
                }
                // trade.win = trade.side == 'buy' ? currentPrice > trade.start_price :currentPrice < trade.start_price 
                let tradeClone = {
                    ...trade
                }
                delete tradeClone.socket
                trade.socket.emit('trade:closed', tradeClone)
            }
        }
        console.log(trade.closed, trade.delta, trade.win)
    }
},2000)
const init = async () => {

}
init()