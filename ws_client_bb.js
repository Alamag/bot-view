const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

let ws_server = params.ws_server;
if (!ws_server) {
  ws_server = "localhost";
}

let ws_port = parseInt(params.ws_port);
if (!ws_port) {
  ws_port = 5151;
}

document.getElementById("ws_server").innerHTML = ws_server+":"+ws_port;


var current_price = 1.0;
var current_top = 1.0;
var current_middle = 1.0;
var current_bottom = 1.0;
var current_lot_volume = 90000;
var current_symbol = "";
var symbol = "";

var rsi_lim=70
var stoch_lim=80
const audio = new Audio("sounds/bell.mp3");

const command_list = [
  "set_sma_period",
  "set_std_factor", 
  "set_take_profit", 
  "set_stop_loss",
  "set_stop_loss_prc",
  "set_reopen_loss_prc",
  "set_take_max_pl_prc",
  "set_stoch_lim",
  "set_stoch_period",
  "set_stoch_sma",
  "set_rsi_lim",
  "set_rsi_period",
  "set_max_signal_count",
  "set_lot_volume",
  "set_close_at",
  "set_max_signal_count",
];

const command_list_val = [
  'set_set_status',
  'set_symbol_status',
  'set_symbol_name',
  'set_symbol',
  'set_stock'
];

const command_list_val_fmt = [
  'set_pl',
  'set_cpl',
  'set_ait',
  'set_buypow',
  'set_equity',
  'set_buying_power'
];

const button_list = [
  'set_stream_status',
  'set_algo_status',
  'set_trading_status',
  'set_alpaca_status',
  'set_waiting_status',
  'set_bb_status',
  'set_rsi_status',
  'set_stoch_status',
];


// Create our number formatter.
var formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",

  // These options are needed to round to whole numbers if that's what you want.
  //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
  //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});

function chartConfig(width, height) {
  return {
    width: width,
    height: height,
    layout: {
      backgroundColor: "#000000",
      textColor: "#ffffff",
    },
    grid: {
      vertLines: {
        color: "#404040",
      },
      horzLines: {
        color: "#404040",
      },
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
    },
    priceScale: {
      borderColor: "#cccccc",
    },
    timeScale: {
      borderColor: "#cccccc",
      timeVisible: true,
    },
    handleScroll: {
      vertTouchDrag: false,
    },
  };
}

let trades = [];
let currentBar = {};


var chart1 = LightweightCharts.createChart(
  document.getElementById("chart1"),
  chartConfig(700, 300)
);

var chart2 = LightweightCharts.createChart(
  document.getElementById("chart2"),
  chartConfig(700, 300)
);

var chart3 = LightweightCharts.createChart(
  document.getElementById("chart3"),
  chartConfig(700, 150)
);

const upColor = "#fc9803";
const downColor = "#0394fc";



var lineSeries_top = chart1.addLineSeries({
  color: "rgba(90, 90, 90, 1)",
  lineWidth: 2,
});

var lineSeries_middle = chart1.addLineSeries({
  color: "rgba(50, 50, 50, 1)",
  lineWidth: 2,
});

var lineSeries_bottom = chart1.addLineSeries({
  color: "rgba(90, 90, 90, 1)",
  lineWidth: 2,
});


var lineSeries = chart1.addLineSeries({
  color: "rgba(4, 111, 232, 1)",
  lineWidth: 2,
});


var lineSeries_rsi = chart2.addLineSeries({
  autoscaleInfoProvider: () => ({
    priceRange: {
      minValue: 0,
      maxValue: 100,
    },
    margins: {
      above: 2,
      below: 2,
    },
  }),
  color: "rgba(0, 180, 0, 1)",
  lineWidth: 2,
});

var lineSeries_fast = chart2.addLineSeries({
  autoscaleInfoProvider: () => ({
    priceRange: {
      minValue: 0,
      maxValue: 100,
    },
    margins: {
      above: 2,
      below: 2,
    },
  }),
  color: "rgba(0, 80, 180, 1)",
  lineWidth: 2,
});

var lineSeries_slow = chart2.addLineSeries({
  autoscaleInfoProvider: () => ({
    priceRange: {
      minValue: 0,
      maxValue: 100,
    },
    margins: {
      above: 2,
      below: 2,
    },
  }),
  color: "rgba(0, 111, 232, 1)",
  lineWidth: 2,
});


var areaSeries = chart3.addAreaSeries({
  autoscaleInfoProvider: () => ({
    priceRange: {
      minValue: -5,
      maxValue: 10,
    },
    margins: {
      above: 2,
      below: 2,
    },
  }),
  topColor: "rgba(67, 83, 254, 0.7)",
  bottomColor: "rgba(67, 83, 254, 0.3)",
  lineColor: "rgba(67, 83, 254, 1)",
  lineWidth: 2,
});


var priceLines = [];
var tick_count = 0;

function lineConfig(price, color, title = "") {
  return {
    price: price,
    color: color,
    lineWidth: 2,
    lineStyle: LightweightCharts.LineStyle.Solid,
    axisLabelVisible: true,
    title: title,
  };
}



function remove_lines(){
  priceLines.forEach((object) => {
    lineSeries_rsi.removePriceLine(object);
  });
}

function draw_lines(){
  remove_lines()

  var theLine = lineConfig(rsi_lim,"#aaaa00","");
  let priceLine = lineSeries_rsi.createPriceLine(theLine);
  priceLines.push(priceLine);

  var theLine = lineConfig(100-rsi_lim,"#aaaa00","");
  priceLine = lineSeries_rsi.createPriceLine(theLine);
  priceLines.push(priceLine);

  var theLine = lineConfig(stoch_lim,"#aa0000","");
  priceLine = lineSeries_rsi.createPriceLine(theLine);
  priceLines.push(priceLine);

  var theLine = lineConfig(100-stoch_lim,"#aa0000","");
  priceLine = lineSeries_rsi.createPriceLine(theLine);
  priceLines.push(priceLine);

  // lineSeries_rsi.createPriceLine(rsiTopLine);
  // lineSeries_rsi.createPriceLine(rsiBottomLine);

  // lineSeries_fast.createPriceLine(stochasticTopLine);
  // lineSeries_fast.createPriceLine(stochasticBottomLine);
}

function reset_charts(){
  lineSeries.setData([]);
  lineSeries_top.setData([]);
  lineSeries_middle.setData([]);
  lineSeries_bottom.setData([]);
  lineSeries_rsi.setData([]);
  lineSeries_fast.setData([]);
  lineSeries_slow.setData([]);
  areaSeries.setData([]);

  document.getElementById("trades").innerHTML = "";
  document.getElementById("quotes").innerHTML = "";

  trades = [];
  lineSeries.setMarkers(trades);
  lineSeries_rsi.setMarkers(trades);
  areaSeries.setMarkers(trades);

  priceLines.forEach((object) => {
    lineSeries.removePriceLine(object);
  });
}
function receiveFromBot(websocket) {
  websocket.addEventListener("message", ({ data }) => {
    // console.log(data);
    const event = JSON.parse(data);
    // const message = data[0]['msg'];
    // console.log(event.data);

    for (var key in event) {
      const type = event[key].T;
      //// Settings or commands////
      if (type == "s") {
        // console.log('got a cmd');
        // console.log(event[key]);
        var cmd = event[key].cmd;
        if (cmd == "refresh") {
          window.location.reload();
        }
        if (cmd == "add_line") {
          var theLine = lineConfig(
            event[key].p,
            event[key].clr,
            event[key].ttl
          );
          let priceLine = lineSeries.createPriceLine(theLine);
          priceLines.push(priceLine);
        }

        if (cmd == "remove_lines") {
          remove_lines()
        }

        if (cmd == "reset_charts") {
          reset_charts()
        }



        if (cmd == "set_signals_count") {
          document.getElementById("signals_count").innerHTML = event[key].val;
        }

        if (cmd == "set_symbol") {
          symbol = event[key].val;
          var symbols = symbol.split("-");
          current_symbol = symbols[0];
          current_symbol2 = symbols[1];
          document.getElementById("set_symbol").value = symbol;
          document.title=symbol;
        }

        // commands to set input fileds
        if (command_list.includes(cmd)){
          document.getElementById(cmd).value = event[key].val;
        }

        if (cmd == "set_rsi_lim") {
          rsi_lim=event[key].val
          draw_lines()
        }
        if (cmd == "set_stoch_lim") {
          stoch_lim=event[key].val
          draw_lines()
        }
        // commands to set plain values
        if (command_list_val.includes(cmd)){
          component_id=cmd.split("set_")[1]
          console.log("plain component_id:"+component_id+", val="+event[key].val);
          document.getElementById(component_id).innerHTML = event[key].val;
        }

        // commands to set formatted values
        if (command_list_val_fmt.includes(cmd)){
          component_id=cmd.split("set_")[1]
          console.log("fmt component_id:"+component_id+", val="+formatter.format(event[key].val));
          document.getElementById(component_id).innerHTML = formatter.format(event[key].val);
        }

        // commands to set buttin status
        
        if (button_list.includes(cmd)){
          component_id1=cmd.split("set_")[1];
          component_id=component_id1.split("_")[0];
          var value = event[key].val;
          console.log("button component_id:"+component_id+", val="+value);
          if (value == true) {
            var component_btn = document.getElementById("enable_"+component_id);
            if (component_btn) {
              component_btn.innerText = "Disable "+component_id;
              component_btn.className += " active-btn";
              component_btn.id = "disable_"+component_id;
            }
          } else {
            var component_btn = document.getElementById("disable_"+component_id);
            if (component_btn) {
              component_btn.innerText = "Enable "+component_id;
              component_btn.className = component_btn.className.replace(
                /(?:^|\s)active-btn(?!\S)/g,
                ""
              );
              component_btn.id = "enable_"+component_id;
            }
          }
        }

        if (cmd == "set_info") {
          document.getElementById("info").innerHTML = event[key].val;
        }
      }

      //// Trades ////
      if (type == "t") {
        
        audio.play();

        var timepart = event[key].t.split(" ")[1];
        // console.log('got a trade');
        // console.log(event[key]);
        // var value = Math.round((event[key].limit_price + Number.EPSILON) * 100) / 100;
        var value = formatter.format(event[key].limit_price);
        var amount = formatter.format(event[key].limit_price*event[key].qty);

        var act = event[key].side;
        const tradeElement = document.createElement("div");
        tradeElement.className = "trade";
        tradeElement.innerHTML = `
          <b>${timepart}</b>
          <span class='w50px'>${act}</span>
          <span class='w50px'>${event[key].symbol}</span>
          <span class='w70px n'>${value}</span>
          <span class='w70px n'>${event[key].qty}</span>
          <span class='w150px n'>${amount}</span>
        `;

        const tradesElement = document.getElementById("trades");
        tradesElement.appendChild(tradeElement);

        let elements = document.getElementsByClassName("trade");
        if (elements.length > 1000) {
          tradesElement.removeChild(elements[0]);
        }
        tradesElement.scrollTop = tradesElement.scrollHeight;

        // var timestamp = new Date(event[key].t).getTime() / 1000;
        var timestamp = new Date(event[key].t).getTime() / 1000 + 60 * 60 * 3;

        if (event[key].symbol==current_symbol){
          if (act == "sell" || act == "short") {
            markers = {
              time: timestamp,
              position: "aboveBar",
              color: "#ff0000",
              shape: "arrowDown",
              text: event[key].msg, 
              // text: act + " " + event[key].symbol,
            };
          } else {
            markers = {
              time: timestamp,
              position: "belowBar",
              color: "#99ccff",
              shape: "arrowUp",
              text: event[key].msg, 
              // text: act + " " + event[key].symbol,
            };
          }

          trades.push(markers);
          // candleSeries.setMarkers(trades);
          lineSeries.setMarkers(trades);
          lineSeries_rsi.setMarkers(trades);
          areaSeries.setMarkers(trades);

        }
        
      }

      //// Logs ////
      if (type == "l") {
        // console.log(event[key]);
        const logElement = document.createElement("div");
        var logText = event[key].inf;
        var logClass = "";
        if (logText.includes("!!!")) {
          logClass = "warn";
        }
        if (logText.includes("CRITICAL")) {
          logClass = "critical";
        }
        if (logText.includes("ERROR")) {
          logClass = "warn";
        }
        if (logText.includes("WARNING")) {
          logClass = "warn";
        }
        if (logText.includes("SUCCESS")) {
          logClass = "success";
        }
        if (logText.includes("OK")) {
          logClass = "success";
        }
        logElement.className = "log";
        logElement.innerHTML = `
          <b>${event[key].t}</b> 
          <span class='${logClass}'>${logText}</span>
        `;

        const logsElement = document.getElementById("log");
        logsElement.appendChild(logElement);

        let elements = document.getElementsByClassName("log");
        if (elements.length > 1000) {
          logsElement.removeChild(elements[0]);
        }
        logsElement.scrollTop = logsElement.scrollHeight;
      }

      //// Quotes ////
      if (type == "q") {
        var timepart = event[key].t.split(" ")[1];
        // console.log(event[key]);
        // var price1=Math.round((event[key].p1 + Number.EPSILON) * 100) / 100;
        var top = event[key].top;
        var price = event[key].price;
        var middle = event[key].middle;
        var bottom = event[key].bottom;
        var bottom = event[key].bottom;
        var rsi = event[key].rsi;
        var fast = event[key].fast;
        var slow = event[key].slow;
        var vlt = event[key].vlt;
        var current_price = formatter.format(event[key].price);

        const quoteElement = document.createElement("div");
        quoteElement.className = "quote";

        top_class=''
        bottom_class=''
        rsi_class=''
        fast_class=''
        slow_class=''
        vlt_class=''

        if (price>top) {top_class='warn'}
        if (price<bottom) {bottom_class='warn'}
        if (rsi<100-rsi_lim || rsi>rsi_lim) {rsi_class='warn'}
        if (fast<100-stoch_lim || fast>stoch_lim) {fast_class='warn'}
        if (slow<100-stoch_lim || slow>stoch_lim) {slow_class='warn'}

        row_class=event[key].signal;

        quoteElement.innerHTML = `
          <span class='${row_class}'>
          <b>${timepart}</b> 
          <span class='w100px'>${event[key].symbol}: ${current_price}</span> 
          <span class='w70px ${vlt_class} n'>${vlt}</span> 
          <span class='w70px ${top_class} n'>${top}</span> 
          <span class='w70px ${bottom_class} n'>${bottom}</span>
          <span class='w50px ${rsi_class} n'>${rsi}</span>
          <span class='w50px ${fast_class} n'>${fast}</span>
          <span class='w50px ${slow_class} n'>${slow}</span>
          </span>
        `;

        const quotesElement = document.getElementById("quotes");
        quotesElement.appendChild(quoteElement);

        var elements = document.getElementsByClassName("quote");
        if (elements.length > 1000) {
          quotesElement.removeChild(elements[0]);
        }

        quotesElement.scrollTop = quotesElement.scrollHeight;

        document.getElementById("info").innerHTML = `${event[key].inf}`;
        document.getElementById("status").innerHTML = `${event[key].ps}`;
        document.getElementById("buying_power").innerHTML = formatter.format(event[key].buypow);
        document.getElementById("ait").innerHTML = formatter.format(event[key].ait);
        document.getElementById("cpl").innerHTML = formatter.format(event[key].CPL);
        document.getElementById("pl_prc").innerHTML = "% "+event[key].pl_prc;
        document.getElementById("pl_prc_sh").innerHTML = "% "+event[key].pl_prc_sh;
        document.getElementById("pl_prc_cur").innerHTML = "% "+event[key].pl_prc_cur;

        var bar = event[key];
        var timestamp = new Date(bar.t).getTime() / 1000 + 60 * 60 * 3;
        currentBar = {
          time: timestamp,
          open: bar.pn1,
          high: bar.pn1,
          low: bar.pn2,
          close: bar.pn2,
        };
        var spread = event[key].spd;
        currentTick = {
          time: timestamp,
          value: price,
        };
        currentTick_top = {
          time: timestamp,
          value: top,
        };
        currentTick_middle = {
          time: timestamp,
          value: middle,
        };
        currentTick_bottom = {
          time: timestamp,
          value: bottom,
        };
        currentTick_rsi = {
          time: timestamp,
          value: event[key].rsi,
        };
        currentTick_fast = {
          time: timestamp,
          value: event[key].fast,
        };
        currentTick_slow = {
          time: timestamp,
          value: event[key].slow,
        };
        currentPL = {
          time: timestamp,
          value: event[key].pl_prc,
        };
        if (spread >= 0) {
          color = "rgba(0, 150, 136, 0.8)";
        } else {
          color = "rgba(255,82,82, 0.8)";
        }
        volume = {
          time: timestamp,
          value: spread,
          color: color,
        };

        lineSeries.update(currentTick);
        lineSeries_top.update(currentTick_top);
        lineSeries_middle.update(currentTick_middle);
        lineSeries_bottom.update(currentTick_bottom);
        lineSeries_rsi.update(currentTick_rsi);
        lineSeries_fast.update(currentTick_fast);
        lineSeries_slow.update(currentTick_slow);
        areaSeries.update(currentPL);
        // candleSeries.update(currentBar);
        // volumeSeries.update(volume);

        tick_count++;
      }
    }
  });
}

function sendToBot(element, websocket) {
  // When clicking a column, send a "play" event for a move in that column.
  element.addEventListener("keypress", ({ target }) => {
    console.log(target);
    const column = target.val();
    // Ignore clicks outside a column.
    if (column === undefined) {
      return;
    }
    const event = {
      cmd: "stop_bot",
      val: parseInt(column, 10),
    };
    console.log(event);
    const res = websocket.send(JSON.stringify(event));
    console.log(res);
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

window.addEventListener("DOMContentLoaded", () => {
  // Open the WebSocket connection and register event handlers.
  const websocket = new WebSocket("ws://" + ws_server + ":" + ws_port + "/");
  receiveFromBot(websocket);
  websocket.onerror = function (err) {
    console.error("Socket encountered error: ", err.message, "Closing socket");
    websocket.close();
  };

  websocket.onclose = function (e) {
    console.log(
      "Socket is closed. Reconnect will be attempted in 1 second.",
      e.reason
    );
    setTimeout(function () {
      window.location.reload();
    }, 10000);
  };

  $(document).on("keypress", ".cmd_to_send", function (e) {
    if (e.which == 13) {
      var newtext = $(this).val();
      var cmd = $(this).attr("id");
      sendMSGToBot(cmd, newtext, websocket);
    }
  });
  $(document).on("click", ".cmd_to_send_clk", function (e) {
    var newtext = "";
    var cmd = $(this).attr("id");

    if (cmd == "stop_bot") {
      const userAgree = confirm("Do you really want to stop bot?");
      if (!userAgree) {
        return;
      }
    }

    sendMSGToBot(cmd, newtext, websocket);
  });
  $(document).on("click", "#fit_charts", function (e) {
    chart1.timeScale().fitContent();
    chart2.timeScale().fitContent();
    chart3.timeScale().fitContent();
  });
  $(document).on("click", "#reset_charts", function (e) {
    reset_charts()
  });


  const chartsContainer = document.querySelector(".charts");
  let mousePos;

  const resizeChartsContainer = function (event) {
    const dx = mousePos - event.clientX;
    mousePos = event.clientX;
    chartsContainer.style.width =
      parseInt(getComputedStyle(chartsContainer).width) - dx + "px";
  };

  const resizeCharts = function () {
    const chartsWidthInPx = parseInt(getComputedStyle(chartsContainer).width);
    if (!chartsWidthInPx) {
      return;
    }
    // 43 = padding + borders
    chart1.resize(chartsWidthInPx - 43, 300);
    chart2.resize(chartsWidthInPx - 43, 300);
    chart3.resize(chartsWidthInPx - 43, 150);
  };

  chartsContainer.addEventListener("mousedown", function (e) {
    const borderSize = 4;
    const containerWidth = parseInt(getComputedStyle(chartsContainer).width);
    if (
      e.offsetX > containerWidth - borderSize &&
      e.offsetX < containerWidth + borderSize
    ) {
      mousePos = e.clientX;
      document.addEventListener("mousemove", resizeChartsContainer);
      document.addEventListener("mousemove", resizeCharts);
    }
  });

  document.addEventListener("mouseup", function () {
    document.removeEventListener("mousemove", resizeChartsContainer);
    document.removeEventListener("mousemove", resizeCharts);
  });

  const date = new Date();
  const today=date.toISOString().split('T')[0]



  // const backTestInput = document.querySelector("#run_backtest");
  // backTestInput.value = today + ' ' + '14:30-19:59';
});
