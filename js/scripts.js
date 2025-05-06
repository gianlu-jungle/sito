/*
 * Start Bootstrap - Agency v7.0.12 (https://startbootstrap.com/theme/agency)
 * Copyright 2013-2023 Start Bootstrap
 * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-agency/blob/master/LICENSE)
 */

let allTools = [];

fetch('tools.json')
  .then(r => r.json())
  .then(data => {
    allTools = data;
  });


// Main scripts
window.addEventListener('DOMContentLoaded', event => {
  // Navbar shrink function
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('✅ Service Worker registrato'))
      .catch(err => console.warn('❌ Errore SW:', err));
  }
  const navbarShrink = () => {
    const navbarCollapsible = document.body.querySelector('#mainNav');
    if (!navbarCollapsible) return;
    if (window.scrollY === 0) {
      navbarCollapsible.classList.remove('navbar-shrink');
    } else {
      navbarCollapsible.classList.add('navbar-shrink');
    }
  };
  // Shrink the navbar
  navbarShrink();
  document.addEventListener('scroll', navbarShrink);

  // Activate Bootstrap scrollspy
  const mainNav = document.body.querySelector('#mainNav');
  if (mainNav) {
    new bootstrap.ScrollSpy(document.body, {
      target: '#mainNav',
      rootMargin: '0px 0px -40%'
    });
  }

  // Collapse responsive navbar when toggler is visible
  const navbarToggler = document.body.querySelector('.navbar-toggler');
  const responsiveNavItems = [].slice.call(
    document.querySelectorAll('#navbarResponsive .nav-link')
  );
  responsiveNavItems.forEach(item => {
    item.addEventListener('click', () => {
      if (window.getComputedStyle(navbarToggler).display !== 'none') {
        navbarToggler.click();
      }
    });
  });
});

// Utility: normalize ID
function normalizzaId(nome) {
  return nome.toLowerCase()
    .normalize('NFD').replace(/[̀-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
}

// Favorites storage
function getPreferiti() {
  const p = localStorage.getItem('ai-tools-preferiti');
  return p ? JSON.parse(p) : [];
}
function salvaPreferiti(pref) {
  localStorage.setItem('ai-tools-preferiti', JSON.stringify(pref));
}
function togglePreferito(nomeTool) {
  const id = normalizzaId(nomeTool);
  const pref = getPreferiti();
  const idx = pref.indexOf(id);
  if (idx === -1) {
    pref.push(id);
    document.querySelectorAll(`.star-btn[data-id="${id}"]`).forEach(btn => {
      btn.classList.add('active');
      const ic = btn.querySelector('i');
      if (ic) {
        ic.classList.add('animate-star');
        setTimeout(() => ic.classList.remove('animate-star'), 600);
      }
    });
  } else {
    pref.splice(idx, 1);
    document.querySelectorAll(`.star-btn[data-id="${id}"]`).forEach(btn => {
      btn.classList.remove('active');
    });
  }
  salvaPreferiti(pref);
  aggiornaSezionePreferiti();
}

// Reset single section order
function resetOrdineSezione(idSezione) {
  // Remove saved order
  localStorage.removeItem(`ordine-${idSezione}`);
  // Reorder DOM children based on original order stored
  const sezione = document.getElementById(idSezione);
  if (!sezione) return;
  const row = sezione.querySelector('.row');
  if (!row || !row.dataset.originalOrder) return;
  const original = JSON.parse(row.dataset.originalOrder);
  original.forEach(id => {
    const col = Array.from(row.children).find(c => {
      const btn = c.querySelector('.star-btn');
      return btn && btn.dataset.id === id;
    });
    if (col) row.appendChild(col);
  });
}

// Attach reset buttons
function abilitaResetOrdine() {
  document.querySelectorAll('.reset-order-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const idSez = btn.getAttribute('data-sezione-id');
      if (idSez) resetOrdineSezione(idSez);
    });
  });

}

// Enable drag & drop with saving
const sortableMap = new Map(); // fuori dalla funzione, globale o in uno scope condiviso

function abilitaDragSezioniConSalvataggio() {
  document.querySelectorAll('.portfolio-section .row').forEach(row => {
    const sec = row.closest('.portfolio-section');
    if (!sec) return;
    const cat = sec.id;

    // Se già esiste un sortable su questo elemento, lo distrugge prima
    if (sortableMap.has(row)) {
      const existingSortable = sortableMap.get(row);
      existingSortable.destroy();
    }

    const sortable = new Sortable(row, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      chosenClass: 'sortable-chosen',
      delay: 200,
      delayOnTouchOnly: true,
      touchStartThreshold: 10,
      filter: '.star-btn, .portfolio-hover-content',
      preventOnFilter: false,
      onEnd: () => {
        const ids = Array.from(row.children)
          .map(el => {
            const idEl = el.querySelector('.star-btn');
            return idEl?.dataset.id || null;
          })
          .filter(id => id);
        if (ids.length) {
          localStorage.setItem(`ordine-${cat}`, JSON.stringify(ids));
        }
      }
    });

    // Salva l'istanza per evitare duplicati
    sortableMap.set(row, sortable);
  });
}

// Update favorites section
function aggiornaSezionePreferiti() {
  const pref = getPreferiti();
  const secPref = document.getElementById('preferiti-section');
  const navUl = document.querySelector('#navbarResponsive ul') || document.getElementById('nav-dynamic');

  // Rimuove il link “Preferiti” dalla navbar
  function rimuoviLink() {
    const link = navUl.querySelector('a[href="#preferiti-section"]');
    if (link && link.parentElement) {
      navUl.removeChild(link.parentElement);
    }
  }

  // Se non ci sono preferiti, nascondi la sezione e abilita comunque drag & reset
  if (pref.length === 0) {
    if (secPref) secPref.style.display = 'none';
    rimuoviLink();

    abilitaDragSezioniConSalvataggio();
    abilitaResetOrdine();
    return;
  }

  // Se ci sono preferiti, ricava i dettagli e costruisci la sezione
  fetch('tools.json')
    .then(r => r.json())
    .then(data => {
      const toolsP = data.filter(t => pref.includes(normalizzaId(t.nome)));

      // Se dopo il filtro non resta nulla, nascondi e abilita comunque drag & reset
      if (!toolsP.length) {
        if (secPref) secPref.style.display = 'none';
        rimuoviLink();

        abilitaDragSezioniConSalvataggio();
        abilitaResetOrdine();
        return;
      }

      // Crea o riutilizza la section “preferiti-section”
      let section = secPref;
      if (!section) {
        section = document.createElement('section');
        section.classList.add('page-section', 'portfolio-section');
        section.id = 'preferiti-section';
        const container = document.getElementById('tools-sections') || document.body;
        container.insertBefore(section, container.firstChild);
      }
      section.style.display = 'block';

      // HTML della sezione
      section.innerHTML = `
        <div class="container">
          <div class="text-center">
            <h2 class="section-heading text-uppercase">I Tuoi Preferiti</h2>
            <h3 class="section-subheading text-muted">
              Strumenti AI che hai contrassegnato come preferiti
            </h3>
          </div>
          <div class="row g-3"></div>
          <div class="text-end mt-3">
            <button class="btn btn-link reset-order-btn" data-sezione-id="preferiti-section">
              <i class="fas fa-rotate-right"></i> Resetta ordine
            </button>
          </div>
        </div>
      `;

      const row = section.querySelector('.row');
      const savedOrder = JSON.parse(localStorage.getItem('ordine-preferiti-section') || '[]');
      if (savedOrder.length) {
        toolsP.sort((a, b) =>
          savedOrder.indexOf(normalizzaId(a.nome)) -
          savedOrder.indexOf(normalizzaId(b.nome))
        );
      }

      // Mantieni l’ordine originale per il reset
      row.dataset.originalOrder = JSON.stringify(toolsP.map(t => normalizzaId(t.nome)));

      // Popola i tool preferiti
      row.innerHTML = toolsP.map(tool => {
        const id = normalizzaId(tool.nome);
        return `
          <div class="col-4 col-sm-6 col-lg-4 mb-4">
            <div class="portfolio-item">
              <a class="portfolio-link" href="${tool.url}" target="_blank">
                <div class="portfolio-hover">
                  <div class="portfolio-hover-content">
                   <span class="hover-text">Vai</span>
                    <i class="fas fa-arrow-right fa-3x"></i>
                  </div>
                </div>
                <img class="img-fluid" src="${tool.immagine}" alt="${tool.nome}" />
              </a>
              <div class="portfolio-caption">
                <div class="portfolio-caption-heading">${tool.nome}</div>
                <div class="portfolio-caption-subheading text-muted">
                  ${tool.descrizione}
                </div>
                <button class="star-btn active" data-id="${id}">
                  <i class="fas fa-star"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Listener per togliere/aggiungere preferiti
      section.querySelectorAll('.star-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.preventDefault();
          const id = btn.dataset.id;
          const nome = toolsP.find(t => normalizzaId(t.nome) === id)?.nome;
          if (nome) togglePreferito(nome);
        });
      });

      // Abilita sempre drag & drop e reset sull’ordine
      abilitaDragSezioniConSalvataggio();
      abilitaResetOrdine();

      // Aggiungi il link in navbar se non c’è già
      if (!navUl.querySelector('a[href="#preferiti-section"]')) {
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.innerHTML = `<a class="nav-link" href="#preferiti-section">Preferiti</a>`;
        navUl.insertBefore(li, navUl.firstChild);
      }
    });
}

document.addEventListener('DOMContentLoaded', aggiornaSezionePreferiti);

// Build all tool sections
fetch('tools.json')
  .then(r => r.json())
  .then(data => {
    // Ensure IDs
    data.forEach(tool => { tool.id = tool.id || normalizzaId(tool.nome); });
    const categorieTitoli = {
      "Chat e Testo": { id: "chat", titolo: "Chat e Testo", sottotitolo: "Strumenti AI per scrivere, conversare e creare contenuti testuali." },
      "Immagini":   { id: "immagini", titolo: "Immagini", sottotitolo: "Strumenti AI per la generazione e modifica di immagini." },
      "Audio e Musica": { id: "audio", titolo: "Audio e Musica", sottotitolo: "Generazione vocale e composizione musicale con AI." },
      "Video": { id: "video", titolo: "Video", sottotitolo: "Strumenti AI per video editing e creazione automatica." },
      "Codice e Sviluppo": { id: "codice", titolo: "Codice e Sviluppo", sottotitolo: "AI per la programmazione e supporto agli sviluppatori." },
      "Altri Strumenti": { id: "altri", titolo: "Altri Strumenti", sottotitolo: "Assistenti, ricerca, presentazioni, produttività." }
    };
    const container = document.getElementById('tools-sections') || document.body;
    const gruppi = {};
    data.forEach(tool => {
      (gruppi[tool.categoria] = gruppi[tool.categoria] || []).push(tool);
    });
    for (const cat in gruppi) {
      const tools = gruppi[cat];
      const sezione = document.createElement('section');
      const promptInputId = `prompt-${normalizzaId(cat)}`;
      sezione.classList.add('page-section', 'portfolio-section');
      sezione.id = normalizzaId(cat);
      sezione.innerHTML = `
      <div class="container">
        <div class="text-center mb-3">
          <h2 class="section-heading text-uppercase">${categorieTitoli[cat]?.titolo || cat}</h2>
          <h3 class="section-subheading text-muted">${categorieTitoli[cat]?.sottotitolo || ''}</h3>
        </div>
    
        <div class="row g-3"></div>
        <div class="text-end mt-3">
          <button class="btn btn-link reset-order-btn" data-sezione-id="${sezione.id}">
            <i class="fas fa-rotate-right"></i> Resetta ordine
          </button>
        </div>
      </div>
    `;
      const row = sezione.querySelector('.row');
      // Sort by saved order
      const ordSaved = JSON.parse(localStorage.getItem(`ordine-${sezione.id}`) || '[]');
      if (ordSaved.length) {
        tools.sort((a,b) => ordSaved.indexOf(a.id) - ordSaved.indexOf(b.id));
      }
      // Store original
      row.dataset.originalOrder = JSON.stringify(tools.map(t => t.id));
      // Populate items
      row.innerHTML = tools.map(tool => `
        <div class="col-4 col-sm-6 col-lg-4 mb-4">
          <div class="portfolio-item">
            <a class="portfolio-link" href="${tool.url}" target="_blank">
              <div class="portfolio-hover">
                <div class="portfolio-hover-content">
                 <span class="hover-text">Vai</span>
                <i class="fas fa-arrow-right fa-3x"></i></div>
              </div>
              <img class="img-fluid" src="${tool.immagine}" alt="${tool.nome}" />
            </a>
           <div class="portfolio-caption">
  <div class="portfolio-caption-heading">${tool.nome}</div>
  <div class="portfolio-caption-subheading text-muted">${tool.descrizione}</div>
  <button class="star-btn ${getPreferiti().includes(tool.id) ? 'active' : ''}" data-id="${tool.id}">
    <i class="fas fa-star"></i>
  </button>
 
</div>
          </div>
        </div>
      `).join('');
      container.appendChild(sezione);
      // Listeners
      sezione.querySelectorAll('.star-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.preventDefault(); togglePreferito(btn.getAttribute('data-id'));
        });
      });
     

    }
  
    abilitaDragSezioniConSalvataggio();
    abilitaResetOrdine();
  });

// Build navigation links
fetch('tools.json')
  .then(r => r.json())
  .then(data => {
    const navUl = document.getElementById('navbarResponsive').querySelector('ul') || document.getElementById('nav-dynamic');
    // Favorites link if any
    if (getPreferiti().length) {
      const li = document.createElement('li'); li.className='nav-item';
      li.innerHTML = `<a class="nav-link" href="#preferiti-section">Preferiti</a>`;
      navUl.insertBefore(li, navUl.firstChild);
    }
    // Unique categories
    const cats = [...new Set(data.map(t => t.categoria))];
    cats.forEach(cat => {
      const id = normalizzaId(cat);
      const li = document.createElement('li'); li.className='nav-item';
      li.innerHTML = `<a class="nav-link" href="#${id}">${cat}</a>`;
      navUl.appendChild(li);
    });
    abilitaDragSezioniConSalvataggio();
  });

  document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('searchInput');
    if (!input) return;
  
    const container = document.getElementById('tools-sections') || document.body;
    let filteredSection = null;
  
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
  
      // Rimuovi la vecchia sezione, se esiste
      if (filteredSection) {
        filteredSection.remove();
        filteredSection = null;
      }
  
      if (!q) return; // query vuota: niente da fare
  
      // Trova TUTTI i .portfolio-item che matchano
      const allMatches = Array.from(document.querySelectorAll('.portfolio-item')).filter(item => {
        const nome = item.querySelector('.portfolio-caption-heading')?.textContent.toLowerCase() || '';
        const desc = item.querySelector('.portfolio-caption-subheading')?.textContent.toLowerCase() || '';
        return nome.includes(q) || desc.includes(q);
      });
  
      // Deduplica per data-id
      const seen = new Set();
      const matches = allMatches.filter(item => {
        const id = item.querySelector('.star-btn')?.dataset.id;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
  
      if (!matches.length) return;
  
      // Crea la sezione “Risultati ricerca”
      filteredSection = document.createElement('section');
      filteredSection.classList.add('page-section','portfolio-section');
      filteredSection.id = 'filtered-section';
      filteredSection.innerHTML = `
        <div class="container">
          <div class="text-center">
            <h2 class="section-heading text-uppercase">Risultati ricerca</h2>
            <h3 class="section-subheading text-muted">Trovati ${matches.length} elementi</h3>
          </div>
          <div class="row g-3"></div>
        </div>
      `;
      const row = filteredSection.querySelector('.row');
  
      // Clona i .col-… dei match (uno per id) e aggancia la stellina
      matches.forEach(item => {
        const originalCol = item.closest('.col-4, .col-sm-6, .col-lg-4');
        if (!originalCol) return;
  
        const clone = originalCol.cloneNode(true);
        const star = clone.querySelector('.star-btn');
        if (star) {
          const id = star.dataset.id;
          // Stato star
          if (getPreferiti().includes(id)) star.classList.add('active');
          else star.classList.remove('active');
          // Listener
          star.addEventListener('click', e => {
            e.preventDefault();
            const nome = clone.querySelector('.portfolio-caption-heading')?.textContent;
            if (nome) togglePreferito(nome);
          });
        }
        row.appendChild(clone);
      });
  
      // Inserisci la sezione filtrata in cima
      container.parentNode.insertBefore(filteredSection, container);
    });
  });
  
  function getTurboList() {
    const t = localStorage.getItem('ai-tools-turbo');
    return t ? JSON.parse(t) : [];
  }
  function saveTurboList(list) {
    localStorage.setItem('ai-tools-turbo', JSON.stringify(list));
  }
  function toggleTurbo(id) {
    const list = getTurboList();
    const idx = list.indexOf(id);
    if (idx === -1) list.push(id);
    else list.splice(idx, 1);
    saveTurboList(list);
    document.querySelectorAll(`.bolt-btn[data-id="${id}"]`)
      .forEach(btn => btn.classList.toggle('active'));
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  
 
 // collega i link dei tool
 // Per ogni tool cliccato
 document.querySelectorAll('.portfolio-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();

    const promptInput = document.getElementById('globalTurboPromptInput');
    const prompt = promptInput?.value.trim();
    const url = link.getAttribute('data-url');

    // Togli il focus dall'input
    document.activeElement.blur();

    if (prompt) {
      navigator.clipboard.writeText(prompt)
        .then(() => {
          console.log('✅ Prompt copiato');

          // ⏱ aspetta un attimo prima di aprire il link
          setTimeout(() => {
            if (url) window.open(url, '_blank');
          }, 150);
        })
        .catch(err => {
          console.warn('❌ Errore copia:', err);
          // fallback: apri comunque
          if (url) window.open(url, '_blank');
        });
    } else {
      if (url) window.open(url, '_blank');
    }
  });
});


