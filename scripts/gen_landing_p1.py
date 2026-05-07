import os, json
os.makedirs('d:/friendoo-monorepo/docs', exist_ok=True)

head = """<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Friendoo \u2014 India's Female Host Social Platform</title>
<meta name="description" content="Friendoo connects users with verified female hosts for real conversations via chat and voice calls.">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--brand:#7c5cff;--teal:#18c6b8;--pink:#ff7ab6;--dark:#060810;--panel:rgba(255,255,255,.05);--border:rgba(255,255,255,.08);--muted:rgba(255,255,255,.5);--r:22px}
*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
body{font-family:'Space Grotesk',sans-serif;background:var(--dark);color:#fff;line-height:1.7;overflow-x:hidden}
a{color:inherit;text-decoration:none}
.lang-bar{background:rgba(255,255,255,.03);border-bottom:1px solid var(--border);padding:8px 6vw;display:flex;gap:8px;align-items:center;justify-content:flex-end;flex-wrap:wrap}
.lang-bar>span{color:var(--muted);font-size:12px;margin-right:6px}
.lang-btn{padding:5px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.15);background:transparent;color:rgba(255,255,255,.6);font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;transition:all .2s}
.lang-btn:hover,.lang-btn.active{background:linear-gradient(135deg,var(--brand),var(--pink));color:#fff;border-color:transparent}
nav{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:14px 6vw;background:rgba(6,8,16,.92);backdrop-filter:blur(16px);border-bottom:1px solid var(--border)}
.logo{display:flex;align-items:center;gap:12px;font-weight:800;font-size:20px}.logo svg{width:36px;height:36px}
.nav-right{display:flex;gap:22px;align-items:center}.nav-right a{color:var(--muted);font-size:14px}.nav-right a:hover{color:#fff}
.btn{display:inline-block;padding:10px 22px;border-radius:999px;font-weight:700;font-size:14px;font-family:inherit;background:linear-gradient(135deg,var(--brand),var(--pink));color:#fff;border:none;cursor:pointer;transition:transform .2s}.btn:hover{transform:translateY(-2px)}
.btn-lg{padding:16px 36px;font-size:16px}.btn-outline{background:transparent!important;color:#fff!important;border:1.5px solid rgba(255,255,255,.25)!important}
.view{display:none}.view:target{display:block}
body:not(:has(.view:target)) #home-view{display:block}
.hero{min-height:100vh;display:flex;flex-direction:column;justify-content:flex-end;padding:0 6vw 80px;position:relative;background:var(--dark);overflow:hidden}
.hero-bg{position:absolute;inset:0;z-index:0;background:radial-gradient(ellipse 80% 60% at 70% 40%,rgba(124,92,255,.22) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 20% 70%,rgba(255,122,182,.14) 0%,transparent 55%)}
.hero-content{position:relative;z-index:2}
.hero-eyebrow{display:inline-flex;align-items:center;gap:10px;padding:10px 16px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:999px;font-size:13px;color:rgba(255,255,255,.7);margin-bottom:24px}
.hero-eyebrow>span{width:8px;height:8px;border-radius:50%;background:var(--teal);display:inline-block}
.hero-heading{font-size:clamp(50px,10vw,120px);font-weight:800;line-height:.92;letter-spacing:-3px;max-width:1000px}
.cycle-wrapper{display:inline-block;overflow:hidden;vertical-align:bottom;height:1em}
.cycle-text{display:flex;flex-direction:column;animation:cycle 3.6s infinite ease-in-out}
.cycle-text span{display:block;height:1em;line-height:1;background:linear-gradient(135deg,#fff 0%,#c7b8ff 40%,#ff7ab6 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
@keyframes cycle{0%,18%{transform:translateY(0)}25%,43%{transform:translateY(-1em)}50%,68%{transform:translateY(-2em)}75%,93%{transform:translateY(-3em)}100%{transform:translateY(-4em)}}
.hero-sub{color:var(--muted);font-size:clamp(16px,2vw,20px);max-width:520px;margin-top:28px;margin-bottom:36px}
.hero-actions{display:flex;gap:14px;flex-wrap:wrap}
.ticker-wrap{overflow:hidden;background:rgba(255,255,255,.04);border-top:1px solid rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.06);padding:18px 0;white-space:nowrap}
.ticker-track{display:inline-flex;gap:64px;animation:ticker 22s linear infinite}
.ticker-item{color:var(--muted);font-size:14px;font-weight:600}.ticker-sep{color:var(--brand);font-size:18px}
@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
section{padding:80px 6vw}.label{display:inline-block;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--brand);font-weight:700;margin-bottom:14px}
h2{font-size:clamp(34px,5.5vw,68px);font-weight:800;line-height:1;letter-spacing:-2px}.section-lead{color:rgba(255,255,255,.6);font-size:17px;max-width:560px;margin-top:16px}
.features-marquee{display:flex;gap:18px;overflow:hidden;margin-top:48px}.features-marquee-inner{display:flex;gap:18px;flex-shrink:0;animation:marq 24s linear infinite}
@keyframes marq{from{transform:translateX(0)}to{transform:translateX(-100%)}}
.feat-card{flex-shrink:0;width:290px;padding:28px;background:var(--panel);border:1px solid var(--border);border-radius:var(--r)}.feat-icon{font-size:34px;margin-bottom:14px}.feat-card h3{font-size:18px;margin-bottom:8px}.feat-card p{color:var(--muted);font-size:14px;line-height:1.6}
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:48px}.stat-box{padding:28px 22px;background:var(--panel);border:1px solid var(--border);border-radius:var(--r)}
.stat-num{font-size:clamp(36px,4.5vw,52px);font-weight:800;letter-spacing:-2px;background:linear-gradient(135deg,white,#b8c2ff);-webkit-background-clip:text;background-clip:text;color:transparent}.stat-label{color:var(--muted);font-size:13px;margin-top:6px}
.tier-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:36px}.tier-card{padding:32px;background:var(--panel);border:1px solid var(--border);border-radius:var(--r)}
.tier-card.gold{background:linear-gradient(160deg,rgba(255,215,0,.15),rgba(255,122,182,.08));border-color:rgba(255,215,0,.4)}
.badge{display:inline-block;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:700;background:rgba(255,255,255,.08);color:rgba(255,255,255,.75);margin-bottom:16px}
.earn{font-size:42px;font-weight:800;letter-spacing:-2px;margin:14px 0 6px;background:linear-gradient(135deg,#fff,#ffd700);-webkit-background-clip:text;background-clip:text;color:transparent}
.earn-sub{color:var(--muted);font-size:14px}.tier-card ul{padding-left:20px;color:rgba(255,255,255,.7);font-size:15px;line-height:2}
.steps-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:36px}.step-card{padding:24px;background:var(--panel);border:1px solid var(--border);border-radius:var(--r);text-align:center}
.step-num{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--brand),var(--pink));display:grid;place-items:center;font-size:20px;font-weight:800;margin:0 auto 14px}
.potential-section{background:linear-gradient(135deg,rgba(124,92,255,.14),rgba(255,122,182,.10),rgba(24,198,184,.10));border:1px solid var(--border);border-radius:32px;padding:48px}
.potential-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:32px}.potential-card{padding:24px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:20px}.potential-card h4{font-size:20px;margin-bottom:14px}
.potential-card table{width:100%;font-size:14px;color:rgba(255,255,255,.75)}.potential-card td{padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)}.potential-card td:last-child{text-align:right;font-weight:700;color:#fff}
.prob-bar{margin-top:6px;height:6px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden}.prob-fill{height:100%;border-radius:999px}.prob-label{display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-top:6px}
.calc-section{background:linear-gradient(135deg,rgba(124,92,255,.14),rgba(255,122,182,.10),rgba(24,198,184,.10));border:1px solid var(--border);border-radius:32px;padding:48px}
.calc-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:32px}.calc-input label{display:block;font-size:12px;color:var(--muted);margin-bottom:8px}
.calc-input input,.calc-input select{width:100%;padding:14px 16px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:14px;color:#fff;font-family:inherit;font-size:15px;font-weight:700;outline:none}select option{background:#1a2040}
.calc-output-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:24px}.calc-out-box{padding:20px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);border-radius:16px}.calc-out-box .num{font-size:28px;font-weight:800;letter-spacing:-1px}.calc-out-box .lbl{font-size:12px;color:var(--muted);margin-top:4px}
.pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:44px}.price-card{padding:28px;background:var(--panel);border:1px solid var(--border);border-radius:var(--r)}.price-card.hot{background:linear-gradient(160deg,rgba(124,92,255,.20),rgba(255,122,182,.12));border-color:rgba(124,92,255,.45)}
.pill{display:inline-block;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:700;background:linear-gradient(135deg,var(--brand),var(--pink));color:#fff;margin-bottom:18px}.price-card .amount{font-size:46px;font-weight:800;letter-spacing:-2px;margin:8px 0 3px}.price-card .coins{font-size:15px;color:var(--muted);margin-bottom:18px}.price-card ul{padding-left:18px}.price-card li{color:rgba(255,255,255,.65);font-size:13px;line-height:2}
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
@media(max-width:900px){.stats-row,.tier-grid,.steps-grid,.potential-grid,.calc-grid,.pricing-grid,.form-grid,.calc-output-row{grid-template-columns:1fr}.hero-heading{letter-spacing:-1.5px}.nav-right a:not(:last-child){display:none}.cta-band,.lang-bar{justify-content:center;text-align:center}}
</style></head><body>"""

with open('d:/friendoo-monorepo/docs/index.html', 'w', encoding='utf-8') as f:
    f.write(head)
print('Part 1 done', len(head))
