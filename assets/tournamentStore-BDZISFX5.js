import{D as $,r as D,c as Y}from"./index-CtUKLQXI.js";var q={exports:{}},U=q.exports,B;function X(){return B||(B=1,(function(o,w){(function(v,P){o.exports=P()})(U,(function(){return(()=>{var v={870:(d,u,i)=>{i.r(u),i.d(u,{createEndpoint:()=>M,expose:()=>J,proxy:()=>p,proxyMarker:()=>A,releaseProxy:()=>h,transfer:()=>S,transferHandlers:()=>_,windowEndpoint:()=>O,wrap:()=>t});const A=Symbol("Comlink.proxy"),M=Symbol("Comlink.endpoint"),h=Symbol("Comlink.releaseProxy"),m=Symbol("Comlink.thrown"),g=e=>typeof e=="object"&&e!==null||typeof e=="function",_=new Map([["proxy",{canHandle:e=>g(e)&&e[A],serialize(e){const{port1:n,port2:f}=new MessageChannel;return J(e,n),[f,[f]]},deserialize:e=>(e.start(),t(e))}],["throw",{canHandle:e=>g(e)&&m in e,serialize({value:e}){let n;return n=e instanceof Error?{isError:!0,value:{message:e.message,name:e.name,stack:e.stack}}:{isError:!1,value:e},[n,[]]},deserialize(e){throw e.isError?Object.assign(new Error(e.value.message),e.value):e.value}}]]);function J(e,n=self){n.addEventListener("message",(function f(c){if(!c||!c.data)return;const{id:C,type:W,path:E}=Object.assign({path:[]},c.data),L=(c.data.argumentList||[]).map(y);let b;try{const T=E.slice(0,-1).reduce(((I,G)=>I[G]),e),j=E.reduce(((I,G)=>I[G]),e);switch(W){case 0:b=j;break;case 1:T[E.slice(-1)[0]]=y(c.data.value),b=!0;break;case 2:b=j.apply(T,L);break;case 3:b=p(new j(...L));break;case 4:{const{port1:I,port2:G}=new MessageChannel;J(e,G),b=S(I,[I])}break;case 5:b=void 0}}catch(T){b={value:T,[m]:0}}Promise.resolve(b).catch((T=>({value:T,[m]:0}))).then((T=>{const[j,I]=R(T);n.postMessage(Object.assign(Object.assign({},j),{id:C}),I),W===5&&(n.removeEventListener("message",f),F(n))}))})),n.start&&n.start()}function F(e){(function(n){return n.constructor.name==="MessagePort"})(e)&&e.close()}function t(e,n){return s(e,[],n)}function a(e){if(e)throw new Error("Proxy has been released and is not useable")}function s(e,n=[],f=function(){}){let c=!1;const C=new Proxy(f,{get(W,E){if(a(c),E===h)return()=>N(e,{type:5,path:n.map((L=>L.toString()))}).then((()=>{F(e),c=!0}));if(E==="then"){if(n.length===0)return{then:()=>C};const L=N(e,{type:0,path:n.map((b=>b.toString()))}).then(y);return L.then.bind(L)}return s(e,[...n,E])},set(W,E,L){a(c);const[b,T]=R(L);return N(e,{type:1,path:[...n,E].map((j=>j.toString())),value:b},T).then(y)},apply(W,E,L){a(c);const b=n[n.length-1];if(b===M)return N(e,{type:4}).then(y);if(b==="bind")return s(e,n.slice(0,-1));const[T,j]=r(L);return N(e,{type:2,path:n.map((I=>I.toString())),argumentList:T},j).then(y)},construct(W,E){a(c);const[L,b]=r(E);return N(e,{type:3,path:n.map((T=>T.toString())),argumentList:L},b).then(y)}});return C}function r(e){const n=e.map(R);return[n.map((c=>c[0])),(f=n.map((c=>c[1])),Array.prototype.concat.apply([],f))];var f}const l=new WeakMap;function S(e,n){return l.set(e,n),e}function p(e){return Object.assign(e,{[A]:!0})}function O(e,n=self,f="*"){return{postMessage:(c,C)=>e.postMessage(c,f,C),addEventListener:n.addEventListener.bind(n),removeEventListener:n.removeEventListener.bind(n)}}function R(e){for(const[n,f]of _)if(f.canHandle(e)){const[c,C]=f.serialize(e);return[{type:3,name:n,value:c},C]}return[{type:0,value:e},l.get(e)||[]]}function y(e){switch(e.type){case 3:return _.get(e.name).deserialize(e.value);case 0:return e.value}}function N(e,n,f){return new Promise((c=>{const C=new Array(4).fill(0).map((()=>Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(16))).join("-");e.addEventListener("message",(function W(E){E.data&&E.data.id&&E.data.id===C&&(e.removeEventListener("message",W),c(E.data))})),e.start&&e.start(),e.postMessage(Object.assign({id:C},n),f)}))}},162:function(d,u,i){var A=this&&this.__createBinding||(Object.create?function(t,a,s,r){r===void 0&&(r=s),Object.defineProperty(t,r,{enumerable:!0,get:function(){return a[s]}})}:function(t,a,s,r){r===void 0&&(r=s),t[r]=a[s]}),M=this&&this.__setModuleDefault||(Object.create?function(t,a){Object.defineProperty(t,"default",{enumerable:!0,value:a})}:function(t,a){t.default=a}),h=this&&this.__importStar||function(t){if(t&&t.__esModule)return t;var a={};if(t!=null)for(var s in t)s!=="default"&&Object.prototype.hasOwnProperty.call(t,s)&&A(a,t,s);return M(a,t),a};Object.defineProperty(u,"__esModule",{value:!0}),u.createDbWorker=void 0;const m=h(i(870));async function g(t){if(t.data&&t.data.action==="eval"){const a=new Int32Array(t.data.notify,0,2),s=new Uint8Array(t.data.notify,8);let r;try{r={ok:await F(t.data.request)}}catch(S){console.error("worker request error",t.data.request,S),r={err:String(S)}}const l=new TextEncoder().encode(JSON.stringify(r));s.set(l,0),a[1]=l.length,Atomics.notify(a,0)}}function _(t){if(t.tagName==="BODY")return"body";const a=[];for(;t.parentElement&&t.tagName!=="BODY";){if(t.id){a.unshift("#"+t.id);break}{let s=1,r=t;for(;r.previousElementSibling;)r=r.previousElementSibling,s++;a.unshift(t.tagName.toLowerCase()+":nth-child("+s+")")}t=t.parentElement}return a.join(" > ")}function J(t){return Object.keys(t)}async function F(t){if(console.log("dom vtable request",t),t.type==="select")return[...document.querySelectorAll(t.selector)].map((a=>{const s={};for(const r of t.columns)r==="selector"?s.selector=_(a):r==="parent"?a.parentElement&&(s.parent=a.parentElement?_(a.parentElement):null):r==="idx"||(s[r]=a[r]);return s}));if(t.type==="insert"){if(!t.value.parent)throw Error('"parent" column must be set when inserting');const a=document.querySelectorAll(t.value.parent);if(a.length===0)throw Error(`Parent element ${t.value.parent} could not be found`);if(a.length>1)throw Error(`Parent element ${t.value.parent} ambiguous (${a.length} results)`);const s=a[0];if(!t.value.tagName)throw Error("tagName must be set for inserting");const r=document.createElement(t.value.tagName);for(const l of J(t.value))if(t.value[l]!==null){if(l==="tagName"||l==="parent")continue;if(l==="idx"||l==="selector")throw Error(`${l} can't be set`);r[l]=t.value[l]}return s.appendChild(r),null}if(t.type==="update"){const a=document.querySelector(t.value.selector);if(!a)throw Error(`Element ${t.value.selector} not found!`);const s=[];for(const r of J(t.value)){const l=t.value[r];if(r!=="parent"){if(r!=="idx"&&r!=="selector"&&l!==a[r]){if(console.log("SETTING ",r,a[r],"->",l),r==="tagName")throw Error("can't change tagName");s.push(r)}}else if(l!==_(a.parentElement)){const S=document.querySelectorAll(l);if(S.length!==1)throw Error(`Invalid target parent: found ${S.length} matches`);S[0].appendChild(a)}}for(const r of s)a[r]=t.value[r];return null}throw Error(`unknown request ${t.type}`)}m.transferHandlers.set("WORKERSQLPROXIES",{canHandle:t=>!1,serialize(t){throw Error("no")},deserialize:t=>(t.start(),m.wrap(t))}),u.createDbWorker=async function(t,a,s,r=1/0){const l=new Worker(a),S=m.wrap(l),p=await S.SplitFileHttpDatabase(s,t,void 0,r);return l.addEventListener("message",g),{db:p,worker:S,configs:t}}},432:function(d,u,i){var A=this&&this.__createBinding||(Object.create?function(h,m,g,_){_===void 0&&(_=g),Object.defineProperty(h,_,{enumerable:!0,get:function(){return m[g]}})}:function(h,m,g,_){_===void 0&&(_=g),h[_]=m[g]}),M=this&&this.__exportStar||function(h,m){for(var g in h)g==="default"||Object.prototype.hasOwnProperty.call(m,g)||A(m,h,g)};Object.defineProperty(u,"__esModule",{value:!0}),M(i(162),u)}},P={};function k(d){var u=P[d];if(u!==void 0)return u.exports;var i=P[d]={exports:{}};return v[d].call(i.exports,i,i.exports,k),i.exports}return k.d=(d,u)=>{for(var i in u)k.o(u,i)&&!k.o(d,i)&&Object.defineProperty(d,i,{enumerable:!0,get:u[i]})},k.o=(d,u)=>Object.prototype.hasOwnProperty.call(d,u),k.r=d=>{typeof Symbol<"u"&&Symbol.toStringTag&&Object.defineProperty(d,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(d,"__esModule",{value:!0})},k(432)})()}))})(q)),q.exports}var K=X();const Q=new URL("/chess-results-viewer/assets/sqlite.worker-DMS32ee_.js",import.meta.url),V=new URL("/chess-results-viewer/assets/sql-wasm-Bv7gRpUo.wasm",import.meta.url);async function Z(){const o=await K.createDbWorker([{from:"inline",config:{serverMode:"full",url:"/chess-results-viewer/database.sqlite",requestChunkSize:4096}}],Q.toString(),V.toString());return o.db.query("PRAGMA cache_size=-2048; PRAGMA temp_store=MEMORY;"),o.db}let z=null;const ee=()=>(z||(z=Z()),z);async function x(o,w=[]){const v=await ee(),P=[];for(const k of await v.query(o,w))P.push(k);return P}const H={getAllTournaments:()=>x(`
    SELECT id, name, start_date FROM tournaments ORDER BY start_date DESC
  `),getTournamentDetails:o=>x(`
    SELECT * FROM tournaments WHERE id = ?
  `,[o]).then(w=>w[0]),getTournamentStandings:o=>x(`
    SELECT p.canonical_name as name, p.id as player_id, perf.* 
    FROM player_performances perf
    JOIN players p ON p.id = perf.player_id
    WHERE perf.tournament_id = ?
    ORDER BY perf.final_rank ASC, perf.score DESC
  `,[o]),getTournamentGames:o=>x(`
    SELECT 
      g.id, g.round, g.board, g.result, g.pgn_moves,
      wp.canonical_name as white_name, bp.canonical_name as black_name,
      wpf.rating_at_tournament as white_rating, bpf.rating_at_tournament as black_rating,
      wpf.player_id as white_player_id, bpf.player_id as black_player_id
    FROM games g
    JOIN player_performances wpf ON wpf.id = g.white_performance_id
    JOIN players wp ON wp.id = wpf.player_id
    JOIN player_performances bpf ON bpf.id = g.black_performance_id
    JOIN players bp ON bp.id = bpf.player_id
    WHERE g.tournament_id = ?
    ORDER BY CAST(g.round AS INTEGER), CAST(g.board AS INTEGER)
  `,[o]),getTournamentParticipants:o=>x(`
    SELECT p.id, p.canonical_name as name, p.fide_id, p.federation, perf.rating_at_tournament as rating, perf.starting_rank
    FROM player_performances perf
    JOIN players p ON p.id = perf.player_id
    WHERE perf.tournament_id = ?
    ORDER BY perf.starting_rank ASC
  `,[o]),getPlayerProfileInTournament:(o,w)=>x(`
    SELECT p.*, perf.*
    FROM players p
    JOIN player_performances perf ON p.id = perf.player_id
    WHERE p.id = ? AND perf.tournament_id = ?
  `,[o,w]).then(v=>v[0]),getPlayerGamesInTournament:(o,w)=>x(`
    SELECT
      g.id, g.round, g.board, g.result, g.pgn_moves,
      CASE WHEN wpf.player_id = ? THEN 'w' ELSE 'b' END as color,
      CASE WHEN wpf.player_id = ? THEN bp.canonical_name ELSE wp.canonical_name END as opponent_name,
      CASE WHEN wpf.player_id = ? THEN bpf.rating_at_tournament ELSE wpf.rating_at_tournament END as opponent_rating
    FROM games g
    JOIN player_performances wpf ON wpf.id = g.white_performance_id
    JOIN players wp ON wp.id = wpf.player_id
    JOIN player_performances bpf ON bpf.id = g.black_performance_id
    JOIN players bp ON bp.id = bpf.player_id
    WHERE (wpf.player_id = ? OR bpf.player_id = ?) AND g.tournament_id = ?
    ORDER BY CAST(g.round AS INTEGER)
  `,[o,o,o,o,o,w]),getGameDetails:o=>x(`
    SELECT 
      g.id, g.round, g.board, g.result, g.pgn_moves,
      wp.canonical_name as white_name, bp.canonical_name as black_name,
      wpf.rating_at_tournament as white_rating, bpf.rating_at_tournament as black_rating,
      wp.id as white_player_id, bp.id as black_player_id
    FROM games g
    JOIN player_performances wpf ON wpf.id = g.white_performance_id
    JOIN players wp ON wp.id = wpf.player_id
    JOIN player_performances bpf ON bpf.id = g.black_performance_id
    JOIN players bp ON bp.id = bpf.player_id
    WHERE g.id = ?
  `,[o]).then(w=>w[0]),getDataForCrosstable:o=>x(`
    SELECT
      p.id as player_id,
      p.canonical_name as player_name,
      perf.starting_rank,
      g.round,
      g.result,
      g.board,
  	  g.id as game_id,
      CASE WHEN wpf.player_id = p.id THEN 'w' ELSE 'b' END as color,
      CASE WHEN wpf.player_id = p.id THEN bp.canonical_name ELSE wp.canonical_name END as opponent_name,
      CASE WHEN wpf.player_id = p.id THEN bpf.player_id ELSE wpf.player_id END as opponent_player_id
    FROM players p
    JOIN player_performances perf ON p.id = perf.player_id
    LEFT JOIN games g ON (
      (g.white_performance_id = perf.id OR g.black_performance_id = perf.id) AND g.tournament_id = perf.tournament_id
    )
    LEFT JOIN player_performances wpf ON wpf.id = g.white_performance_id
    LEFT JOIN players wp ON wp.id = wpf.player_id
    LEFT JOIN player_performances bpf ON bpf.id = g.black_performance_id
    LEFT JOIN players bp ON bp.id = bpf.player_id
    WHERE perf.tournament_id = ?
  `,[o]),getGamesForStatistics:o=>x(`
    SELECT 
      g.id,
      g.result,
      g.pgn_moves,
      g.eco_code,
      wpf.rating_at_tournament as white_rating,
      bpf.rating_at_tournament as black_rating,
      wp.canonical_name as white_name,
      bp.canonical_name as black_name,
      wp.id as white_player_id,
      bp.id as black_player_id
    FROM games g
    JOIN player_performances wpf ON wpf.id = g.white_performance_id
    JOIN players wp ON wp.id = wpf.player_id
    JOIN player_performances bpf ON bpf.id = g.black_performance_id
    JOIN players bp ON bp.id = bpf.player_id
    WHERE g.tournament_id = ?
  `,[o])},ae=$("tournaments",()=>{const o=D([]),w=D(!1),v=D(null),P=D(null),k=D([]),d=D([]),u=D([]),i=D(!1),A=D(null),M=D([]),h=D(null),m=D([]),g=D([]),_=D(null),J=Y(()=>w.value||i.value);async function F(){w.value=!0,v.value=null;try{o.value.length===0&&(o.value=await H.getAllTournaments())}catch(p){v.value=p.message}finally{w.value=!1}}function t(p){const O={},R=p.split(`
`);for(let y=1;y<R.length;y++){const N=R[y].trim();if(!N)continue;const e=N.split("	");if(e.length<3)continue;const[n,f,c]=e;O[c]={e:n,n:f}}return O}async function a(){try{const O=["a.tsv","b.tsv","c.tsv","d.tsv","e.tsv"].map(N=>fetch(`data/${N}`).then(e=>e.text())),y=(await Promise.all(O)).map(N=>t(N));return Object.assign({},...y)}catch(p){return console.error("Error loading ECO database:",p),null}}async function s(p){if(P.value?.id!==parseInt(p)){i.value=!0,v.value=null;try{const[O,R,y,N,e,n,f]=await Promise.all([H.getTournamentDetails(p),H.getTournamentStandings(p),H.getTournamentGames(p),H.getTournamentParticipants(p),H.getDataForCrosstable(p),H.getGamesForStatistics(p),a()]);P.value=O,k.value=R,d.value=y,u.value=N,m.value=e,g.value=n,_.value=f}catch(O){v.value=O.message}finally{i.value=!1}}}async function r(p,O){i.value=!0,v.value=null;try{const[R,y]=await Promise.all([H.getPlayerProfileInTournament(p,O),H.getPlayerGamesInTournament(p,O)]);A.value=R,M.value=y}catch(R){v.value=R.message}finally{i.value=!1}}async function l(p){i.value=!0,v.value=null;try{h.value=await H.getGameDetails(p)}catch(O){v.value=O.message}finally{i.value=!1}}function S(){P.value=null,k.value=[],d.value=[],u.value=[],A.value=null,M.value=[],h.value=null,m.value=[],g.value=[]}return{tournamentsList:o,activeTournament:P,standings:k,games:d,participants:u,activePlayer:A,activePlayerGames:M,activeGame:h,error:v,isLoading:J,isLoadingList:w,isLoadingDetails:i,fetchAllTournaments:F,fetchTournamentData:s,fetchPlayerData:r,fetchGameData:l,crosstableData:m,statisticsData:g,ecoDatabase:_,clearActiveData:S}});export{ae as u};
