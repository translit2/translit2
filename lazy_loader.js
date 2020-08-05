//lazy_loader.js (utf-8)  tg:@ArturPlugin   Jul 2020
//догружает кусок html из txt/js/png и выполняет стили и скрипты.
//использует очередь на js (см ниже) (prefix: vidno_)
//use:
//<div id="id_w1"><hr></div>
//<script> window['vidno_id_el']='id_w1';window['vidno_url']="page2.png";vidno_wait_id(vidno_load_png1_htm);/script>
//подгрузка html при прокрутке до якоря или видно. стили работают, скрипты не очень(только простые)
//грузится могут html/ js - (html как строка)/png (html как пикселы-дешифровка через канвас)
//если контент длинный (лента) то можно подгружать порциями и добавлять к низу, или как постраничный
//с единой шапкой и футером, а подгрузка по #name_page - скрипт ловит и если нет, то тянет по аяксу в фоне.
//с гет параметром &axaj=1 отдает без шапки и футера. <!-- start page content -->
//пока юзер смотрит 2й блок, то в фоне заранее грузит 3й и он его видит сразу и не ждет загруки.
//с меню - надо ждать. хоть и меньше. скрипты и стили не из кеша а уже в браузере
//-----mini liba---------
window['url_jquery']=window['url_jquery'] || 'jquery.js';
function get_ms(){return (new Date()).getTime();}
function len(any){
  if(any===undefined)return 0;
  if(any.length!==undefined)return any.length;//str/mas
  if(typeof(any)=='number')return (''+any).length;//num
  var o,k=0;for(o in any)k++;return k;}//dict
function hex(d){return parseInt(d).toString(16);}
function utf8(s){var i,k,r='';
 if(typeof(s)!='string') return '##';
 for(i=0;i<s.length;i++){k=s.charCodeAt(i);r+=(k<128)?'-'+hex(k):window.encodeURIComponent(s.charAt(i)).replace(/%/g,'+');}
 return r+'=';}
function msg(o){return console.log(o);}
function msg2(s){s=''+s;console.log(s,len(s),utf8(s));}
function in_mas(s,ms){if(typeof(ms)=='string')ms=ms.split(',');return ms.indexOf(s)+1;}
function replace_all(ss,s1,s2){var m=ss.split(s1);return m.join(s2);}
function split2(s,b1,b2){var m=[],k1,k2,k3=0,a1,a2,t,limit=9999;
  s=''+s;b1=''+b1;b2=''+b2;a1=b1.length;a2=b2.length;
  t=s.toLowerCase();
  while(limit--){
    k1=t.indexOf(b1,k3);if(k1<0){m.push(s.substring(k3));return m;}
    k2=t.indexOf(b2,k1+a1);if(k2<0){m.push(s.substring(k3));return m;}
    m.push(s.substring(k3,k1));  m.push(s.substring(k1,k1+a1));
    m.push(s.substring(k1+a1,k2));  m.push(s.substring(k2,k2+a2));
    k3=k2+a2;}
  return -2;}
function ok_dk(s){return s.replace(/'/g,'"');}
function parser_src(h){// src=""
    var m=(' '+h).match(/[\s]+src[\s]*=[\s]*"([^"]+)"/i);
    if(m)if(m.length==2)return m[1].trim();  return '';}
function del_blok(h,b1,b2){var k1,k2,s=''+h;
 while(1){
  k1=s.indexOf(b1);if(k1<0)return s;
  k2=s.indexOf(b2,k1+b1.length);if(k2<0)return s.substr(0,k1);//до конца
  s=s.substring(0,k1)+s.substring(k2+b2.length);}}
function tr2_to_rus(ss,razd){var ss,rus,lat,rl,tr2,i,c,w,s;//chr(127)\x7F
  rus='юшертыуиопасдфгхйклзжцвбнмэчъьщяЮШЕРТЫУИОПАСДФГХЙКЛЗЖЦВБНМЭЧЩЯ';
  lat='qwertyuiopasdfghjklzxcvbnm345679QWERTYUIOPASDFGHJKLZXCVBNM0812';
  rl={};for(i=0;i<rus.length;i++){rl[lat.charAt(i)]=rus.charAt(i);}//[w]=ш
  tr2=0; s='';
  for(i=0;i<ss.length;i++){
    c=ss.charAt(i);
    if(c===razd){tr2=(tr2)?0:1;continue;}
    w=rl[c];
    s += (tr2 && w!==undefined)? w:c;}
  return s;}
function mas8_to_str(bytes){ var out=[],pos=0,c=0,c1,c2,c3,c4,u;
  while(pos < bytes.length){
    c1 = bytes[pos++];
    if(c1 < 128){ out[c++] = String.fromCharCode(c1);}
    else if(c1 > 191 && c1 < 224){ c2 = bytes[pos++]; out[c++] = String.fromCharCode((c1 & 31) << 6 | c2 & 63);}
    else if(c1 > 239 && c1 < 365){ c2 = bytes[pos++]; c3 = bytes[pos++]; c4 = bytes[pos++];
      u = ((c1 & 7) << 18 | (c2 & 63) << 12 | (c3 & 63) << 6 | c4 & 63) -  0x10000;
      out[c++] = String.fromCharCode(0xD800 + (u >> 10)); out[c++] = String.fromCharCode(0xDC00 + (u & 1023));
    }
    else {c2=bytes[pos++];c3=bytes[pos++];out[c++]=String.fromCharCode((c1 & 15) << 12 | (c2 & 63) << 6 | c3 & 63);}}
  return out.join('');}
function test_jquery(){
  if(window['$'])if($.fn)if($.fn.jquery){msg("OK:jquery="+$.fn.jquery);return 1;}
  msg("ERR:нет jquery!"); return 0;}
function wait_jquery(vFuncLoadEnd,limit){
  if(limit){window['wait_jquery_limit']=limit/200;}
  else {if(window['wait_jquery_limit'])if(--wait_jquery_limit<1)return alert('ERR:таймаут jquery');}
  if(test_jquery()){$(document).ready(vFuncLoadEnd);return 1;}
  setTimeout(wait_jquery,200);}
function get_ext(s){var k1,k2,e;
    k1=s.lastIndexOf('/'); k2=s.lastIndexOf('.');
    if(k1>k2 || k2<0)return '';//netu
    e=s.substring(k2+1); e=e.toLowerCase();
    if(e=='jpeg')e='jpg'; if(e=='html')e='htm';
    return e;}
//--end--

//-----------------------------------------------------
//tg:@ArturPlugin  /(ru)Очередь задач для внеш и внутр js скриптов, можно добавлять на лету, паузы делать, циклы.
//use: run_many_js([arg1,arg2..],need_jQuery=1/0)
//arg:string(code js)/number(pause)/0=url(ext js async)/1=url(ext js defer)/~string(console.log)
//ochered=task queue Jul 2020

window['url_jquery']=window['url_jquery'] || 'jquery.js';//https://ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js
function waiter_end_step(n){setTimeout(function(){ochered_busy=0;run_many_js();},10+parseInt(n));}
function sleep(n){return n;}
function msg(o){return console.log(o);}
function loader_ext_js(u,t,wait){//load ext js from url
 var vFlag=1, e=document.createElement('script'); msg('start load='+u);
  e.onload=function(){if(vFlag){vFlag=0;msg('OK:'+t+' loaded='+u);if(wait)waiter_end_step(0);}}
  e.onerror=function(){msg('ERR:'+t+' ?='+u);}
  e.onreadystatechange=function(){if(this.readyState in {'complete':0,'loaded':0})setTimeout(function(){e.onload();},0);}
  e.async=true; e.charset='utf-8'; e.src=u; document.head.appendChild(e);}
function run_many_js(add_js,need_jQuery){var s,e,wait,url,t,i,d,u;
 if(window['ochered_js']===undefined){window['ochered_js']=[];}
 if(window['ochered_busy']===undefined){window['ochered_busy']=0;}
 if(add_js){//+load jQuery if no
  if(need_jQuery)if(test_jquery()==0){ochered_js.push("~loading jQuery");ochered_js.push('1='+window['url_jquery']);}
  if(typeof(add_js)=='object'){d=add_js.length;msg('add '+ d+ '-tasks');for(i=0;i<d;i++)ochered_js.push(add_js[i]);} //array
  else {ochered_js.push(add_js); return 100;}} //for one task - no auturun
 //run next task
 if(ochered_busy){msg('ocheredJS:busy');return -1;}
 ochered_busy=1;//set busy while this step+timer
 s=ochered_js.shift(); if(!s){msg('ocheredJS:null/end');ochered_busy=0;return 0;}
 t=typeof(s);
 if(t=='string'){ e=s.substring(0,1);u=s.substring(2);
  if(e=='~'){d=(''+(new Date())).substring(4,24);msg(d+'>'+s);waiter_end_step(0);return 1;}
  if(e=='1'){loader_ext_js(u,'defer js',1);return 2;}
  if(e=='0'){loader_ext_js(u,'async js',0);waiter_end_step(0);return 3;}//no wait, go to next task
  msg('ocheredJS:run js size='+s.length); eval(s);waiter_end_step(0);return 4;}
 if(t=='function'){msg('ocheredJS:run function='+s.name);s();waiter_end_step(0);return 5;}
 if(t=='number'){msg('ocheredJS:pause='+s);waiter_end_step(s);return 6;}
 msg('ocheredJS:error?');return -1;}

function parser_sleep(ss){var s,m,blok,i,w,k,n;
  s=''+ss;
  s=replace_all(s,'\r\n','\n')+'\n';
  s=s.replace(/\/\/[^\n]*\n/g,'');//del_koments(s)(//*\n)
  s=replace_all(s,';sleep(','; sleep(');
  s=replace_all(s,'\nsleep(','\n sleep(');
  m=s.split(' sleep(')  // a=0;sleep(10);b=0;
  blok=[];w=m[0].trim();if(w)blok.push(w);
  for(i=1;i<m.length;i++)if(m[i]){
    w=m[i]; k=w.indexOf(');');
    if(k>0){n=parseInt(w.substr(0,k));if(n)blok.push(n); w=w.substr(k+2).trim();if(w)blok.push(w);}}
  return blok;}

//-----------------------------------------------------
//tg:@ArturPlugin  /(ru) отложенная загрузка кучи htm,js,css,png,gif,jpg---------------
//все урл при паковке заменяются на abs0 - урл от корня /path/file.ext      ./ ../ - нельзя.
if('IntersectionObserver' in window){  //once!
  window['vidno_lazyElObserver']=new IntersectionObserver(function(entries, observer){entries.forEach(function(entry){
    if(entry.isIntersecting){
      msg('observe vidno='+entry.target.id);
      vidno_lazyElObserver.unobserve(entry.target);
      setTimeout(window['vidno_func'],0);
    }
  });});
}
function vidno_wait_id(vFunc){
  window['vidno_func']=vFunc;
  if('IntersectionObserver' in window){ //для новых бр можно вешать нес-ко элементов с таким ид
    msg('OK:observe, new browser');if(!window['vidno_id_el'])return 0;//once
    var e=document.querySelectorAll('#'+vidno_id_el); window['vidno_id_el']='';
    if(e){e=[].slice.call(e); e.forEach(function(el){vidno_lazyElObserver.observe(el);});};
  }
  else {// scroll event не должен нигде использоваться и только для 1го элемента. +если уже видно, то грузим сразу.
    msg('NO observe?, old browser');if(!window['vidno_id_el'])return 0;//once
    run_many_js(vidno_scroll_bind,'nado_jQuery');
    run_many_js(vidno_scroll_id);
    run_many_js();
  }
}
function vidno_scroll_bind(){$(window).unbind('scroll');$(window).bind('scroll',vidno_scroll_id);}
function vidno_scroll_id(){ //эту вешаем на скролл и ждем
  var v=window['vidno_id_el'],h=$(window).scrollTop(),t=$("#"+v).offset();
  t=(t==undefined)?0:t.top-$(window).height(); //msg(v,h,t);
  if(v)if(t)if(h >= t){
    msg('scroll vidno='+v); window['vidno_id_el']=''; $(window).unbind("scroll"); setTimeout(window['vidno_func'],0);
  }
}
function vidno_loader_ajax(){ //все работает сразу и стили и скрипты, иногда глючит.
  if(test_jquery()==0){alert('нужен jQuery');return -1;}
  var u=window['vidno_url'];msg('загружается по ajax url='+u);
  $.ajax({
    url:u, type:'GET',
    success:function(data){if(data != ''){msg('загружен по ajax, size='+data.length);$(document.body).append(data);}}
  });
}
function vidno_load_htm(){ //нежелательно (нужен jQuery)
  run_many_js(vidno_loader_ajax,'nado_jQuery');
  run_many_js();
}
//--------------------run all js------без jQuery---------------
function extract_js(s){var nn=0,vv=0,m,i,k,w,z,wait,url;//все скрипты вытягиваем и удаляем.
 s=del_blok(s,'<!'+'--','--'+'>');//удалить коменты, там могут быть закоментарены скрипты
 m=split2(s,'<scr'+'ipt','</scr'+'ipt>');
 for(i=1;i<m.length;i+=4){
   s=m[i+1]; k=s.indexOf('>'); if(k<0){msg('ERR:extract_js >');continue;}
   w=s.substring(0,k)+' '; wait=(w.indexOf(' async ')<0)?1:0;
   w=ok_dk(w);url=parser_src(w);
   z=s.substring(k+1);nn++;if(z.trim()=='' && url!=''){z=wait+'='+url;vv++;nn--;msg(z);}
   run_many_js(z);m[i+0]='';m[i+1]='';m[i+2]='';//del
 }
 msg('нашел скриптов: внутр='+nn+' внеш='+vv);
 return m.join('');
}

function append_body(h){var i,d,m,le,ext,f;
  h=extract_js(h);//добавляет в очередь и удаляет из хтмл
  h=htm_replacer(h);  //<style-url() <img src="" замена на дата64 из лок сторе если там есть
  d=''+document.body.innerHTML;document.body.innerHTML=d+h;
  run_many_js();}//запуск очереди
function append_css(h){
   var el = document.createElement('style');
   h=style_replacer(h);//url()-замена на дата64 из лок сторе если есть
   el.innerHTML = ''+h;
   document.head.appendChild(el);}
function htm_replacer(h){var i;
  h=del_blok(h,'<!'+'--','--'+'>');//удалить коменты, там могут быть закоментарены style/img
  h=split2(h,'<sty'+'le','</sty'+'le>');
  h[0]=img_replacer(h[0]);
  for(i=1;i<h.length;i+=4){
    h[i+1]=style_replacer(h[i+1]);//*>+css
    h[i+3]=img_replacer(h[i+3]);}//htm
  h=h.join('');
  return h;}
function style_replacer(h){var i,s,f,d;
  h=split2(h,'url(',')');
  for(i=1;i<h.length;i+=4){
    s=h[i+1]; if(s.length>999)continue;//err? data? too long path?
    f=s.replace(/['"]/g,' ').trim(); d=read_LST('site_'+f);if(d=='')continue;
    msg('f=('+f+')');h[i+1]=d;}
  return h.join('');}
function img_replacer(h){var i,s,f,d;
  h=split2(h,'<img ','>');
  for(i=1;i<h.length;i+=4){
    s=h[i+1]; if(s.length>999)continue;//err? data? too long path?
    s=ok_dk(s);f=parser_src(s);
    if(f){
     d=read_LST('site_'+f);if(d=='')continue;//нет такого на складе
     msg('f=('+f+')');h[i+1]=s.replace('"'+f+'"','"'+d+'"');}}
  h=h.join('');
  h=split2(h,'style="','"');
  for(i=1;i<h.length;i+=4){h[i+1]=style_replacer(h[i+1]);}//inline
  h=h.join('');
  return h;
}

function append_img(b,u){var m,i,r,t,j; //в осн HTML надо src менять на data-src а в стилях /*url()*/
  m=document.querySelectorAll('img');
  for(i=0;i<m.length;i++)if(u==m[i].getAttribute('data-src')){
    m[i].setAttribute('src',b);m[i].setAttribute('data-src','*');m[i].style.border='';msg('img='+u);}
  m=document.querySelectorAll('style');//background  /*url()*/
  for(i=0;i<m.length;i++){
      t=m[i].innerHTML;
      r=t.match(/\/\*url\(["']([^"']+)["']\)\*\//);
      if(r)for(j=0;j<r.length;j++)if(r[1]==u){msg('bg='+u);m[i].innerHTML=replace_all(t,r[0],'url("'+b+'")');}}}
//грузим html как js ( проблем меньше и локально можно) \x0B(11) =\v занят. нельзя в тексе юзать. /gzip utf-8
function end_load_js_htm(){var h,d;//стили применяются, скрипты запускаются очередью-js с учетом defer/async!
  if(window['ext_html']){
    h=ext_html.replace(/\x0b/g,'`'); ext_html=0; msg('OK:js-html загружен. size='+h.length); append_body(h);}
  else msg('ERR:нет var ext_html?');}
function vidno_load_js_htm(){//as html: var ext_html=`text`; (` replace \x0b) экранирование не катит т.к будут накладки.
  var url=window['vidno_url']; window['ext_html']=''; msg('загружаем js-html='+url);
  run_many_js('1='+url)
  run_many_js(end_load_js_htm);
  run_many_js();}
function vidno_load_any(){ //нежелательно (нужен jQuery)
  var url=window['vidno_url'],ext=url.substring(url.lastIndexOf('.'));
  if(ext=='.js')vidno_load_js_htm();
  if(ext=='.htm')vidno_load_htm();
  if(ext=='.png')vidno_load_png3_any();}
    
function vidno_load_png3_any(){//стили применяются, скрипты работают. RGB-0 PNG (tr2u вместо UTF-8)
 var url=window['vidno_url'], im=new Image; msg("загружаем png-data="+url);
 im.onload=function (){var canvas,w,h,context,d,i,n,t,m,vLimit,ext,f,le,ww,x;
  try{ 

   m=[]; w=im.width;h=im.height;canvas=document.createElement('canvas');
   canvas.width=w;canvas.height=h;context=canvas.getContext('2d');  
   context.drawImage(im,0,0); d=context.getImageData(0,0,w,h).data;
   for(i=0;i<d.length;i=i+4){m.push(d[i+0]);m.push(d[i+1]);m.push(d[i+2]);}  
   
   delete canvas; delete context; delete im;
  } catch(e){alert('ERR:canvas не работает!');return -1;}
  
  n=0;le=m.length; msg('OK:png-data загружен w='+im.width+' h='+im.height+' size='+le);
  if(!isLST()){alert('ERR:LocalStore не работает');return -2;}
  clear_LST();write_LST('site_files','==список файлов сайта==');//весь список файлов
  while(1){//цикл по файлам в контейнере имя0размер3дата+32..32 /пихаем все в локалсторе.
   d=[];vLimit=9999;while(vLimit--){if(n>=le){m=0;return maker_site();} w=m[n];n++;if(w==0)break;d.push(w);}
   f=mas8_to_str(d);if(n+2>=le){m=0;return maker_site();} i=m[n+2]+256*m[n+1]+256*256*m[n+0];n=n+3;
   msg('file='+f+' size='+i);if(i==0)return -1;d=[];while(i--){if(n>=le){m=0;return maker_site();} d.push(m[n]);n++;}
   ext=get_ext(f);if(ext=='css' || ext=='js' || ext=='htm'){d=mas8_to_str(d);d=tr2_to_rus(d,'\x7f');}
   if(ext=='png' || ext=='gif' || ext=='jpg'){d=img_base64(d,ext);} if(ext=='ver')d=mas8_to_str(d);
   write_LST('site_'+f,d);write_LST('site_files',read_LST('site_files')+"\n"+f);}}
 im.src=''+url+'?no_cache='+get_ms() ;}
 
function img_base64(m,ext){var b,i;
  b='';for(i=0;i<m.length;i++)b+=String.fromCharCode(m[i]);
  return 'data:image/'+ext+';base64,'+btoa(b);}
function maker_site(){var i,m,ext,f,le;
  m=read_LST('site_files').split("\n");le=m.length;
  for(i=1;i<le;i++)if(get_ext(m[i])=='css')append_css(read_LST('site_'+m[i]));
  for(i=1;i<le;i++)if(get_ext(m[i])=='htm')append_body(read_LST('site_'+m[i]));
  for(i=1;i<le;i++)if(get_ext(m[i])=='js')eval(read_LST('site_'+m[i]));
  for(i=1;i<le;i++){//картинки в осн хтмл
    ext=get_ext(m[i]);f=m[i];
    if(ext=='png' || ext=='gif' || ext=='jpg')append_img(read_LST('site_'+f),f);}
  if(typeof(window['end_load_png'])=='function')end_load_png();}//callback
//----ф-и для локалсторе типа куки
function isLST(){if('localStorage' in window)if(typeof(localStorage.getItem) == 'function')return 1; return 0;}
function clear_LST(){localStorage.clear();}
function write_LST(vName, vData, fObj){
 if(fObj)vData=JSON.stringify(vData);
 try {localStorage.setItem(''+vName, vData);return read_LST(''+vName,fObj);}
 catch(e){alert('Превышен лимит LocalStorage? или ошибка записи');}}
function read_LST(vName,fObj){var r;
 r=localStorage.getItem(''+vName);
 if(r==='0')return '0'; if(!r)return '';
 return (fObj)?JSON.parse(r):r;}
function from_json(v){ return JSON.parse(v);}
function to_json(v){ return JSON.stringify(v);}



//h='<style id="1">12345 uRl("==1==")123456 url("==2==")1234567</style>12345<iMg src="==1==" data-src="aaa">123456 <Img srC="==2==">1234567';htm_replacer(h)


function png3(u){//стили применяются, скрипты работают. RGB-0 PNG (tr2u вместо UTF-8)
 var url=u, im=new Image; msg("загружаем png-data="+url);
 im.onload=function (){var canvas,w,h,context,d,i,n,t,m,vLimit,ext,f,le,ww,x;
  try{ 
 //var1  
   m=[]; w=im.width;h=im.height;canvas=document.createElement('canvas');
   canvas.width=w;canvas.height=h;context=canvas.getContext('2d');  
   context.drawImage(im,0,0); d=context.getImageData(0,0,w,h).data;
   for(i=0;i<d.length;i=i+4){m.push(d[i+0]);m.push(d[i+1]);m.push(d[i+2]);}  
   
   
//var2 h=1   
   ww=10000; x=0; m=[]; w=im.width;h=im.height;canvas=document.createElement('canvas');
   canvas.width=ww;canvas.height=h;context=canvas.getContext('2d');  
   while(1){
    if(w<ww)ww=w;
    context.drawImage(im,-x,0); d=context.getImageData(0,0,ww,h).data;
    for(i=0;i<d.length;i=i+4){m.push(d[i+0]);m.push(d[i+1]);m.push(d[i+2]);}
    x+=ww;w-=ww;if(w==0)break;
   } 
      
   delete canvas; delete context; delete im;
  } catch(e){alert('ERR:canvas не работает!');return -1;}
  
  n=0;le=m.length; msg("OK:png-data загружен w="+im.width+" h=1 size="+le);
  if(!isLST()){alert('ERR:LocalStore не работает');return -2;}
  clear_LST();write_LST('site_files','==список файлов сайта==');//весь список файлов
  while(1){//цикл по файлам в контейнере имя0размер3дата+32..32 /пихаем все в локалсторе.
   d=[];vLimit=9999;while(vLimit--){if(n>=le)return maker_site();w=m[n];n++;if(w==0)break;d.push(w);}
   f=mas8_to_str(d);if(n+2>=le)return maker_site();i=m[n+2]+256*m[n+1]+256*256*m[n+0];n=n+3;
   msg('file='+f+' size='+i);if(i==0)return -1;d=[];while(i--){if(n>=le)return maker_site();d.push(m[n]);n++;}
   ext=get_ext(f);if(ext=='css' || ext=='js' || ext=='htm'){d=mas8_to_str(d);d=tr2_to_rus(d,'\x7f');}
   if(ext=='png' || ext=='gif' || ext=='jpg'){d=img_base64(d,ext);} if(ext=='ver')d=mas8_to_str(d);
   msg('f='+f+' size='+d.length);}}
 im.src=''+url+'?no_cache='+get_ms() ;}
 
//детектор шрифта -не мое, свиснул где-то. шрифты грузим в самом конце -можно в диспетчере дописать запуск,
// 
function FontDetector(){ 
 this.detect = detect;  this.addFont = addFont;
 var baseFonts = ['monospace', 'sans-serif', 'serif']; 
 var h = document.getElementsByTagName("body")[0]; 
 var s = document.createElement("span");  s.style.fontSize = '72px'; s.innerHTML = "mmmmmmmmmmlli"; 
 var defaultWidth = { }; var defaultHeight = { }; 
 for(var index in baseFonts){ 
  s.style.fontFamily = baseFonts[index]; 
  h.appendChild(s); 
  defaultWidth[baseFonts[index]] = s.offsetWidth; 
  defaultHeight[baseFonts[index]] = s.offsetHeight; 
  h.removeChild(s); 
 }
 function detect(font){ 
  var detected = false; 
  for(var index in baseFonts){ 
   s.style.fontFamily = font + ',' + baseFonts[index]; 
   h.appendChild(s); 
   var matched = (s.offsetWidth != defaultWidth[baseFonts[index]] || s.offsetHeight != defaultHeight[baseFonts[index]]);
   h.removeChild(s); 
   detected = detected || matched; 
  } 
  return detected; 
 } 
 function addFont(family, url){ 
  if(detect(family)){ console.log('using internal font '+family); return 1; } 
  if(url){ 
   console.log('added stylesheet '+url); 
   var link = document.createElement('link'); 
   link.type = 'text/css'; link.rel = 'stylesheet'; link.href = url; document.head.appendChild(link); 
   return 1; 
  } 
  console.log('ERR: '+family); return -1;
 } 
}
//пример
var fd=new FontDetector();
console.log('Montserrat='+fd.detect('Montserrat'));
//fd.addFont('FontAwesome','https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css?display=swap');
//fd.addFont('Open+Sans','https://fonts.googleapis.com/css?family=Open+Sans&display=swap'); 

/*диспетчер асинхронной загрузки кучи js / в конце каждого js пишем window['load_async_99]=1;end_async();
  если есть прямой код,зависящий от js выше то оборачиваем его в run_async_99(){} глоб.перем через window['var']
<script>
var run1=vidno_load_png3_any;
var site_config=["data_page99.png",'page99.png.ver',99,];
window['vidno_url']=site_config[0];
var v=read_LST('site_/'+site_config[1]);
if(v)if(v==site_config[2]){msg('уже новая версия в локалсторе');run1=maker_site;}
function end_load_png(){ //end load_png+make_site
 window['load_async_0']=1;end_async();}
var gMaxAsync=2; for(var i=0;i<gMaxAsync;i++){window['load_async_'+i]=0;}
function end_async(){var i; msg('---------------');
 for(i=0;i<gMaxAsync;i++){if(window['load_async_'+i]) msg('загружена=load_async_'+i);}
 for(i=0;i<gMaxAsync;i++){if(!window['load_async_'+i])return -1;}
 for(i=0;i<gMaxAsync;i++)if(window['run_async_'+i])window['run_async_'+i]();
 msg('все части приехали');//сюда пишем код как на $(document).ready(function)-но тут это не работает.
 document.querySelector('div.ramka-5').style="display:none";}
</script>
<body >
<div class="ramka-5"><h2>LOADING..<br> ИДЕТ ЗАГРУЗКА</h2></div>
<noscript><h1>ENABLE JAVASCRIPT (ВКЛЮЧИТЕ СКРИПТ)</h1></noscript>

<script> run1(); </script>
</body>
*/
