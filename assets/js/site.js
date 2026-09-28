
(function(){
  var root=document.documentElement;
  var EN=root.lang==='en';
  var S=EN?{menu:'Menu',close:'Close',toLight:'Switch to light mode',toDark:'Switch to dark mode',
            err:'Please enter your name, a way to reach you and your message.',hello:'Hello, I am writing from sotgec.com.',
            subject:'Subject: ',country:'Project country: ',td:'Chad',ci:'Côte d’Ivoire',name:'Name: ',contact:'Contact: ',mailSubject:'Request from sotgec.com: '}
          :{menu:'Menu',close:'Fermer',toLight:'Passer en mode clair',toDark:'Passer en mode sombre',
            err:'Renseignez votre nom, un moyen de vous joindre et votre message.',hello:'Bonjour, je vous écris depuis sotgec.com.',
            subject:'Sujet : ',country:'Pays du projet : ',td:'Tchad',ci:'Côte d’Ivoire',name:'Nom : ',contact:'Contact : ',mailSubject:'Demande depuis sotgec.com : '};
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* thème clair / sombre */
  var tbtn=document.querySelector('.theme-btn');
  var meta=document.querySelector('meta[name=theme-color]');
  function applyTheme(t){
    root.setAttribute('data-theme',t);
    if(meta){meta.setAttribute('content',t==='light'?'#F6F7F5':'#0E1A24');}
    if(tbtn){tbtn.setAttribute('aria-label',t==='light'?S.toDark:S.toLight);tbtn.setAttribute('title',t==='light'?S.toDark:S.toLight);}
  }
  applyTheme(root.getAttribute('data-theme')==='light'?'light':'dark');
  if(tbtn){
    tbtn.addEventListener('click',function(){
      var t=root.getAttribute('data-theme')==='light'?'dark':'light';
      applyTheme(t);
      try{localStorage.setItem('sotgec-theme',t);}catch(e){}
    });
  }

  var header = document.querySelector('.site-header');
  var btn=document.querySelector('.menu-btn'), nav=document.getElementById('nav');
  if(btn&&nav){
    btn.addEventListener('click',function(){
      var open=nav.classList.toggle('open');
      btn.setAttribute('aria-expanded',open?'true':'false');
      btn.textContent=open?S.close:S.menu;
    });
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');btn.setAttribute('aria-expanded','false');btn.textContent=S.menu;btn.focus();}
    });
  }
  document.querySelectorAll('[data-year]').forEach(function(y){y.textContent=new Date().getFullYear();});

  /* défilement doux + animations liées au défilement */
  var lenis=null;
  if(!reduce && window.Lenis){
    lenis=new Lenis({lerp:0.09,smoothWheel:true});
    if(window.gsap&&window.ScrollTrigger){
      gsap.registerPlugin(ScrollTrigger);
      lenis.on('scroll',ScrollTrigger.update);
      gsap.ticker.add(function(t){lenis.raf(t*1000);});
      gsap.ticker.lagSmoothing(0);
    }else{
      (function raf(t){lenis.raf(t);requestAnimationFrame(raf);})(0);
    }
  }
  function onScroll(fn){ if(lenis){lenis.on('scroll',fn);} else {window.addEventListener('scroll',fn,{passive:true});} fn(); }

  var heroEnd = document.querySelector('[data-header-solid-after]');
  onScroll(function(){
    var limit = heroEnd ? heroEnd.offsetTop + heroEnd.offsetHeight - 90 : 40;
    header.classList.toggle('solid', window.scrollY > limit);
  });

  if(!reduce && window.gsap && window.ScrollTrigger){
    gsap.utils.toArray('.photo img, .phero .bg img').forEach(function(img){
      gsap.fromTo(img,{yPercent:-8},{yPercent:0,ease:'none',scrollTrigger:{trigger:img.parentElement,start:'top bottom',end:'bottom top',scrub:true}});
    });
  }

  /* film piloté par le défilement */
  var scrub=document.querySelector('.scrub');
  if(scrub){
    var video=scrub.querySelector('video');
    var gauge=scrub.querySelectorAll('.gauge li');
    var cue=scrub.querySelector('.scroll-cue');
    var target=0, current=0, ready=false;
    function progress(){
      var r=scrub.getBoundingClientRect();
      var total=scrub.offsetHeight-window.innerHeight;
      return Math.min(1,Math.max(0,-r.top/total));
    }
    function update(){
      var p=progress();
      var idx=Math.min(gauge.length-1,Math.floor(p*gauge.length*0.999));
      gauge.forEach(function(g,i){g.classList.toggle('on',i<=idx);});
      if(cue){cue.style.opacity=p>0.04?'0':'1';}
      if(ready){ target=p*(video.duration-0.05); }
    }
    onScroll(update);
    if(video && !reduce){
      var small=window.matchMedia('(max-width: 860px)').matches;
      var h264=video.canPlayType('video/mp4; codecs="avc1.42E01E"')!=='';
      var src=h264?(small?video.dataset.srcMobile:video.dataset.src):(small?video.dataset.webmMobile:video.dataset.webm);
      function arm(u){
        video.addEventListener('loadeddata',function(){ready=true;update();video.style.opacity=1;},{once:true});
        video.src=u; video.load();
      }
      fetch(src).then(function(r){if(!r.ok)throw 0;return r.blob();}).then(function(b){arm(URL.createObjectURL(b));}).catch(function(){arm(src);});
      (function tick(){
        if(ready && !video.seeking){
          current+= (target-current)*0.18;
          if(Math.abs(video.currentTime-current)>0.015){ try{video.currentTime=current;}catch(e){} }
        }
        requestAnimationFrame(tick);
      })();
    }
  }

  /* formulaires : WhatsApp ou email */
  var WA={td:'23595736513',ci:'2250712209441'};

  /* Enregistrement des demandes dans Supabase (table demandes_site).
     Tant que SUPABASE_ANON_KEY n'est pas renseignée ci-dessous, cette
     fonction ne fait rien : WhatsApp et email continuent de fonctionner
     comme avant, sans régression. Une fois la clé publique du projet
     Supabase récupérée (après réactivation du projet), la coller ici. */
  var SUPABASE_URL='https://icjpmboahhsovvcijvhs.supabase.co';
  var SUPABASE_ANON_KEY='';
  var MAILBOX_TO_ENTITE={'contact@sotgec.com':'contact','btp@sotgec.com':'btp','immobilier@sotgec.com':'immobilier','consulting@sotgec.com':'consulting'};
  function saveDemande(f,c,canal){
    if(!SUPABASE_ANON_KEY)return;
    try{
      var entite=MAILBOX_TO_ENTITE[f.getAttribute('data-mailbox')]||'contact';
      fetch(SUPABASE_URL+'/rest/v1/demandes_site',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'apikey':SUPABASE_ANON_KEY,
          'Authorization':'Bearer '+SUPABASE_ANON_KEY,
          'Prefer':'return=minimal'
        },
        body:JSON.stringify({
          entite:entite,
          page_source:window.location.href,
          langue:(document.documentElement.lang||'fr').slice(0,2),
          nom:f.elements.nom?f.elements.nom.value.trim():'',
          contact:f.elements.contact?f.elements.contact.value.trim():'',
          sujet:f.elements.sujet?f.elements.sujet.value:'',
          pays:c.pays,
          message:f.elements.msg?f.elements.msg.value.trim():'',
          canal:canal
        })
      }).catch(function(){/* silencieux : ne bloque jamais l'envoi WA/email */});
    }catch(e){/* silencieux */}
  }

  document.querySelectorAll('form[data-mailbox]').forEach(function(f){
    var err=f.querySelector('.err');
    function value(n){var el=f.elements[n];return el?String(el.value||'').trim():'';}
    function compose(){
      var pays=f.querySelector('input[name=pays]:checked');
      var ci=pays&&pays.value==='ci';
      var lines=[S.hello,'',S.subject+value('sujet'),S.country+(ci?S.ci:S.td),S.name+value('nom'),S.contact+value('contact'),'',value('msg')];
      return {text:lines.join('\n'),pays:ci?'ci':'td'};
    }
    function check(){
      if(!value('nom')||!value('contact')||!value('msg')){err.textContent=S.err;return false;}
      err.textContent='';return true;
    }
    f.querySelectorAll('[data-send]').forEach(function(b){
      b.addEventListener('click',function(){
        if(!check())return;
        var c=compose();
        if(b.getAttribute('data-send')==='wa'){
          saveDemande(f,c,'whatsapp');
          window.open('https://wa.me/'+WA[c.pays]+'?text='+encodeURIComponent(c.text),'_blank','noopener');
        }else{
          saveDemande(f,c,'email');
          window.location.href='mailto:'+f.getAttribute('data-mailbox')+'?subject='+encodeURIComponent(S.mailSubject+value('sujet'))+'&body='+encodeURIComponent(c.text);
        }
      });
    });
    f.addEventListener('submit',function(e){e.preventDefault();});
  });
})();
