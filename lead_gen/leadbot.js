/**
 * SuiteSubscription Lead Capture Bot
 * Captures name, email, phone, location — sends via EmailJS
 */

(function () {
  const EMAILJS_PUBLIC_KEY      = 'yPHimPafzP_FD_bEr';
  const EMAILJS_SERVICE_ID      = 'service_lbxsr09';
  const EMAILJS_ADMIN_TEMPLATE  = 'template_z1n7vk8';  // notifies info@suitesubscription.com
  const EMAILJS_CONFIRM_TEMPLATE = 'template_4kzfuva'; // confirmation sent to the lead
  const LOCATIONS = ['South Atlanta', 'Riverdale', 'Macon'];
  const DELAY_MS  = 8000;

  // Ensure EmailJS is initialized
  if (window.emailjs) {
    window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  // ─── STYLES ─────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #ss-bot-bubble {
      position: fixed; bottom: 2rem; right: 2rem; z-index: 9999;
      width: 60px; height: 60px; border-radius: 50%;
      background: #F5E642; box-shadow: 0 4px 20px rgba(245,230,66,0.4);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      font-size: 1.6rem; transition: transform 0.2s;
      animation: ss-bounce 2s infinite;
    }
    #ss-bot-bubble:hover { transform: scale(1.1); }
    @keyframes ss-bounce {
      0%,100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    #ss-bot-panel {
      position: fixed; bottom: 6.5rem; right: 2rem; z-index: 9999;
      width: 320px; background: #fff; border-radius: 12px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.15); overflow: hidden;
      display: none; flex-direction: column;
      font-family: 'DM Sans', sans-serif;
      animation: ss-slideup 0.3s ease;
    }
    #ss-bot-panel.open { display: flex; }
    @keyframes ss-slideup {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .ss-header {
      background: #111; color: #F5E642; padding: 1rem 1.25rem;
      display: flex; align-items: center; justify-content: space-between;
    }
    .ss-header-text strong { display: block; font-size: 0.95rem; }
    .ss-header-text span { font-size: 0.75rem; color: #bbb; }
    .ss-close { background: none; border: none; color: #F5E642; font-size: 1.2rem; cursor: pointer; line-height: 1; }
    .ss-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .ss-msg {
      background: #f5f5f5; border-radius: 8px 8px 8px 0;
      padding: 0.75rem 1rem; font-size: 0.85rem; color: #333; line-height: 1.5;
      max-width: 85%;
    }
    .ss-input {
      width: 100%; border: 1px solid #ddd; border-radius: 6px;
      padding: 0.65rem 0.9rem; font-size: 0.88rem; font-family: inherit;
      outline: none; transition: border-color 0.2s;
    }
    .ss-input:focus { border-color: #F5E642; }
    .ss-select {
      width: 100%; border: 1px solid #ddd; border-radius: 6px;
      padding: 0.65rem 0.9rem; font-size: 0.88rem; font-family: inherit;
      outline: none; background: #fff; -webkit-appearance: none;
      transition: border-color 0.2s;
    }
    .ss-select:focus { border-color: #F5E642; }
    .ss-btn {
      width: 100%; background: #F5E642; color: #111; border: none;
      padding: 0.75rem; border-radius: 6px; font-size: 0.9rem;
      font-weight: 700; font-family: inherit; cursor: pointer;
      text-transform: uppercase; letter-spacing: 0.05em;
      transition: background 0.2s;
    }
    .ss-btn:hover { background: #FFF176; }
    .ss-error {
      color: #e53e3e; font-size: 0.8rem; display: none; text-align: center;
    }
    .ss-success {
      padding: 1.5rem 1.25rem; text-align: center;
    }
    .ss-success .ss-check { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .ss-success h4 { font-size: 1rem; font-weight: 700; margin-bottom: 0.4rem; }
    .ss-success p { font-size: 0.82rem; color: #666; line-height: 1.5; }
    .ss-dot { width: 8px; height: 8px; background: #F5E642; border-radius: 50%; display: inline-block; margin-right: 4px; animation: ss-pulse 1.5s infinite; }
    @keyframes ss-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  `;
  document.head.appendChild(style);

  // ─── HTML ────────────────────────────────────────────
  const bubble = document.createElement('div');
  bubble.id = 'ss-bot-bubble';
  bubble.innerHTML = '💬';
  document.body.appendChild(bubble);

  const panel = document.createElement('div');
  panel.id = 'ss-bot-panel';
  panel.innerHTML = `
    <div class="ss-header">
      <div class="ss-header-text">
        <strong>SuiteSubscription 👑</strong>
        <span><span class="ss-dot"></span>We're here 24/7</span>
      </div>
      <button class="ss-close" id="ss-close-btn">✕</button>
    </div>
    <div class="ss-body" id="ss-form-body">
      <div class="ss-msg">Hey! 👋 Ready to get access to a premium salon suite near you? Drop your info below and we'll reach out right away.</div>
      <input class="ss-input" id="ss-name"  type="text"  placeholder="Your Name" />
      <input class="ss-input" id="ss-email" type="email" placeholder="Email Address" />
      <input class="ss-input" id="ss-phone" type="tel"   placeholder="Phone Number" />
      <select class="ss-select" id="ss-location">
        <option value="">Which location interests you?</option>
        ${LOCATIONS.map(l => `<option value="${l}">${l}, GA</option>`).join('')}
      </select>
      <div class="ss-error" id="ss-error">Please fill in all fields.</div>
      <button class="ss-btn" id="ss-submit-btn">Get Suite Access →</button>
    </div>
    <div class="ss-success" id="ss-success-body" style="display:none;">
      <div class="ss-check">✅</div>
      <h4>You're on the list!</h4>
      <p>We'll reach out within 24 hours about your suite in <strong id="ss-chosen-location"></strong>. Get ready to grow your business! 👑</p>
    </div>
  `;
  document.body.appendChild(panel);

  // ─── LOGIC ───────────────────────────────────────────
  bubble.addEventListener('click', () => panel.classList.toggle('open'));
  document.getElementById('ss-close-btn').addEventListener('click', () => panel.classList.remove('open'));

  document.getElementById('ss-submit-btn').addEventListener('click', async () => {
    const name     = document.getElementById('ss-name').value.trim();
    const email    = document.getElementById('ss-email').value.trim();
    const phone    = document.getElementById('ss-phone').value.trim();
    const location = document.getElementById('ss-location').value;
    const errEl    = document.getElementById('ss-error');

    if (!name || !email || !location) {
      errEl.style.display = 'block';
      return;
    }
    errEl.style.display = 'none';

    const btn = document.getElementById('ss-submit-btn');
    btn.textContent = 'Sending...';
    btn.disabled = true;

    let sent = false;
    try {
      // 1. Notify SuiteSubscription team
      await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_ADMIN_TEMPLATE, {
        to_email:    'info@suitesubscription.com',
        to_name:     'SuiteSubscription Team',
        conf_num:    'LEAD-BOT',
        member_name: name,
        email:       email,
        phone:       phone || 'Not provided',
        plan:        'Lead Bot Inquiry',
        location:    location + ', GA',
        dates:       'N/A',
        notes:       'Source: Website Lead Bot',
        submitted:   new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
      });
      // 2. Send confirmation to the lead
      await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CONFIRM_TEMPLATE, {
        to_email:    email,
        to_name:     name,
        conf_num:    'LEAD-BOT',
        member_name: name,
        plan:        'Suite Access Inquiry',
        location:    location + ', GA',
        dates:       'N/A',
        notes:       "We'll be in touch within 24 hours!",
        phone:       phone || 'Not provided'
      });
      sent = true;
    } catch (e) {
      console.error('EmailJS leadbot error:', e);
      btn.textContent = 'Get Suite Access →';
      btn.disabled = false;
      errEl.textContent = 'Something went wrong. Please try again.';
      errEl.style.display = 'block';
    }

    if (sent) {
      document.getElementById('ss-form-body').style.display = 'none';
      document.getElementById('ss-chosen-location').textContent = location + ', GA';
      document.getElementById('ss-success-body').style.display = 'block';
    }
  });

  // ─── AUTO-SHOW after delay ────────────────────────────
  setTimeout(() => {
    if (!sessionStorage.getItem('ss-bot-opened')) {
      panel.classList.add('open');
      sessionStorage.setItem('ss-bot-opened', '1');
    }
  }, DELAY_MS);

})();
