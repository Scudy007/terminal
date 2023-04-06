<style>
   * {
    font-family: sans-serif;
    letter-spacing: .5px;
   }

   @media screen and (max-width: 1024px) {
    .trading-vue {
        margin-top: 14em;
    }
    .buttons {
        justify-content: center;
        width: 100%;
    }
    .additions {
        position: relative; 
    }
    .trAcc {
        position: absolute;
        top: 0;
        left: 0;
    }
    .theme {
        position: absolute;
        top: 0;
        right: 0;
    }
   }
</style>

<template>
<div>
    <div class="tradingview-widget-container">
    <div id="tradingview_db23e" ></div>
  </div>
    <div class="buttons" style="display: grid; gap: 1em">
        <div class="additions">
  <span class="trAcc">Счет: {{this.tradingAccount}}</span>
</div>
        <div>
            <select v-model="currSymbol" @change="event => socket.emit('symbol:change', {symbol: currSymbol, interval: currInterval})">
                <option v-for="pair in pairs">
                    {{  pair.symbol }}
                </option>
            </select>
          
        </div>
        <p style="font-size: 1.2rem;margin-bottom: -10px;margin-top: -2px;">Время сделки:</p>
        <select v-model="dealTime">
            <option value="1">1 минута</option>
            <option value="3">3 минуты</option>
            <option value="5">5 минут</option>
        </select>
        <div class="transaction-amount">
   <div class="input-wrapper">
      <label for="amount-input">Сумма сделки &#8381;</label>
      <div class="input-controls">
        <button type="button" @click="decrementAmount" style="background-color: red;"><svg width="20" height="20">
  <rect x="2" y="8" width="16" height="4" fill="#FFFFFF"/>
</svg></button>
         <input id="amount-input" class="transaction-amount-input" v-model.number="trAmount" placeholder="Введите сумму">
         <button type="button" @click="incrementAmount" style="background-color: #39b54a;"><svg width="20" height="20">
  <rect x="8" y="2" width="4" height="16" fill="#FFFFFF"/>
  <rect x="2" y="8" width="16" height="4" fill="#FFFFFF"/>
</svg></button>
      </div>
   </div>
</div>

     
<div style="display: inline-flex; background: white; z-index: 9999; background: rgb(1, 43, 0);">

<button  :disabled="trAmount <= 0" @click="startTrade('Вверх')" class="button button_up">Вверх<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24">
<path d="M7 14l5-5 5 5z"  fill="#ffffff"/>
<path d="M0 0h24v24H0z" fill="none"/>
</svg></button>
<button :disabled="trAmount <= 0" @click="startTrade('Вниз')" class="button button_down">Вниз<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24">
<path d="M7 10l5 5 5-5z" fill="#ffffff"/>
<path d="M0 0h24v24H0z" fill="none"/>
</svg></button>
</div>
<p style="font-size: 18px;">сделки</p>
<div style="height: 200px; overflow-y: scroll;">
  <div v-for="(tr, id) in trades" :key="index" style="display: grid; margin-bottom: 24px">
      <span>Выйгрыш: {{ tr.win ? (tr.win == 'y' ? 'Да' : 'Нет') : 'В ожидании' }}</span>
      <span>Номер: {{ tr.id }}</span>
      <span>Сторона: {{ tr.dir }}</span>
      <span>Сумма: {{ tr.amount }}</span>
      <span>Длительность: {{ tr.time }} мин</span>
      <span>Время: {{ new Date(tr.id).toLocaleString() }}</span>
    </div>
  </div>
</div>
</div>
</template>



<script>
import TradingVue from 'trading-vue-js'
import Data from '../data/data.json'
import Grin from './Grin.js'

export default {
  name: "app",
  data: {
    currSymbol: "BNBBTC", 
  },
  
  updated() {
    this.$refs.tradingView = new TradingView.widget({
      "width": this.width,
      "height":  this.height,
      "symbol": this.currSymbol,
      "interval": "1",
      "timezone": "Etc/UTC",
      "theme": "light",
      "style": "1",
      "locale": "ru",
      "hide_top_toolbar": false,
      "toolbar_bg": "#f1f3f6",
      "enable_publishing": false,
      "hide_side_toolbar": false,
      "allow_symbol_change": false,
      "container_id": "tradingview_db23e",
    });
  },
  methods: { 
    computed: {
arTrades: function () {
    return Object.values(this.trades);
}
},
    changeSymbol(symbol) {
      this.currSymbol = symbol;
      this.reloadChart(); 
    },
    reloadChart() {
      const widget = this.$refs.tradingView.widget;
      widget.chart().setSymbol(this.currSymbol, () => {
        widget.reload();
      });
    },
    methods: {
        
    },
     incrementAmount() {
            if (this.trAmount >= 0) {
         this.trAmount += 100;
            }
      },
      decrementAmount() {
         if (this.trAmount > 0) {
            this.trAmount -= 100;
         }
      },
        incrementAmount() {
         this.trAmount += 100;
      },
      decrementAmount() {
         if (this.trAmount >= 100) {
            this.trAmount -= 100;
         }
      },
        indicatorReq () {
            console.log(this.indicator)
            let payload = this.indicator.payload;
            if (this.indicator.code == 'SMA' ||
                this.indicator.code.indexOf('EMA') >= 0 ||
                this.indicator.code.indexOf('SMA') >= 0 ||
                this.indicator.code.indexOf('WMA') >= 0 ||
                this.indicator.code.indexOf('TRIX') >= 0
            ) {
                payload.values = this.chart.chart.data.map(item => item[4])
            }

            this.socket.emit('indicator:req', {
                indicator: this.indicator.code,
                payload: payload
            } ,response => {
                console.log('indicator:res', response)
                if (response.indicator.indexOf('SMA') >= 0) {
                    let t = 0
                    let l = this.chart.chart.data.length - response.result.length - 2
                    console.log(l)
                    let times = response.result.map(item => {
                        l++
                        return [
                            this.chart.chart.data[l][0],
                            item
                        ]
                    })

                    this.chart.onchart.push({
                        "name": "SMA",
                        "type": "SMA",
                        "data": [
                            ...times
                        ],
                        "settings": { } // Arbitrary settings format
                    })
                }
                if (response.indicator.indexOf('EMA') >= 0) {
                    let t = 0
                    let l = this.chart.chart.data.length - response.result.length - 2
                    console.log(l)
                    let times = response.result.map(item => {
                        l++
                        return [
                            this.chart.chart.data[l][0],
                            item
                        ]
                    })

                    this.chart.onchart.push({
                        "name": "EMA",
                        "type": "EMA",
                        "data": [
                            ...times
                        ],
                        "settings": { } // Arbitrary settings format
                    })
                }
                if (response.indicator == 'WEMA') {
                    let t = 0
                    let l = this.chart.chart.data.length - response.result.length - 2
                    console.log(l)
                    let times = response.result.map(item => {
                        l++
                        return [
                            this.chart.chart.data[l][0],
                            item
                        ]
                    })

                    this.chart.onchart.push({
                        "name": "WEMA",
                        "type": "EMA",
                        "data": [
                            ...times
                        ],
                        "settings": { } // Arbitrary settings format
                    })
                }
                if (response.indicator.indexOf('WMA') >=0 ) {
                    let t = 0
                    let l = this.chart.chart.data.length - response.result.length - 2
                    console.log(l)
                    let times = response.result.map(item => {
                        l++
                        return [
                            this.chart.chart.data[l][0],
                            item
                        ]
                    })

                    this.chart.onchart.push({
                        "name": "WMA",
                        "type": "EMA",
                        "data": [
                            ...times
                        ],
                        "settings": { } // Arbitrary settings format
                    })
                }
                if (response.indicator == 'TRIX') {
                    let t = 0
                    let l = this.chart.chart.data.length - response.result.length - 2
                    console.log(l)
                    let times = response.result.map(item => {
                        l++
                        return [
                            this.chart.chart.data[l][0],
                            item
                        ]
                    })

                    this.chart.onchart.push({
                        "name": "TRIX",
                        "type": "EMA",
                        "data": [
                            ...times
                        ],
                        "settings": { } // Arbitrary settings format
                    })
                }
                if (response.indicator == 'RSI') {
                    let t = 0
                    let l = this.chart.chart.data.length - response.result.length - 2
                    console.log(l)
                    let times = response.result.map(item => {
                        l++
                        return [
                            this.chart.chart.data[l][0],
                            item
                        ]
                    })

                    this.chart.onchart.push({
                        "name": "TRIX",
                        "type": "EMA",
                        "data": [
                            ...times
                        ],
                        "settings": { } // Arbitrary settings format
                    })
                }
            })
        }, //измени startTrade чтобы это выглядело в виде массива с добавлением нового элемента с параметрами id, symbok, time, amount 
        data() {
  return {
    trades: {},
  }
},
mounted() {
    this.sendData();
  },
  methods: {
    async sendData() {
      const tradingAccount = "1000"; // Пример значения переменной
      const response = await fetch('server.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tradingAccount })
      });
      // Обработка ответа сервера
    }
  },
methods: {
  startTrade(dir, symbol, time, amount) {
    const trade = {
      dir,
      id: Date.now(),
      symbol: this.currSymbol,
      time: this.dealTime,
      amount: this.trAmount
    }
    this.$set(this.trades, trade.id, trade)
    this.socket.emit('trade:start', trade)
  }
},
        startTrade (dir) {
            const trade = {
                dir,
                id: Date.now(),
                symbol: this.currSymbol,
                time: this.dealTime,
                amount: this.trAmount
            }
            this.$set(this.trades, trade.id, trade)
            this.socket.emit('trade:start', trade)
        },
        onResize(event) {
            this.width = window.innerWidth
            this.height = window.innerHeight
        },
        wrapCandle (tick) {
            return [
                parseFloat(tick.t),
                parseFloat(tick.open),
                parseFloat(tick.high),
                parseFloat(tick.low),
                parseFloat(tick.close),
                parseFloat(tick.volume)
            ]
        }
    },  
   
    mounted() {
        window.addEventListener('resize', this.onResize)
        this.socket.on('trade:closed', trade => {
            console.log('trade:closed', trade)
            this.trades[trade.id] = trade
            // this.$set(this.trades, trade.id, trade)

            this.trade = null
        })
        this.socket.on('config', config => {
            console.log('config', config)
            this.pairs = config.pairs.map(pair => {
                return {
                    symbol: pair
                }
            })
            // this.socket.emit('symbol:change', this.pairs[0].symbol)

        })
        this.socket.on('trade:start', trade => {
            console.log('trade starting', trade)
            this.trade = trade
        })
        this.socket.on('symbol:chart', chart => {
            console.log('symbol:chart', chart)
            this.chart.chart.data = []
            
            let res = [];
            for (const timestamp in chart.chart) {
                let tick = chart.chart[timestamp]
                tick.t = timestamp
                res.push(this.wrapCandle(tick))
            }
            setTimeout(() => {
                this.chart.chart.data = res
            }, 1500)    

            // this.$refs.tradingVue.resetChart()
        })
        this.socket.on('symbol:tick', tick => {
            const length = this.chart.chart.data.length
            if (tick.isFinal) {
                this.$set(this.chart.chart.data, length, this.wrapCandle(tick))
            } else {
                this.$set(this.chart.chart.data, length - 1, this.wrapCandle(tick))
            }
            // this.$refs.tradingVue.resetChart()
            
        })
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.onResize)
    },
    data() {
      
        return { 
            //  передай переменную tradingAccount в server.php с помощью post при 
            tradingAccount: 1000,
            indicator: '',
            trade: null,
            dealTime: 1,
            dealTime: 1,
            trAmount: 100,
            socket: io("ws://localhost:3989", { transports: ["websocket"] }),
            pairs: [
                {symbol: 'BTC/USDT'}
            ],
            trades: {},
            currSymbol: 'BNBBTC',
            currInterval: '1m',
            indicators: [
                // 'Stochastic Oscillator (KD).',
                // 'Stochastic RSI (StochRSI).',
                // 'Rate of Change (ROC).',
                // 'Moving Average Convergence Divergence (MACD).',
                // 'Accumulation Distribution Line (ADL)',
                // 'Average Directional Index (ADX).',
                // 'Average True Range (ATR).',
                // 'Awesome Oscillator (AO).',
                // 'Bollinger Bands (BB).',
                // 'Commodity Channel Index (CCI).',
                // 'Force Index (FI).', 
                // 'Know Sure Thing (KST).',
                // 'Moneyflow Index (MFI).',
                // 'On Balance Volume (OBV).',
                {
                    label: 'SMA 10',
                    code: 'SMA',
                    payload: {
                        period: 10,
                        values: []
                    }
                },
                {
                    label: 'SMA 25',
                    code: 'SMA',
                    payload: {
                        period: 25,
                        values: []
                    }
                },
                {
                    label: 'SMA 50',
                    code: 'SMA',
                    payload: {
                        period: 50,
                        values: []
                    }
                },
                {
                    label: 'EMA 8',
                    code: 'EMA',
                    payload: {
                        period: 8,
                        values: []
                    }
                },
                {
                    label: 'EMA 16',
                    code: 'EMA',
                    payload: {
                        period: 16,
                        values: []
                    }
                },
                {
                    label: 'EMA 32',
                    code: 'EMA',
                    payload: {
                        period: 32,
                        values: []
                    }
                },
                {
                    label: 'WEMA',
                    code: 'WEMA',
                    payload: {
                        period: 5,
                        values: []
                    }
                },
                {
                    label: 'WMA 8',
                    code: 'WMA',
                    payload: {
                        period: 8,
                        values: []
                    }
                },
                {
                    label: 'WMA 20',
                    code: 'WMA',
                    payload: {
                        period: 20,
                        values: []
                    }
                },
                {
                    label: 'WMA 50',
                    code: 'WMA',
                    payload: {
                        period: 50,
                        values: []
                    }
                },
                {
                    label: 'TRIX',
                    code: 'TRIX',
                    payload: {
                        period: 18,
                        values: []
                    }
                }
            ],
            chart: Data,
            
            // overlays: [Grin],
            width: window.innerWidth,
            height: window.innerHeight,
            colors: {
                colorBack: '#fff',
                colorGrid: '#eee',
                colorText: '#333',
            }
        }
    }
}
</script>
