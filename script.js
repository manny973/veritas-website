/* ============================================================
   VERITAS — shared interactions
   ============================================================ */
(function(){
  'use strict';

  /* ---- sticky nav state ---- */
  var nav = document.querySelector('.nav');
  function onScroll(){
    if(!nav) return;
    if(window.scrollY > 24) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* ---- mobile menu ---- */
  var toggle = document.querySelector('.nav-toggle');
  var menu   = document.querySelector('.mobile-menu');
  var scrim  = document.querySelector('.scrim');
  function setMenu(open){
    if(!menu) return;
    menu.classList.toggle('open', open);
    if(scrim) scrim.classList.toggle('open', open);
    if(toggle) toggle.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if(toggle) toggle.addEventListener('click', function(){ setMenu(!menu.classList.contains('open')); });
  if(scrim) scrim.addEventListener('click', function(){ setMenu(false); });
  if(menu) menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });

  /* ---- scroll reveal (rect-based; reliable across environments) ----
     Add `.r` to <html> synchronously, then immediately reveal in-view items
     in the SAME task so the browser never paints a hidden frame. */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  document.documentElement.classList.add('r');
  function checkReveals(){
    var vh = window.innerHeight || document.documentElement.clientHeight;
    for(var i=reveals.length-1; i>=0; i--){
      var el = reveals[i];
      var r = el.getBoundingClientRect();
      if(r.top < vh * 0.92 && r.bottom > 0){
        el.classList.add('in');
        reveals.splice(i,1);
      }
    }
  }
  checkReveals();
  requestAnimationFrame(checkReveals);
  setTimeout(checkReveals, 150);
  window.addEventListener('scroll', checkReveals, {passive:true});
  window.addEventListener('resize', checkReveals);
  window.addEventListener('load', checkReveals);
  /* safety net: never leave content hidden for long */
  setTimeout(function(){ reveals.forEach(function(el){ el.classList.add('in'); }); }, 1100);

  /* ---- animated counters ---- */
  function animateCount(el){
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var prefix = el.getAttribute('data-prefix') || '';
    var dec = (el.getAttribute('data-dec')|0);
    var dur = 1400, start = performance.now();
    function step(now){
      var p = Math.min((now-start)/dur, 1);
      var eased = 1 - Math.pow(1-p, 3);
      var val = target * eased;
      el.textContent = prefix + (dec ? val.toFixed(dec) : Math.round(val)) + suffix;
      if(p<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  function checkCounters(){
    var vh = window.innerHeight || document.documentElement.clientHeight;
    for(var i=counters.length-1; i>=0; i--){
      var el = counters[i];
      var r = el.getBoundingClientRect();
      if(r.top < vh * 0.9 && r.bottom > 0){ animateCount(el); counters.splice(i,1); }
    }
  }
  checkCounters();
  window.addEventListener('scroll', checkCounters, {passive:true});
  window.addEventListener('load', checkCounters);

  /* ---- service detail accordion (services page) ---- */
  document.querySelectorAll('[data-accordion] .acc-head').forEach(function(head){
    head.addEventListener('click', function(){
      var item = head.closest('.acc-item');
      var open = item.classList.contains('open');
      item.closest('[data-accordion]').querySelectorAll('.acc-item').forEach(function(i){ i.classList.remove('open'); });
      if(!open) item.classList.add('open');
    });
  });

  /* ---- contact form validation ---- */
  var form = document.querySelector('#lead-form');
  if(form){
    var fields = form.querySelectorAll('[required]');
    function validateField(f){
      var ok = true, val = (f.value||'').trim();
      if(!val) ok = false;
      else if(f.type==='email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      var wrap = f.closest('.field');
      if(wrap) wrap.classList.toggle('invalid', !ok);
      return ok;
    }
    fields.forEach(function(f){
      f.addEventListener('blur', function(){ if((f.value||'').trim()) validateField(f); });
      f.addEventListener('input', function(){
        var wrap = f.closest('.field');
        if(wrap && wrap.classList.contains('invalid')) validateField(f);
      });
    });
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var allOk = true;
      fields.forEach(function(f){ if(!validateField(f)) allOk = false; });
      if(!allOk){
        var firstBad = form.querySelector('.field.invalid input, .field.invalid textarea, .field.invalid select');
        if(firstBad) firstBad.focus();
        return;
      }

      var get = function(n){ var el = form.querySelector('[name="'+n+'"]'); return el ? el.value.trim() : ''; };
      var submitBtn = form.querySelector('[type="submit"]');
      var errorBox  = document.querySelector('#form-error');
      var success   = document.querySelector('#form-success');

      // honeypot: if a bot filled the hidden field, silently "succeed"
      if(get('company_website')){
        if(success){ form.style.display='none'; success.classList.add('show'); }
        return;
      }

      function showError(msg){
        if(errorBox){
          errorBox.querySelector('.fe-msg').innerHTML = msg;
          errorBox.classList.add('show');
        }
      }
      function buildMailto(){
        var subject = 'New inquiry — ' + (get('company') || get('name') || 'Website');
        var body = [
          'Name: ' + get('name'),
          'Company: ' + get('company'),
          'Email: ' + get('email'),
          'Phone: ' + get('phone'),
          'Company size: ' + get('size'),
          'Service of interest: ' + get('service'),
          '', 'Message:', get('message')
        ].join('\n');
        return 'mailto:info@veritascybersec.com?subject=' + encodeURIComponent(subject) +
               '&body=' + encodeURIComponent(body);
      }

      if(errorBox) errorBox.classList.remove('show');
      if(submitBtn){ submitBtn.classList.add('is-loading'); submitBtn.disabled = true; }

      var endpoint = form.getAttribute('action') || 'contact.php';
      var data = new FormData(form);

      fetch(endpoint, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      })
      .then(function(res){
        return res.json().catch(function(){ throw new Error('bad-json'); })
          .then(function(json){ return { ok: res.ok && json && json.ok, json: json }; });
      })
      .then(function(result){
        if(result.ok){
          if(success){
            form.style.display = 'none';
            success.classList.add('show');
          }
        } else {
          throw new Error((result.json && result.json.error) || 'send-failed');
        }
      })
      .catch(function(){
        // Server unreachable or misconfigured — don't lose the lead.
        if(submitBtn){ submitBtn.classList.remove('is-loading'); submitBtn.disabled = false; }
        showError('We couldn\'t send that automatically. Please email us at ' +
          '<a href="mailto:info@veritascybersec.com">info@veritascybersec.com</a> ' +
          'or <a href="' + buildMailto() + '">click here to open a pre-filled email</a>. ' +
          'You can also call <a href="tel:+18132791957">813.279.1957</a>.');
      });
    });
  }

  /* ---- year stamp ---- */
  document.querySelectorAll('[data-year]').forEach(function(el){ el.textContent = new Date().getFullYear(); });

})();
