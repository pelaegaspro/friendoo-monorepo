body_html = """<div class="lang-bar"><span>Select Language:</span>
<button class="lang-btn active" data-lang="en" onclick="switchLang('en')">English</button>
<button class="lang-btn" data-lang="hi" onclick="switchLang('hi')">&#2361;&#2367;&#2306;&#2342;&#2368;</button>
<button class="lang-btn" data-lang="ta" onclick="switchLang('ta')">&#2980;&#2990;&#3007;&#2996;&#3021;</button>
<button class="lang-btn" data-lang="te" onclick="switchLang('te')">&#3108;&#3142;&#3122;&#3137;&#3095;&#3137;</button>
<button class="lang-btn" data-lang="kn" onclick="switchLang('kn')">&#3221;&#3240;&#3277;&#3240;&#3233;</button>
<button class="lang-btn" data-lang="ml" onclick="switchLang('ml')">&#3374;&#3378;&#3375;&#3390;&#3379;&#3330;</button>
<button class="lang-btn" data-lang="ur" onclick="switchLang('ur')">&#1575;&#1585;&#1583;&#1608;</button>
</div>
<nav>
<a class="logo" href="#home"><svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="28" fill="url(#ng)"/><defs><linearGradient id="ng" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#7c5cff"/><stop offset="1" stop-color="#ff7ab6"/></linearGradient></defs><circle cx="36" cy="42" r="13" fill="white"/><circle cx="64" cy="42" r="13" fill="white"/><path d="M50 80C68 80 82 66 82 50V46H18V50C18 66 32 80 50 80Z" fill="white"/><path d="M28 26C36 17 64 17 72 26" stroke="#18C6B8" stroke-width="7" stroke-linecap="round"/></svg>Friendoo</a>
<div class="nav-right"><a href="#features" data-t="nav.features">Features</a><a href="#tiers" data-t="nav.tiers">Host Tiers</a><a href="#pricing" data-t="nav.pricing">Coins</a><a href="#apply" data-t="nav.apply">Apply</a><a href="#privacy">Privacy</a><a href="#terms">Terms</a><a class="btn" href="#apply" data-t="nav.join">Join as Host</a></div>
</nav>
<div id="home-view" class="view">
<section class="hero"><div class="hero-bg"></div><div class="hero-content">
<div class="hero-eyebrow"><span></span><span data-t="hero.eyebrow">Female hosts only &middot; Verified &middot; Safe &middot; India-first</span></div>
<h1 class="hero-heading">Real conversations<br>with <span class="cycle-wrapper"><span class="cycle-text" id="cycleText"><span>real women</span><span>verified hosts</span><span>earn coins</span><span>Friendoo</span><span>real women</span></span></span></h1>
<p class="hero-sub" data-t="hero.sub">Friendoo connects you with verified female hosts. Hosts earn &#8377;3/min as Normal, &#8377;4.5/min as Star.</p>
<div class="hero-actions"><a class="btn btn-lg" href="#apply" data-t="hero.cta1">Join as Host</a><a class="btn btn-lg btn-outline" href="#tiers" data-t="hero.cta2">See earnings</a></div>
</div></section>
<div class="ticker-wrap"><div class="ticker-track" id="tickerTrack"><span class="ticker-item">Female Hosts Only</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Verified Profiles</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">&#8377;3/min Normal</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">&#8377;4.5/min Star</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">UPI Payments</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Real-time Chat</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Voice Calls</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">India-first</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Safe Platform</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Host Earnings</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Female Hosts Only</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Verified Profiles</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">&#8377;3/min Normal</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">&#8377;4.5/min Star</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">UPI Payments</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Real-time Chat</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Voice Calls</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">India-first</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Safe Platform</span><span class="ticker-sep">&#10022;</span><span class="ticker-item">Host Earnings</span><span class="ticker-sep">&#10022;</span></div></div>
<section id="features"><span class="label" data-t="features.label">What's inside</span><h2 data-t="features.title">Built for real connections</h2><div class="features-marquee"><div class="features-marquee-inner" id="featInner1"></div><div class="features-marquee-inner" id="featInner2" aria-hidden="true"></div></div></section>
<section><div class="stats-row" id="statsRow"></div></section>
<section id="tiers"><span class="label" data-t="tiers.label">Host program</span><h2 data-t="tiers.title">Two tiers.<br>More earnings.</h2><p class="section-lead" data-t="tiers.lead">All Friendoo hosts are verified females.</p>
<div class="tier-grid"><div class="tier-card"><span class="badge" data-t="tiers.normal.badge">Normal Host</span><h3 data-t="tiers.normal.title">&#127775; Normal Host</h3><div class="earn">&#8377;3<span style="font-size:20px;color:var(--muted)">/min</span></div><div class="earn-sub" data-t="tiers.normal.earnSub">User pays &#8377;5/min &middot; You keep &#8377;3</div><ul id="normalPoints"></ul></div>
<div class="tier-card gold"><span class="badge" style="background:rgba(255,215,0,.2);color:#ffd700" data-t="tiers.star.badge">Star Host</span><h3 data-t="tiers.star.title">&#128081; Star Host</h3><div class="earn" style="background:linear-gradient(135deg,#ffd700,#ffaa00);-webkit-background-clip:text;background-clip:text;color:transparent">&#8377;4.5<span style="font-size:20px;color:var(--muted)">/min</span></div><div class="earn-sub" data-t="tiers.star.earnSub">User pays &#8377;10/min (offer &#8377;7) &middot; You keep &#8377;4.5</div><ul id="starPoints"></ul></div></div>
<div style="margin-top:48px"><span class="label" data-t="steps.label">Upgrade path</span><h2 data-t="steps.title">How to become a Star Host</h2><div class="steps-grid" id="stepsGrid"></div></div></section>
<section><div class="potential-section"><span class="label" data-t="potential.label">Realistic estimates</span><h2 data-t="potential.title">Your earning potential</h2><p class="section-lead" data-t="potential.lead">Conservative estimates.</p><div class="potential-grid" id="potentialGrid"></div></div></section>
<section><div class="calc-section"><span class="label">Earnings calculator</span><h2>Calculate your monthly income</h2><div class="calc-grid">
<div class="calc-input"><label>Host tier</label><select id="tier"><option value="3">Normal Host (&#8377;3/min)</option><option value="4.5">Star Host (&#8377;4.5/min)</option></select></div>
<div class="calc-input"><label>Active days / month</label><input type="number" id="days" value="20" min="1" max="31"></div>
<div class="calc-input"><label>Call hours per day</label><input type="number" id="hours" value="2" min="0.5" max="12" step="0.5"></div>
<div class="calc-input"><label>Average call length (mins)</label><input type="number" id="avgMin" value="15" min="1" max="60"></div></div>
<div class="calc-output-row"><div class="calc-out-box"><div class="num" id="cCalls">40</div><div class="lbl">Calls per month</div></div><div class="calc-out-box"><div class="num" id="cMinutes">600</div><div class="lbl">Total minutes</div></div><div class="calc-out-box"><div class="num" id="cEarnings" style="background:linear-gradient(135deg,#7c5cff,#18c6b8);-webkit-background-clip:text;background-clip:text;color:transparent">&#8377;1,800</div><div class="lbl">Monthly earnings</div></div></div></div></section>
<section id="hosts"><span class="label" data-t="hosts.label">Verified hosts</span><h2 data-t="hosts.title">Meet our hosts</h2><div class="host-visual" id="hostVisual"></div></section>
<section id="pricing"><span class="label" data-t="pricing.label">Coin packs</span><h2 data-t="pricing.title">Buy coins,<br>unlock calls</h2><div class="pricing-grid" id="pricingGrid"></div></section>
<section id="apply"><div class="form-section">
<span class="label" data-t="form.label">Join as Host</span><h2 data-t="form.title">Apply to become a Friendoo host</h2>
<p class="section-lead" data-t="form.lead">Only female applicants accepted. Our team will review your application within 48 hours.</p>
<div style="background:rgba(255,122,182,.1);border:1px solid rgba(255,122,182,.3);border-radius:14px;padding:16px 20px;margin:20px 0;color:rgba(255,255,255,.85);font-size:14px">&#128161; Host earnings start only after verification. Paid weekly via UPI.</div>
<form class="form-grid" id="hostForm">
<div><label class="form-label">Full name</label><input type="text" name="name" placeholder="Your full name" required></div>
<div><label class="form-label">City</label><input type="text" name="city" placeholder="Mumbai, Chennai&#8230;" required></div>
<div><label class="form-label">Phone / WhatsApp</label><input type="tel" name="phone" placeholder="+91XXXXXXXXXX" required></div>
<div><label class="form-label">Primary language</label><select name="language" id="langSelect"><option>Hindi</option><option>Tamil</option><option>Telugu</option><option>Kannada</option><option>Malayalam</option><option>Urdu</option></select></div>
<div class="form-full"><label class="form-label">Why do you want to join as a host?</label><textarea name="about" placeholder="I love talking about movies and music&#8230;"></textarea></div>
<div class="form-full"><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px"><input type="checkbox" id="confirm" required style="width:auto"><label for="confirm" style="display:inline;color:rgba(255,255,255,.7);font-size:14px">I confirm I am 18+ female and agree to the Terms of Service and Privacy Policy</label></div>
<button type="submit" class="btn btn-lg" id="submitBtn" style="width:100%;text-align:center;border-radius:14px">Submit application</button>
<div class="success-msg" id="successMsg">&#9989; Application received! Our team will review your profile and contact you on WhatsApp within 48 hours.</div>
<div class="error-msg" id="errorMsg">&#10060; Something went wrong. Please try again or contact support@friendoo.app</div>
</div></form></div></section>
<div class="cta-band"><div><h2>Ready to earn as a Friendoo host?</h2><p style="color:var(--muted);margin-top:10px;font-size:15px">Verified female hosts earn &#8377;3&#8211;4.5 per minute.</p></div><div style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn-lg" href="#apply">Join as Host</a><a class="btn btn-lg btn-outline" href="mailto:support@friendoo.app">Contact us</a></div></div>
</div>"""

with open('d:/friendoo-monorepo/docs/index.html', 'a', encoding='utf-8') as f:
    f.write(body_html)
print('Part 2 done', len(body_html))
