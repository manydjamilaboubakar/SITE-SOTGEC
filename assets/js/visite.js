/* SOTGEC — Visite guidée.
   Un seul moteur, quatre parcours (groupe, BTP, immobilier, conseil), FR et EN.
   - Rien ne se lance sans un clic du visiteur ; le son est optionnel.
   - L'ambiance sonore est générée dans le navigateur (Web Audio) : aucun fichier
     musical, donc aucun droit d'auteur à gérer et aucun poids réseau.
   - Les images ne se chargent qu'au démarrage d'une visite (et pas du tout en mode léger).
   - Toutes les images du site sont des illustrations : chaque scène porte la mention
     « Photo d'illustration ». À remplacer par de vraies photos dès qu'elles existent
     (voir IMG et le champ i de chaque scène).
   Mesure GA4 (respecte le consentement déjà en place) : visite_ouverte, visite_demarree,
   visite_scene, visite_terminee (dernière scène atteinte), visite_cta_clic, visite_fermee, visite_son. */
(function(){
  'use strict';
  var root=document.documentElement, EN=root.lang==='en';
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function t(a){return a[EN?1:0];}

  /* ---------- liens et coordonnées ---------- */
  var P={
    home:EN?'/en/':'/', contact:EN?'/en/contact/':'/contact/',
    btp:EN?'/en/construction/':'/btp/', immo:EN?'/en/real-estate/':'/immobilier/', conseil:EN?'/en/consulting/':'/consulting/'
  };
  var WA={td:'23595736513',ci:'2250712209441'};
  var IMG={chantier:'/assets/media/chantier-poster.jpg',btp:'/assets/img/btp',immobilier:'/assets/img/immobilier',hse:'/assets/img/hse',projet:'/assets/img/projet',residence:'/assets/img/residence-nuit',plans:'/assets/img/conseil-plans',immeuble:'/assets/img/chantier-immeuble'};
  function imgSrc(k){
    if(k==='chantier')return IMG.chantier;
    return IMG[k]+(window.innerWidth<=860?'-s':'')+'.webp';
  }
  var MOTION=[
    ['scale(1.04)','scale(1.16) translate3d(-1.5%,-1%,0)'],
    ['scale(1.16) translate3d(1.5%,0,0)','scale(1.04)'],
    ['scale(1.08) translate3d(2%,1%,0)','scale(1.08) translate3d(-2%,-1%,0)'],
    ['scale(1.14)','scale(1.03)']
  ];
  var ORANGE='#FF9000', TEAL='#3CC6B0', SKY='#7DB2E3', PAPER='#EEF1F2';

  /* ---------- contenu des parcours ---------- */
  var SCENE_MS=15000;
  var TOURS={
    groupe:{
      color:PAPER, page:P.home, sound:'on', ambience:'groupe',
      name:['Découvrir SOTGEC','Discover SOTGEC'],
      who:['Première visite : le groupe, ses trois métiers, sa façon de travailler.','First visit: the group, its three businesses, how we work.'],
      scenes:[
        {i:'chantier',pos:'45% 60%',m:0,k:['SOTGEC','SOTGEC'],t:['Bâtir. Loger. Conseiller.','Build. House. Advise.'],
         p:['Fondée à N’Djamena en 2019, SOTGEC est présente au Tchad et en Côte d’Ivoire.','Founded in N’Djamena in 2019, SOTGEC works in Chad and Côte d’Ivoire.']},
        {i:'btp',pos:'60% 50%',m:1,c:ORANGE,k:['SOTGEC BTP','SOTGEC BTP'],t:['Des fondations à la réception.','From foundations to handover.'],
         p:['Bâtiments, travaux publics, hydraulique et assainissement. Une étude sérieuse, un chantier suivi, une réception propre.','Buildings, public works, water supply and sanitation. Careful studies, a closely managed site, a clean handover.']},
        {i:'immobilier',pos:'55% 50%',m:0,c:TEAL,k:['SOTGEC Immobilier','SOTGEC Real Estate'],t:['Des murs qui accueillent.','Spaces that welcome.'],
         p:['Location, vente et promotion de biens, pour les familles, les entreprises et les organisations.','Renting, selling and developing property for families, companies and organisations.']},
        {i:'hse',pos:'40% 55%',m:2,c:SKY,k:['SOTGEC Consulting','SOTGEC Consulting'],t:['Chaque projet, sécurisé et piloté.','Every project, safe and under control.'],
         p:['Diagnostic HSE, accompagnement mensuel, formation pratique et management de projet.','HSE assessment, monthly support, hands-on training and project management.']},
        {i:'projet',pos:'35% 45%',m:3,k:['Notre façon de travailler','How we work'],t:['Rigueur, transparence, engagement écrit.','Rigour, transparency, commitments in writing.'],
         l:[['Un périmètre écrit, des points d’étape, un bilan à la fin.','A written scope, progress reviews, a final report.'],
            ['Seule une proposition écrite et signée engage SOTGEC.','Only a written, signed proposal binds SOTGEC.'],
            ['Le conseil est séparé des activités de construction.','Consulting is kept separate from construction.']]},
        {i:'immeuble',pos:'60% 55%',m:1,end:true,k:['Parlons de votre projet','Let’s talk about your project'],t:['Un seul interlocuteur, du terrain à la clé.','One point of contact, from plot to keys.'],
         p:['À N’Djamena et à Abidjan, nous construisons, louons, vendons et sécurisons avec la même exigence.','In N’Djamena and Abidjan, we build, rent, sell and make projects safer to the same standard.'],
         contact:'contact'}
      ]
    },
    btp:{
      color:ORANGE, page:P.btp, sound:'on', ambience:'btp',
      name:['Construire ou rénover','Build or renovate'],
      who:['Maîtres d’ouvrage, ONG, industriels : la méthode d’un chantier SOTGEC.','Clients, NGOs, industrial firms: how a SOTGEC site is run.'],
      scenes:[
        {i:'btp',pos:'60% 50%',m:0,k:['SOTGEC BTP','SOTGEC BTP'],t:['Construire et rénover avec méthode.','Building and renovating, methodically.'],
         p:['Entreprise de bâtiment et travaux publics basée à N’Djamena : des ouvrages neufs et des remises en état, de l’étude à la réception.','A building and public works company based in N’Djamena: new builds and refurbishments, from study to handover.']},
        {i:'immeuble',pos:'50% 55%',m:1,k:['Six domaines','Six fields'],t:['Un seul interlocuteur pour les coordonner.','One point of contact to coordinate them.'],
         l:[['Construction de bâtiments','Building construction'],['Réfection et rénovation','Renovation and refurbishment'],['Travaux publics','Public works'],
            ['Hydraulique et assainissement','Water supply and sanitation'],['Études et ingénierie','Studies and engineering'],['Entretien et fournitures','Maintenance and supplies']]},
        {i:'projet',pos:'40% 50%',m:2,k:['Étapes 1 et 2','Steps 1 and 2'],t:['Étude, chiffrage, planning.','Study, pricing, planning.'],
         p:['Visite, relevés, quantités et prix détaillés. Puis l’ordre des tâches, les achats et les livraisons planifiés.','Site visit, surveys, quantities and detailed prices. Then the task sequence, purchases and deliveries scheduled.']},
        {i:'btp',pos:'30% 50%',m:3,k:['Étapes 3 et 4','Steps 3 and 4'],t:['Un chantier suivi, des contrôles.','A managed site, regular checks.'],
         p:['Exécution suivie par un conducteur de travaux. Contrôles qualité et règles de sécurité appliquées.','Works overseen by a site manager. Quality checks and safety rules applied.']},
        {i:'hse',pos:'50% 55%',m:0,k:['Sécurité','Safety'],t:['Préparée avant l’ouverture du chantier.','Planned before the site opens.'],
         p:['Accès, protections, information des équipes et contrôles réguliers sont prévus dès la préparation, pas ajoutés en cours de route.','Access, protection, team briefings and regular checks are planned from the start, not added along the way.']},
        {i:'immeuble',pos:'40% 55%',m:1,end:true,k:['Étape 5 et après','Step 5 and after'],t:['Réception et suivi.','Handover and follow-up.'],
         p:['Levée des réserves, remise du dossier, suivi après livraison. Un dossier de références est disponible, avec l’accord de nos clients.','Snag clearance, handover file, after-delivery follow-up. A references file is available, shared with our clients’ consent.'],
         contact:'btp',ctaLabel:['Demander un devis','Request a quote']}
      ]
    },
    immo:{
      color:TEAL, page:P.immo, sound:'on', ambience:'immo',
      name:['Louer, acheter, investir','Rent, buy, invest'],
      who:['Familles, entreprises, organisations, diaspora : comment nous accompagnons un bien.','Families, companies, organisations, diaspora: how we support a property project.'],
      scenes:[
        {i:'residence',pos:'55% 55%',m:0,k:['SOTGEC Immobilier','SOTGEC Real Estate'],t:['Louer, vendre, promouvoir.','Rent, sell, develop.'],
         p:['Nous accompagnons propriétaires, entreprises et organisations, de la recherche du bien à la signature.','We support owners, companies and organisations, from finding the property to signing.']},
        {i:'immobilier',pos:'20% 60%',m:1,k:['Location','Rental'],t:['Nous cherchons, vous visitez.','We search, you visit.'],
         p:['Nous cherchons le bien, organisons les visites, vérifions le contrat et préparons la remise des clés.','We find the property, arrange viewings, check the lease and prepare the key handover.']},
        {i:'immobilier',pos:'80% 45%',m:2,k:['Vente','Sales'],t:['Jusqu’à la signature.','Through to signing.'],
         p:['Estimation, mise en vente, visites et accompagnement jusqu’à la signature.','Valuation, listing, viewings and support through to signing.']},
        {i:'immeuble',pos:'55% 55%',m:3,k:['Promotion immobilière','Property development'],t:['Avec l’appui de SOTGEC BTP.','With SOTGEC BTP behind it.'],
         p:['Montage et suivi de programmes, avec l’appui de SOTGEC BTP pour la construction.','Setting up and managing projects, with SOTGEC BTP handling construction.']},
        {i:'projet',pos:'60% 50%',m:0,k:['Votre demande','Your request'],t:['Quatre étapes, un seul contact.','Four steps, one contact.'],
         l:[['1. Votre besoin : type de bien, lieu, budget, délai','1. Your needs: type of property, location, budget, timing'],['2. La sélection des biens qui correspondent','2. A shortlist of matching properties'],
            ['3. Les visites, organisées et accompagnées','3. Viewings, arranged and accompanied'],['4. Le contrat : documents vérifiés, signature, remise des clés','4. The contract: document checks, signing, key handover']]},
        {i:'residence',pos:'35% 55%',m:1,end:true,k:['Notre catalogue se construit','Our listings are being built up'],t:['Dites-nous ce que vous cherchez.','Tell us what you are looking for.'],
         p:['Le catalogue de biens est en cours de constitution : décrivez ce que vous cherchez ou ce que vous souhaitez confier.','Our property listings are being built up: tell us what you are looking for or what you would like to entrust to us.'],
         contact:'immo',ctaLabel:['Demander des renseignements','Ask for information']}
      ]
    },
    conseil:{
      color:SKY, page:P.conseil, sound:'off', ambience:'conseil',
      name:['Être conseillé','Get advice'],
      who:['PME, industriels, donneurs d’ordre : HSE et management de projet, en trois marches.','SMEs, industrial firms, principals: HSE and project management, in three steps.'],
      scenes:[
        {i:'hse',pos:'45% 55%',m:0,k:['SOTGEC Consulting','SOTGEC Consulting'],t:['Sécuriser et piloter.','Safer projects, better managed.'],
         p:['Conseil et formation en HSE et en management de projet. On commence par un diagnostic, puis on accompagne la mise en œuvre.','Consulting and training in HSE and project management. We start with an assessment, then support implementation.']},
        {i:'plans',pos:'50% 55%',m:1,k:['Marche 1','Step 1'],t:['Le diagnostic.','The assessment.'],
         p:['Nous mesurons où vous en êtes et ce qu’il faut traiter en premier : état des lieux, écarts constatés, plan d’actions priorisé.','We measure where you stand and what to address first: current situation, gaps found, a prioritised action plan.']},
        {i:'hse',pos:'25% 55%',m:2,k:['Marche 2','Step 2'],t:['L’accompagnement mensuel.','Monthly support.'],
         p:['Suivi du plan d’actions, audits internes, indicateurs, appui aux équipes : mois après mois.','Action plan follow-up, internal audits, indicators, support for your teams: month after month.']},
        {i:'btp',pos:'40% 50%',m:3,k:['Marche 3','Step 3'],t:['La formation pratique.','Hands-on training.'],
         p:['Des modules courts, construits sur les situations réelles de vos sites, pour que les acquis restent en place.','Short modules built on real situations from your sites, so the gains stay in place.']},
        {i:'plans',pos:'65% 50%',m:0,k:['Management de projet','Project management'],t:['Cadrer, suivre, maîtriser.','Scope, track, control.'],
         l:[['Cadrage et planification','Scoping and planning'],['Suivi des coûts et des délais','Cost and schedule control'],['Maîtrise des risques','Risk management'],['Reporting aux décideurs','Reporting to decision-makers']]},
        {i:'hse',pos:'60% 50%',m:1,end:true,k:['Indépendance','Independence'],t:['Un conseil séparé de la construction.','Advice kept separate from construction.'],
         p:['SOTGEC Consulting intervient indépendamment des activités de construction du groupe. Les intervenants et leurs qualifications sont présentés dans chaque proposition.','SOTGEC Consulting works independently of the group’s construction business. The team and their credentials are set out in each proposal.'],
         contact:'conseil',ctaLabel:['Demander un diagnostic','Request an assessment']}
      ]
    }
  };
  var ORDER=['groupe','btp','immo','conseil'];
  var CARD_COLOR={groupe:PAPER,btp:ORANGE,immo:TEAL,conseil:SKY};

  /* ---------- textes d'interface ---------- */
  var S=EN?{
    launch:'Guided tour',launchAria:'Start the guided tour',title:'Guided tour',
    lede:'Choose a route. About 90 seconds, with ambient sound or in silence, and you can stop at any time.',
    forPage:'For this page',go:'Start · 90 s',sound:'Sound',soundOn:'With ambience',soundOff:'No sound',light:'Light mode: no images (slow connection)',
    hint:'Nothing plays until you choose. Ambient sound is generated in your browser and adds nothing to the page weight.',
    close:'Close the tour',prev:'Previous scene',next:'Next scene',pause:'Pause',play:'Play',mute:'Mute',unmute:'Turn sound on',vol:'Volume',
    scene:'Scene',of:'of',text:'Read the text version',note:'Illustration',jump:'Go to scene',
    wa:'WhatsApp N’Djamena',wa2:'WhatsApp Abidjan',write:'Write to us',cta:'Discuss your project',
    waMsg:function(n){return 'Hello, I am writing after the guided tour “'+n+'” on sotgec.com.';}
  }:{
    launch:'Visite guidée',launchAria:'Démarrer la visite guidée',title:'Visite guidée',
    lede:'Choisissez un parcours. Environ 90 secondes, avec ambiance sonore ou en silence, et vous pouvez l’arrêter à tout moment.',
    forPage:'Pour cette page',go:'Démarrer · 90 s',sound:'Son',soundOn:'Avec ambiance',soundOff:'Sans son',light:'Mode léger : sans images (connexion lente)',
    hint:'Rien ne se lance sans votre choix. L’ambiance sonore est générée dans votre navigateur et n’alourdit pas la page.',
    close:'Fermer la visite',prev:'Scène précédente',next:'Scène suivante',pause:'Pause',play:'Lecture',mute:'Couper le son',unmute:'Activer le son',vol:'Volume',
    scene:'Scène',of:'sur',text:'Lire la version texte',note:'Photo d’illustration',jump:'Aller à la scène',
    wa:'WhatsApp N’Djamena',wa2:'WhatsApp Abidjan',write:'Nous écrire',cta:'Parler de votre projet',
    waMsg:function(n){return 'Bonjour, je vous écris après la visite guidée « '+n+' » sur sotgec.com.';}
  };

  /* ---------- outils ---------- */
  function track(name,params){
    try{ if(typeof window.gtag==='function'){ window.gtag('event',name,params||{}); } }catch(e){}
  }
  function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch(e){}return null;}
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function el(tag,cls,html){var n=document.createElement(tag);if(cls)n.className=cls;if(html!==undefined)n.innerHTML=html;return n;}
  var ICON={
    play:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>',
    pause:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4.5" width="4.2" height="15"/><rect x="13.8" y="4.5" width="4.2" height="15"/></svg>',
    prev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M15 4.5 7.5 12 15 19.5"/></svg>',
    next:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M9 4.5 16.5 12 9 19.5"/></svg>',
    x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19"/></svg>',
    on:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12"/></svg>',
    off:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>'
  };

  /* ---------- ambiance sonore générée (Web Audio) ---------- */
  function mtof(m){return 440*Math.pow(2,(m-69)/12);}
  var AMB={
    groupe:{cut:2000,wet:.55,step:8,pad:'triangle',bell:0,
      chords:[[48,55,59,64,67],[45,52,55,60,64],[41,53,57,60,64],[43,55,59,62,64]]},
    immo:{cut:2400,wet:.6,step:7,pad:'sine',bell:.85,scale:[62,64,66,69,71,74,76,78],
      chords:[[50,57,61,64,66],[47,54,57,62,66],[43,55,59,62,66],[45,52,57,59,64]]},
    btp:{cut:900,wet:.5,step:10,pad:'triangle',bell:0,
      chords:[[36,43,48],[36,43,50],[36,43,52],[34,41,48]]},
    conseil:{cut:1300,wet:.5,step:9,pad:'sine',bell:.2,scale:[62,64,69,71,74],
      chords:[[38,50,52,57,64],[43,55,59,62,66],[45,52,57,62],[38,50,54,57,64]]}
  };
  function Ambience(kind){
    var AC=window.AudioContext||window.webkitAudioContext;
    var cfg=AMB[kind]||AMB.groupe;
    var ctx=null, master=null, bus=null, timer=null, bellTimer=null, ci=0, level=.4, muted=false, alive=true;
    this.ok=!!AC;
    function impulse(c,secs){
      var n=Math.floor(c.sampleRate*secs), b=c.createBuffer(2,n,c.sampleRate);
      for(var ch=0;ch<2;ch++){var d=b.getChannelData(ch);for(var i=0;i<n;i++){d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.6);}}
      return b;
    }
    function tone(freq,at,att,hold,rel,gain,type){
      var o=ctx.createOscillator(), g=ctx.createGain();
      o.type=type; o.frequency.value=freq; o.detune.value=(Math.random()-.5)*10;
      g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(gain,at+att);
      g.gain.setValueAtTime(gain,at+att+hold); g.gain.linearRampToValueAtTime(0,at+att+hold+rel);
      o.connect(g); g.connect(bus); o.start(at); o.stop(at+att+hold+rel+.2);
    }
    function bell(freq,at,gain){
      var o=ctx.createOscillator(), o2=ctx.createOscillator(), g=ctx.createGain(), g2=ctx.createGain();
      o.type='sine'; o.frequency.value=freq; o2.type='sine'; o2.frequency.value=freq*2.01;
      g2.gain.value=.18;
      g.gain.setValueAtTime(.0001,at); g.gain.exponentialRampToValueAtTime(gain,at+.03); g.gain.exponentialRampToValueAtTime(.0001,at+4.2);
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(bus); o.start(at); o2.start(at); o.stop(at+4.4); o2.stop(at+4.4);
    }
    function chord(){
      if(!ctx||ctx.state!=='running')return;
      var ch=cfg.chords[ci%cfg.chords.length]; ci++;
      var now=ctx.currentTime+.05, dur=cfg.step;
      ch.forEach(function(m,i){
        var low=i===0;
        tone(mtof(m),now+(low?0:i*.35),low?3:2.6,dur*.55,low?5:4.5,low?.12:.065,cfg.pad);
      });
    }
    function scheduleBell(){
      if(!alive||!cfg.bell)return;
      bellTimer=setTimeout(function(){
        if(ctx&&ctx.state==='running'&&Math.random()<cfg.bell){
          bell(mtof(cfg.scale[Math.floor(Math.random()*cfg.scale.length)]),ctx.currentTime+.05,.05+Math.random()*.03);
        }
        scheduleBell();
      },2600+Math.random()*3400);
    }
    function apply(fade){
      if(!ctx)return;
      var target=muted?0:Math.pow(level,2)*.9;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(target,ctx.currentTime,fade||.25);
    }
    this.start=function(){
      if(!AC||ctx)return;
      try{
        ctx=new AC(); master=ctx.createGain(); master.gain.value=0;
        var lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=cfg.cut; lp.Q.value=.4;
        var conv=ctx.createConvolver(); conv.buffer=impulse(ctx,3.6);
        var wet=ctx.createGain(); wet.gain.value=cfg.wet; var dry=ctx.createGain(); dry.gain.value=1-cfg.wet*.5;
        bus=ctx.createGain(); bus.connect(lp); lp.connect(dry); lp.connect(conv); conv.connect(wet);
        dry.connect(master); wet.connect(master); master.connect(ctx.destination);
        if(ctx.state==='suspended'){ctx.resume();}
        chord(); timer=setInterval(chord,cfg.step*1000); scheduleBell();
        apply(1.2);
      }catch(e){ctx=null;this.ok=false;}
    };
    this.resume=function(){if(ctx&&ctx.state==='suspended'){ctx.resume();}};
    this.suspend=function(){if(ctx&&ctx.state==='running'){ctx.suspend();}};
    this.setLevel=function(v){level=Math.max(0,Math.min(1,v));apply(.15);};
    this.setMuted=function(m){muted=!!m;apply(.2);};
    this.stop=function(){
      alive=false; clearInterval(timer); clearTimeout(bellTimer);
      if(!ctx)return;
      var c=ctx; ctx=null;
      try{master.gain.cancelScheduledValues(c.currentTime);master.gain.setTargetAtTime(0,c.currentTime,.25);}catch(e){}
      setTimeout(function(){try{c.close();}catch(e){}},1400);
    };
  }

  /* ---------- la visite ---------- */
  var ui=null, state=null;
  function slowLink(){
    var c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
    return !!(c&&(c.saveData||/(^|-)2g$/.test(c.effectiveType||'')));
  }
  function suggested(){
    var p=location.pathname.replace(/\/+$/,'/');
    if(/\/(btp|construction)\//.test(p))return 'btp';
    if(/\/(immobilier|real-estate)\//.test(p))return 'immo';
    if(/\/consulting\//.test(p))return 'conseil';
    return 'groupe';
  }
  function build(){
    var d=el('div','vt is-choose');
    d.setAttribute('role','dialog'); d.setAttribute('aria-modal','true'); d.setAttribute('aria-label',S.title); d.setAttribute('data-lenis-prevent','');
    d.hidden=true;
    d.innerHTML=
      '<div class="vt-bg"><div class="vt-layer"></div><div class="vt-layer"></div><div class="vt-shade"></div></div>'+
      '<div class="vt-top"><img class="vt-logo" src="/assets/img/sotgec-logo-clair.svg" alt="SOTGEC" width="146" height="32"><div class="vt-prog" role="group" aria-label="'+esc(S.title)+'"></div>'+
      '<button type="button" class="vt-close" aria-label="'+esc(S.close)+'">'+ICON.x+'</button></div>'+
      '<div class="vt-choose"><h2>'+esc(S.title)+'</h2><p class="vt-lede">'+esc(S.lede)+'</p><div class="vt-cards"></div>'+
      '<div class="vt-opts"><div class="vt-seg" role="group" aria-label="'+esc(S.sound)+'"><button type="button" data-snd="on">'+esc(S.soundOn)+'</button><button type="button" data-snd="off">'+esc(S.soundOff)+'</button></div>'+
      '<label class="vt-check"><input type="checkbox" class="vt-lite"> <span>'+esc(S.light)+'</span></label></div><p class="vt-hint">'+esc(S.hint)+'</p></div>'+
      '<div class="vt-scene" aria-live="polite"><div class="vt-inner"></div></div>'+
      '<span class="vt-note">'+esc(S.note)+'</span>'+
      '<div class="vt-bar"><div class="vt-grp"><button type="button" class="vt-btn" data-a="prev" aria-label="'+esc(S.prev)+'">'+ICON.prev+'</button>'+
      '<button type="button" class="vt-btn" data-a="pause" aria-label="'+esc(S.pause)+'">'+ICON.pause+'</button>'+
      '<button type="button" class="vt-btn" data-a="next" aria-label="'+esc(S.next)+'">'+ICON.next+'</button><span class="vt-count" aria-hidden="true"></span></div>'+
      '<div class="vt-grp"><button type="button" class="vt-btn" data-a="mute" aria-label="'+esc(S.mute)+'">'+ICON.on+'</button>'+
      '<input class="vt-vol" type="range" min="0" max="100" step="5" aria-label="'+esc(S.vol)+'"></div>'+
      '<a class="vt-txtlink" href="#">'+esc(S.text)+'</a></div>';
    var cards=d.querySelector('.vt-cards');
    ORDER.forEach(function(id){
      var T=TOURS[id], b=el('button','vt-card');
      b.type='button'; b.setAttribute('data-tour',id); b.style.setProperty('--c',CARD_COLOR[id]);
      b.innerHTML='<b>'+esc(t(T.name))+'</b><span>'+esc(t(T.who))+'</span><em>'+esc(S.go)+'</em>';
      cards.appendChild(b);
    });
    document.body.appendChild(d);
    return {
      root:d, layers:d.querySelectorAll('.vt-layer'), prog:d.querySelector('.vt-prog'), inner:d.querySelector('.vt-inner'),
      note:d.querySelector('.vt-note'), count:d.querySelector('.vt-count'), vol:d.querySelector('.vt-vol'),
      pause:d.querySelector('[data-a=pause]'), mute:d.querySelector('[data-a=mute]'), prev:d.querySelector('[data-a=prev]'), next:d.querySelector('[data-a=next]'),
      txt:d.querySelector('.vt-txtlink'), lite:d.querySelector('.vt-lite'), seg:d.querySelectorAll('[data-snd]'), cards:cards
    };
  }

  function setSoundChoice(v,touched){
    state.sound=v;
    if(touched){state.soundTouched=true;store('sotgec-visite-son',v);}
    [].forEach.call(ui.seg,function(b){b.setAttribute('aria-pressed',b.getAttribute('data-snd')===v?'true':'false');});
  }

  function open(origin,preselect){
    if(!ui){ui=build(); wire();}
    var saved=store('sotgec-visite-son');
    state={tour:null,idx:0,playing:false,elapsed:0,last:0,raf:0,sound:'on',soundTouched:false,amb:null,muted:false,
           lite:slowLink(),opener:document.activeElement,t0:0,layer:0,reachedEnd:false,suggest:preselect||suggested()};
    ui.lite.checked=state.lite;
    var v=parseInt(store('sotgec-visite-vol'),10); ui.vol.value=isNaN(v)?40:v;
    setSoundChoice(saved==='on'||saved==='off'?saved:(state.lite?'off':'on'),false);
    if(saved==='on'||saved==='off')state.soundTouched=true;
    [].forEach.call(ui.cards.children,function(c){
      var id=c.getAttribute('data-tour'), em=c.querySelector('em');
      em.textContent=(id===state.suggest?S.forPage+' · ':'')+S.go+(TOURS[id].sound==='off'&&!state.soundTouched?' · '+S.soundOff:'');
    });
    ui.root.classList.add('is-choose'); ui.root.classList.remove('is-play');
    ui.root.hidden=false; document.body.classList.add('vt-open');
    inertOthers(true);
    void ui.root.offsetWidth; ui.root.classList.add('is-on');
    var first=ui.cards.querySelector('[data-tour="'+state.suggest+'"]')||ui.cards.firstChild; first.focus({preventScroll:true});
    track('visite_ouverte',{origine:origin||'bouton',page:location.pathname});
  }

  function inertOthers(on){
    [].forEach.call(document.body.children,function(n){
      if(n===ui.root||n.tagName==='SCRIPT')return;
      if(on){n.setAttribute('inert','');n.setAttribute('aria-hidden','true');}
      else{n.removeAttribute('inert');n.removeAttribute('aria-hidden');}
    });
  }

  function start(id){
    var T=TOURS[id]; state.tour=id; state.idx=0; state.reachedEnd=false; state.t0=Date.now();
    state.lite=ui.lite.checked;
    if(!state.soundTouched){setSoundChoice(T.sound,false);}
    ui.root.style.setProperty('--vt',T.color);
    ui.root.classList.remove('is-choose'); ui.root.classList.add('is-play');
    ui.txt.setAttribute('href',T.page);
    /* progression cliquable */
    ui.prog.innerHTML='';
    T.scenes.forEach(function(s,i){
      var b=el('button','',"<i></i>"); b.type='button'; b.setAttribute('aria-label',S.jump+' '+(i+1)+' : '+t(s.t));
      b.addEventListener('click',function(){go(i);}); ui.prog.appendChild(b);
    });
    /* son : créé dans le geste de clic du visiteur */
    var wantSound=state.sound==='on';
    ui.mute.style.display=ui.vol.style.display=wantSound?'':'none';
    ui.mute.parentNode.style.display=wantSound?'':'none';
    if(wantSound){
      state.amb=new Ambience(T.ambience);
      if(state.amb.ok){state.amb.setLevel(ui.vol.value/100);state.amb.start();}
      else{ui.mute.parentNode.style.display='none';}
    }
    state.muted=false; syncMute();
    state.playing=!reduce;
    track('visite_demarree',{parcours:id,son:wantSound?'oui':'non',mode_leger:state.lite?'oui':'non',page:location.pathname});
    render(0,true);
    state.last=performance.now(); cancelAnimationFrame(state.raf); state.raf=requestAnimationFrame(tick);
    syncPause();
    ui.next.focus({preventScroll:true});
  }

  function scenes(){return TOURS[state.tour].scenes;}

  function render(i,first){
    var T=TOURS[state.tour], sc=T.scenes[i];
    state.idx=i; state.elapsed=0; state.last=performance.now();
    var color=sc.c||T.color; ui.root.style.setProperty('--vt',color);
    /* fond */
    var next=ui.layers[state.layer=1-state.layer], prev=ui.layers[1-state.layer];
    if(!state.lite){
      var fp=(sc.pos||'50% 50%').split(' '), im=el('img'); im.alt=''; im.decoding='async';
      im.style.objectPosition=sc.pos||'50% 50%'; next.style.setProperty('--fx',fp[0]); next.style.setProperty('--fy',fp[1]);
      im.src=imgSrc(sc.i); next.innerHTML=''; next.appendChild(im);
      if(!reduce&&im.animate){
        var mo=MOTION[sc.m||0]; im.style.transformOrigin=fp[0]+' '+fp[1];
        im.animate([{transform:mo[0]},{transform:mo[1]}],{duration:SCENE_MS+2500,fill:'forwards',easing:'linear'});
      }
      ui.note.style.display='';
    }else{next.innerHTML='';ui.note.style.display='none';}
    next.classList.add('on'); if(!first)prev.classList.remove('on'); else prev.classList.remove('on');
    /* texte */
    var h='<span class="vt-kicker">'+esc(t(sc.k))+'</span><h2 class="vt-title">'+esc(t(sc.t))+'</h2>';
    if(sc.p)h+='<p class="vt-text">'+esc(t(sc.p))+'</p>';
    if(sc.l){h+='<ul class="vt-list">'+sc.l.map(function(x){return '<li>'+esc(t(x))+'</li>';}).join('')+'</ul>';}
    if(sc.end)h+=ctaHtml(sc);
    ui.inner.innerHTML=h; ui.inner.className='vt-inner vt-in';
    ui.inner.parentNode.scrollTop=0;
    ui.count.textContent=(i+1)+' / '+T.scenes.length;
    ui.prev.disabled=i===0; ui.next.disabled=i===T.scenes.length-1;
    [].forEach.call(ui.prog.children,function(b,j){
      var f=b.firstChild; f.style.transform=j<i?'scaleX(1)':'scaleX(0)';
      if(j===i)b.setAttribute('aria-current','step'); else b.removeAttribute('aria-current');
    });
    /* préchargement de la scène suivante */
    if(!state.lite&&T.scenes[i+1]){var pre=new Image();pre.src=imgSrc(T.scenes[i+1].i);}
    track('visite_scene',{parcours:state.tour,scene:i+1});
    if(sc.end&&!state.reachedEnd){state.reachedEnd=true;track('visite_terminee',{parcours:state.tour});}
  }

  function ctaHtml(sc){
    var T=TOURS[state.tour], name=t(T.name);
    var utm='?utm_source=visite&utm_medium=parcours&utm_campaign='+state.tour;
    var msg=encodeURIComponent(S.waMsg(name));
    var href=P[sc.contact]||P.contact;
    var form=(sc.contact==='contact'||!sc.contact)?href+utm:href+utm+'#contact';
    var label=sc.ctaLabel?t(sc.ctaLabel):S.write;
    var out='<div class="vt-cta">';
    out+='<a class="btn-solid" data-cta="formulaire" href="'+esc(form)+'">'+esc(label)+'</a>';
    out+='<a class="btn-line" data-cta="whatsapp_td" href="https://wa.me/'+WA.td+'?text='+msg+'" target="_blank" rel="noopener">'+esc(S.wa)+'</a>';
    out+='<a class="btn-line" data-cta="whatsapp_ci" href="https://wa.me/'+WA.ci+'?text='+msg+'" target="_blank" rel="noopener">'+esc(S.wa2)+'</a></div>';
    return out;
  }

  function go(i){
    var n=scenes().length; if(i<0||i>=n)return;
    render(i,false);
  }

  function tick(now){
    state.raf=requestAnimationFrame(tick);
    var dt=now-state.last; state.last=now;
    if(!state.playing||document.hidden||dt>500)return;
    state.elapsed+=dt;
    var n=scenes().length, p=Math.min(1,state.elapsed/SCENE_MS);
    var f=ui.prog.children[state.idx]&&ui.prog.children[state.idx].firstChild;
    if(f)f.style.transform='scaleX('+p+')';
    if(p>=1){
      if(state.idx<n-1){go(state.idx+1);}
      else{state.playing=false;syncPause();}
    }
  }

  function syncPause(){
    ui.pause.innerHTML=state.playing?ICON.pause:ICON.play;
    ui.pause.setAttribute('aria-label',state.playing?S.pause:S.play);
  }
  function syncMute(){
    ui.mute.innerHTML=state.muted?ICON.off:ICON.on;
    ui.mute.setAttribute('aria-label',state.muted?S.unmute:S.mute);
  }

  function close(){
    if(!ui||ui.root.hidden)return;
    if(state.tour){
      track('visite_fermee',{parcours:state.tour,scene:state.idx+1,duree_s:Math.round((Date.now()-state.t0)/1000)});
    }
    cancelAnimationFrame(state.raf);
    if(state.amb){state.amb.stop();state.amb=null;}
    ui.root.classList.remove('is-on'); document.body.classList.remove('vt-open');
    inertOthers(false);
    var opener=state.opener;
    setTimeout(function(){ui.root.hidden=true;ui.layers[0].innerHTML='';ui.layers[1].innerHTML='';ui.layers[0].classList.remove('on');ui.layers[1].classList.remove('on');},480);
    if(opener&&opener.focus){try{opener.focus({preventScroll:true});}catch(e){}}
    state.tour=null;
  }

  function wire(){
    ui.root.querySelector('.vt-close').addEventListener('click',close);
    ui.cards.addEventListener('click',function(e){var b=e.target.closest('[data-tour]');if(b)start(b.getAttribute('data-tour'));});
    [].forEach.call(ui.seg,function(b){b.addEventListener('click',function(){setSoundChoice(b.getAttribute('data-snd'),true);});});
    ui.prev.addEventListener('click',function(){go(state.idx-1);});
    ui.next.addEventListener('click',function(){go(state.idx+1);});
    ui.pause.addEventListener('click',function(){
      state.playing=!state.playing; state.last=performance.now(); syncPause();
    });
    ui.mute.addEventListener('click',function(){
      state.muted=!state.muted; if(state.amb)state.amb.setMuted(state.muted); syncMute();
      track('visite_son',{etat:state.muted?'coupe':'actif',parcours:state.tour});
    });
    ui.vol.addEventListener('input',function(){
      var v=ui.vol.value/100; store('sotgec-visite-vol',String(ui.vol.value));
      if(state.amb){state.amb.setLevel(v); if(state.muted&&v>0){state.muted=false;state.amb.setMuted(false);syncMute();}}
    });
    ui.inner.addEventListener('click',function(e){
      var a=e.target.closest('[data-cta]'); if(a)track('visite_cta_clic',{parcours:state.tour,cta:a.getAttribute('data-cta')});
    });
    ui.txt.addEventListener('click',function(){track('visite_version_texte',{parcours:state.tour});});
    /* clavier */
    document.addEventListener('keydown',function(e){
      if(!ui||ui.root.hidden)return;
      if(e.key==='Escape'){e.preventDefault();close();return;}
      if(e.key==='Tab'){
        var f=[].filter.call(ui.root.querySelectorAll('button,a[href],input'),function(n){return n.offsetParent!==null&&!n.disabled;});
        if(!f.length)return;
        var a=f[0], z=f[f.length-1];
        if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}
        else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}
        return;
      }
      if(!state.tour)return;
      var tag=(e.target&&e.target.tagName)||'';
      if(e.key==='ArrowRight'&&tag!=='INPUT'){e.preventDefault();go(state.idx+1);}
      else if(e.key==='ArrowLeft'&&tag!=='INPUT'){e.preventDefault();go(state.idx-1);}
      else if((e.key==='m'||e.key==='M')&&state.amb&&tag!=='INPUT'){ui.mute.click();}
    });
    /* balayage tactile */
    var sx=0,sy=0,ok=false;
    ui.root.addEventListener('touchstart',function(e){
      ok=!!state.tour&&!e.target.closest('button,a,input')&&e.touches.length===1; if(ok){sx=e.touches[0].clientX;sy=e.touches[0].clientY;}
    },{passive:true});
    ui.root.addEventListener('touchend',function(e){
      if(!ok)return; var dx=e.changedTouches[0].clientX-sx, dy=e.changedTouches[0].clientY-sy;
      if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5){go(state.idx+(dx<0?1:-1));}
    },{passive:true});
    /* onglet masqué : on suspend le son */
    document.addEventListener('visibilitychange',function(){
      if(!state||!state.amb)return;
      if(document.hidden)state.amb.suspend(); else state.amb.resume();
    });
  }

  /* ---------- lanceur flottant + déclencheurs data-visite ---------- */
  function init(){
    var launch=el('button','vt-launch','<span class="vt-ico">'+ICON.play+'</span><span>'+esc(S.launch)+'</span>');
    launch.type='button'; launch.setAttribute('aria-haspopup','dialog'); launch.setAttribute('aria-label',S.launchAria);
    launch.addEventListener('click',function(){open('bouton');});
    document.body.appendChild(launch);
    function place(){
      var cb=document.querySelector('.cookie-bar');
      launch.style.bottom=(cb?cb.offsetHeight+14:18)+'px';
    }
    place(); window.addEventListener('resize',place);
    if(window.MutationObserver){new MutationObserver(place).observe(document.body,{childList:true});}
    document.addEventListener('click',function(e){
      var a=e.target.closest&&e.target.closest('[data-visite]');
      if(!a)return; e.preventDefault(); open('page',a.getAttribute('data-visite'));
    });
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}
})();
