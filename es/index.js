var u=Object.assign;var d=(y,i,e)=>new Promise((l,s)=>{var t=r=>{try{c(e.next(r))}catch(o){s(o)}},a=r=>{try{c(e.throw(r))}catch(o){s(o)}},c=r=>r.done?l(r.value):Promise.resolve(r.value).then(t,a);c((e=e.apply(y,i)).next())});import T from"querystring-number";var h={},m=(l,s,...t)=>d(void 0,[l,s,...t],function*(y,i,e={}){let a;a=i&&JSON.stringify(i);let c=(e.baseUrl||"")+y,r=c+a;if(e.cacheTime){let n=h[r];if(n&&Date.now()-n.time<e.cacheTime)return n}let o=Object.prototype.toString.call(i)==="[object FormData]";return e.headers||(e.headers={}),e.headers["Content-Type"]||(o?e.headers["Content-Type"]="application/x-www-form-urlencoded":e.headers["Content-Type"]="application/json"),e.method==="GET"&&!e.headers["Cache-Control"]&&(e.headers["Cache-Control"]="public, max-age=604800, immutable"),fetch(c,u(u({body:a},e),{headers:e.headers})).then(n=>d(void 0,null,function*(){return{body:yield n[e.format||"json"](),status:n.status,headers:n.headers}})).then(n=>d(void 0,null,function*(){return e.cacheTime&&(h[r]={data:n,time:Date.now()}),e.reduce&&(n=yield Promise.resolve(e.reduce(n))),e.onSuccess&&(yield Promise.resolve(e.onSuccess(n))),n})).catch(n=>d(void 0,null,function*(){e.onError&&(yield Promise.resolve(e.onError(n)))}))}),b=(y,i,e,l,s,t)=>d(void 0,null,function*(){if(typeof window=="undefined")return;let a="/"+i;return e&&(a+="?"+T.stringify(e)),m(a,l,u(u(u({},s),t),{method:y}))}),w={get:!0,post:!0,put:!0,del:!0,options:!0},_=(y={})=>{let i=e=>new Proxy(e,{get(s,t){if(!s[t])if(!w[t])s[t]=i({___parent:s.___parent?s.___parent+"/"+t:t});else{let a=t.toUpperCase();a==="DEL"&&(a="DELETE");let c=s.___parent;s[t]=(r={})=>{let{query:o,body:n,options:f}=r;return!o&&!n&&!f&&(a==="GET"?o=r:n=r),b(a,c,o,n,y,f)}}return s[t]}});return i({})};export{m as baseApi,_ as createZeroApi};
