import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const HTML_DOCUMENT = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Friendoo — Safe Audio Conversations in Your Language</title>
<meta name="description" content="Friendoo connects adults with verified hosts for in-app audio conversations in supported Indian languages.">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--brand:#7c5cff;--teal:#18c6b8;--pink:#ff7ab6;--dark:#060810;--panel:rgba(255,255,255,.05);--border:rgba(255,255,255,.08);--muted:rgba(255,255,255,.5);--r:22px}
*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
body{font-family:'Space Grotesk',sans-serif;background:var(--dark);color:#fff;line-height:1.7;overflow-x:hidden}
a{color:inherit;text-decoration:none}
.lang-bar{background:rgba(255,255,255,.03);border-bottom:1px solid var(--border);padding:6px 6vw;display:flex;gap:6px;align-items:center;justify-content:flex-end}
.lang-bar>span{color:var(--muted);font-size:12px}
.lang-select{padding:4px 28px 4px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#fff;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;outline:none;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.5)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center;transition:border-color .2s;width:auto;max-width:130px}
.lang-select:hover,.lang-select:focus{border-color:var(--brand)}
.lang-select option{background:#1a2040;color:#fff}
nav{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:14px 6vw;background:rgba(6,8,16,.92);backdrop-filter:blur(16px);border-bottom:1px solid var(--border)}
.logo{display:flex;align-items:center;gap:12px;font-weight:800;font-size:20px}.logo svg,.logo img{width:36px;height:36px;object-fit:contain;border-radius:8px}
.nav-right{display:flex;gap:22px;align-items:center}.nav-right a{color:var(--muted);font-size:14px}.nav-right a:hover{color:#fff}
.btn{display:inline-block;padding:10px 22px;border-radius:999px;font-weight:700;font-size:14px;font-family:inherit;background:linear-gradient(135deg,var(--brand),var(--pink));color:#fff;border:none;cursor:pointer;transition:transform .2s}.btn:hover{transform:translateY(-2px)}
.btn-lg{padding:16px 36px;font-size:16px}.btn-outline{background:transparent!important;color:#fff!important;border:1.5px solid rgba(255,255,255,.25)!important}
.view{display:none}.view:target{display:block}
body:not(:has(.view:target)) #home-view{display:block}
.hero{min-height:100vh;display:flex;flex-direction:column;justify-content:flex-end;padding:0 6vw 80px;position:relative;background:var(--dark);overflow:hidden}
.call-story{height:230vh;position:relative;margin:0;background:radial-gradient(ellipse 70% 55% at 50% 45%,rgba(124,92,255,.22),transparent 68%),linear-gradient(180deg,#060810 0%,#0b1030 48%,#060810 100%);overflow:clip}.call-story-sticky{position:sticky;top:0;height:100vh;min-height:640px;overflow:hidden;border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.08)}.call-story canvas{position:absolute;inset:0;width:100%;height:100%;display:block}.call-story-copy{position:absolute;z-index:2;left:6vw;top:50%;transform:translateY(-50%);max-width:430px;pointer-events:none}.call-story-copy h2{font-size:clamp(38px,5vw,72px);margin:0;letter-spacing:-2px}.call-story-copy p{color:rgba(255,255,255,.64);font-size:16px;max-width:360px;margin:18px 0 0;line-height:1.65}.call-story-stage{position:absolute;z-index:2;right:6vw;bottom:8vh;max-width:310px;padding:13px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.15);background:rgba(7,10,26,.64);backdrop-filter:blur(16px);color:#fff;font-size:12px;font-weight:700;letter-spacing:.2px;box-shadow:0 12px 40px rgba(0,0,0,.24)}.call-story-stage:before{content:'';display:inline-block;width:7px;height:7px;margin-right:9px;border-radius:50%;background:var(--teal);box-shadow:0 0 14px var(--teal)}.call-story-hint{position:absolute;z-index:2;left:6vw;bottom:8vh;color:rgba(255,255,255,.45);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase}.call-story-hint:after{content:'↓';margin-left:9px;color:var(--teal);font-size:16px}.story-static canvas{display:none}.story-static .call-story-sticky{background:radial-gradient(circle at 72% 45%,rgba(255,122,182,.18),transparent 30%),radial-gradient(circle at 35% 45%,rgba(24,198,184,.15),transparent 28%)}
@media(max-width:760px){.call-story{height:180vh}.call-story-sticky{min-height:560px}.call-story-copy{top:auto;bottom:18vh;left:5vw;right:5vw;transform:none;max-width:340px}.call-story-copy h2{font-size:clamp(34px,10vw,48px);letter-spacing:-1.5px}.call-story-copy p{font-size:14px}.call-story-stage{left:5vw;right:auto;bottom:7vh;max-width:290px}.call-story-hint{display:none}}
.hero-bg{position:absolute;inset:0;z-index:0;background:radial-gradient(ellipse 80% 60% at 70% 40%,rgba(124,92,255,.22) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 20% 70%,rgba(255,122,182,.14) 0%,transparent 55%)}
.hero-content{position:relative;z-index:2}
.hero-eyebrow{display:inline-flex;align-items:center;gap:10px;padding:10px 16px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:999px;font-size:13px;color:rgba(255,255,255,.7);margin-bottom:24px;line-height:1}
.hero-eyebrow>span:first-child{width:8px;height:8px;border-radius:50%;background:var(--teal);display:inline-block;flex-shrink:0}
.hero-heading{font-size:clamp(44px,9vw,110px);font-weight:800;line-height:1.05;letter-spacing:-2px;max-width:1100px}
.cycle-wrapper{display:inline-block;overflow:hidden;vertical-align:baseline;height:1.1em;line-height:1.1em}
.cycle-text{display:flex;flex-direction:column;animation:cycle 3.6s infinite ease-in-out}
.cycle-text span{display:block;height:1.1em;line-height:1.1em;padding-bottom:.05em;background:linear-gradient(135deg,#fff 0%,#c7b8ff 40%,#ff7ab6 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
@keyframes cycle{0%,18%{transform:translateY(0)}25%,43%{transform:translateY(-1.1em)}50%,68%{transform:translateY(-2.2em)}75%,93%{transform:translateY(-3.3em)}100%{transform:translateY(-4.4em)}}
.hero-sub{color:var(--muted);font-size:clamp(16px,2vw,20px);max-width:520px;margin-top:28px;margin-bottom:36px}
.hero-actions{display:flex;gap:14px;flex-wrap:wrap}
.ticker-wrap{overflow:hidden;background:rgba(255,255,255,.04);border-top:1px solid rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.06);padding:18px 0;white-space:nowrap}
.ticker-track{display:inline-flex;gap:64px;animation:ticker 22s linear infinite}
.ticker-item{color:var(--muted);font-size:14px;font-weight:600}.ticker-sep{color:var(--brand);font-size:18px}
@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
section{padding:56px 6vw}.label{display:inline-block;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--brand);font-weight:700;margin-bottom:14px}
h2{font-size:clamp(34px,5.5vw,68px);font-weight:800;line-height:1.1;letter-spacing:-1.5px}.section-lead{color:rgba(255,255,255,.6);font-size:17px;max-width:560px;margin-top:16px}
.features-marquee{display:flex;gap:18px;overflow:hidden;margin-top:48px}.features-marquee-inner{display:flex;gap:18px;flex-shrink:0;animation:marq 24s linear infinite}
@keyframes marq{from{transform:translateX(0)}to{transform:translateX(-100%)}}
.feat-card{flex-shrink:0;width:290px;padding:28px;background:var(--panel);border:1px solid var(--border);border-radius:var(--r)}.feat-icon{font-size:34px;margin-bottom:14px}.feat-card h3{font-size:18px;margin-bottom:8px;line-height:1.3}.feat-card p{color:var(--muted);font-size:14px;line-height:1.6}
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:48px}.stat-box{padding:28px 22px;background:var(--panel);border:1px solid var(--border);border-radius:var(--r)}
.stat-num{font-size:clamp(36px,4.5vw,52px);font-weight:800;letter-spacing:-2px;background:linear-gradient(135deg,white,#b8c2ff);-webkit-background-clip:text;background-clip:text;color:transparent}.stat-label{color:var(--muted);font-size:13px;margin-top:6px;line-height:1.4}
.tier-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:36px}.tier-card{padding:32px;background:var(--panel);border:1px solid var(--border);border-radius:var(--r)}
.tier-card.gold{background:linear-gradient(160deg,rgba(255,215,0,.15),rgba(255,122,182,.08));border-color:rgba(255,215,0,.4)}
.badge{display:inline-block;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:700;background:rgba(255,255,255,.08);color:rgba(255,255,255,.75);margin-bottom:16px}
.earn{font-size:42px;font-weight:800;letter-spacing:-2px;margin:14px 0 6px;background:linear-gradient(135deg,#fff,#ffd700);-webkit-background-clip:text;background-clip:text;color:transparent}
.earn-sub{color:var(--muted);font-size:14px}.tier-card ul{padding-left:20px;color:rgba(255,255,255,.7);font-size:15px;line-height:1.8}
.steps-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:36px}.step-card{padding:24px;background:var(--panel);border:1px solid var(--border);border-radius:var(--r);text-align:center;word-wrap:break-word}
.step-num{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--brand),var(--pink));display:grid;place-items:center;font-size:20px;font-weight:800;margin:0 auto 14px}.step-card h4{font-size:18px;margin-bottom:8px;line-height:1.3}.step-card p{font-size:14px;color:var(--muted);line-height:1.5}
.potential-section{background:linear-gradient(135deg,rgba(124,92,255,.14),rgba(255,122,182,.10),rgba(24,198,184,.10));border:1px solid var(--border);border-radius:32px;padding:48px}
.potential-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:32px}.potential-card{padding:24px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:20px}.potential-card h4{font-size:20px;margin-bottom:14px;line-height:1.3}
.potential-card table{width:100%;font-size:14px;color:rgba(255,255,255,.75)}.potential-card td{padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)}.potential-card td:last-child{text-align:right;font-weight:700;color:#fff}
.prob-bar{margin-top:6px;height:6px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden}.prob-fill{height:100%;border-radius:999px}.prob-label{display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-top:6px}
.calc-section{background:linear-gradient(135deg,rgba(124,92,255,.14),rgba(255,122,182,.10),rgba(24,198,184,.10));border:1px solid var(--border);border-radius:32px;padding:48px}
.calc-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:32px}.calc-input label{display:block;font-size:12px;color:var(--muted);margin-bottom:8px}
.calc-input input,.calc-input select{width:100%;padding:14px 16px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:14px;color:#fff;font-family:inherit;font-size:15px;font-weight:700;outline:none}select option{background:#1a2040}
.calc-output-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:24px}.calc-out-box{padding:20px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);border-radius:16px}.calc-out-box .num{font-size:28px;font-weight:800;letter-spacing:-1px}.calc-out-box .lbl{font-size:12px;color:var(--muted);margin-top:4px;line-height:1.3}
.pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:44px}.price-card{padding:28px;background:var(--panel);border:1px solid var(--border);border-radius:var(--r)}.price-card.hot{background:linear-gradient(160deg,rgba(124,92,255,.20),rgba(255,122,182,.12));border-color:rgba(124,92,255,.45)}
.pill{display:inline-block;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:700;background:linear-gradient(135deg,var(--brand),var(--pink));color:#fff;margin-bottom:18px}.price-card .amount{font-size:46px;font-weight:800;letter-spacing:-2px;margin:8px 0 3px}.price-card .coins{font-size:15px;color:var(--muted);margin-bottom:18px}.price-card ul{padding-left:18px}.price-card li{color:rgba(255,255,255,.65);font-size:13px;line-height:1.6}
.host-visual{background:var(--panel);border:1px solid var(--border);border-radius:32px;overflow:hidden;padding:24px;max-width:720px;margin:0 auto}.host-card{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.10);border-radius:18px;padding:20px;margin-bottom:12px}.host-tag{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.tag{padding:6px 12px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(255,255,255,.08);color:rgba(255,255,255,.75)}.bar-bg{height:6px;background:rgba(255,255,255,.08);border-radius:999px}.bar-fill{height:6px;border-radius:999px;background:linear-gradient(to right,var(--brand),var(--teal))}
.form-section{background:rgba(255,255,255,.03);border-radius:32px;padding:48px;border:1px solid rgba(255,255,255,.07)}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:28px}.form-full{grid-column:1/-1}
input[type=text],input[type=email],input[type=tel],select,textarea{width:100%;padding:14px 16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:14px;color:#fff;font-family:inherit;font-size:14px;outline:none}
input:focus,select:focus,textarea:focus{border-color:var(--brand)}textarea{min-height:110px;resize:vertical}
.form-label{display:block;font-size:12px;color:var(--muted);margin-bottom:6px}
.success-msg{display:none;margin-top:16px;padding:14px 18px;border-radius:14px;background:rgba(88,214,141,.15);border:1px solid rgba(88,214,141,.3);color:#a3f5be}
.error-msg{display:none;margin-top:16px;padding:14px 18px;border-radius:14px;background:rgba(255,90,90,.15);border:1px solid rgba(255,90,90,.3);color:#ffb3b3}
.cta-band{margin:0 6vw 80px;padding:64px 6vw;background:linear-gradient(135deg,rgba(124,92,255,.22),rgba(255,122,182,.16),rgba(24,198,184,.16));border:1px solid rgba(255,255,255,.10);border-radius:32px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}.cta-band h2{font-size:clamp(30px,4vw,48px);max-width:560px}
.legal-hero{padding:64px 6vw 40px;max-width:880px;margin:0 auto;border-bottom:1px solid var(--border)}.legal-content{max-width:880px;margin:0 auto;padding:40px 6vw 80px}
.legal-content h2{font-size:24px;font-weight:800;margin:40px 0 12px;padding-top:12px;border-top:1px solid var(--border)}.legal-content h2:first-of-type{border-top:none;margin-top:0}
.legal-content p{color:rgba(255,255,255,.72);margin-bottom:12px;font-size:15px}.legal-content ul,.legal-content ol{padding-left:20px;color:rgba(255,255,255,.65);font-size:14px;margin-bottom:14px}.legal-content li{margin-bottom:7px;line-height:1.7}
.legal-toc{background:var(--panel);border:1px solid var(--border);border-radius:18px;padding:24px 28px;margin-bottom:44px}.legal-toc h3{font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:12px}.legal-toc ol{padding-left:18px}.legal-toc a{color:rgba(255,255,255,.7);font-size:13px}
.legal-box{background:linear-gradient(135deg,rgba(124,92,255,.12),rgba(24,198,184,.08));border:1px solid rgba(124,92,255,.25);border-radius:14px;padding:18px 22px;margin:20px 0;color:rgba(255,255,255,.8);font-size:15px}
.legal-contact{background:var(--panel);border:1px solid var(--border);border-radius:18px;padding:24px 28px;margin-top:28px}
footer{padding:32px 6vw 48px;border-top:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px}
footer .links{display:flex;gap:22px}footer .links a{color:var(--muted);font-size:14px}footer .links a:hover{color:#fff}
.spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle;margin-right:6px}@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:900px){
.stats-row,.tier-grid,.steps-grid,.potential-grid,.calc-grid,.pricing-grid,.form-grid,.calc-output-row{grid-template-columns:1fr}
.hero-heading{letter-spacing:-1.5px}
.nav-right a:not(:last-child){display:none}
.cta-band,.lang-bar{justify-content:center;text-align:center}
.trust-grid{grid-template-columns:1fr 1fr!important}
.testimonial-grid{grid-template-columns:1fr!important}
.host-cards-grid{grid-template-columns:1fr 1fr!important}
.how-grid{grid-template-columns:1fr!important}
}
@media(max-width:600px){
nav{padding:12px 4vw}
.logo{font-size:17px}.logo svg,.logo img{width:28px;height:28px}
.nav-right{gap:10px}
.lang-bar{padding:8px 4vw;justify-content:center}
.lang-select{font-size:11px}
section{padding:52px 4vw}
.hero{padding:0 4vw 60px;min-height:92vh}
.hero-heading{font-size:clamp(34px,10vw,56px);letter-spacing:-1px}
.hero-eyebrow{font-size:11px;padding:8px 12px}
.hero-sub{font-size:15px;margin-top:18px;margin-bottom:24px}
.hero-actions{flex-direction:column;gap:10px}
.hero-actions .btn{width:100%;text-align:center}
.btn-lg{padding:14px 24px;font-size:15px}
h2{font-size:clamp(26px,8vw,42px);letter-spacing:-1px}
.section-lead{font-size:15px}
.potential-section,.calc-section{padding:28px 18px;border-radius:20px}
.form-section{padding:28px 18px;border-radius:20px}
.cta-band{margin:0 4vw 52px;padding:36px 4vw;border-radius:20px;flex-direction:column;align-items:flex-start}
.cta-band>div:last-child{flex-direction:column;width:100%}
.cta-band>div:last-child .btn{width:100%;text-align:center}
.stats-row{grid-template-columns:1fr 1fr}
.trust-grid{grid-template-columns:1fr 1fr!important}
.testimonial-grid{grid-template-columns:1fr!important}
.stat-box{padding:20px 14px}
.tier-card{padding:22px 18px}
.earn{font-size:34px}
.step-card{padding:18px 14px}
.step-num{width:40px;height:40px;font-size:16px}
.calc-output-row{grid-template-columns:1fr 1fr}
.calc-out-box{padding:14px}
.calc-out-box .num{font-size:22px}
.price-card{padding:22px 18px}
.price-card .amount{font-size:36px}
.pricing-grid{grid-template-columns:1fr}
.host-visual{padding:16px;border-radius:20px}
.host-card{padding:14px}
footer{flex-direction:column;align-items:flex-start;gap:10px;padding:24px 4vw 36px}
footer .links{flex-wrap:wrap;gap:14px}
.legal-hero{padding:40px 4vw 24px}
.legal-content{padding:24px 4vw 52px}
}
</style></head><body><div class="lang-bar">
<select class="lang-select" id="langBarSelect" onchange="switchLang(this.value)">
<option value="en">🌐 English</option>
<option value="hi">🌐 हिंदी</option>
<option value="ta">🌐 தமிழ்</option>
<option value="te">🌐 తెలుగు</option>
<option value="kn">🌐 ಕನ್ನಡ</option>
<option value="ml">🌐 മലയാളം</option>
<option value="bn">🌐 বাংলা</option>
</select>
</div>
<nav>
<a class="logo" href="#home"><img src="/logo.png" alt="Friendoo Logo" />Friendoo</a>
<div class="nav-right"><a href="#features" data-t="nav.features">Features</a><a href="#for-users">For Users</a><a href="#hosts">Hosts</a><a href="#tiers" data-t="nav.tiers">Host Tiers</a><a href="#apply" data-t="nav.apply">Apply</a><a href="#safety-view">Safety</a><a href="#privacy-view">Privacy</a><a href="#terms-view">Terms</a><a class="btn" href="#apply" data-t="nav.join">Join as Host</a></div>
</nav>
<div id="home-view" class="view">
<section class="hero"><div class="hero-bg"></div><div class="hero-content">
<div class="hero-eyebrow"><span></span><span data-t="hero.eyebrow">Female hosts only &middot; Verified IDs &middot; No bots &middot; Real earnings</span></div>
<h1 class="hero-heading">Real conversations<br>with <span class="cycle-wrapper"><span class="cycle-text" id="cycleText"><span>real women</span><span>verified hosts</span><span>weekly earnings</span><span>Friendoo</span><span>real women</span></span></span></h1>
<p class="hero-sub" data-t="hero.sub">Friendoo hosts are verified, actively online, and ranked fairly by language. Call only when the host is available in the app.</p>
<div class="hero-actions"><a class="btn btn-lg" href="#for-users">Start Chatting</a><a class="btn btn-lg btn-outline" href="#apply" data-t="hero.cta1">Join as Host</a></div>
<div style="display:flex;gap:24px;flex-wrap:wrap;margin-top:20px">
<span style="font-size:13px;color:var(--muted)">&#128100; <strong style="color:#fff">Users:</strong> Browse hosts &rarr; Buy coins &rarr; Make an in-app audio call</span>
<span style="font-size:13px;color:var(--muted)">&#9989; <strong style="color:#fff">Hosts:</strong> Apply &rarr; Get verified &rarr; Track completed-call earnings</span>
</div>
</div></section>
<section class="call-story" data-call-story aria-label="A scroll-driven 3D audio call story">
  <div class="call-story-sticky">
    <canvas aria-hidden="true"></canvas>
    <div class="call-story-copy">
      <span class="label">Audio calls, in the app</span>
      <h2>From a call request<br>to a real connection.</h2>
      <p>Scroll through the moment a caller reaches an online host — and the conversation begins only when she accepts.</p>
    </div>
    <div class="call-story-stage" data-call-stage>01 · A caller starts an in-app audio call</div>
    <div class="call-story-hint">Scroll to follow the call</div>
  </div>
</section>
<div class="ticker-wrap"><div class="ticker-track" id="tickerTrack"><span class="ticker-item">Female Hosts Only</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Verified Profiles</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Competitive Earnings</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Earnings Tracking</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Google Play Billing</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">In-app Audio Calls</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Voice Calls</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Verified Profiles</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Safe Platform</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Supabase Ledger</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Female Hosts Only</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Verified Profiles</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Competitive Earnings</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Earnings Tracking</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Google Play Billing</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">In-app Audio Calls</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Voice Calls</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">No Bots Ever</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">ID-Verified Hosts</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">6 Supported Languages</span><span class="ticker-sep">&#10022;</span></div></div>
<section id="features"><span class="label" data-t="features.label">What's inside</span><h2 data-t="features.title">Built for real connections</h2><div class="features-marquee"><div class="features-marquee-inner" id="featInner1"></div><div class="features-marquee-inner" id="featInner2" aria-hidden="true"></div></div></section>
<section><div class="stats-row" id="statsRow"></div></section>
<section id="why-friendoo" style="background:linear-gradient(135deg,rgba(124,92,255,.1),rgba(255,122,182,.08));border:1px solid rgba(124,92,255,.2);border-radius:32px;padding:48px;margin:0 6vw 48px"><span class="label">Why Friendoo is Different</span><h2>We do what other apps don't</h2><p class="section-lead">Most social apps have fake profiles, payment delays, and zero safety. Friendoo is built differently — verified hosts, reviewed calls, and transparent earnings tracking.</p>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:36px" class="trust-grid">
<div style="text-align:center"><div style="font-size:40px;margin-bottom:12px">🪪</div><h4 style="font-size:16px;margin-bottom:8px">ID-Verified Hosts</h4><p style="font-size:13px;color:var(--muted)">Govt. ID + video check. Zero fake accounts.</p></div>
<div style="text-align:center"><div style="font-size:40px;margin-bottom:12px">💸</div><h4 style="font-size:16px;margin-bottom:8px">Earnings Tracking</h4><p style="font-size:13px;color:var(--muted)">Host earnings are tracked after verification. Withdrawals are temporarily unavailable.</p></div>
<div style="text-align:center"><div style="font-size:40px;margin-bottom:12px">🛡️</div><h4 style="font-size:16px;margin-bottom:8px">Safety &amp; Reporting</h4><p style="font-size:13px;color:var(--muted)">Use the in-app report and block controls when you need help.</p></div>
<div style="text-align:center"><div style="font-size:40px;margin-bottom:12px">🌐</div><h4 style="font-size:16px;margin-bottom:8px">Your Language</h4><p style="font-size:13px;color:var(--muted)">6 supported languages: Hindi, Bengali, Telugu, Tamil, Kannada, and Malayalam.</p></div>
</div>

</section>
<section id="tiers"><span class="label" data-t="tiers.label">Host program</span><h2 data-t="tiers.title">Two tiers.<br>More earnings.</h2><p class="section-lead" data-t="tiers.lead">All Friendoo hosts are verified females.</p>
<div class="tier-grid"><div class="tier-card"><span class="badge" data-t="tiers.normal.badge">Normal Host</span><h3 data-t="tiers.normal.title">&#127775; Normal Host</h3><div class="earn">Competitive<span style="font-size:20px;color:var(--muted)"> rate</span></div><div class="earn-sub" data-t="tiers.normal.earnSub">Start here &middot; Build your audience &middot; Upgrade to Star</div><ul id="normalPoints"></ul></div>
<div class="tier-card gold"><span class="badge" style="background:rgba(255,215,0,.2);color:#ffd700" data-t="tiers.star.badge">Star Host</span><h3 data-t="tiers.star.title">&#128081; Star Host</h3><div class="earn" style="background:linear-gradient(135deg,#ffd700,#ffaa00);-webkit-background-clip:text;background-clip:text;color:transparent">Premium<span style="font-size:20px;color:var(--muted)"> rate</span></div><div class="earn-sub" data-t="tiers.star.earnSub">Weekly top 10 per language &middot; Priority matching &middot; Gold badge</div><ul id="starPoints"></ul></div></div>
<div style="margin-top:48px"><span class="label" data-t="steps.label">Upgrade path</span><h2 data-t="steps.title">How to become a Star Host</h2><div class="steps-grid" id="stepsGrid"><div class="step-card"><div class="step-num">1</div><h4>Apply &amp; Verify</h4><p>Submit your application with government ID. We verify within 48 hours.</p></div><div class="step-card"><div class="step-num">2</div><h4>Start as Normal</h4><p>Begin taking calls. Build your rating and profile strength.</p></div><div class="step-card"><div class="step-num">3</div><h4>Hit 4.5★ Rating</h4><p>Maintain a 4.5+ star rating across 100+ calls over 30 days.</p></div><div class="step-card" style="background:linear-gradient(160deg,rgba(255,215,0,.12),rgba(255,122,182,.08));border-color:rgba(255,215,0,.3)"><div class="step-num" style="background:linear-gradient(135deg,#ffd700,#ffaa00)">4</div><h4 style="color:#ffd700">Become Star ⭐</h4><p>Unlock premium rates, priority matching, gold badge &amp; higher visibility.</p></div></div></div></section>
<section><div class="potential-section"><span class="label" data-t="potential.label">Your opportunity</span><h2 data-t="potential.title">Your opportunity</h2><p class="section-lead" data-t="potential.lead">Whether you're looking for a side income or a full-time career, Friendoo gives you the flexibility to earn on your schedule.</p><div class="potential-grid" id="potentialGrid">
<div class="potential-card"><h4>🌟 Normal Host &middot; Part-time</h4><p style="color:var(--muted);font-size:14px;line-height:1.7">Work 2&ndash;3 hours a day, a few days a week. Earn a meaningful side income doing what you love — talking.</p></div>
<div class="potential-card"><h4>🌟 Normal Host &middot; Full-time</h4><p style="color:var(--muted);font-size:14px;line-height:1.7">Commit more hours and build a loyal listener base. Many full-time Normal Hosts earn above minimum wage.</p></div>
<div class="potential-card" style="border-color:rgba(255,215,0,.3)"><h4>👑 Star Host &middot; Part-time</h4><p style="color:var(--muted);font-size:14px;line-height:1.7">Star Hosts earn at a premium rate. Even a few hours a day can translate into impressive monthly income.</p></div>
<div class="potential-card" style="border-color:rgba(255,215,0,.3)"><h4>👑 Star Host &middot; Full-time</h4><p style="color:var(--muted);font-size:14px;line-height:1.7">Our top-performing Star Hosts work full schedules and regularly achieve some of the highest payouts on the platform.</p></div>
</div></div></section>

<section id="for-users" style="padding:56px 6vw">
<span class="label">For Users</span>
<h2>Connect with real people,<br>in your language</h2>
<p class="section-lead">Browse verified hosts, select a supported language, and make an audio call only when the host is online — no subscriptions.</p>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:40px" class="trust-grid">
<div style="background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:28px"><div style="font-size:36px;margin-bottom:12px">🎭</div><h4 style="margin-bottom:8px">Choose your topic</h4><p style="font-size:13px;color:var(--muted);line-height:1.6">Movies, music, travel, life advice — filter hosts by interests and talk about what you love.</p></div>
<div style="background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:28px"><div style="font-size:36px;margin-bottom:12px">🌐</div><h4 style="margin-bottom:8px">Your language, your pace</h4><p style="font-size:13px;color:var(--muted);line-height:1.6">Hindi, Bengali, Telugu, Tamil, Kannada, or Malayalam. Select the language before calling.</p></div>
<div style="background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:28px"><div style="font-size:36px;margin-bottom:12px">🔒</div><h4 style="margin-bottom:8px">100% private</h4><p style="font-size:13px;color:var(--muted);line-height:1.6">Your phone number is never shared. Hosts see only your display name. Block anyone instantly.</p></div>
<div style="background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:28px"><div style="font-size:36px;margin-bottom:12px">✅</div><h4 style="margin-bottom:8px">No fake profiles</h4><p style="font-size:13px;color:var(--muted);line-height:1.6">Every host is ID-verified with government ID + video check. What you see is real.</p></div>
<div style="background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:28px"><div style="font-size:36px;margin-bottom:12px">🪙</div><h4 style="margin-bottom:8px">Pay only what you use</h4><p style="font-size:13px;color:var(--muted);line-height:1.6">Buy coins, spend as you go. No monthly subscription. Coins never expire. Starting &#8377;29.</p></div>
<div style="background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:28px"><div style="font-size:36px;margin-bottom:12px">🛡️</div><h4 style="margin-bottom:8px">Safe &amp; moderated</h4><p style="font-size:13px;color:var(--muted);line-height:1.6">Report a problem in the app. Calls are audio-only and host availability is in-app only.</p></div>
</div>
<div style="margin-top:52px">
<span class="label">Getting started</span>
<h2>Start talking in 3 minutes</h2>
<div class="steps-grid" style="margin-top:32px">
<div class="step-card"><div class="step-num">1</div><h4>Download App</h4><p>Get Friendoo on Android or iOS. Sign up with your phone number in under 2 minutes.</p></div>
<div class="step-card"><div class="step-num">2</div><h4>Buy Coins</h4><p>Choose a coin pack in the app. Android purchases use Google Play Billing, and Supabase verifies the purchase before crediting your wallet.</p></div>
<div class="step-card"><div class="step-num">3</div><h4>Browse Hosts</h4><p>Filter by language, interest, and star rating. Read profiles. Every host is real and verified.</p></div>
<div class="step-card" style="background:linear-gradient(160deg,rgba(124,92,255,.12),rgba(24,198,184,.08));border-color:rgba(124,92,255,.3)"><div class="step-num" style="background:linear-gradient(135deg,var(--brand),var(--teal))">4</div><h4 style="color:var(--teal)">Audio Call</h4><p>Start chatting or request a voice call. Pay per minute, stop anytime. No commitments.</p></div>
</div>
</div>
<div style="margin-top:52px;background:linear-gradient(135deg,rgba(124,92,255,.12),rgba(255,122,182,.08));border:1px solid rgba(124,92,255,.25);border-radius:28px;padding:40px">
<span class="label">Coin Packs</span>
<h2>Simple, transparent pricing</h2>
<p class="section-lead" style="margin-bottom:32px">Buy coins once, use them whenever you want. No subscription. Coins never expire.</p>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">
<div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.10);border-radius:18px;padding:20px;text-align:center"><div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Starter</div><div style="font-size:36px;font-weight:800;letter-spacing:-1px">&#8377;99</div><div style="color:var(--teal);font-size:15px;font-weight:700;margin:6px 0">100 coins</div><div style="font-size:11px;color:var(--muted);margin-bottom:16px">20 normal-host minutes</div></div>
<div style="background:linear-gradient(160deg,rgba(124,92,255,.22),rgba(255,122,182,.14));border:2px solid rgba(124,92,255,.55);border-radius:18px;padding:20px;text-align:center;position:relative"><div style="position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,var(--brand),var(--pink));color:#fff;padding:3px 11px;border-radius:999px;font-size:10px;font-weight:700;white-space:nowrap">POPULAR</div><div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Value</div><div style="font-size:36px;font-weight:800;letter-spacing:-1px">&#8377;499</div><div style="color:var(--brand);font-size:15px;font-weight:700;margin:6px 0">550 coins</div><div style="font-size:11px;color:var(--muted);margin-bottom:16px">110 normal-host minutes</div></div>
<div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,215,0,.3);border-radius:18px;padding:20px;text-align:center"><div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Premium</div><div style="font-size:36px;font-weight:800;letter-spacing:-1px">&#8377;999</div><div style="color:#ffd700;font-size:15px;font-weight:700;margin:6px 0">1,200 coins</div><div style="font-size:11px;color:var(--muted);margin-bottom:16px">240 normal-host minutes</div></div>
</div>
<p style="text-align:center;color:var(--muted);font-size:13px;margin-top:18px">Google Play Billing on Android &nbsp;&middot;&nbsp; &#9989; Supabase verification &nbsp;&middot;&nbsp; &#9989; Coins never expire</p>
</div>
</section>
<section id="hosts"><span class="label" data-t="hosts.label">Verified hosts</span><h2 data-t="hosts.title">Meet our hosts</h2><p class="section-lead">Example host profiles. Current availability and Star status are shown in the app.</p><div id="hostVisual" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:36px" class="host-cards-grid"><div style="background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:24px"><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#7c5cff,#ff7ab6);flex-shrink:0"></div><div style="flex:1"><strong>Meera S.</strong><div style="font-size:12px;color:var(--muted)">Delhi · ⭐ 4.9</div></div><span style="padding:4px 10px;border-radius:999px;background:rgba(255,215,0,.2);color:#ffd700;font-size:11px;font-weight:700">STAR</span></div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px"><span class="tag">Hindi</span><span class="tag">Movies</span><span class="tag">Lifestyle</span></div></div><div style="background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:24px"><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#18c6b8,#7c5cff);flex-shrink:0"></div><div style="flex:1"><strong>Divya R.</strong><div style="font-size:12px;color:var(--muted)">Bangalore · ⭐ 4.8</div></div><span style="padding:4px 10px;border-radius:999px;background:rgba(255,215,0,.2);color:#ffd700;font-size:11px;font-weight:700">STAR</span></div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px"><span class="tag">Kannada</span><span class="tag">Music</span><span class="tag">Travel</span></div></div><div style="background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:24px"><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#ff7ab6,#ffd700);flex-shrink:0"></div><div style="flex:1"><strong>Priya K.</strong><div style="font-size:12px;color:var(--muted)">Mumbai · ⭐ 4.9</div></div><span style="padding:4px 10px;border-radius:999px;background:rgba(255,215,0,.2);color:#ffd700;font-size:11px;font-weight:700">STAR</span></div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px"><span class="tag">Hindi</span><span class="tag">Bollywood</span><span class="tag">Cooking</span></div></div><div style="background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:24px"><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#7c5cff,#18c6b8);flex-shrink:0"></div><div style="flex:1"><strong>Sneha T.</strong><div style="font-size:12px;color:var(--muted)">Chennai · ⭐ 4.7</div></div><span style="padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.1);color:rgba(255,255,255,.7);font-size:11px;font-weight:700">NORMAL</span></div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px"><span class="tag">Tamil</span><span class="tag">Books</span><span class="tag">Fitness</span></div></div><div style="background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:24px"><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#ff7ab6,#7c5cff);flex-shrink:0"></div><div style="flex:1"><strong>Ananya R.</strong><div style="font-size:12px;color:var(--muted)">Hyderabad · ⭐ 4.6</div></div><span style="padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.1);color:rgba(255,255,255,.7);font-size:11px;font-weight:700">NORMAL</span></div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px"><span class="tag">Telugu</span><span class="tag">Art</span><span class="tag">Dance</span></div></div><div style="background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:24px"><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#18c6b8,#ff7ab6);flex-shrink:0"></div><div style="flex:1"><strong>Fatima N.</strong><div style="font-size:12px;color:var(--muted)">Lucknow · ⭐ 4.8</div></div><span style="padding:4px 10px;border-radius:999px;background:rgba(255,215,0,.2);color:#ffd700;font-size:11px;font-weight:700">STAR</span></div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px"><span class="tag">Bengali</span><span class="tag">Poetry</span><span class="tag">Culture</span></div></div></div><div style="margin-top:28px;text-align:center"><a class="btn" href="#apply">Join verified hosts →</a></div></section>
<section id="testimonials" style="background:linear-gradient(135deg,rgba(255,122,182,.08),rgba(124,92,255,.06));border:1px solid rgba(255,122,182,.2);border-radius:32px;padding:48px;margin:0 6vw 48px">
<span class="label">Success Stories</span>
<h2>What people say</h2>
<p style="color:var(--muted);font-size:15px;margin-top:12px;margin-bottom:8px">From hosts who earn, and users who connect.</p>
<div style="display:flex;gap:12px;margin-top:16px;margin-bottom:28px">
  <span style="padding:6px 16px;border-radius:999px;background:rgba(255,215,0,.15);color:#ffd700;font-size:12px;font-weight:700">&#127775; Host Stories</span>
  <span style="padding:6px 16px;border-radius:999px;background:rgba(124,92,255,.15);color:#a89cff;font-size:12px;font-weight:700">&#128100; User Stories</span>
</div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px" class="testimonial-grid">
<div style="background:var(--panel);border:1px solid rgba(255,215,0,.2);border-radius:20px;padding:28px"><div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#ffd700;margin-bottom:10px">&#127775; HOST</div><div style="font-size:20px;color:#ffd700;margin-bottom:12px">&#9733;&#9733;&#9733;&#9733;&#9733;</div><p style="font-size:14px;line-height:1.7;color:rgba(255,255,255,.8);margin-bottom:16px">&ldquo;I earn &#8377;15,000&ndash;20,000 monthly working just 3 hours a day. Friendoo changed my life!&rdquo;</p><div style="display:flex;align-items:center;gap:12px"><div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#ffd700,#ff7ab6)"></div><div><strong style="font-size:14px">Priya K.</strong><div style="font-size:12px;color:var(--muted)">Star Host &middot; Hindi</div></div></div></div>
<div style="background:var(--panel);border:1px solid rgba(124,92,255,.2);border-radius:20px;padding:28px"><div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#a89cff;margin-bottom:10px">&#128100; USER</div><div style="font-size:20px;color:#ffd700;margin-bottom:12px">&#9733;&#9733;&#9733;&#9733;&#9733;</div><p style="font-size:14px;line-height:1.7;color:rgba(255,255,255,.8);margin-bottom:16px">&ldquo;I love being able to talk in Tamil with real people, not bots. Makes my evenings so much better.&rdquo;</p><div style="display:flex;align-items:center;gap:12px"><div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--brand),var(--teal))"></div><div><strong style="font-size:14px">Karthik S.</strong><div style="font-size:12px;color:var(--muted)">User &middot; Tamil Nadu</div></div></div></div>
<div style="background:var(--panel);border:1px solid rgba(255,215,0,.2);border-radius:20px;padding:28px"><div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#ffd700;margin-bottom:10px">&#127775; HOST</div><div style="font-size:20px;color:#ffd700;margin-bottom:12px">&#9733;&#9733;&#9733;&#9733;&#9733;</div><p style="font-size:14px;line-height:1.7;color:rgba(255,255,255,.8);margin-bottom:16px">&ldquo;Weekly UPI payments are always on time. Best platform for female hosts in India!&rdquo;</p><div style="display:flex;align-items:center;gap:12px"><div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#18c6b8,#7c5cff)"></div><div><strong style="font-size:14px">Shreya M.</strong><div style="font-size:12px;color:var(--muted)">Star Host &middot; Telugu</div></div></div></div>
<div style="background:var(--panel);border:1px solid rgba(124,92,255,.2);border-radius:20px;padding:28px"><div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#a89cff;margin-bottom:10px">&#128100; USER</div><div style="font-size:20px;color:#ffd700;margin-bottom:12px">&#9733;&#9733;&#9733;&#9733;&#9733;</div><p style="font-size:14px;line-height:1.7;color:rgba(255,255,255,.8);margin-bottom:16px">&ldquo;The coin system is transparent. I know exactly what I spend. No hidden charges &mdash; finally an honest app!&rdquo;</p><div style="display:flex;align-items:center;gap:12px"><div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--pink),var(--brand))"></div><div><strong style="font-size:14px">Rahul M.</strong><div style="font-size:12px;color:var(--muted)">User &middot; Mumbai</div></div></div></div>
<div style="background:var(--panel);border:1px solid rgba(255,215,0,.2);border-radius:20px;padding:28px"><div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#ffd700;margin-bottom:10px">&#127775; HOST</div><div style="font-size:20px;color:#ffd700;margin-bottom:12px">&#9733;&#9733;&#9733;&#9733;&#9733;</div><p style="font-size:14px;line-height:1.7;color:rgba(255,255,255,.8);margin-bottom:16px">&ldquo;As a student, this helps me pay my fees. The verification was quick and professional.&rdquo;</p><div style="display:flex;align-items:center;gap:12px"><div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--brand),var(--pink))"></div><div><strong style="font-size:14px">Ananya R.</strong><div style="font-size:12px;color:var(--muted)">Normal Host &middot; Tamil</div></div></div></div>
<div style="background:var(--panel);border:1px solid rgba(124,92,255,.2);border-radius:20px;padding:28px"><div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#a89cff;margin-bottom:10px">&#128100; USER</div><div style="font-size:20px;color:#ffd700;margin-bottom:12px">&#9733;&#9733;&#9733;&#9733;&#9733;</div><p style="font-size:14px;line-height:1.7;color:rgba(255,255,255,.8);margin-bottom:16px">&ldquo;Chatting with Divya R. in Kannada felt like talking to a real friend. I come back every week.&rdquo;</p><div style="display:flex;align-items:center;gap:12px"><div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--teal),var(--brand))"></div><div><strong style="font-size:14px">Suresh P.</strong><div style="font-size:12px;color:var(--muted)">User &middot; Bangalore</div></div></div></div>
</div>
</section>
<section id="apply"><div class="form-section">
<span class="label" data-t="form.label">Join as Host</span><h2 data-t="form.title">Apply to become a Friendoo host</h2>
<p class="section-lead" data-t="form.lead">Only female applicants accepted. Our team will review your application within 48 hours.</p>
<div style="background:rgba(255,122,182,.1);border:1px solid rgba(255,122,182,.3);border-radius:14px;padding:16px 20px;margin:20px 0;color:rgba(255,255,255,.85);font-size:14px">&#128161; Host earnings start only after verification. Withdrawals are currently unavailable while Friendoo selects a replacement payout service.</div>
<form class="form-grid" id="hostForm">
<div><label class="form-label" data-t="form.field.name">Full name</label><input type="text" name="name" placeholder="Your full name" required></div>
<div><label class="form-label">Phone / WhatsApp</label><input type="tel" name="phone" placeholder="+91XXXXXXXXXX" required></div>
<div><label class="form-label">Age</label><input type="number" name="age" min="18" max="60" placeholder="e.g. 23" required></div>
<div><label class="form-label">Location (City)</label><input type="text" name="city" placeholder="e.g. Mumbai, Chennai, Bengaluru" required></div>
<div class="form-full"><label class="form-label" data-t="form.field.lang">Languages you can speak (select all that apply)</label><div id="langCheckboxes" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:6px">
<label style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:10px;padding:8px 14px;cursor:pointer;font-size:14px"><input type="checkbox" name="language" value="hi" style="width:auto"> हिंदी</label>
<label style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:10px;padding:8px 14px;cursor:pointer;font-size:14px"><input type="checkbox" name="language" value="bn" style="width:auto"> বাংলা</label>
<label style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:10px;padding:8px 14px;cursor:pointer;font-size:14px"><input type="checkbox" name="language" value="te" style="width:auto"> తెలుగు</label>
<label style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:10px;padding:8px 14px;cursor:pointer;font-size:14px"><input type="checkbox" name="language" value="ta" style="width:auto"> தமிழ்</label>
<label style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:10px;padding:8px 14px;cursor:pointer;font-size:14px"><input type="checkbox" name="language" value="kn" style="width:auto"> ಕನ್ನಡ</label>
<label style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:10px;padding:8px 14px;cursor:pointer;font-size:14px"><input type="checkbox" name="language" value="ml" style="width:auto"> മലയാളം</label>
</div></div>
<div class="form-full"><label class="form-label" data-t="form.field.about">Why do you want to join as a host?</label><textarea name="about" placeholder="I love talking about movies and music&#8230;"></textarea></div>
<div class="form-full"><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px"><input type="checkbox" id="confirm" required style="width:auto"><label for="confirm" style="display:inline;color:rgba(255,255,255,.7);font-size:14px" data-t="form.confirm">I confirm I am 18+ female and agree to the Terms of Service and Privacy Policy</label></div>
<button type="submit" class="btn btn-lg" id="submitBtn" style="width:100%;text-align:center;border-radius:14px" data-t="form.submit">Submit application</button>
<div class="success-msg" id="successMsg">&#9989; Application received! Our team will review your profile and contact you on WhatsApp within 48 hours.</div>
<div class="error-msg" id="errorMsg">&#10060; Something went wrong. Please try again or contact <a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="8ffcfaffffe0fdfbcfe9fde6eae1ebe0e0a1eeffff">[email&#160;protected]</a></div>
</div></form></div></section>
<section id="faq" style="padding:56px 6vw">
<span class="label">Common Questions</span>
<h2>Frequently Asked Questions</h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:36px;max-width:1100px" class="tier-grid">
<div>
<p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:var(--brand);font-weight:700;margin-bottom:16px">&#128100; For Users</p>
<div style="background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:22px;margin-bottom:14px"><h4 style="font-size:15px;margin-bottom:10px;color:#fff">How do I get started as a user?</h4><p style="font-size:13px;color:var(--muted);line-height:1.6">Download the Friendoo app, create a free account, buy a coin pack from &#8377;99, and start browsing verified hosts instantly.</p></div>
<div style="background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:22px;margin-bottom:14px"><h4 style="font-size:15px;margin-bottom:10px;color:#fff">How do coins work?</h4><p style="font-size:13px;color:var(--muted);line-height:1.6">Coins are the in-app currency. Buy packs from &#8377;99. Spend per minute during chats and calls. Coins never expire and unused coins are refundable.</p></div>
<div style="background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:22px;margin-bottom:14px"><h4 style="font-size:15px;margin-bottom:10px;color:#fff">What can I talk about?</h4><p style="font-size:13px;color:var(--muted);line-height:1.6">Anything you like &mdash; movies, music, travel, daily life, career advice, language practice. Hosts have interest tags so you can find the right match.</p></div>
<div style="background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:22px"><h4 style="font-size:15px;margin-bottom:10px;color:#fff">Is my privacy protected?</h4><p style="font-size:13px;color:var(--muted);line-height:1.6">Yes. Your phone number is never shared. Hosts see only your display name. You can block or report any host in 2 taps.</p></div>
</div>
<div>
<p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#ffd700;font-weight:700;margin-bottom:16px">&#127775; For Hosts</p>
<div style="background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:22px;margin-bottom:14px"><h4 style="font-size:15px;margin-bottom:10px;color:#fff">Who can become a Friendoo host?</h4><p style="font-size:13px;color:var(--muted);line-height:1.6">Only verified females 18+ can apply. We verify identity via government ID and video verification for safety.</p></div>
<div style="background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:22px;margin-bottom:14px"><h4 style="font-size:15px;margin-bottom:10px;color:#fff">How much can I earn?</h4><p style="font-size:13px;color:var(--muted);line-height:1.6">Normal hosts initially earn ₹2.50 per completed minute. Star hosts earn ₹4.00 per completed minute while they are in the weekly top 10 for that language.</p></div>
<div style="background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:22px;margin-bottom:14px"><h4 style="font-size:15px;margin-bottom:10px;color:#fff">When and how do I get paid?</h4><p style="font-size:13px;color:var(--muted);line-height:1.6">Host earnings are tracked after verification. Withdrawals are currently unavailable while Friendoo selects a replacement payout service.</p></div>
<div style="background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:22px"><h4 style="font-size:15px;margin-bottom:10px;color:#fff">What languages are supported?</h4><p style="font-size:13px;color:var(--muted);line-height:1.6">Hindi, Tamil, Telugu, Kannada, Malayalam, and Urdu. Host and earn in your native language!</p></div>
</div>
</div>
</section>
<div class="cta-band"><div><h2>Join Friendoo today</h2><p style="color:var(--muted);margin-top:10px;font-size:15px">Whether you want real conversations or real earnings &mdash; Friendoo has a place for you.</p></div><div style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn-lg" href="#for-users">Start Chatting</a><a class="btn btn-lg" href="#apply" style="background:linear-gradient(135deg,#ffd700,#ffaa00);color:#000">Join as Host</a><a class="btn btn-lg btn-outline" href="/cdn-cgi/l/email-protection#85f6f0f5f5eaf7f1c5e3f7ece0ebe1eaeaabe4f5f5">Contact us</a></div></div>
</div><div id="privacy-view" class="view"><div class="legal-hero">
  <div class="label">Legal</div>
  <h1 style="font-size:clamp(32px,5vw,56px);font-weight:800;letter-spacing:-1.5px;line-height:1.1">Privacy Policy</h1>
  <p style="color:var(--muted);margin-top:12px;font-size:15px">Last updated: May 2026 &nbsp;&middot;&nbsp; Friendoo Platform operated by [Your Company Name] (&ldquo;Company&rdquo;)</p>
</div>
<div class="legal-content">
  <div class="legal-toc">
    <h3>Table of Contents</h3>
    <ol><li><a href="#pp1">Information We Collect</a></li><li><a href="#pp2">How We Use Your Information</a></li><li><a href="#pp3">Information Sharing</a></li><li><a href="#pp4">Data Security</a></li><li><a href="#pp5">Your Rights</a></li><li><a href="#pp6">Cookies &amp; Tracking</a></li><li><a href="#pp7">Children&rsquo;s Privacy</a></li><li><a href="#pp8">Grievance Officer</a></li><li><a href="#pp9">Changes to This Policy</a></li></ol>
  </div>
  <div class="legal-box">By using Friendoo, you agree to this Privacy Policy. If you do not agree, please do not use the platform.</div>
  <h2 id="pp1">1. Information We Collect</h2>
  <p>When you use Friendoo, we collect the following categories of information:</p>
  <ul>
    <li><strong>Account information:</strong> Phone number (used for OTP login), display name, profile photo, and language preferences.</li>
    <li><strong>Host information:</strong> Government-issued ID documents submitted during host verification. These are used solely for identity verification and are stored securely.</li>
    <li><strong>Usage data:</strong> Call duration, coin transactions, app activity logs, and interaction history.</li>
    <li><strong>Device information:</strong> Device model, OS version, IP address, and unique device identifiers.</li>
    <li><strong>Communications:</strong> Reports, support tickets, and any messages sent to our team.</li>
  </ul>
  <h2 id="pp2">2. How We Use Your Information</h2>
  <p>We use your information to:</p>
  <ul>
    <li>Provide, maintain and improve the Friendoo platform</li>
    <li>Verify host identities and ensure platform safety</li>
    <li>Process coin purchases and host payouts</li>
    <li>Send transactional notifications (OTP, payment confirmation, etc.)</li>
    <li>Detect, prevent and investigate fraud or abuse</li>
    <li>Respond to support requests and disputes</li>
    <li>Comply with applicable laws and regulations in India</li>
  </ul>
  <h2 id="pp3">3. Information Sharing</h2>
  <p>We do <strong>not sell</strong> your personal data. We share data only in these limited circumstances:</p>
  <ul>
    <li><strong>Service providers:</strong> Trusted third parties (payment processors, cloud storage, communication APIs) who process data only on our behalf and under strict confidentiality.</li>
    <li><strong>Legal compliance:</strong> When required by law, court order, or government authority.</li>
    <li><strong>Safety:</strong> To protect the rights, safety, or property of Friendoo or its users.</li>
    <li><strong>Business transfers:</strong> In the event of a merger or acquisition, subject to the same privacy commitments.</li>
  </ul>
  <p>Host identity documents are <strong>never shared</strong> with users or other hosts.</p>
  <h2 id="pp4">4. Data Security</h2>
  <p>We implement industry-standard security measures including encrypted data storage, secure HTTPS transmission, and access controls. However, no method of transmission over the internet is 100% secure. We encourage you to use a strong PIN and keep your device secure.</p>
  <h2 id="pp5">5. Your Rights</h2>
  <p>Under applicable Indian law (including IT Act 2000 and DPDP Act 2023), you have the right to:</p>
  <ul>
    <li>Access and review your personal data</li>
    <li>Correct inaccurate information</li>
    <li>Request deletion of your account and associated data</li>
    <li>Withdraw consent where processing is consent-based</li>
    <li>Raise a grievance with our Grievance Officer</li>
  </ul>
  <p>To exercise these rights, email us at <strong><a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="bececcd7c8dfddc7fed8ccd7dbd0dad1d190d7d0">[email&#160;protected]</a></strong>.</p>
  <h2 id="pp6">6. Cookies &amp; Tracking</h2>
  <p>Our web platform uses essential cookies for session management and analytics. We do not use third-party advertising cookies. You may disable cookies in your browser settings, though some features may not work correctly.</p>
  <h2 id="pp7">7. Children&rsquo;s Privacy</h2>
  <p>Friendoo is intended for users aged <strong>18 and above</strong>. We do not knowingly collect data from minors. If you believe a minor has created an account, contact us immediately at <a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="89f9fbe0ffe8eaf0c9effbe0ece7ede6e6a7e0e7">[email&#160;protected]</a>.</p>
  <h2 id="pp8">8. Grievance Officer</h2>
  <div class="legal-contact">
    <p><strong>Grievance Officer:</strong> [Name]</p>
    <p><strong>Email:</strong> <a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="fa9d88939f8c9b94999fba9c88939f949e9595d49394">[email&#160;protected]</a></p>
    <p><strong>Address:</strong> [Registered Office Address, India]</p>
    <p style="margin-top:10px;font-size:13px;color:var(--muted)">We will acknowledge your grievance within 48 hours and resolve it within 30 days as per applicable law.</p>
  </div>
  <h2 id="pp9">9. Changes to This Policy</h2>
  <p>We may update this Privacy Policy from time to time. We will notify you of material changes via in-app notification or email. Continued use of Friendoo after changes constitutes acceptance of the updated policy.</p>
</div></div>
<div id="terms-view" class="view"><div class="legal-hero">
  <div class="label">Legal</div>
  <h1 style="font-size:clamp(32px,5vw,56px);font-weight:800;letter-spacing:-1.5px;line-height:1.1">Terms &amp; Conditions</h1>
  <p style="color:var(--muted);margin-top:12px;font-size:15px">Last updated: May 2026 &nbsp;&middot;&nbsp; Please read these terms carefully before using Friendoo.</p>
</div>
<div class="legal-content">
  <div class="legal-toc">
    <h3>Table of Contents</h3>
    <ol><li><a href="#tc1">Acceptance of Terms</a></li><li><a href="#tc2">Eligibility</a></li><li><a href="#tc3">User Accounts</a></li><li><a href="#tc4">Coins &amp; Payments</a></li><li><a href="#tc5">Host Terms</a></li><li><a href="#tc6">Prohibited Conduct</a></li><li><a href="#tc7">Content Policy</a></li><li><a href="#tc8">Termination</a></li><li><a href="#tc9">Disclaimer &amp; Liability</a></li><li><a href="#tc10">Governing Law</a></li><li><a href="#tc11">Contact</a></li></ol>
  </div>
  <div class="legal-box">These Terms constitute a legally binding agreement between you and Friendoo. By using the platform, you agree to these Terms.</div>
  <h2 id="tc1">1. Acceptance of Terms</h2>
  <p>By accessing or using Friendoo (&ldquo;Platform&rdquo;, &ldquo;Service&rdquo;), you agree to be bound by these Terms &amp; Conditions and our Privacy Policy. If you do not agree, you must not use the Platform.</p>
  <h2 id="tc2">2. Eligibility</h2>
  <ul>
    <li>You must be at least <strong>18 years of age</strong> to use Friendoo.</li>
    <li>You must be a resident of India and have a valid Indian mobile number.</li>
    <li>You must not be prohibited from using the Service under applicable law.</li>
    <li>Hosts must additionally pass our identity verification process.</li>
  </ul>
  <h2 id="tc3">3. User Accounts</h2>
  <p>You are responsible for maintaining the confidentiality of your account. You must not share your OTP or account access with others. You agree to notify us immediately of any unauthorized use of your account at <strong><a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="b9caccc9c9d6cbcdf9dfcbd0dcd7ddd6d697d0d7">[email&#160;protected]</a></strong>.</p>
  <h2 id="tc4">4. Coins &amp; Payments</h2>
  <ul>
    <li>Coins are the virtual currency used on Friendoo. They have no cash value outside the platform.</li>
    <li>Coin purchases are <strong>non-refundable</strong> unless required by applicable law.</li>
    <li>Coins are deducted in real time during calls. The per-minute rate is displayed before you connect.</li>
    <li>Unused coins do not expire.</li>
    <li>All payments are processed securely. We do not store card or UPI credentials.</li>
    <li>Friendoo reserves the right to modify coin pack pricing with reasonable notice.</li>
  </ul>
  <h2 id="tc5">5. Host Terms</h2>
  <ul>
    <li>Hosts must be female, aged 18 or above, and provide valid government-issued ID.</li>
    <li>Hosts must not misrepresent their identity, age, or location.</li>
    <li>Host payouts are processed weekly, subject to meeting minimum threshold requirements.</li>
    <li>Friendoo reserves the right to withhold payouts pending fraud investigation.</li>
    <li>Host accounts may be terminated for policy violations without prior notice.</li>
    <li>Hosts must maintain professional conduct and adhere to our Community Guidelines at all times.</li>
  </ul>
  <h2 id="tc6">6. Prohibited Conduct</h2>
  <p>You must not:</p>
  <ul>
    <li>Use the Platform for any illegal purpose or in violation of applicable law</li>
    <li>Harass, abuse, threaten, or stalk any host or user</li>
    <li>Attempt to contact hosts outside the Platform</li>
    <li>Share or solicit explicit sexual content</li>
    <li>Create fake accounts or impersonate others</li>
    <li>Attempt to circumvent the coin system or platform payments</li>
    <li>Use automated bots or scripts on the Platform</li>
    <li>Reverse engineer or exploit platform vulnerabilities</li>
  </ul>
  <h2 id="tc7">7. Content Policy</h2>
  <p>All conversations must remain within legal and community standards. Friendoo reserves the right to monitor, review, and remove content or suspend accounts that violate our Community Guidelines. Repeated violations may result in permanent bans and referral to law enforcement.</p>
  <h2 id="tc8">8. Termination</h2>
  <p>We may suspend or terminate your account at any time for violation of these Terms, with or without notice. Upon termination, unused coins may be forfeited unless otherwise required by law. You may delete your account at any time via the app settings.</p>
  <h2 id="tc9">9. Disclaimer &amp; Limitation of Liability</h2>
  <p>The Platform is provided &ldquo;as is&rdquo; without warranties of any kind. Friendoo does not guarantee uninterrupted service, and is not liable for any indirect, incidental, or consequential damages arising from use of the Platform. Our total liability shall not exceed the amount you paid to us in the 30 days preceding the claim.</p>
  <h2 id="tc10">10. Governing Law</h2>
  <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in [City], India. We encourage you to contact us first to resolve any dispute amicably.</p>
  <h2 id="tc11">11. Contact Us</h2>
  <div class="legal-contact">
    <p><strong>Email:</strong> <a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="2a464f4d4b466a4c58434f444e4545044344">[email&#160;protected]</a></p>
    <p><strong>Support:</strong> <a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="cbb8bebbbba4b9bf8badb9a2aea5afa4a4e5a2a5">[email&#160;protected]</a></p>
    <p><strong>Address:</strong> [Registered Office Address, India]</p>
  </div>
</div></div>
<div id="refund-view" class="view"><div class="legal-hero"><span class="label">Legal</span><h1>Refund &amp; Cancellation Policy</h1><p style="color:var(--muted);font-size:14px">Effective date: 6 May 2026 &nbsp;&bull;&nbsp; Last updated: 9 May 2026</p></div><div class="legal-content">
<div class="legal-box"><strong>Summary:</strong> Coins are generally non-refundable. However, we offer refunds in specific situations like failed transactions or technical errors. Contact us within 7 days.</div>
<div class="legal-toc"><h3>Table of Contents</h3><ol><li><a href="#r1">General policy</a></li><li><a href="#r2">Eligible refund situations</a></li><li><a href="#r3">Non-refundable situations</a></li><li><a href="#r4">How to claim a refund</a></li><li><a href="#r5">Processing time</a></li><li><a href="#r6">Host earnings</a></li><li><a href="#r7">Contact</a></li></ol></div>
<h2 id="r1">1. General policy</h2><p>All coin purchases on Friendoo are final and non-refundable, except in the specific situations listed below. By purchasing coins you acknowledge this policy. We are committed to a fair resolution process for all disputes.</p>
<h2 id="r2">2. Eligible refund situations</h2><ul><li><strong>Failed transaction:</strong> Your account was charged but coins were not credited. Refund issued within 5–7 business days.</li><li><strong>Duplicate charge:</strong> You were charged more than once for the same transaction.</li><li><strong>Technical error:</strong> A platform bug caused coins to be deducted incorrectly during a call or chat.</li><li><strong>Unauthorised transaction:</strong> A charge occurred without your knowledge due to account compromise (must be reported within 48 hours).</li><li><strong>First-time buyer guarantee:</strong> If you are unsatisfied with your first coin purchase, contact us within 7 days for a full refund — no questions asked.</li></ul>
<h2 id="r3">3. Non-refundable situations</h2><ul><li>Coins already spent on calls or chats.</li><li>Buyer's remorse (change of mind after purchase).</li><li>Account suspension due to policy violations.</li><li>Expired coins (after 12 months of inactivity).</li><li>Refund requests made more than 7 days after purchase.</li></ul>
<h2 id="r4">4. How to claim a refund</h2><ol><li>Email <a href="/cdn-cgi/l/email-protection#7b080e0b0b14090f3b1d09121e151f1414551a0b0b"><span class="__cf_email__" data-cfemail="f4878184849b8680b492869d919a909b9bda958484">[email&#160;protected]</span></a> with subject line: <strong>"Refund Request - [Your registered phone/email]"</strong>.</li><li>Include: transaction ID or order ID, date of purchase, amount, and reason for refund.</li><li>Our team will respond within 2 business days.</li><li>Approved refunds are processed to the original payment method.</li></ol>
<h2 id="r5">5. Processing time</h2><ul><li>UPI refunds: 2–5 business days.</li><li>Credit/Debit card refunds: 5–10 business days (depending on your bank).</li><li>Net banking: 3–7 business days.</li></ul>
<h2 id="r6">6. Host earnings</h2><p>Host earnings are calculated based on completed call minutes and paid weekly. Earnings from completed sessions are <strong>non-reversible</strong>. In cases of confirmed fraud or policy violation by a host, earnings may be withheld pending investigation.</p>
<h2 id="r7">7. Contact</h2><div class="legal-contact"><h3>Refund Support</h3><p>Email: <a href="/cdn-cgi/l/email-protection#27545257574855536741554e424943484809465757"><span class="__cf_email__" data-cfemail="34474144445b46407452465d515a505b5b1a554444">[email&#160;protected]</span></a><br>Subject: "Refund Request"<br>Response: Within 2 business days.</p></div>
</div></div>
<div id="guidelines-view" class="view"><div class="legal-hero"><span class="label">Legal</span><h1>Community Guidelines</h1><p style="color:var(--muted);font-size:14px">Effective date: 6 May 2026 &nbsp;&bull;&nbsp; Last updated: 9 May 2026</p></div><div class="legal-content">
<div class="legal-box"><strong>Our promise:</strong> Friendoo is built for genuine, respectful conversations. These guidelines protect every user and every host on the platform.</div>
<div class="legal-toc"><h3>Table of Contents</h3><ol><li><a href="#g1">Our values</a></li><li><a href="#g2">For all users</a></li><li><a href="#g3">For hosts</a></li><li><a href="#g4">Zero tolerance</a></li><li><a href="#g5">Consequences</a></li><li><a href="#g6">How to report</a></li><li><a href="#g7">Appeals</a></li></ol></div>
<h2 id="g1">1. Our values</h2><p>Friendoo is a safe space for authentic human connection. We believe everyone deserves to be treated with dignity. Our community is built on respect, honesty, and mutual care.</p>
<h2 id="g2">2. For all users</h2><ul><li><strong>Be respectful:</strong> Treat hosts as real people. No insults, degrading comments, or verbal abuse.</li><li><strong>Be honest:</strong> Use your real identity. No fake profiles, impersonation, or misleading information.</li><li><strong>Keep it safe:</strong> Do not share your personal phone number, social media handles, or home address in calls or chat.</li><li><strong>No solicitation:</strong> Do not attempt to pay or meet hosts outside the app. This results in an immediate ban.</li><li><strong>No explicit content:</strong> Friendoo is not an adult platform. Sexual content, requests, or conversations are prohibited.</li><li><strong>No recording:</strong> Do not record, screenshot, or distribute any conversation without explicit consent.</li></ul>
<h2 id="g3">3. For hosts</h2><ul><li><strong>Be authentic:</strong> Your profile must reflect who you really are. No misleading photos or false claims.</li><li><strong>Maintain quality:</strong> Be present, attentive, and engaged during calls. Repeated no-shows may affect your rating.</li><li><strong>Set boundaries:</strong> You have the right to end any call that makes you uncomfortable — use the end call button or block feature.</li><li><strong>No off-platform contact:</strong> Never share personal contact details with users. Violations result in immediate ban.</li><li><strong>Professionalism:</strong> Represent Friendoo positively. Language, behaviour, and topic choices reflect on the community.</li></ul>
<h2 id="g4">4. Zero tolerance violations</h2><p>The following result in <strong>immediate permanent ban</strong> with no appeal:</p><ul><li>Sharing or soliciting sexually explicit content involving minors (also reported to law enforcement).</li><li>Threats of violence or credible harassment campaigns.</li><li>Attempting to doxx (expose personal information of) another user or host.</li><li>Operating a bot or automated account.</li><li>Fraud or payment circumvention.</li></ul>
<h2 id="g5">5. Consequences</h2><ul><li><strong>Warning:</strong> Minor first-time violations.</li><li><strong>Temporary suspension (24h–30 days):</strong> Repeated minor violations or moderate violations.</li><li><strong>Permanent ban:</strong> Severe violations or zero-tolerance offences.</li><li>Banned users may not create new accounts. Attempts to bypass bans will be reported.</li></ul>
<h2 id="g6">6. How to report</h2><p>Use the in-app report button on any profile, message, or call. You can also email <a href="/cdn-cgi/l/email-protection#77040207071805033711051e121913181859160707"><span class="__cf_email__" data-cfemail="681b1d1818071a1c280e1a010d060c070746091818">[email&#160;protected]</span></a> with details. Reports are reviewed according to the active Friendoo safety process.</p>
<h2 id="g7">7. Appeals</h2><p>If you believe an action was taken against your account in error, email <a href="/cdn-cgi/l/email-protection#26555356564954526640544f434842494908475656"><span class="__cf_email__" data-cfemail="1c6f696c6c736e685c7a6e757972787373327d6c6c">[email&#160;protected]</span></a> with subject "Account Appeal" within 14 days of the action. We review all appeals fairly.</p>
</div></div>
<div id="safety-view" class="view"><div class="legal-hero">
  <div class="label">Safety</div>
  <h1 style="font-size:clamp(32px,5vw,56px);font-weight:800;letter-spacing:-1.5px;line-height:1.1">Safety Center</h1>
  <p style="color:var(--muted);margin-top:12px;font-size:15px">Your safety is our highest priority. Here&rsquo;s how we keep Friendoo safe for everyone.</p>
</div>
<div class="legal-content">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin-bottom:48px">
    <div class="legal-box" style="margin:0">
      <div style="font-size:32px;margin-bottom:10px">🪪</div>
      <h3 style="font-size:17px;margin-bottom:8px">ID-Verified Hosts</h3>
      <p style="font-size:14px;color:var(--muted)">Every host submits a government-issued ID and passes a video verification check before going live. Zero tolerance for fake accounts.</p>
    </div>
    <div class="legal-box" style="margin:0">
      <div style="font-size:32px;margin-bottom:10px">🛡️</div>
      <h3 style="font-size:17px;margin-bottom:8px">24/7 Moderation</h3>
      <p style="font-size:14px;color:var(--muted)">Our trust &amp; safety team reviews all reports within 2 hours. Serious violations are escalated immediately.</p>
    </div>
    <div class="legal-box" style="margin:0">
      <div style="font-size:32px;margin-bottom:10px">🔒</div>
      <h3 style="font-size:17px;margin-bottom:8px">Privacy by Design</h3>
      <p style="font-size:14px;color:var(--muted)">Your phone number is never shown to hosts. Hosts see only your display name. All call audio is not stored.</p>
    </div>
    <div class="legal-box" style="margin:0">
      <div style="font-size:32px;margin-bottom:10px">🚫</div>
      <h3 style="font-size:17px;margin-bottom:8px">Instant Block &amp; Report</h3>
      <p style="font-size:14px;color:var(--muted)">Block or report any host in 2 taps. Reported accounts are reviewed immediately. Confirmed violations result in permanent bans.</p>
    </div>
  </div>
  <h2>Our Community Guidelines</h2>
  <p>All Friendoo users must follow these standards:</p>
  <ul>
    <li><strong>Respect:</strong> Treat all hosts and users with dignity. Harassment, abuse, or threatening behavior is grounds for immediate permanent ban.</li>
    <li><strong>No explicit content:</strong> Friendoo is a platform for genuine conversations. Soliciting or sharing sexually explicit content is strictly prohibited.</li>
    <li><strong>No off-platform contact:</strong> Attempting to obtain personal contact information from hosts is prohibited and may result in account termination.</li>
    <li><strong>Authentic identity:</strong> You must use the platform under your real identity. Impersonation or fake profiles are not permitted.</li>
    <li><strong>No recording:</strong> Recording calls without explicit consent of all parties is prohibited and may be illegal.</li>
  </ul>
  <h2>How to Report</h2>
  <p>If you experience or witness any safety issue:</p>
  <ol>
    <li>Use the in-app <strong>Report</strong> button on any host profile or during a call</li>
    <li>Email our safety team at <strong><a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="5023313635242910362239353e343f3f7e393e">[email&#160;protected]</a></strong></li>
    <li>For urgent issues, call our helpline: <strong>[Helpline Number]</strong></li>
  </ol>
  <p>All reports are confidential. We do not share reporter identities with the reported user.</p>
  <h2>For Hosts: Your Safety Matters Too</h2>
  <ul>
    <li>You have the right to end any call immediately if you feel uncomfortable</li>
    <li>Block any user who behaves inappropriately — they cannot contact you again</li>
    <li>Our host support team is available 7 days a week</li>
    <li>We investigate all host reports within 24 hours</li>
  </ul>
  <div class="legal-contact">
    <p><strong>Safety Team:</strong> <a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="a8dbc9cecddcd1e8cedac1cdc6ccc7c786c1c6">[email&#160;protected]</a></p>
    <p><strong>Host Support:</strong> <a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="40282f3334333530302f323400263229252e242f2f6e292e">[email&#160;protected]</a></p>
    <p><strong>General Support:</strong> <a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="afdcdadfdfc0dddbefc9ddc6cac1cbc0c081c6c1">[email&#160;protected]</a></p>
  </div>
</div></div>
<footer style="flex-direction:column;gap:20px;align-items:flex-start"><div style="display:flex;justify-content:space-between;width:100%;flex-wrap:wrap;gap:16px"><div><strong style="font-size:16px">Friendoo</strong><p style="color:var(--muted);font-size:13px;margin-top:4px;max-width:280px">Genuine conversations with verified female hosts. Safe, real, rewarding.</p></div><div style="display:flex;gap:40px;flex-wrap:wrap"><div><p style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Platform</p><div class="links" style="flex-direction:column;gap:8px"><a href="#home">Home</a><a href="#features">Features</a><a href="#hosts">Meet Hosts</a><a href="#apply">Join as Host</a></div></div><div><p style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Legal</p><div class="links" style="flex-direction:column;gap:8px"><a href="#privacy-view">Privacy Policy</a><a href="#terms-view">Terms of Use</a><a href="#refund-view">Refund Policy</a><a href="#guidelines-view">Community Guidelines</a><a href="#safety-view">Safety Center</a></div></div><div><p style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Support</p><div class="links" style="flex-direction:column;gap:8px"><a href="/cdn-cgi/l/email-protection#087b7d7878677a7c486e7a616d666c676726697878"><span class="__cf_email__" data-cfemail="691a1c1919061b1d290f1b000c070d060647081919">[email&#160;protected]</span></a><a href="#safety-view">Report an Issue</a><a href="#guidelines-view">Community Rules</a></div></div></div></div><div style="border-top:1px solid rgba(255,255,255,.06);width:100%;padding-top:16px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><span style="color:rgba(255,255,255,.3);font-size:13px">&#169; 2026 Friendoo. All rights reserved.</span><span style="color:rgba(255,255,255,.3);font-size:13px">Made with &#10084; for Bharat</span></div></footer><script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script><script>
const HOST_APPLICATION_ENDPOINT = 'https://gjbhsogarwqkkftzijhf.supabase.co/functions/v1/host-application-submit';
document.getElementById('hostForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  const successMsg = document.getElementById('successMsg');
  const errorMsg = document.getElementById('errorMsg');
  successMsg.style.display = 'none'; errorMsg.style.display = 'none';
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>Submitting…';
  try {
    const response = await fetch(HOST_APPLICATION_ENDPOINT, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        fullName: this.name.value.trim(),
        phone: this.phone.value.trim(),
        age: parseInt(this.age ? this.age.value : '22', 10) || 22,
        city: this.city.value.trim(),
        languages: Array.from(this.querySelectorAll('input[name="language"]:checked')).map(c => c.value),
        about: this.about.value.trim(),
        isAdult: this.confirm.checked,
        isFemale: this.confirm.checked,
        agreedToTerms: this.confirm.checked,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Unable to submit the application.');
    successMsg.style.display = 'block'; this.reset();
  } catch (err) {
    console.error('Host application submission failed:', err);
    errorMsg.textContent = '❌ ' + (err.message || 'Something went wrong. Please try again or contact support@friendoo.app');
    errorMsg.style.display = 'block';
  } finally { btn.disabled = false; btn.textContent = 'Submit application'; }
});
</script><script>
var I18N={};var currentLang='en';
function t(k,fb){if(fb===undefined)fb='';var keys=k.split('.'),val=I18N[currentLang];for(var i=0;i<keys.length;i++){if(val==null){val=undefined;break;}val=val[keys[i]];}if(val!==undefined&&val!==null)return val;val=I18N['en'];for(var j=0;j<keys.length;j++){if(val==null){val=undefined;break;}val=val[keys[j]];}return(val!==undefined&&val!==null)?val:fb;}
function setHtml(sel,html){var el=document.querySelector(sel);if(el)el.innerHTML=html;}
function switchLang(lang){if(!I18N[lang])lang='en';currentLang=lang;var sel=document.getElementById('langBarSelect');if(sel)sel.value=lang;localStorage.setItem('friendoo_lang',lang);applyTranslations();}
function applyTranslations(){
  document.querySelectorAll('[data-t]').forEach(function(el){var k=el.getAttribute('data-t'),v=t(k);if(v&&typeof v==='string')el.textContent=v;});
  renderDynamic();
}
function renderDynamic(){
  var cards=t('features.cards',[]);if(Array.isArray(cards)&&cards.length){var fi=cards.map(function(c){return'<div class="feat-card"><div class="feat-icon">'+c.icon+'</div><h3>'+c.title+'</h3><p>'+c.desc+'</p></div>';}).join('');setHtml('#featInner1',fi);setHtml('#featInner2',fi);}
  var stats=t('stats',[]);if(Array.isArray(stats)&&stats.length)setHtml('#statsRow',stats.map(function(s){return'<div class="stat-box"><div class="stat-num">'+s.num+'</div><div class="stat-label">'+s.label+'</div></div>';}).join(''));
  var np=t('tiers.normal.points',[]);if(Array.isArray(np)&&np.length)setHtml('#normalPoints',np.map(function(p){return'<li>'+p+'</li>';}).join(''));
  var sp=t('tiers.star.points',[]);if(Array.isArray(sp)&&sp.length)setHtml('#starPoints',sp.map(function(p){return'<li>'+p+'</li>';}).join(''));
  var cy=t('hero.cycle',[]);if(Array.isArray(cy)&&cy.length)setHtml('#cycleText',cy.map(function(c){return'<span>'+c+'</span>';}).join('')+'<span>'+cy[0]+'</span>');
  var ids=[['calcTierLabel','calc.tier'],['calcDaysLabel','calc.days'],['calcHoursLabel','calc.hours'],['calcAvgLabel','calc.avg'],['cCallsLbl','calc.callsLbl'],['cMinutesLbl','calc.minutesLbl'],['cEarningsLbl','calc.earningsLbl']];
  ids.forEach(function(p){var v=t(p[1],'');if(v){var el=document.getElementById(p[0]);if(el)el.textContent=v;}});
}
function calc(){var tier=parseFloat(document.getElementById('tier').value)||0,days=parseFloat(document.getElementById('days').value)||0,hours=parseFloat(document.getElementById('hours').value)||0,avgMin=parseFloat(document.getElementById('avgMin').value)||1,totalMin=Math.round(days*hours*60),calls=Math.round(totalMin/avgMin);document.getElementById('cCalls').textContent=calls.toLocaleString('en-IN');document.getElementById('cMinutes').textContent=totalMin.toLocaleString('en-IN');document.getElementById('cEarnings').textContent='₹'+Math.round(totalMin*tier).toLocaleString('en-IN');}
['tier','days','hours','avgMin'].forEach(function(id){var el=document.getElementById(id);if(el){el.addEventListener('input',calc);el.addEventListener('change',calc);}});calc();
</script><script>
I18N.en={"nav": {"features": "Features", "tiers": "Host Tiers", "pricing": "Coins", "apply": "Apply", "join": "Join as Host"}, "hero": {"eyebrow": "Female hosts only · Verified · Safe · India-first", "sub": "Friendoo connects you with verified female hosts for meaningful conversations. Hosts earn ₹2.50/min as Normal, ₹4/min as Star.", "cta1": "Join as Host", "cta2": "See earnings", "cycle": ["real women", "verified hosts", "earn coins", "Friendoo"]}, "features": {"label": "What's inside", "title": "Built for real connections", "cards": [{"icon": "💬", "title": "Real-time chat", "desc": "Private one-to-one chat with fast delivery, read states, and clean conversation flows."}, {"icon": "📞", "title": "Voice calls", "desc": "Request calls using coins. Female hosts manage availability and session timing."}, {"icon": "🛡️", "title": "Safety controls", "desc": "Reporting, moderation, profile review, and account actions for a safer experience."}, {"icon": "🪙", "title": "Coin wallet", "desc": "Buy coin packs through Google Play Billing on Android. Track spending from your wallet screen."}, {"icon": "🎯", "title": "Smart host match", "desc": "AI-powered recommendation using interests, language, activity time, and ratings."}, {"icon": "📊", "title": "Host dashboard", "desc": "Track requests, earnings, ratings, and payout status in one place."}, {"icon": "🌐", "title": "Multi-language", "desc": "Hindi, Tamil, Telugu, Malayalam, Kannada, and Urdu community support."}, {"icon": "⚡", "title": "Instant matching", "desc": "Interest tag-based discovery means you find the right host without noise."}]}, "stats": [{"num": "Female Only", "label": "All hosts are verified women"}, {"num": "₹2.50–4.00", "label": "Per minute host earnings"}, {"num": "70%", "label": "Revenue share for hosts"}, {"num": "₹99+", "label": "Coin packs starting from"}], "tiers": {"label": "Host program", "title": "Two tiers.\\nMore earnings.", "lead": "All Friendoo hosts are verified females. Start as Normal Host and climb to Star Host for higher pay.", "normal": {"badge": "Normal Host", "title": "🌟 Normal Host", "earnSub": "User pays ₹5/min · You keep ₹3 · Platform keeps ₹2", "points": ["Standard profile visibility", "Earn ₹3 per call minute", "Weekly payout via UPI", "Basic host dashboard access", "Minimum 4.0★ rating required", "Need 50+ completed minutes to qualify for Star"]}, "star": {"badge": "Star Host", "title": "👑 Star Host", "earnSub": "User pays 7 coins/min (offer ₹7) · You keep ₹4.5 · Platform keeps ₹2.5–₹5.5", "points": ["Top 10 per language each week", "Earn ₹4.5 per call minute", "Priority in matching algorithm", "Featured on homepage", "Instant payout eligibility", "Gold badge on profile", "Need 4.5★+ and 200+ minutes"]}}, "steps": {"label": "Upgrade path", "title": "How to become a Star Host", "steps": [{"num": "1", "title": "Apply & Verify", "desc": "Submit your application. Get verified as a female host."}, {"num": "2", "title": "Build Rating", "desc": "Complete 50+ minutes with 4.0★+. Every call counts toward your Star score."}, {"num": "3", "title": "Hit 200+ Mins", "desc": "Reach 200+ call minutes with 4.5★+ average."}, {"num": "4", "title": "Top 10 Promotion", "desc": "Platform auto-promotes top 10 hosts per language every week."}]}, "potential": {"label": "Realistic estimates", "title": "Your earning potential", "lead": "Based on actual host performance data. Conservative estimates — top hosts earn significantly more.", "cards": [{"title": "📈 Call Volume Probability", "rows": ["0–2 calls/day|25%", "3–5 calls/day|35%", "6–10 calls/day|25%", "10+ calls/day|15%"], "bar": "75%"}, {"title": "💰 Monthly Earnings (Normal Host)", "rows": ["Beginner (20h/mo)|₹3,600", "Regular (40h/mo)|₹7,200", "Active (60h/mo)|₹10,800", "Top 10% (100h/mo)|₹18,000+"], "bar": "60%"}, {"title": "⭐ Monthly Earnings (Star Host)", "rows": ["Regular (40h/mo)|₹10,800", "Active (60h/mo)|₹16,200", "Top Star (100h/mo)|₹27,000+", "With tips/bonuses|₹30,000+"], "bar": "85%"}, {"title": "🎯 Star Host Probability", "rows": ["Apply → Approved|~60%", "Normal → 50 mins|~80%", "50 mins → 200 mins|~40%", "200 mins → Star|~25%"], "bar": "5%"}]}, "hosts": {"label": "Verified hosts", "title": "Meet our hosts", "cards": [{"name": "Meera S.", "loc": "Delhi", "tier": "STAR", "rating": "4.9", "tags": ["Hindi", "Movies", "Lifestyle"], "earn": "₹22,400", "bar": "82%"}, {"name": "Divya R.", "loc": "Bangalore", "tier": "STAR", "rating": "4.8", "tags": ["Kannada", "Music", "Travel"], "earn": "₹18,900", "bar": "72%"}, {"name": "Priya S.", "loc": "Chennai", "rating": "4.9", "tier": "STAR", "tags": ["Tamil", "Music", "Travel", "Late night"], "earn": "₹24,300", "bar": "90%"}, {"name": "Anjali M.", "loc": "Mumbai", "rating": "4.3", "tier": "Normal", "tags": ["Hindi", "Bollywood", "Cooking"], "earn": "₹8,400", "bar": "35%"}]}, "pricing": {"label": "Coin packs", "title": "Buy coins,\\nunlock calls", "cards": [{"pill": "Starter", "amount": "₹99", "coins": "100 coins · 20 mins with Normal Host", "points": ["Perfect for first-time users", "Quick UPI checkout", "Instant wallet credit"], "cta": "Get started"}, {"pill": "Most Popular", "amount": "₹299", "coins": "350 coins · 70 mins with Normal Host", "points": ["Best value for regular callers", "Enough for multiple sessions", "Priority matching"], "cta": "Buy coins"}, {"pill": "Star Access", "amount": "₹599", "coins": "750 coins · 60 mins with Star Host", "points": ["Call Star Hosts at 7 coins/min", "Exclusive high-rated hosts", "VIP support"], "cta": "Upgrade"}]}, "form": {"label": "Join as Host", "title": "Apply to become a Friendoo host", "lead": "Only female applicants accepted. Fill in your details and our team will review your application within 48 hours.", "fields": [{"label": "Full name"}, {"label": "City"}, {"label": "Phone / WhatsApp"}, {"label": "Primary language", "options": ["Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Urdu"]}, {"label": "Why do you want to join as a host?"}]}, "footer": {"copy": "© 2026 Friendoo. All rights reserved."}};
I18N.hi={"nav": {"features": "फ़ीचर्स", "tiers": "होस्ट स्तर", "pricing": "कॉइन्स", "apply": "आवेदन", "join": "होस्ट बनें"}, "hero": {"eyebrow": "केवल महिला होस्ट · सत्यापित · सुरक्षित", "sub": "फ्रेंडू आपको सत्यापित महिला होस्ट से जोड़ता है। होस्ट ₹2.50–4.00/मिनट कमाते हैं।", "cta1": "होस्ट बनें", "cta2": "कमाई देखें", "cycle": ["वास्तविक महिलाएं", "सत्यापित होस्ट", "कॉइन कमाएं", "फ्रेंडू"]}, "features": {"label": "अंदर क्या है", "title": "वास्तविक जुड़ाव के लिए", "cards": [{"icon": "💬", "title": "रियल-टाइम चैट", "desc": "निजी वन-टु-वन चैट।"}, {"icon": "📞", "title": "वॉइस कॉल", "desc": "कॉइन से कॉल का अनुरोध।"}, {"icon": "🛡️", "title": "सुरक्षा", "desc": "रिपोर्टिंग और मॉडरेशन।"}, {"icon": "🪙", "title": "कॉइन वॉलेट", "desc": "UPI से कॉइन खरीदें।"}, {"icon": "🎯", "title": "स्मार्ट मैच", "desc": "AI सिफारिश।"}, {"icon": "📊", "title": "होस्ट डैशबोर्ड", "desc": "कमाई ट्रैक करें।"}, {"icon": "🌐", "title": "बहु-भाषा", "desc": "6 भाषाएं समर्थित।"}, {"icon": "⚡", "title": "त्वरित मिलान", "desc": "रुचि टैग से सही होस्ट।"}]}, "stats": [{"num": "केवल महिला", "label": "सभी होस्ट सत्यापित महिलाएं"}, {"num": "₹2.50–4.00", "label": "प्रति मिनट होस्ट कमाई"}, {"num": "70%", "label": "होस्ट राजस्व हिस्सा"}, {"num": "₹99+", "label": "कॉइन पैक शुरुआती मूल्य"}], "tiers": {"label": "होस्ट कार्यक्रम", "title": "दो स्तर। अधिक कमाई।", "lead": "सभी फ्रेंडू होस्ट सत्यापित महिलाएं हैं।", "normal": {"badge": "नॉर्मल होस्ट", "title": "🌟 नॉर्मल होस्ट", "earnSub": "उपयोगकर्ता ₹5/मिनट · आप ₹3 रखें", "points": ["मानक दृश्यता", "₹3/मिनट कमाएं", "UPI साप्ताहिक भुगतान", "4.0★+ रेटिंग", "50+ मिनट पूरे करें"]}, "star": {"badge": "स्टार होस्ट", "title": "👑 स्टार होस्ट", "earnSub": "उपयोगकर्ता ₹10/मिनट · आप ₹4.5 रखें", "points": ["प्रति भाषा शीर्ष 10", "₹4.5/मिनट कमाएं", "मिलान में प्राथमिकता", "गोल्ड बैज", "4.5★+ और 200+ मिनट"]}}, "steps": {"label": "अपग्रेड पथ", "title": "स्टार होस्ट कैसे बनें", "steps": [{"num": "1", "title": "आवेदन करें", "desc": "ID प्रूफ के साथ आवेदन करें।"}, {"num": "2", "title": "रेटिंग बनाएं", "desc": "4.0★+ के साथ 50+ मिनट पूरे करें।"}, {"num": "3", "title": "200+ मिनट", "desc": "4.5★+ के साथ 200+ मिनट तक पहुंचें।"}, {"num": "4", "title": "शीर्ष 10", "desc": "हर महीने शीर्ष 10 को बढ़ावा दिया जाता है।"}]}, "potential": {"label": "वास्तविक अनुमान", "title": "आपकी कमाई क्षमता", "lead": "रूढ़िवादी अनुमान — शीर्ष होस्ट अधिक कमाते हैं।", "cards": [{"title": "📈 कॉल वॉल्यूम", "rows": ["0–2 कॉल/दिन|25%", "3–5 कॉल/दिन|35%", "6–10 कॉल/दिन|25%", "10+ कॉल/दिन|15%"], "bar": "75%"}, {"title": "💰 मासिक कमाई (नॉर्मल)", "rows": ["बिगिनर (20घं/माह)|₹3,600", "नियमित (40घं/माह)|₹7,200", "सक्रिय (60घं/माह)|₹10,800", "शीर्ष 10% (100घं/माह)|₹18,000+"], "bar": "60%"}, {"title": "⭐ मासिक कमाई (स्टार)", "rows": ["नियमित (40घं/माह)|₹10,800", "सक्रिय (60घं/माह)|₹16,200", "शीर्ष स्टार (100घं/माह)|₹27,000+", "टिप्स के साथ|₹30,000+"], "bar": "85%"}, {"title": "🎯 स्टार संभावना", "rows": ["आवेदन → स्वीकृत|~60%", "नॉर्मल → 50 मिनट|~80%", "50 मिनट → 200 मिनट|~40%", "200 मिनट → स्टार|~25%"], "bar": "5%"}]}, "hosts": {"label": "सत्यापित होस्ट", "title": "हमारे होस्ट से मिलें", "cards": [{"name": "प्रिया एस.", "loc": "चेन्नई", "rating": "4.9", "tier": "STAR", "tags": ["तमिल", "संगीत", "यात्रा"], "earn": "₹24,300", "bar": "90%"}, {"name": "अंजलि एम.", "loc": "मुंबई", "rating": "4.3", "tier": "Normal", "tags": ["हिंदी", "बॉलीवुड"], "earn": "₹8,400", "bar": "35%"}]}, "pricing": {"label": "कॉइन पैक", "title": "कॉइन खरीदें,\\nकॉल अनलॉक करें", "cards": [{"pill": "स्टार्टर", "amount": "₹99", "coins": "100 कॉइन · 20 मिनट", "points": ["पहली बार के लिए", "तुरंत UPI", "तुरंत क्रेडिट"], "cta": "शुरू करें"}, {"pill": "सबसे लोकप्रिय", "amount": "₹299", "coins": "350 कॉइन · 70 मिनट", "points": ["बेहतर मूल्य", "कई सत्र", "प्राथमिकता"], "cta": "कॉइन खरीदें"}, {"pill": "स्टार एक्सेस", "amount": "₹599", "coins": "750 कॉइन · 60 मिनट स्टार", "points": ["स्टार होस्ट कॉल", "उच्च रेटेड होस्ट", "VIP समर्थन"], "cta": "अपग्रेड"}]}, "form": {"label": "होस्ट बनें", "title": "फ्रेंडू होस्ट बनने के लिए आवेदन करें", "lead": "केवल महिला आवेदक। 48 घंटों में समीक्षा।", "fields": [{"label": "पूरा नाम"}, {"label": "शहर"}, {"label": "फोन / व्हाट्सएप"}, {"label": "मुख्य भाषा", "options": ["हिंदी", "तमिल", "तेलुगु", "कन्नड़", "मलयालम", "उर्दू"]}, {"label": "होस्ट क्यों बनना चाहते हैं?"}]}, "footer": {"copy": "© 2026 फ्रेंडू। सर्वाधिकार सुरक्षित।"}};
I18N.ta={"nav":{"features":"அம்சங்கள்","tiers":"ஹோஸ்ட் நிலைகள்","pricing":"காயின்கள்","apply":"விண்ணப்பி","join":"ஹோஸ்ட் ஆகு"},"hero":{"eyebrow":"பெண் ஹோஸ்ட்கள் மட்டுமே · சரிபார்க்கப்பட்டது · பாதுகாப்பானது","sub":"ஃபிரெண்டூ உங்களை சரிபார்க்கப்பட்ட பெண் ஹோஸ்ட்களுடன் இணைக்கிறது. ஹோஸ்ட்கள் ₹2.50–4.00/நிமிடம் சம்பாதிக்கிறார்கள்.","cta1":"ஹோஸ்ட் ஆகு","cta2":"வருமானம் பார்","cycle":["உண்மையான பெண்கள்","சரிபார்க்கப்பட்ட ஹோஸ்ட்கள்","காயின்கள் சம்பாதி","ஃபிரெண்டூ"]},"features":{"label":"உள்ளே என்ன உள்ளது","title":"உண்மையான இணைப்புகளுக்காக","cards":[{"icon":"💬","title":"நேரடி அரட்டை","desc":"தனிப்பட்ட ஒன்றுக்கு ஒன்று அரட்டை."},{"icon":"📞","title":"குரல் அழைப்புகள்","desc":"காயின்களால் அழைப்பு கோரிக்கை."},{"icon":"🛡️","title":"பாதுகாப்பு","desc":"புகாரளித்தல் மற்றும் மிதவினை."},{"icon":"🪙","title":"காயின் பணப்பை","desc":"UPI மூலம் காயின்கள் வாங்கு."},{"icon":"🎯","title":"ஸ்மார்ட் பொருத்தம்","desc":"AI பரிந்துரை."},{"icon":"📊","title":"ஹோஸ்ட் டாஷ்போர்டு","desc":"வருமானத்தை கண்காணி."},{"icon":"🌐","title":"பன்மொழி","desc":"6 மொழிகள் ஆதரவு."},{"icon":"⚡","title":"விரைவான பொருத்தம்","desc":"ஆர்வக் குறிச்சொல்லால் சரியான ஹோஸ்ட்."}]},"stats":[{"num":"பெண் மட்டுமே","label":"அனைத்து ஹோஸ்ட்களும் சரிபார்க்கப்பட்ட பெண்கள்"},{"num":"₹2.50–4.00","label":"ஒரு நிமிஷத்திற்கு ஹோஸ்ட் வருமானம்"},{"num":"70%","label":"ஹோஸ்ட்களுக்கான வருமான பங்கு"},{"num":"₹99+","label":"காயின் பேக்குகள் தொட���்க விலை"}],"pricing":{"label":"காயின் பேக்குகள்","title":"காயின்களை வாங்குங்கள்,\\nஅழைக்கவும்","cards":[{"id":"base","pill":"அடிப்படை","amount":"₹49","coins":"50 காயின்கள்","points":["₹0.98 ஒரு காயின்","10 நிமிட அழைப்பு","முதல் வாங்கல்"],"cta":"வாங்கு"},{"id":"starter","pill":"தொடக்கம்","amount":"₹99","coins":"120 காயின்கள்","points":["₹0.83 ஒரு காயின்","24 நிமிட அழைப்பு","நுழைவு பேக்"],"cta":"வாங்கு"},{"id":"popular","pill":"பிரபலமான 🔥","amount":"₹199","coins":"250 காயின்கள்","points":["₹0.80 ஒரு காயின்","50 நிமிட அழைப்பு","அதிகம் தேர்ந்தெடுக்கப்பட்ட"],"cta":"வாங்கு"},{"id":"value","pill":"மதிப்பு","amount":"₹399","coins":"550 காயின்கள்","points":["₹0.73 ஒரு காயின்","110 நிமிட அழைப்பு","சிறந்த ஒப்பந்தம்"],"cta":"வாங்கு"},{"id":"pro","pill":"சிறந்த","amount":"₹799","coins":"1,200 காயின்கள்","points":["₹0.67 ஒரு காயின்","4 மணி அழைப்பு","சக்தி பயனர்"],"cta":"வாங்கு"}]},{"id":"starter","pill":"स्टार्टर","amount":"₹99","coins":"120 कॉइन","points":["₹0.83 प्रति कॉइन","24 मिनट कॉल","एंट्री पैक"],"cta":"खरीदें"},{"id":"popular","pill":"पॉपुलर 🔥","amount":"₹199","coins":"250 कॉइन","points":["₹0.80 प्रति कॉइन","50 मिनट कॉल","सबसे लोकप्रिय"],"cta":"खरीदें"},{"id":"value","pill":"वैल्यू","amount":"₹399","coins":"550 कॉइन","points":["₹0.73 प्रति कॉइन","110 मिनट कॉल","बेस्ट डील"],"cta":"खरीदें"},{"id":"pro","pill":"प्रो","amount":"₹799","coins":"1,200 कॉइन","points":["₹0.67 प्रति कॉइन","4 घंटे कॉल","पावर यूज़र"],"cta":"खरीदें"}]},{"id":"starter","pill":"Starter","amount":"₹99","coins":"120 coins","points":["₹0.83 per coin","24 min call","Entry pack"],"cta":"Buy"},{"id":"popular","pill":"Popular 🔥","amount":"₹199","coins":"250 coins","points":["₹0.80 per coin","50 min call","Most chosen"],"cta":"Buy"},{"id":"value","pill":"Value","amount":"₹399","coins":"550 coins","points":["₹0.73 per coin","110 min call","Best deal"],"cta":"Buy"},{"id":"pro","pill":"Pro","amount":"₹799","coins":"1,200 coins","points":["₹0.67 per coin","4 hour call","Power user"],"cta":"Buy"}]},{"pill":"பாப்புலர்","amount":"₹449","coins":"500 காயின்கள்","points":["10% போனஸ் காயின்கள்","100 நிமிட இயல்பான அழைப்பு","அதிக விற்பனை"],"cta":"வாங்கு"},{"pill":"சிறந்த மதிப்பு","amount":"₹999","coins":"1,200 காயின்கள்","points":["20% போனஸ் காயின்கள்","4 மணி இயல்பான அழைப்பு","சிறந்த ஒப்பந்தம்"],"cta":"வாங்கு"},{"pill":"பிரீமியம்","amount":"₹1,999","coins":"2,500 காயின்கள்","points":["25% போனஸ் காயின்கள்","8+ மணி இயல்பான அழைப்பு","VIP பேட்ஜ்"],"cta":"வாங்கு"}]},"tiers":{"label":"ஹோஸ்ட் திட்டம்","title":"இரண்டு நிலைகள்.\\nகூடுதல் வருமானம்.","lead":"அனைத்து ஃபிரெண்டூ ஹோஸ்ட்களும் சரிபார்க்கப்பட்�� பெண்கள்.","normal":{"badge":"இயல்பான ஹோஸ்ட்","title":"⭐ இயல்பான ஹோஸ்ட்","earnSub":"பயனர் ₹5/நிமிடம் செலுத்துகிறார் · நீங்கள் ₹3 பெறுவீர்கள்","points":["₹3/நிமிடம் சம்பாதிக்கவும்","4.0★ மதிப்பீடு தேவை","50+ நிமிடங்கள் நிலை மாற","அடிப்படை பொருத்தம்"]},"star":{"badge":"ஸ்டார் ஹோஸ்ட்","title":"👑 ஸ்டார் ஹோஸ்ட்","earnSub":"பயனர் ₹10/நிமிடம் செலுத்துகிறார் · நீங்கள் ₹4.5 பெறுவீர்கள்","points":["₹4.5/நிமிடம் சம்பாதிக்கவும்","முன்னுரிமை பொருத்தம்","தங்க பேட்ஜ்","சிறப்பு ஹோஸ்ட் விழா"]}}}
I18N.te={"nav":{"features":"ఫీచర్లు","tiers":"హోస్ట్ స్థాయిలు","pricing":"కాయిన్లు","apply":"దరఖాస్తు","join":"హోస్ట్ అవ్వండి"},"hero":{"eyebrow":"మహిళా హోస్ట్లు మాత్రమే · ధృవీకరించబడింది · సురక్షితమైనది","sub":"ఫ్రెండూ మిమ్మల్ని ధృవీకరించబడిన మహిళా హోస్ట్లతో కనెక్ట్ చేస్తుంది. హోస్ట్లు ₹2.50–4.00/నిమిషం సంపాదిస్తారు.","cta1":"హోస్ట్ అవ్వండి","cta2":"ఆదాయం చూడండి","cycle":["నిజమైన మహిళలు","ధృవీకరించబడిన హోస్ట్లు","కాయిన్లు సంపాదించండి","ఫ్రెండూ"]},"features":{"label":"లోపల ఏముంది","title":"నిజమైన కనెక్షన్ల కోసం","cards":[{"icon":"💬","title":"రియల్-టైం చాట్","desc":"వ్యక్తిగత వన్-టూ-వన్ చాట్."},{"icon":"📞","title":"వాయిస్ కాల్స్","desc":"కాయిన్లతో కాల్ అభ్యర్థన."},{"icon":"🛡️","title":"సురక్షత","desc":"నివేదికలు మరియు మోడరేషన్."},{"icon":"🪙","title":"కాయిన్ వాలెట్","desc":"UPI ద్వారా కాయిన్లు కొనండి."},{"icon":"🎯","title":"స్మార్ట్ మ్యాచ్","desc":"AI సిఫార్సు."},{"icon":"📊","title":"హోస్ట్ డాష్‌బోర్డ్","desc":"ఆదాయాన్ని ట్రాక్ చేయండి."},{"icon":"🌐","title":"బహుభాష","desc":"6 భాషల మద్దతు."},{"icon":"⚡","title":"త్వరిత మ్యాచింగ్","desc":"ఇంటరెస్ట్ ట్యాగ్ ద్వారా సరైన హోస్ట్."}]},"stats":[{"num":"మహిళ మాత్రమే","label":"అన్ని హోస్ట్లు ధృవీకరించబడిన మహిళలు"},{"num":"₹2.50–4.00","label":"నిమిషానికి హోస్ట్ ఆదాయం"},{"num":"70%","label":"హోస్ట్లకు రెవెన్యూ షేర్"},{"num":"₹99+","label":"కాయిన్ ప్యాక్‌లు ప్రారంభ ధర"}],"pricing":{"label":"కాయిన్ ప్యాక్‌లు","title":"కాయిన్లు కొనండి,\\nకాల్ చేయండి","cards":[{"id":"base","pill":"బేసిక్","amount":"₹49","coins":"50 కాయిన్లు","points":["₹0.98 ఒక కాయిన్","10 నిమిష కాల్","మొదటి కొనుగోలు"],"cta":"కొను"},{"id":"starter","pill":"స్టార్టర్","amount":"₹99","coins":"120 కాయిన్లు","points":["₹0.83 ఒక కాయిన్","24 నిమిష కాల్","ఎంట్రీ ప్యాక్"],"cta":"కొను"},{"id":"popular","pill":"పాపులర్ 🔥","amount":"₹199","coins":"250 కాయిన్లు","points":["₹0.80 ఒక కాయిన్","50 నిమిష కాల్","ఎక్కువగా ఎంచుకున్న"],"cta":"కొను"},{"id":"value","pill":"వాల్యూ","amount":"₹399","coins":"550 కాయిన్లు","points":["₹0.73 ఒక కాయిన్","110 నిమిష కాల్","ఉత్తమ డీల్"],"cta":"కొను"},{"id":"pro","pill":"ప్రో","amount":"₹799","coins":"1,200 కాయిన్లు","points":["₹0.67 ఒక కాయిన్","4 గంటల కాల్","పవర్ యూజర్"],"cta":"కొను"}]},{"pill":"పాపులర్","amount":"₹449","coins":"500 కాయిన్లు","points":["10% బోనస్ కాయిన్లు","100 నిమిష సాధారణ కాల్","అత్యధిక అమ్మకాలు"],"cta":"కొనుగోలు"},{"pill":"బెస్ట్ వాల్యూ","amount":"₹999","coins":"1,200 కాయిన్లు","points":["20% బోనస్ కాయిన్లు","4 గంటల సాధారణ కాల్","ఉత్తమ డీల్"],"cta":"కొనుగోలు"},{"pill":"ప్రీమియం","amount":"₹1,999","coins":"2,500 కాయిన్లు","points":["25% బోనస్ కాయిన్లు","8+ గంటల సాధారణ కాల్","VIP బ్యాడ్జ్"],"cta":"కొనుగోలు"}]},"tiers":{"label":"హోస్ట్ ప్రోగ్రామ్","title":"రెండు స్థాయిలు.\\nఎక్కువ ఆదాయం.","lead":"అన్ని ఫ్రెండూ హోస్ట్లు ధృవీకరించబడిన మహిళలు.","normal":{"badge":"సాధారణ హోస్ట్","title":"⭐ సాధారణ హోస్ట్","earnSub":"యూజర్ ₹5/నిమిషం చెల్లిస్తారు · మీరు ₹3 పొందుతారు","points":["₹3/నిమిషం సంపాదించండి","4.0★ రేటింగ్ అవసరం","50+ నిమిషాలు స్థాయి మార్పు","బేసిక్ మ్యాచింగ్"]},"star":{"badge":"స్టార్ హోస్ట్","title":"👑 స్టార్ హోస్ట్","earnSub":"యూజర్ ₹10/నిమిషం చెల్లిస్తారు · మీరు ₹4.5 పొందుతారు","points":["₹4.5/నిమిషం సంపాదించండి","ప్రాధాన్యత మ్యాచింగ్","గోల్డ్ బ్యాడ్జ్","స్పెషల్ హోస్ట్ ఈవెంట్స్"]}}}
I18N.kn={"nav":{"features":"ವೈಶಿಷ್ಟ್ಯಗಳು","tiers":"ಹೋಸ್ಟ್ ಮಟ್ಟಗಳು","pricing":"ನಾಣ್ಯಗಳು","apply":"ಅರ್ಜಿ","join":"ಹೋಸ್ಟ್ ಆಗಿ"},"hero":{"eyebrow":"ಮಹಿಳಾ ಹೋಸ್ಟ್‌ಗಳು ಮಾತ್ರ · ಪರಿಶೀಲಿಸಲಾಗಿದೆ · ಸುರಕ್ಷಿತ","sub":"ಫ್ರೆಂಡೂ ನಿಮ್ಮನ್ನು ಪರಿಶೀಲಿಸಲಾದ ಮಹಿಳಾ ಹೋಸ್ಟ್‌ಗಳೊಂದಿಗೆ ಸಂಪರ್ಕಿಸುತ್ತದೆ. ಹೋಸ್ಟ್‌ಗಳು ₹2.50–4.00/ನಿಮಿಷ ಗಳಿಸುತ್ತಾರೆ.","cta1":"ಹೋಸ್ಟ್ ಆಗಿ","cta2":"ಆದಾಯ ವೀಕ್ಷಿಸಿ","cycle":["ನಿಜವಾದ ಮಹಿಳೆಯರು","ಪರಿಶೀಲಿಸಲಾದ ಹೋಸ್ಟ್‌ಗಳು","ನಾಣ್ಯಗಳನ್ನು ಗಳಿಸಿ","ಫ್ರೆಂಡೂ"]},"features":{"label":"ಒಳಗೆ ಏನಿದೆ","title":"ನಿಜವಾದ ಸಂಪರ್ಕಗಳಿಗಾಗಿ","cards":[{"icon":"💬","title":"ರಿಯಲ್-ಟೈಮ್ ಚಾಟ್","desc":"ಖಾಸಗಿ ಒನ್-ಟು-ಒನ್ ಚಾಟ್."},{"icon":"📞","title":"ವಾಯ್ಸ್ ಕಾಲ್ಸ್","desc":"ನಾಣ್ಯಗಳಿಂದ ಕಾಲ್ ವಿನಂತಿ."},{"icon":"🛡️","title":"ಸುರಕ್ಷತೆ","desc":"ರಿಪೋರ್ಟಿಂಗ್ ಮತ್ತು ಮಾಡರೇಷನ್."},{"icon":"🪙","title":"ನಾಣ್ಯ ವಾಲೆಟ್","desc":"UPI ಮೂಲಕ ನಾಣ್ಯಗಳನ್ನು ಖರೀದಿಸಿ."},{"icon":"🎯","title":"ಸ್ಮಾರ್ಟ್ ಮ್ಯಾಚ್","desc":"AI ಶಿಫಾರಸು."},{"icon":"📊","title":"ಹೋಸ್ಟ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್","desc":"ಆದಾಯವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ."},{"icon":"🌐","title":"ಬಹುಭಾಷೆ","desc":"6 ಭಾಷೆಗಳ ಬೆಂಬಲ."},{"icon":"⚡","title":"ತ್ವರಿತ ಮ್ಯಾಚಿಂಗ್","desc":"ಆಸಕ್ತಿ ಟ್ಯಾಗ್ ಮೂಲಕ ಸರಿಯಾದ ಹೋಸ್ಟ್."}]},"stats":[{"num":"ಮಹಿಳೆ ಮಾತ್ರ","label":"ಎಲ್ಲಾ ಹೋಸ್ಟ್‌ಗಳು ಪರಿಶೀಲಿಸಲಾದ ಮಹಿಳೆಯರು"},{"num":"₹2.50–4.00","label":"ನಿಮಿಷಕ್ಕೆ ಹೋಸ್ಟ್ ಆದಾಯ"},{"num":"70%","label":"ಹೋಸ್ಟ್‌ಗಳಿಗೆ ಆದಾಯ ವಿಂಗಡಣೆ"},{"num":"₹99+","label":"ನಾಣ್ಯ ಪ್ಯಾಕೇಜ್‌ಗಳು ಆರಂಭಿಕ ಬೆಲೆ"}],"pricing":{"label":"ನಾಣ್ಯ ಪ್ಯಾಕ್‌ಗಳು","title":"ನಾಣ್ಯಗಳನ್ನು ಖರೀದಿಸಿ,\\nಕರೆ ಮಾಡಿ","cards":[{"id":"base","pill":"ಮೂಲ","amount":"₹49","coins":"50 ನಾಣ್ಯಗಳು","points":["₹0.98 ಒಂದು ನಾಣ್ಯ","10 ನಿಮಿಷ ಕರೆ","ಮೊದಲ ಖರೀದಿ"],"cta":"ಖರೀದಿಸಿ"},{"id":"starter","pill":"ಪ್ರಾರಂಭ","amount":"₹99","coins":"120 ನಾಣ್ಯಗಳು","points":["₹0.83 ಒಂದು ನಾಣ್ಯ","24 ನಿಮಿಷ ಕರೆ","ಎಂಟ್ರಿ ಪ್ಯಾಕ್"],"cta":"ಖರೀದಿಸಿ"},{"id":"popular","pill":"ಜನಪ್ರಿಯ 🔥","amount":"₹199","coins":"250 ನಾಣ್ಯಗಳು","points":["₹0.80 ಒಂದು ನಾಣ್ಯ","50 ನಿಮಿಷ ಕರೆ","ಹೆಚ್ಚು ಆಯ್ಕೆ"],"cta":"ಖರೀದಿಸಿ"},{"id":"value","pill":"ಮೌಲ್ಯ","amount":"₹399","coins":"550 ನಾಣ್ಯಗಳು","points":["₹0.73 ಒಂದು ನಾಣ್ಯ","110 ನಿಮಿಷ ಕರೆ","ಉತ್ತಮ ಒಪ್ಪಂದ"],"cta":"ಖರೀದಿಸಿ"},{"id":"pro","pill":"ಪ್ರೊ","amount":"₹799","coins":"1,200 ನಾಣ್ಯಗಳು","points":["₹0.67 ಒಂದು ನಾಣ್ಯ","4 ಗಂಟೆ ಕರೆ","ಪವರ್ ಯೂಸರ್"],"cta":"ಖರೀದಿಸಿ"}]},{"pill":"ಪಾಪುಲರ್","amount":"₹449","coins":"500 ನಾಣ್ಯಗಳು","points":["10% ಬೋನಸ್ ನಾಣ್ಯಗಳು","100 ನಿಮಿಷ ಸಾಮಾನ್ಯ ಕರೆ","ಅತ್ಯಧಿಕ ಮಾರಾಟ"],"cta":"ಖರೀದಿಸಿ"},{"pill":"ಬೆಸ್ಟ್ ವ್ಯಾಲ್ಯೂ","amount":"₹999","coins":"1,200 ನಾಣ್ಯಗಳು","points":["20% ಬೋನಸ್ ನಾಣ್ಯಗಳು","4 ಗಂಟೆ ಸಾಮಾನ್ಯ ಕರೆ","ಉತ್ತಮ ಒಪ್ಪಂದ"],"cta":"ಖರೀದಿಸಿ"},{"pill":"ಪ್ರೀಮಿಯಂ","amount":"₹1,999","coins":"2,500 ನಾಣ್ಯಗಳು","points":["25% ಬೋನಸ್ ನಾಣ್ಯಗಳು","8+ ಗಂಟೆ ಸಾಮಾನ್ಯ ಕರೆ","VIP ಬ್ಯಾಡ್ಜ್"],"cta":"ಖರೀದಿಸಿ"}]},"tiers":{"label":"ಹೋಸ್ಟ್ ಕಾರ್ಯಕ್ರಮ","title":"ಎರಡು ಮಟ್ಟಗಳು.\\nಹೆಚ್ಚು ಆದಾಯ.","lead":"ಎಲ್ಲಾ ಫ್ರೆಂಡೂ ಹೋಸ್ಟ್‌ಗಳು ಪರಿಶೀಲಿಸಲಾದ ಮಹಿಳೆಯರು.","normal":{"badge":"ಸಾಮಾನ್ಯ ಹೋಸ್ಟ್","title":"⭐ ಸಾಮಾನ್ಯ ಹೋಸ್ಟ್","earnSub":"ಬಳಕೆದಾರ ₹5/ನಿಮಿಷ ಪಾವತಿಸುತ್ತಾರೆ · ನೀವು ₹3 ಪಡೆಯುತ್ತೀರಿ","points":["₹3/ನಿಮಿಷ ಗಳಿ��ಿ","4.0★ ರೇಟಿಂಗ್ ಅಗತ್ಯ","50+ ನಿಮಿಷಗಳು ಮಟ್ಟ ಬದಲಾವಣೆ","ಮೂಲ ಮ್ಯಾಚಿಂಗ್"]},"star":{"badge":"ಸ್ಟಾರ್ ಹೋಸ್ಟ್","title":"👑 ಸ್ಟಾರ್ ಹೋಸ್ಟ್","earnSub":"ಬಳಕೆದಾರ ₹10/ನಿಮಿಷ ಪಾವತಿಸುತ್ತಾರೆ · ನೀವು ₹4.5 ಪಡೆಯುತ್ತೀರಿ","points":["₹4.5/ನಿಮಿಷ ಗಳಿಸಿ","ಪ್ರಾಧಾನ್ಯತೆ ಮ್ಯಾಚಿಂಗ್","ಗೋಲ್ಡ್ ಬ್ಯಾಡ್ಜ್","ವಿಶೇಷ ಹೋಸ್ಟ್ ಈವೆಂಟ್‌ಗಳು"]}}}
I18N.ml={"nav":{"features":"ഫീച്ചറുകൾ","tiers":"ഹോസ്റ്റ് നിലകൾ","pricing":"കോയിനുകൾ","apply":"അപേക്ഷിക്കുക","join":"ഹോസ്റ്റ് ആകുക"},"hero":{"eyebrow":"മഹിളാ ഹോസ്റ്റുകൾ മാത്രം · പരിശോധിച്ചത് · സുരക്ഷിതം","sub":"ഫ്രണ്ടൂ നിങ്ങളെ പരിശോധിച്ച മഹിളാ ഹോസ്റ്റുകളുമായി ബന്ധിപ്പിക്കുന്നു. ഹോസ്റ്റുകൾ ₹2.50–4.00/മിനിറ്റ് സമ്പാദിക്കുന്നു.","cta1":"ഹോസ്റ്റ് ആകുക","cta2":"വരുമാനം കാണുക","cycle":["യഥാർത്ഥ സ്ത്രീകൾ","പരിശോധിച്ച ഹോസ്റ്റുകൾ","കോയിനുകൾ സമ്പാദിക്കുക","ഫ്രണ്ടൂ"]},"features":{"label":"ഉള്ളിൽ എന്തുണ്ട്","title":"യഥാർത്ഥ ബന്ധങ്ങൾക്കായി","cards":[{"icon":"💬","title":"റിയൽ-ടൈം ചാറ്റ്","desc":"സ്വകാര്യ വൺ-ടു-വൺ ചാറ്റ്."},{"icon":"📞","title":"വോയ്സ് കോൾസ്","desc":"കോയിനുകൾ ഉപയോഗിച്ച് കോൾ അഭ്യർത്ഥന."},{"icon":"🛡️","title":"സുരക്ഷ","desc":"റിപ്പോർട്ടിംഗും മോഡറേഷനും."},{"icon":"🪙","title":"കോയിൻ വാലറ്റ്","desc":"UPI വഴി കോയിനുകൾ വാങ്ങുക."},{"icon":"🎯","title":"സ്മാർട്ട് മാച്ച്","desc":"AI ശുപാർശ."},{"icon":"📊","title":"ഹോസ്റ്റ് ഡാഷ്ബോർഡ്","desc":"വരുമാനം ട്രാക്ക് ചെയ്യുക."},{"icon":"🌐","title":"ബഹുഭാഷ","desc":"7 ഭാഷകൾ പിന്തുണ."},{"icon":"⚡","title":"വേഗത്തിലുള്ള മാച്ചിംഗ്","desc":"താൽപ്പര്യ ടാഗ് വഴി ശരിയായ ഹോസ്റ്റ്."}]},"stats":[{"num":"മഹിള മാത്രം","label":"എല്ലാ ഹോസ്റ്റുകളും പരിശോധിച്ച സ്ത്രീകൾ"},{"num":"₹2.50–4.00","label":"മിനിറ്റിന് ഹോസ്റ്റ് വരുമാനം"},{"num":"70%","label":"ഹോസ്റ്റുകൾക്കുള്ള വരുമാന വിഹിതം"},{"num":"₹99+","label":"കോയിൻ പാക്കേജുകൾ ആരംഭ വില"}],"pricing":{"label":"കോയിൻ പാക്കുകൾ","title":"കോയിനുകൾ വാങ്ങുക,\\nകോൾ ചെയ്യുക","cards":[{"id":"base","pill":"അടിസ്ഥാന","amount":"₹49","coins":"50 കോയിനുകൾ","points":["₹0.98 ഒരു കോയിൻ","10 മിനിറ്റ് കോൾ","ആദ്യ വാങ്ങൽ"],"cta":"വാങ്ങുക"},{"id":"starter","pill":"സ്റ്റാർട്ടർ","amount":"₹99","coins":"120 കോയിനുകൾ","points":["₹0.83 ഒരു കോയിൻ","24 മിനിറ്റ് കോൾ","എൻട്രി പാക്ക്"],"cta":"വാങ്ങുക"},{"id":"popular","pill":"പോപ്പുലർ 🔥","amount":"₹199","coins":"250 ���ോയിനുകൾ","points":["₹0.80 ഒരു കോയിൻ","50 മിനിറ്റ് കോൾ","കൂടുതൽ തിരഞ്ഞെടുത്ത"],"cta":"വാങ്ങുക"},{"id":"value","pill":"വാല്യൂ","amount":"₹399","coins":"550 കോയിനുകൾ","points":["₹0.73 ഒരു കോയിൻ","110 മിനിറ്റ് കോൾ","ഏറ്റവും നല്ല ഡീൽ"],"cta":"വാങ്ങുക"},{"id":"pro","pill":"പ്രോ","amount":"₹799","coins":"1,200 കോയിനുകൾ","points":["₹0.67 ഒരു കോയിൻ","4 മണിക്കൂർ കോൾ","പവർ ഉപയോക്താവ്"],"cta":"വാങ്ങുക"}]},{"pill":"പോപ്പുലർ","amount":"₹449","coins":"500 കോയിനുകൾ","points":["10% ബോണസ് കോയിനുകൾ","100 മിനിറ്റ് സാധാരണ കോൾ","കൂടുതൽ വിൽപ്പന"],"cta":"വാങ്ങുക"},{"pill":"ബെസ്റ്റ് വാല്യു","amount":"₹999","coins":"1,200 കോയിനുകൾ","points":["20% ബോണസ് കോയിനുകൾ","4 മണിക്കൂർ സാധാരണ കോൾ","ഏറ്റവും നല്ല ഡീൽ"],"cta":"വാങ്ങുക"},{"pill":"പ്രീമിയം","amount":"₹1,999","coins":"2,500 കോയിനുകൾ","points":["25% ബോണസ് കോയിനുകൾ","8+ മണിക്കൂർ സാധാരണ കോൾ","VIP ബാഡ്ജ്"],"cta":"വാങ്ങുക"}]},"tiers":{"label":"ഹോസ്റ്റ് പരിപാടി","title":"രണ്ട് നിലകൾ.\\nകൂടുതൽ വരുമാനം.","lead":"എല്ലാ ഫ്രണ്ടൂ ഹോസ്റ്റുകളും പരിശോധിച്ച സ്ത്രീകൾ.","normal":{"badge":"സാധാരണ ഹോസ്റ്റ്","title":"⭐ സാധാരണ ഹോസ്റ്റ്","earnSub":"ഉപയോക്താവ് ₹5/മിനിറ്റ് നൽകുന്നു · നിങ്ങൾ ₹3 ലഭിക്കും","points":["₹3/മിനിറ്റ് സമ്പാദിക്കുക","4.0★ റേറ്റിംഗ് ആവശ്യം","50+ മിനിറ്റുകൾ നില മാറ്റം","അടിസ്ഥാന മാച്ചിംഗ്"]},"star":{"badge":"സ്റ്റാർ ഹോസ്റ്റ്","title":"👑 സ്റ്റാർ ഹോസ്റ്റ്","earnSub":"ഉപയോക്താവ് ₹10/മിനിറ്റ് നൽകുന്നു · നിങ്ങൾ ₹4.5 ലഭിക്കും","points":["₹4.5/മിനിറ്റ് സമ്പാദിക്കുക","മുൻഗണന മാച്ചിംഗ്","ഗോൾഡ് ബാഡ്ജ്","സ്പെഷ്യൽ ഹോസ്റ്റ് ഇവൻ്റുകൾ"]}}}
I18N.ur={"nav":{"features":"خصوصیات","tiers":"ہوسٹ کی سطحیں","pricing":"کوائنز","apply":"درخواست","join":"ہوسٹ بنیں"},"hero":{"eyebrow":"صرف خواتین ہوسٹس · تصدیق شدہ · محفوظ","sub":"فرینڈو آپ کو تصدیق شدہ خواتین ہوسٹس سے جوڑتا ہے۔ ہوسٹس ₹2.50–4.00/منٹ کماتے ہیں۔","cta1":"ہوسٹ بنیں","cta2":"آمدنی دیکھیں","cycle":["حقیقی خواتین","تصدیق شدہ ہوسٹس","کوائنز کمائیں","فرینڈو"]},"features":{"label":"اندر کیا ہے","title":"حقیقی کنکشنز کے لیے","cards":[{"icon":"💬","title":"ریل ٹائم چیٹ","desc":"نجی ون ٹو ون چیٹ۔"},{"icon":"📞","title":"وائس کالز","desc":"کوائنز سے کال کی درخواست۔"},{"icon":"🛡️","title":"حفاظت","desc":"رپورٹنگ اور ماڈریشن۔"},{"icon":"🪙","title":"کوائن والیٹ","desc":"UPI کے ذریعے کوائنز خریدیں۔"},{"icon":"🎯","title":"اسمارٹ میچ","desc":"AI سفارش۔"},{"icon":"📊","title":"ہوسٹ ڈیش بورڈ","desc":"آمدنی ٹریک کریں۔"},{"icon":"🌐","title":"کثیراللسانی","desc":"6 زبانوں کی حمایت۔"},{"icon":"⚡","title":"فوری میچنگ","desc":"دلچسپی ٹیگ سے صحیح ہوسٹ۔"}]},"stats":[{"num":"صرف خواتین","label":"تمام ہوسٹس تصدیق شدہ خواتین ہیں"},{"num":"₹2.50–4.00","label":"ہوسٹ کی منٹ آمدنی"},{"num":"70%","label":"ہوسٹس کے لیے آمدنی کا حصہ"},{"num":"₹99+","label":"کوائن پیک شروعاتی قیمت"}],"pricing":{"label":"کوائن پیک","title":"کوائنز خریدیں،\\nکال کریں","cards":[{"id":"base","pill":"بیس","amount":"₹49","coins":"50 کوائنز","points":["₹0.98 فی کوائن","10 منٹ کال","پہلی خریداری"],"cta":"خریدیں"},{"id":"starter","pill":"اسٹارٹر","amount":"₹99","coins":"120 کوائنز","points":["₹0.83 فی کوائن","24 منٹ کال","انٹری پیک"],"cta":"خریدیں"},{"id":"popular","pill":"مشہور 🔥","amount":"₹199","coins":"250 کوائنز","points":["₹0.80 فی کوائن","50 منٹ کال","سب سے زیادہ منتخب"],"cta":"خریدیں"},{"id":"value","pill":"ویلیو","amount":"₹399","coins":"550 کوائنز","points":["₹0.73 فی کوائن","110 منٹ کال","بہترین ڈیل"],"cta":"خریدیں"},{"id":"pro","pill":"پرو","amount":"₹799","coins":"1,200 کوائنز","points":["₹0.67 فی کوائن","4 گھنٹے کال","پاور یوزر"],"cta":"خریدیں"}]},{"pill":"مشہور","amount":"₹449","coins":"500 کوائنز","points":["10% بونس کوائنز","100 منٹ عام کال","سب سے زیادہ فروخت"],"cta":"خریدیں"},{"pill":"بہترین قدر","amount":"₹999","coins":"1,200 کوائنز","points":["20% بونس کوائنز","4 گھنٹے عام کال","بہترین ڈیل"],"cta":"خریدیں"},{"pill":"پریمیم","amount":"₹1,999","coins":"2,500 کوائنز","points":["25% بونس کوائنز","8+ گھنٹے عام کال","VIP بیج"],"cta":"خریدیں"}]},"tiers":{"label":"ہوسٹ پروگرام","title":"دو سطحیں۔\\nزیادہ آمدنی۔","lead":"تمام فرینڈو ہوسٹس تصدیق شدہ خواتین ہیں۔","normal":{"badge":"عام ہوسٹ","title":"⭐ عام ہوسٹ","earnSub":"صارف ₹5/منٹ ادا کرتا ہے · آپ ₹3 حاصل کریں گے","points":["₹3/منٹ کمائیں","4.0★ ریٹنگ درکار ہے","50+ منٹ سطح تبدیلی","بنیادی میچنگ"]},"star":{"badge":"اسٹار ہوسٹ","title":"👑 اسٹار ہوسٹ","earnSub":"صارف ₹10/منٹ ادا کرتا ہے · آپ ₹4.5 حاصل کریں گے","points":["₹4.5/منٹ کمائیں","ترجیحی میچنگ","گولڈ بیج","خصوصی ہوسٹ ایونٹس"]}};document.addEventListener('DOMContentLoaded',function(){var saved=localStorage.getItem('friendoo_lang');if(saved&&I18N[saved])currentLang=saved;applyTranslations();});
// Fix form.field.* key lookup — build nested field:{} from flat "field.x" keys
['en','hi','ta','te','kn','ml','ur'].forEach(function(lang){
  var f=I18N[lang]&&I18N[lang].form;if(!f)return;
  f.field={name:f['field.name']||'',city:f['field.city']||'',phone:f['field.phone']||'',lang:f['field.lang']||'',about:f['field.about']||''};
});
// Boot
(function(){
  var saved=localStorage.getItem('friendoo_lang');
  currentLang=(saved&&I18N[saved])?saved:'en';
  var sel=document.getElementById('langBarSelect');if(sel)sel.value=currentLang;
  applyTranslations();
})();
</script>
<script type="module" src="/call-story-3d.js"></script>
<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js/vce701823e78c4301a35b7e07294d87301792088814092" integrity="sha512-UKNk8GbxkABxKcXYuLkO16EleLGUkcvJWtpSNmExE0Too3ZaFAxTscNWEc1OdAv5/BikHawapSCaiD2XCmp+Bw==" data-cf-beacon='{"version":"2024.11.0","token":"062387447fe240f1964b9a4844f57a23","r":1,"spa":2}' crossorigin="anonymous"></script>
</body></html>











`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  }

  return new Response(HTML_DOCUMENT, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
