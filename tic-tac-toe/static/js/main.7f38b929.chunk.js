(this.webpackJsonptik_tac_toe=this.webpackJsonptik_tac_toe||[]).push([[0],{19:function(e,a,n){e.exports=n(32)},30:function(e,a,n){},31:function(e,a,n){},32:function(e,a,n){"use strict";n.r(a);var t=n(0),r=n.n(t),c=n(6),l=n.n(c),i=n(3),m=n(4),o=n(14),s=n(1),u=n(2),p={gameReady:!1,playerOneName:"",playerTwoName:"",playerOneWinCount:0,playerTwoWinCount:0,totalGameCount:6,currentPlayer:1,gameArr:Object(u.a)(Array(9).fill(-1)),winIndex:[],winner:-1,matchDraw:!1,haveMatchWinner:!1},y=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:p,a=arguments.length>1?arguments[1]:void 0,n={};switch(a.type){case"PLAYER_SET":n=Object(s.a)(Object(s.a)({},e),{},{playerOneName:a.playerOneName,playerTwoName:a.playerTwoName,gameReady:!0});break;case"PLACE":n=Object(s.a)(Object(s.a)({},e),{},{gameArr:a.gameArr,currentPlayer:a.currentPlayer});break;case"SET_WINNER":n=Object(s.a)(Object(s.a)({},e),{},{winner:a.winner,winIndex:a.winIndex,gameArr:a.gameArr,playerOneWinCount:a.playerOneWinCount,playerTwoWinCount:a.playerTwoWinCount});break;case"DRAW":n=Object(s.a)(Object(s.a)({},e),{},{gameArr:a.gameArr,matchDraw:!0});break;case"RESET_GAME":n=Object(s.a)(Object(s.a)({},e),{},{winner:-1,winIndex:[],gameArr:Object(u.a)(Array(9).fill(-1)),currentPlayer:1,matchDraw:!1});break;case"RELOAD_GAME":n={gameReady:!1,playerOneName:"",playerTwoName:"",playerOneWinCount:0,playerTwoWinCount:0,totalGameCount:6,currentPlayer:1,gameArr:Object(u.a)(Array(9).fill(-1)),winIndex:[],winner:-1,matchDraw:!1,haveMatchWinner:!1};break;case"FINAL_WINNER":n=Object(s.a)(Object(s.a)({},e),{},{haveMatchWinner:!0});break;default:n=e}return n},d=Object(m.c)(y,Object(m.a)(o.a)),E=n(15),w=n(16),v=n(18),N=n(17);var g=function(){return r.a.createElement("header",null,r.a.createElement("p",{className:"text-uppercase"},"Tic"),r.a.createElement("p",{className:"text-uppercase"},"Tac"),r.a.createElement("p",{className:"text-uppercase"},"Toe"))},f=function(e){return r.a.createElement("div",{className:"flexbox gamem"},r.a.createElement("div",{className:"game-main-cont"},r.a.createElement("div",{className:"game-cont board"},Object(u.a)(Array(9).keys()).map((function(a){return r.a.createElement("div",{key:a,className:"square",onClick:function(){return e.onChooseTile(a)}},r.a.createElement("div",{className:"sign".concat(e.win.length>0&&e.win.indexOf(a)>-1?" selected":"")},1===e.game[a]&&r.a.createElement("div",{className:"cross"}),2===e.game[a]&&r.a.createElement("div",{className:"round"})))})))))},h=function(e){return r.a.createElement("div",{className:"flexbox"},r.a.createElement("div",{className:"player-main-cont".concat(e.winner===e.player?" winner":"").concat(e.draw?" draw":"")},r.a.createElement("div",{className:"turn".concat(e.current===e.player?" visible":"")},e.winner===e.player?"Winner":e.draw?"Draw":"Your Turn"),r.a.createElement("div",{className:"player-cont"},r.a.createElement("div",{className:"heading text-uppercase"},"player ",e.player),r.a.createElement("div",{className:"name"},e.name),r.a.createElement("div",{className:"sign"},1===e.player&&r.a.createElement("div",{className:"cross"}),2===e.player&&r.a.createElement("div",{className:"round"}))),r.a.createElement("div",{className:"steps"},Object(u.a)(Array(e.step).keys()).map((function(a){return r.a.createElement("span",{className:"step".concat(a<e.win?" active":""),key:a})})))))},b=n(11),O=function(){var e=Object(t.useState)(""),a=Object(b.a)(e,2),n=a[0],c=a[1],l=Object(t.useState)(""),m=Object(b.a)(l,2),o=m[0],s=m[1],u=Object(i.c)();return r.a.createElement("div",{className:"flexbox"},r.a.createElement("div",{className:"game-main-cont"},r.a.createElement("div",{className:"game-cont form"},r.a.createElement("div",{className:"heading"},"Welcome to ",r.a.createElement("span",{className:"text-uppercase"},"Tic tac toe")),r.a.createElement("div",{className:"form-group"},r.a.createElement("label",{htmlFor:"player1"},"Player 1"),r.a.createElement("input",{type:"text",autoComplete:"off",className:"input-field",id:"player1",name:"player1",value:n,onChange:function(e){return c(e.target.value)}})),r.a.createElement("div",{className:"form-group"},r.a.createElement("label",{htmlFor:"player2"},"Player 2"),r.a.createElement("input",{type:"text",autoComplete:"off",className:"input-field",id:"player2",name:"player2",value:o,onChange:function(e){return s(e.target.value)}})),r.a.createElement("button",{className:"gradient-btn",disabled:!n||!o,onClick:function(){return u({type:"PLAYER_SET",playerOneName:n,playerTwoName:o})}},"Continue"))))},C=function(e){var a=Object(i.c)();return r.a.createElement(r.a.Fragment,null,r.a.createElement("div",{className:"flexbox"},r.a.createElement("div",{className:"game-main-cont"},r.a.createElement("div",{className:"game-cont winner",onClick:function(){return a({type:"RELOAD_GAME"})}},r.a.createElement("div",{className:"heading text-uppercase"},"Winner!"),r.a.createElement("div",{className:"player"},r.a.createElement("div",{className:"pheading text-uppercase"},"player ",e.player),r.a.createElement("div",{className:"name"},e.name),r.a.createElement("div",{className:"sign"},1===e.player&&r.a.createElement("div",{className:"cross"}),2===e.player&&r.a.createElement("div",{className:"round"})))))),r.a.createElement("div",{class:"pyro"},r.a.createElement("div",{class:"before"}),r.a.createElement("div",{class:"after"})))},A=function(e){Object(v.a)(n,e);var a=Object(N.a)(n);function n(){return Object(E.a)(this,n),a.apply(this,arguments)}return Object(w.a)(n,[{key:"render",value:function(){var e=this.props,a=e.gameReady,n=e.haveMatchWinner,t=e.totalGameCount,c=e.playerOneWinCount,l=e.playerTwoWinCount,i=e.currentPlayer,m=e.winner,o=e.matchDraw,s=e.gameArr,u=e.winIndex,p=e.playerOneName,y=e.playerTwoName;return r.a.createElement("div",{className:"flex-container game-main-container vertical-middle"},r.a.createElement(g,null),!a&&r.a.createElement(O,null),a&&!n&&r.a.createElement(r.a.Fragment,null,r.a.createElement(h,{name:p,player:1,step:t,win:c,current:i,winner:m,draw:o}),r.a.createElement(f,{game:s,win:u,onChooseTile:this.props.placeAndCheck}),r.a.createElement(h,{name:y,player:2,step:t,win:l,current:i,winner:m,draw:o})),n&&r.a.createElement(C,{player:c>l?1:2,name:c>l?p:y}))}}]),n}(t.Component),W=Object(i.b)((function(e){return{gameReady:e.gameReady,playerOneName:e.playerOneName,playerTwoName:e.playerTwoName,playerOneWinCount:e.playerOneWinCount,playerTwoWinCount:e.playerTwoWinCount,totalGameCount:e.totalGameCount,currentPlayer:e.currentPlayer,gameArr:e.gameArr,winIndex:e.winIndex,winner:e.winner,matchDraw:e.matchDraw,haveMatchWinner:e.haveMatchWinner}}),{placeAndCheck:function(e){return function(a,n){if(-1!==n().winner||n().matchDraw)a({type:"RESET_GAME"});else{var t=Object(u.a)(n().gameArr);if(-1===t[e]){var r=n().currentPlayer;t[e]=r;var c=function(e){var a=[[0,1,2],[0,3,6],[0,4,8],[1,4,7],[2,5,8],[2,4,6],[3,4,5],[6,7,8]];if(e.filter((function(e){return-1!==e})).length>0)for(var n=0;n<a.length;n++){var t=a[n];if((-1!==e[t[0]]||-1!==e[t[1]]||-1!==e[t[2]])&&e[t[0]]===e[t[1]]&&e[t[1]]===e[t[2]])return{winner:e[t[0]],winIndex:t}}return{winner:-1,winIndex:[]}}(t),l=c.winner,i=c.winIndex;if(-1!==l){var m=n().playerOneWinCount,o=n().playerTwoWinCount;1===l?m++:o++,a(function(e,a,n,t,r){return{type:"SET_WINNER",winner:e,winIndex:a,gameArr:n,playerOneWinCount:t,playerTwoWinCount:r}}(l,i,t,m,o)),m!==n().totalGameCount&&o!==n().totalGameCount||a({type:"FINAL_WINNER"})}else{0===t.filter((function(e){return-1===e})).length?a({type:"DRAW",gameArr:t}):a(function(e,a){return{type:"PLACE",gameArr:e,currentPlayer:a}}(t,1===r?2:1))}}}}}})(A);Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));n(30),n(31),l.a.render(r.a.createElement(i.a,{store:d},r.a.createElement(W,null)),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[19,1,2]]]);
//# sourceMappingURL=main.7f38b929.chunk.js.map