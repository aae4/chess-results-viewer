import{D as Y,r as T,c as U}from"./index-CQPj8-Ml.js";var B={exports:{}},X=B.exports,$;function K(){return $||($=1,(function(s,m){(function(c,g){s.exports=g()})(X,(function(){return(()=>{var c={870:(u,p,l)=>{l.r(p),l.d(p,{createEndpoint:()=>k,expose:()=>x,proxy:()=>L,proxyMarker:()=>O,releaseProxy:()=>N,transfer:()=>f,transferHandlers:()=>b,windowEndpoint:()=>W,wrap:()=>t});const O=Symbol("Comlink.proxy"),k=Symbol("Comlink.endpoint"),N=Symbol("Comlink.releaseProxy"),_=Symbol("Comlink.thrown"),y=e=>typeof e=="object"&&e!==null||typeof e=="function",b=new Map([["proxy",{canHandle:e=>y(e)&&e[O],serialize(e){const{port1:n,port2:h}=new MessageChannel;return x(e,n),[h,[h]]},deserialize:e=>(e.start(),t(e))}],["throw",{canHandle:e=>y(e)&&_ in e,serialize({value:e}){let n;return n=e instanceof Error?{isError:!0,value:{message:e.message,name:e.name,stack:e.stack}}:{isError:!1,value:e},[n,[]]},deserialize(e){throw e.isError?Object.assign(new Error(e.value.message),e.value):e.value}}]]);function x(e,n=self){n.addEventListener("message",(function h(d){if(!d||!d.data)return;const{id:R,type:j,path:v}=Object.assign({path:[]},d.data),D=(d.data.argumentList||[]).map(M);let w;try{const S=v.slice(0,-1).reduce(((P,G)=>P[G]),e),I=v.reduce(((P,G)=>P[G]),e);switch(j){case 0:w=I;break;case 1:S[v.slice(-1)[0]]=M(d.data.value),w=!0;break;case 2:w=I.apply(S,D);break;case 3:w=L(new I(...D));break;case 4:{const{port1:P,port2:G}=new MessageChannel;x(e,G),w=f(P,[P])}break;case 5:w=void 0}}catch(S){w={value:S,[_]:0}}Promise.resolve(w).catch((S=>({value:S,[_]:0}))).then((S=>{const[I,P]=F(S);n.postMessage(Object.assign(Object.assign({},I),{id:R}),P),j===5&&(n.removeEventListener("message",h),J(n))}))})),n.start&&n.start()}function J(e){(function(n){return n.constructor.name==="MessagePort"})(e)&&e.close()}function t(e,n){return i(e,[],n)}function a(e){if(e)throw new Error("Proxy has been released and is not useable")}function i(e,n=[],h=function(){}){let d=!1;const R=new Proxy(h,{get(j,v){if(a(d),v===N)return()=>H(e,{type:5,path:n.map((D=>D.toString()))}).then((()=>{J(e),d=!0}));if(v==="then"){if(n.length===0)return{then:()=>R};const D=H(e,{type:0,path:n.map((w=>w.toString()))}).then(M);return D.then.bind(D)}return i(e,[...n,v])},set(j,v,D){a(d);const[w,S]=F(D);return H(e,{type:1,path:[...n,v].map((I=>I.toString())),value:w},S).then(M)},apply(j,v,D){a(d);const w=n[n.length-1];if(w===k)return H(e,{type:4}).then(M);if(w==="bind")return i(e,n.slice(0,-1));const[S,I]=r(D);return H(e,{type:2,path:n.map((P=>P.toString())),argumentList:S},I).then(M)},construct(j,v){a(d);const[D,w]=r(v);return H(e,{type:3,path:n.map((S=>S.toString())),argumentList:D},w).then(M)}});return R}function r(e){const n=e.map(F);return[n.map((d=>d[0])),(h=n.map((d=>d[1])),Array.prototype.concat.apply([],h))];var h}const o=new WeakMap;function f(e,n){return o.set(e,n),e}function L(e){return Object.assign(e,{[O]:!0})}function W(e,n=self,h="*"){return{postMessage:(d,R)=>e.postMessage(d,h,R),addEventListener:n.addEventListener.bind(n),removeEventListener:n.removeEventListener.bind(n)}}function F(e){for(const[n,h]of b)if(h.canHandle(e)){const[d,R]=h.serialize(e);return[{type:3,name:n,value:d},R]}return[{type:0,value:e},o.get(e)||[]]}function M(e){switch(e.type){case 3:return b.get(e.name).deserialize(e.value);case 0:return e.value}}function H(e,n,h){return new Promise((d=>{const R=new Array(4).fill(0).map((()=>Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(16))).join("-");e.addEventListener("message",(function j(v){v.data&&v.data.id&&v.data.id===R&&(e.removeEventListener("message",j),d(v.data))})),e.start&&e.start(),e.postMessage(Object.assign({id:R},n),h)}))}},162:function(u,p,l){var O=this&&this.__createBinding||(Object.create?function(t,a,i,r){r===void 0&&(r=i),Object.defineProperty(t,r,{enumerable:!0,get:function(){return a[i]}})}:function(t,a,i,r){r===void 0&&(r=i),t[r]=a[i]}),k=this&&this.__setModuleDefault||(Object.create?function(t,a){Object.defineProperty(t,"default",{enumerable:!0,value:a})}:function(t,a){t.default=a}),N=this&&this.__importStar||function(t){if(t&&t.__esModule)return t;var a={};if(t!=null)for(var i in t)i!=="default"&&Object.prototype.hasOwnProperty.call(t,i)&&O(a,t,i);return k(a,t),a};Object.defineProperty(p,"__esModule",{value:!0}),p.createDbWorker=void 0;const _=N(l(870));async function y(t){if(t.data&&t.data.action==="eval"){const a=new Int32Array(t.data.notify,0,2),i=new Uint8Array(t.data.notify,8);let r;try{r={ok:await J(t.data.request)}}catch(f){console.error("worker request error",t.data.request,f),r={err:String(f)}}const o=new TextEncoder().encode(JSON.stringify(r));i.set(o,0),a[1]=o.length,Atomics.notify(a,0)}}function b(t){if(t.tagName==="BODY")return"body";const a=[];for(;t.parentElement&&t.tagName!=="BODY";){if(t.id){a.unshift("#"+t.id);break}{let i=1,r=t;for(;r.previousElementSibling;)r=r.previousElementSibling,i++;a.unshift(t.tagName.toLowerCase()+":nth-child("+i+")")}t=t.parentElement}return a.join(" > ")}function x(t){return Object.keys(t)}async function J(t){if(console.log("dom vtable request",t),t.type==="select")return[...document.querySelectorAll(t.selector)].map((a=>{const i={};for(const r of t.columns)r==="selector"?i.selector=b(a):r==="parent"?a.parentElement&&(i.parent=a.parentElement?b(a.parentElement):null):r==="idx"||(i[r]=a[r]);return i}));if(t.type==="insert"){if(!t.value.parent)throw Error('"parent" column must be set when inserting');const a=document.querySelectorAll(t.value.parent);if(a.length===0)throw Error(`Parent element ${t.value.parent} could not be found`);if(a.length>1)throw Error(`Parent element ${t.value.parent} ambiguous (${a.length} results)`);const i=a[0];if(!t.value.tagName)throw Error("tagName must be set for inserting");const r=document.createElement(t.value.tagName);for(const o of x(t.value))if(t.value[o]!==null){if(o==="tagName"||o==="parent")continue;if(o==="idx"||o==="selector")throw Error(`${o} can't be set`);r[o]=t.value[o]}return i.appendChild(r),null}if(t.type==="update"){const a=document.querySelector(t.value.selector);if(!a)throw Error(`Element ${t.value.selector} not found!`);const i=[];for(const r of x(t.value)){const o=t.value[r];if(r!=="parent"){if(r!=="idx"&&r!=="selector"&&o!==a[r]){if(console.log("SETTING ",r,a[r],"->",o),r==="tagName")throw Error("can't change tagName");i.push(r)}}else if(o!==b(a.parentElement)){const f=document.querySelectorAll(o);if(f.length!==1)throw Error(`Invalid target parent: found ${f.length} matches`);f[0].appendChild(a)}}for(const r of i)a[r]=t.value[r];return null}throw Error(`unknown request ${t.type}`)}_.transferHandlers.set("WORKERSQLPROXIES",{canHandle:t=>!1,serialize(t){throw Error("no")},deserialize:t=>(t.start(),_.wrap(t))}),p.createDbWorker=async function(t,a,i,r=1/0){const o=new Worker(a),f=_.wrap(o),L=await f.SplitFileHttpDatabase(i,t,void 0,r);return o.addEventListener("message",y),{db:L,worker:f,configs:t}}},432:function(u,p,l){var O=this&&this.__createBinding||(Object.create?function(N,_,y,b){b===void 0&&(b=y),Object.defineProperty(N,b,{enumerable:!0,get:function(){return _[y]}})}:function(N,_,y,b){b===void 0&&(b=y),N[b]=_[y]}),k=this&&this.__exportStar||function(N,_){for(var y in N)y==="default"||Object.prototype.hasOwnProperty.call(_,y)||O(_,N,y)};Object.defineProperty(p,"__esModule",{value:!0}),k(l(162),p)}},g={};function E(u){var p=g[u];if(p!==void 0)return p.exports;var l=g[u]={exports:{}};return c[u].call(l.exports,l,l.exports,E),l.exports}return E.d=(u,p)=>{for(var l in p)E.o(p,l)&&!E.o(u,l)&&Object.defineProperty(u,l,{enumerable:!0,get:p[l]})},E.o=(u,p)=>Object.prototype.hasOwnProperty.call(u,p),E.r=u=>{typeof Symbol<"u"&&Symbol.toStringTag&&Object.defineProperty(u,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(u,"__esModule",{value:!0})},E(432)})()}))})(B)),B.exports}var Q=K();const V=new URL("/chess-results-viewer/assets/sqlite.worker-DMS32ee_.js",import.meta.url),Z=new URL("/chess-results-viewer/assets/sql-wasm-Bv7gRpUo.wasm",import.meta.url),ee=location.hostname.endsWith("github.io"),te=ee?"https://raw.githubusercontent.com/aae4/chess-results-viewer/multitournament_with_db/public/database.sqlite":"/chess-results-viewer/database.sqlite";async function ae(){const s=await Q.createDbWorker([{from:"inline",config:{serverMode:"full",url:te,requestChunkSize:4096,databaseLengthBytes:5652480}}],V.toString(),Z.toString());return s.db.query("PRAGMA cache_size=-2048; PRAGMA temp_store=MEMORY;"),s.db}let z=null;const re=()=>(z||(z=ae()),z);async function C(s,m=[]){const c=await re(),g=[];for(const E of await c.query(s,m))g.push(E);return g}const A={getAllTournaments:()=>C(`
    SELECT id, name, start_date FROM tournaments ORDER BY start_date DESC
  `),getTournamentDetails:s=>C(`
    SELECT * FROM tournaments WHERE id = ?
  `,[s]).then(m=>m[0]),getTournamentStandings:s=>C(`
    SELECT p.canonical_name as name, p.id as player_id, perf.* 
    FROM player_performances perf
    JOIN players p ON p.id = perf.player_id
    WHERE perf.tournament_id = ?
    ORDER BY perf.final_rank ASC, perf.score DESC
  `,[s]),getTournamentGames:s=>C(`
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
  `,[s]),getTournamentParticipants:s=>C(`
    SELECT p.id, p.canonical_name as name, p.fide_id, p.federation, perf.rating_at_tournament as rating, perf.starting_rank
    FROM player_performances perf
    JOIN players p ON p.id = perf.player_id
    WHERE perf.tournament_id = ?
    ORDER BY perf.starting_rank ASC
  `,[s]),getPlayerProfileInTournament:(s,m)=>C(`
    SELECT p.*, perf.*
    FROM players p
    JOIN player_performances perf ON p.id = perf.player_id
    WHERE p.id = ? AND perf.tournament_id = ?
  `,[s,m]).then(c=>c[0]),getPlayerGamesInTournament:(s,m)=>C(`
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
  `,[s,s,s,s,s,m]),getGameDetails:s=>C(`
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
  `,[s]).then(m=>m[0]),getDataForCrosstable:s=>C(`
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
  `,[s]),getGamesForStatistics:s=>C(`
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
  `,[s])};function ne(s){const m={},c=s.split(`
`);for(let g=1;g<c.length;g++){const E=c[g].trim();if(!E)continue;const u=E.split("	");if(u.length<3)continue;const[p,l,O]=u;m[O]={e:p,n:l}}return m}let q=null;async function oe(){return q||(q=new Promise(async(s,m)=>{try{const g=["a.tsv","b.tsv","c.tsv","d.tsv","e.tsv"].map(l=>fetch(`/chess-results-viewer/data/${l}`).then(O=>O.text())),u=(await Promise.all(g)).map(l=>ne(l)),p=Object.assign({},...u);s(p)}catch(c){console.error("Ошибка при загрузке базы дебютов ECO:",c),m(c)}}),q)}const ie=Y("tournaments",()=>{const s=T([]),m=T(!1),c=T(null),g=T(null),E=T([]),u=T([]),p=T([]),l=T(!1),O=T(null),k=T([]),N=T(null),_=T([]),y=T([]),b=T(null),x=U(()=>m.value||l.value);async function J(){m.value=!0,c.value=null;try{s.value.length===0&&(s.value=await A.getAllTournaments())}catch(o){c.value=o.message}finally{m.value=!1}}async function t(o){if(g.value?.id!==parseInt(o)){l.value=!0,c.value=null;try{const[f,L,W,F,M,H,e]=await Promise.all([A.getTournamentDetails(o),A.getTournamentStandings(o),A.getTournamentGames(o),A.getTournamentParticipants(o),A.getDataForCrosstable(o),A.getGamesForStatistics(o),oe()]);g.value=f,E.value=L,u.value=W,p.value=F,_.value=M,y.value=H,b.value=e}catch(f){c.value=f.message}finally{l.value=!1}}}async function a(o,f){l.value=!0,c.value=null;try{const[L,W]=await Promise.all([A.getPlayerProfileInTournament(o,f),A.getPlayerGamesInTournament(o,f)]);O.value=L,k.value=W}catch(L){c.value=L.message}finally{l.value=!1}}async function i(o){l.value=!0,c.value=null;try{N.value=await A.getGameDetails(o)}catch(f){c.value=f.message}finally{l.value=!1}}function r(){g.value=null,E.value=[],u.value=[],p.value=[],O.value=null,k.value=[],N.value=null,_.value=[],y.value=[]}return{tournamentsList:s,activeTournament:g,standings:E,games:u,participants:p,activePlayer:O,activePlayerGames:k,activeGame:N,error:c,isLoading:x,isLoadingList:m,isLoadingDetails:l,fetchAllTournaments:J,fetchTournamentData:t,fetchPlayerData:a,fetchGameData:i,crosstableData:_,statisticsData:y,ecoDatabase:b,clearActiveData:r}});export{ie as u};
