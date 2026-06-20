document.addEventListener('DOMContentLoaded',function(){
var ni=document.querySelectorAll('#topnav .ni'),f=document.getElementById('pf')
var da=document.getElementById('dash')
var pg={dash:'',hermes:'chat',config:'config',ccb:'ccb',sql:'sql-http',mem:'mem'}

function sw(p){
  ni.forEach(function(i){i.classList.toggle('active',i.dataset.p===p)})
  da.style.display='none';f.style.display='none'
  if(p==='dash'){da.style.display='block'}
  else{f.style.display='block';f.src='pages/'+pg[p]+'.html'}
}

ni.forEach(function(i){i.onclick=function(e){e.preventDefault();sw(this.dataset.p)}})
document.querySelectorAll('.card').forEach(function(c){c.onclick=function(){sw(this.dataset.p)}})

// 仪表台状态 - 带重试
function ld(){
  var ok=false
  fetch('/api/hermes/health').then(function(r){return r.json()}).then(function(d){
    ok=d.status==='ok'
    document.getElementById('ds-h').textContent=ok?'运行中':'离线'
    var cfg=document.getElementById('ds-cfg')
    if(cfg)cfg.textContent=ok?'运行中':'离线'
    document.getElementById('sm').textContent=d.model||'-'
    document.getElementById('sv').textContent=d.version||'-'
    document.getElementById('su').textContent=ok?'运行中':'离线'
  }).catch(function(){
    document.getElementById('ds-h').textContent='离线'
    document.getElementById('su').textContent='离线'
    // 2秒后重试一次
    setTimeout(function(){
      fetch('/api/hermes/health').then(function(r){return r.json()}).then(function(d){
        if(d.status==='ok'){
          document.getElementById('ds-h').textContent='运行中'
          document.getElementById('su').textContent='运行中'
        }
      }).catch(function(){})
    },2000)
  })
  fetch('/api/sql-proxy/health').then(function(r){document.getElementById('ds-s').textContent=r.ok?'运行中':'离线'}).catch(function(){document.getElementById('ds-s').textContent='离线'})
  fetch('/api/ccb-progress/health').then(function(r){document.getElementById('ds-c').textContent=r.ok?'运行中':'离线'}).catch(function(){document.getElementById('ds-c').textContent='离线'})
  fetch('/api/mem/health').then(function(r){document.getElementById('ds-m').textContent=r.ok?'运行中':'离线'}).catch(function(){document.getElementById('ds-m').textContent='离线'})}
ld();setInterval(ld,30000);sw('dash')})
