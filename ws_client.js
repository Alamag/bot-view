const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});
let ws_server = params.ws_server;
if (!ws_server){
	ws_server = "localhost"
}

let ws_port = parseInt(params.ws_port);
if (!ws_port){
	ws_port = 5050
}

document.getElementById('ws_server').innerHTML=ws_server
const quotesElement = document.getElementById('quotes');
const tradesElement = document.getElementById('trades');
const logsElement = document.getElementById('log');
const infoElement = document.getElementById('info');
const statusElement = document.getElementById('status');
const buyingPowerElement = document.getElementById('buying_power');
const cashintradeElement = document.getElementById('cash_intrade');
const plElement = document.getElementById('pl');
const cplElement = document.getElementById('cpl');
const line_limit1_color='#be1238'
const line_limit2_color='#CAA40C'
const line_limit3_color='#782234'

var current_limit1=1000
var current_limit2=1

// Create our number formatter.
var formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',

  // These options are needed to round to whole numbers if that's what you want.
  //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
  //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});


let trades = [];
let currentBar = {};
var chart = LightweightCharts.createChart(document.getElementById('chart'), {
	width: 700,
    height: 300,
	layout: {
		backgroundColor: '#000000',
		textColor: '#ffffff',
	},
	grid: {
		vertLines: {
			color: '#404040',
		},
		horzLines: {
			color: '#404040',
		},
	},
	crosshair: {
		mode: LightweightCharts.CrosshairMode.Normal,
	},
	priceScale: {
		borderColor: '#cccccc',
	},
	timeScale: {
		borderColor: '#cccccc',
		timeVisible: true,
	},
	handleScroll: {
		vertTouchDrag: false,
	},
});

var chart2 = LightweightCharts.createChart(document.getElementById('chart2'), {
	width: 700,
    height: 300,
	layout: {
		backgroundColor: '#000000',
		textColor: '#ffffff',
	},
	grid: {
		vertLines: {
			color: '#404040',
		},
		horzLines: {
			color: '#404040',
		},
	},
	crosshair: {
		mode: LightweightCharts.CrosshairMode.Normal,
	},
	priceScale: {
		borderColor: '#cccccc',
	},
	timeScale: {
		borderColor: '#cccccc',
		timeVisible: true,
	},
	handleScroll: {
		vertTouchDrag: false,
	},
});

var chart3 = LightweightCharts.createChart(document.getElementById('chart3'), {
	width: 700,
    height: 150,
	layout: {
		backgroundColor: '#000000',
		textColor: '#ffffff',
	},
	grid: {
		vertLines: {
			color: '#404040',
		},
		horzLines: {
			color: '#404040',
		},
	},
	crosshair: {
		mode: LightweightCharts.CrosshairMode.Normal,
	},
	priceScale: {
		borderColor: '#cccccc',
	},
	timeScale: {
		borderColor: '#cccccc',
		timeVisible: true,
	},
	handleScroll: {
		vertTouchDrag: false,
	},
});

var lineSeries = chart2.addLineSeries({
	color: 'rgba(4, 111, 232, 1)',
	lineWidth: 2,
});



var areaSeries = chart3.addAreaSeries({
	autoscaleInfoProvider: () => ({
        priceRange: {
            minValue: -2000,
            maxValue: 5000,
        },
        margins: {
            above: 2,
            below: 2,
        },
    }),
  topColor: 'rgba(67, 83, 254, 0.7)',
  bottomColor: 'rgba(67, 83, 254, 0.3)',
  lineColor: 'rgba(67, 83, 254, 1)',
  lineWidth: 2,
});

var upColor='#fc9803'
var downColor='#0394fc'

var candleSeries = chart.addCandlestickSeries({
  upColor: upColor,
  downColor: downColor,
  borderDownColor: downColor,
  borderUpColor: upColor,
  wickDownColor: downColor,
  wickUpColor: upColor,
});

var zeroLine = {
		price: 0,
		color: '#ffffff',
		lineWidth: 2,
		lineStyle: LightweightCharts.LineStyle.Solid,
		axisLabelVisible: true,
		title: '',
	};

lineSeries.createPriceLine(zeroLine);

var volumeSeries = chart.addHistogramSeries({
	color: '#26a69a',
	priceFormat: {
		type: 'volume',
	},
	priceScaleId: '',
	scaleMargins: {
		top: 0.8,
		bottom: 0,
	},
});


var priceLines = []
var tick_count = 0

function redrawLines(){
	priceLines.forEach(object => {
		lineSeries.removePriceLine(object);
	});
	var theLine = {
		price: current_limit1,
		color: line_limit1_color,
		lineWidth: 2,
		lineStyle: LightweightCharts.LineStyle.Solid,
		axisLabelVisible: true,
	};
	var priceLine = lineSeries.createPriceLine(theLine);
	priceLines.push(priceLine);

	var theLine = {
		price: -current_limit1,
		color: line_limit1_color,
		lineWidth: 2,
		lineStyle: LightweightCharts.LineStyle.Solid,
		axisLabelVisible: true,
	};
	priceLine = lineSeries.createPriceLine(theLine);
	priceLines.push(priceLine);

	var theLine = {
		price: current_limit2,
		color: line_limit2_color,
		lineWidth: 2,
		lineStyle: LightweightCharts.LineStyle.Solid,
		axisLabelVisible: true,
	};
	priceLine = lineSeries.createPriceLine(theLine);
	priceLines.push(priceLine);

	var theLine = {
		price: -current_limit2,
		color: line_limit2_color,
		lineWidth: 2,
		lineStyle: LightweightCharts.LineStyle.Solid,
		axisLabelVisible: true,
	};
	priceLine = lineSeries.createPriceLine(theLine);
	priceLines.push(priceLine);

	var theLine = {
		price: current_limit1*2,
		color: line_limit3_color,
		lineWidth: 2,
		lineStyle: LightweightCharts.LineStyle.Solid,
		axisLabelVisible: true,

	};
	priceLine = lineSeries.createPriceLine(theLine);
	priceLines.push(priceLine);

	var theLine = {
		price: -current_limit1*2,
		color: line_limit3_color,
		lineWidth: 2,
		lineStyle: LightweightCharts.LineStyle.Solid,
		axisLabelVisible: true,
	};
	priceLine = lineSeries.createPriceLine(theLine);
	priceLines.push(priceLine);

}

function receiveFromBot(websocket) {
	websocket.addEventListener("message", ({ data }) => {
	    const event = JSON.parse(data);
	    // const message = data[0]['msg'];
	    // console.log(event.data);

	    for (var key in event) {
	        const type = event[key].T;
	        //// Settings or commands////
	        if (type == 's') {
	        	// console.log('got a cmd');
	        	// console.log(event[key]);
	        	var cmd=event[key].cmd;
	        	if (cmd=='refresh'){
	        		window.location.reload();
	        	}
	        	if (cmd=='add_line'){
	        		var theLine = {
								price: event[key].p,
								color: event[key].clr,
								lineWidth: 2,
								lineStyle: LightweightCharts.LineStyle.Solid,
								axisLabelVisible: true,
								title: event[key].ttl,
							};
	        		let priceLine = lineSeries.createPriceLine(theLine);
	        		priceLines.push(priceLine);
	        	}

	        	if (cmd=='remove_lines'){
	        		priceLines.forEach(object => {
								lineSeries.removePriceLine(object);
							});
	        	}

	        	if (cmd=='reset_charts'){
	        		lineSeries.setData([]);
		            areaSeries.setData([]);
		            candleSeries.setData([]);
		            volumeSeries.setData([]);
		            tradesElement.innerHTML='';
		            trades = []
		            candleSeries.setMarkers(trades);
		            lineSeries.setMarkers(trades);
		            areaSeries.setMarkers(trades);



	        		priceLines.forEach(object => {
						lineSeries.removePriceLine(object);
					});
	        	}

	        	if (cmd=='set_cash'){
	        		buyingPowerElement.innerHTML = formatter.format(event[key].p) ;
	        	}
	        	if (cmd=='set_balance'){
	        		document.getElementById('balance').innerHTML = formatter.format(event[key].val) ;
	        	}

	        	if (cmd=='set_pair'){
	        		document.getElementById('start_bot').value = event[key].val ;
	        	}
	        	if (cmd=='set_limit1'){
	        		var value=event[key].val.toFixed(0)
	        		document.getElementById('limit1').innerHTML = value ;
	        		document.getElementById('set_limit1').value = value  ;
	        		current_limit1=value

	        		redrawLines()

	        		lineSeries.applyOptions({
								autoscaleInfoProvider: () => ({
							        priceRange: {
							            minValue: -value,
							            maxValue: value,
							        },
							        margins: {
							            above: 50,
							            below: 50,
							        },
							    }),
							    
							});

	        	}
	        	if (cmd=='set_limit2'){
	        		var value=event[key].val.toFixed(0)
	        		document.getElementById('limit2').innerHTML = value  ;
	        		document.getElementById('set_limit2').value = value  ;
	        		current_limit2=value
	        		redrawLines()
	        	}
	        	if (cmd=='set_multiplier'){
	        		document.getElementById('multiplier').innerHTML = event[key].val.toFixed(4)  ;
	        		document.getElementById('set_multiplier').value = event[key].val.toFixed(6)  ;
	        	}

	        	if (cmd=='set_status'){
	        		document.getElementById('status').innerHTML = event[key].val  ;
	        	}

	        	if (cmd=='set_stream_status'){
	        		var value = event[key].val
	        		// document.getElementById('stream_status').innerHTML = value;
	        		if (value == true){
	        			var sream_btn=document.getElementById('enable_stream');
	        			if(sream_btn){
		        			sream_btn.innerText="Disable Stream";
		        			sream_btn.className += " active-btn";
		        			sream_btn.id = 'disable_stream';
		        		}
	        		}else{
	        			var sream_btn=document.getElementById('disable_stream');
	        			if(sream_btn){
		        			sream_btn.innerText="Enable Stream";
		        			sream_btn.className = sream_btn.className.replace
							      ( /(?:^|\s)active-btn(?!\S)/g , '' )
		        			sream_btn.id = 'enable_stream';
	        			}

	        		}
	        	}

	        	if (cmd=='set_trading_status'){
	        		var value = event[key].val
	        		document.getElementById('trading_status').innerHTML = value;
	        		if (value == true){
	        			var trading_btn=document.getElementById('enable_trading');
	        			if(trading_btn){
	        				trading_btn.innerText="Disable Trading";
		        			trading_btn.className += " active-btn";
		        			trading_btn.id = 'disable_trading';
	        			}
	        			
	        		}else{
	        			var trading_btn=document.getElementById('disable_trading');
	        			if(trading_btn){
	        				trading_btn.innerText="Enable Trading";
	        				trading_btn.className =trading_btn.className.replace
						      	( /(?:^|\s)active-btn(?!\S)/g , '' )
	        			
	        				trading_btn.id = 'enable_trading';
	        			}
	        		}
	        	}

	        	if (cmd=='set_alpaca_status'){
	        		var value = event[key].val
	        		document.getElementById('alpaca_status').innerHTML = value;
	        		if (value == true){
	        			var alpaca_btn=document.getElementById('enable_alpaca');
	        			if(alpaca_btn){
	        				alpaca_btn.innerText="Disable Alpaca";
		        			alpaca_btn.className += " active-btn";
		        			alpaca_btn.id = 'disable_alpaca';
	        			}
		        			
	        		}else{
	        			var alpaca_btn=document.getElementById('disable_alpaca');
	        			if(alpaca_btn){
		        			alpaca_btn.innerText="Enable Alpaca";
		        			alpaca_btn.className = alpaca_btn.className.replace
							      ( /(?:^|\s)active-btn(?!\S)/g , '' )
		        			alpaca_btn.id = 'enable_alpaca';
	        			}

	        		}

	        	}

	        	if (cmd=='set_info'){
	        		document.getElementById('info').innerHTML = event[key].val  ;
	        	}
	        	
	        }

	        //// Trades ////
	        if (type == 't') {
	        	audio.play();
	        	var timepart = event[key].t.split(' ')[1]
	            // console.log('got a trade');
	            // console.log(event[key]);
	            // var value = Math.round((event[key].p + Number.EPSILON) * 100) / 100;
	            var value = formatter.format(event[key].p)


	            var act = event[key].act;
	            const tradeElement = document.createElement('div');
	            tradeElement.className = 'trade';
	            tradeElement.innerHTML = `<b>${timepart}</b> <span class='w50px'>${act}</span> <span class='w50px'>${event[key].tk}</span> <span class='w70px n'>${value}</span> <span class='w50px n'>${event[key].s}</span> <span class='w50px n'>${event[key].spd}</span>`;
	            tradesElement.appendChild(tradeElement);

	            var elements = document.getElementsByClassName('trade');
	            if (elements.length > 1000) {
	                tradesElement.removeChild(elements[0]);
	            }
	            tradesElement.scrollTop = tradesElement.scrollHeight;


	            // var timestamp = new Date(event[key].t).getTime() / 1000;
	            var timestamp = (new Date(event[key].t).getTime() / 1000)+60*60*3;
	            
	            if (act =='sell' || act =='short'){
	            	markers = {
		                time: timestamp,
		                position: 'aboveBar',
		                color: '#ff0000',
		                shape: 'arrowDown', 
		                text: act + ' '+ event[key].tk
	            	}
	            }else{
	            	markers = {
		                time: timestamp,
		                position: 'belowBar',
		                color: '#99ccff',
		                shape: 'arrowUp', 
		                text: act + ' '+ event[key].tk
	            	}
	            }
	            
	            trades.push(markers)
	            candleSeries.setMarkers(trades);
	            lineSeries.setMarkers(trades);
	            areaSeries.setMarkers(trades);
	        }

	        //// Logs ////
	        if (type == 'l') { 
	        	// console.log(event[key]);
	        	const logElement = document.createElement('div');
	        	var logText=event[key].inf
	        	var logClass=''
	        	if(logText.includes('!!!')){
	        		logClass='warn'
	        	}
	        	if(logText.includes('CRITICAL')){
	        		logClass='critical'
	        	}
	        	if(logText.includes('ERROR')){
	        		logClass='warn'
	        	}
	        	if(logText.includes('WARNING')){
	        		logClass='warn'
	        	}
	        	if(logText.includes('SUCCESS')){
	        		logClass='success'
	        	}
	        	if(logText.includes('OK')){
	        		logClass='success'
	        	}
	            logElement.className = 'log';
	            logElement.innerHTML = `<b>${event[key].t}</b> <span class='${logClass}'>${logText}</span>`;
	            logsElement.appendChild(logElement);

	            var elements = document.getElementsByClassName('log');
	            if (elements.length > 1000) {
	                logsElement.removeChild(elements[0]);
	            }
	            logsElement.scrollTop = logsElement.scrollHeight;
	        }
	        
	        //// Quptes ////
	        if (type == 'q') {
	        	var timepart = event[key].t.split(' ')[1]
	        	// console.log(event[key]);
	        	// var price1=Math.round((event[key].p1 + Number.EPSILON) * 100) / 100; 
	        	var span=Math.round(event[key].spd); 
	        	var price1 = formatter.format(event[key].p1)
	        	var price2 = formatter.format(event[key].p2)

	        	const quoteElement = document.createElement('div');

	            quoteElement.className = 'quote';
	            quoteElement.innerHTML = `<b>${timepart}</b> <span class='w150px'>${event[key].t1}: ${price1}</span> <span class='w150px'>${event[key].t2}: ${price2}</span> <span class='w50px n'>${span}</span>`;
	            quotesElement.appendChild(quoteElement);

	            var elements = document.getElementsByClassName('quote');
	            if (elements.length > 1000) {
	                quotesElement.removeChild(elements[0]);
	            }

	            quotesElement.scrollTop = quotesElement.scrollHeight;

	            infoElement.innerHTML = `${event[key].inf}`;
	            statusElement.innerHTML = `${event[key].ps}`;
	            buyingPowerElement.innerHTML = formatter.format(event[key].buypow);
	            cashintradeElement.innerHTML = formatter.format(event[key].ait);
	            plElement.innerHTML = formatter.format(event[key].PL);
	            cplElement.innerHTML = formatter.format(event[key].CPL);

	        	var bar = event[key];
	            var timestamp = (new Date(bar.t).getTime() / 1000)+60*60*3;
	            currentBar = {
	                time: timestamp,
	                open: bar.pn1,
	                high: bar.pn1,
	                low: bar.pn2,
	                close: bar.pn2
	            }
	            var spread = event[key].spd;
	            currentTick = {
	                time: timestamp,
	                value: spread,
	            }
	            currentPL = {
	                time: timestamp,
	                value: event[key].PL,
	            }
	            if(spread>=0){
	            	color='rgba(0, 150, 136, 0.8)';
	            }else{
	            	color='rgba(255,82,82, 0.8)';
	            }
	            volume = {
	                time: timestamp,
	                value: spread,
	                color: color,
	            }

	            lineSeries.update(currentTick);
	            areaSeries.update(currentPL);
	            candleSeries.update(currentBar);
	            volumeSeries.update(volume);

	            tick_count ++
	        }
	    }
	});
}

function sendToBot(element, websocket) {
  // When clicking a column, send a "play" event for a move in that column.
  element.addEventListener("keypress", ({ target }) => {
  	console.log(target)
    const column = target.val();
    // Ignore clicks outside a column.
    if (column === undefined) {
      return;
    }
    const event = {
      cmd: "stop_bot",
      val: parseInt(column, 10),
    };
    console.log(event)
    const res=websocket.send(JSON.stringify(event));
    console.log(res)
  });

}



function sendMSGToBot(cmd, value, websocket) {
    const event = {
      cmd: cmd,
      val: value,
    };
    // console.log("cmd:"+cmd+", val:"+val)
    websocket.send(JSON.stringify(event));
}


var audio = new Audio('sounds/bell.mp3');
window.addEventListener("DOMContentLoaded", () => {
	// Open the WebSocket connection and register event handlers.
	const websocket = new WebSocket("ws://"+ws_server+":"+ws_port+"/");
	receiveFromBot(websocket);
	websocket.onerror = function(err) {
    console.error('Socket encountered error: ', err.message, 'Closing socket');
    websocket.close();
  };

  websocket.onclose = function(e) {
    console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
    setTimeout(function() {
      window.location.reload();
    }, 10000);
  };

 

	$(document).on("keypress",".cmd_to_send",function(e) {
		if(e.which == 13) {
	     	var newtext = $(this).val();
	     	var cmd = $(this).attr('id')
	     	sendMSGToBot(cmd, newtext, websocket)
	    }
	});
	$(document).on("click",".cmd_to_send_clk",function(e) {
     	var newtext = "";
     	var cmd = $(this).attr('id')
     	sendMSGToBot(cmd, newtext, websocket)
	});
	$(document).on("click","#fit_charts",function(e) {
		chart.timeScale().fitContent();
        chart2.timeScale().fitContent();
        chart3.timeScale().fitContent();
     	
	});
});
