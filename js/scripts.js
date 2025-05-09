/*
 * Codice JavaScript ottimizzato per il sito di strumenti AI
 */

// Gestione preferiti
const STORAGE_KEYS = {
  FAVORITES: 'ai-tools-preferiti',
  MENU_ORDER: 'menu-order'
};

// Utility per ID normalizzati
const normalizeId = (name) => {
  return name.toLowerCase()
    .normalize('NFD').replace(/[̀-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
};

// Gestione Preferiti
const favoritesManager = {
  get() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]');
  },
  
  save(favorites) {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  },
  
  toggle(toolName) {
    const id = normalizeId(toolName);
    const favorites = this.get();
    const index = favorites.indexOf(id);
    
    if (index === -1) {
      favorites.push(id);
      document.querySelectorAll(`.star-btn[data-id="${id}"]`).forEach(btn => {
        btn.classList.add('active');
        const icon = btn.querySelector('i');
        if (icon) {
          icon.classList.add('animate-star');
          setTimeout(() => icon.classList.remove('animate-star'), 600);
        }
      });
    } else {
      favorites.splice(index, 1);
      document.querySelectorAll(`.star-btn[data-id="${id}"]`).forEach(btn => {
        btn.classList.remove('active');
      });
    }
    
    this.save(favorites);
    updateFavoritesSection();
  }
};

// Gestione ordine sezioni
const sectionOrderManager = {
  get(sectionId) {
    return JSON.parse(localStorage.getItem(`ordine-${sectionId}`) || '[]');
  },
  
  save(sectionId, order) {
    localStorage.setItem(`ordine-${sectionId}`, JSON.stringify(order));
  },
  
  reset(sectionId) {
    localStorage.removeItem(`ordine-${sectionId}`);
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    const row = section.querySelector('.row');
    if (!row || !row.dataset.originalOrder) return;
    
    const originalOrder = JSON.parse(row.dataset.originalOrder);
    originalOrder.forEach(id => {
      const col = Array.from(row.children).find(c => {
        const btn = c.querySelector('.star-btn');
        return btn && btn.dataset.id === id;
      });
      if (col) row.appendChild(col);
    });
  }
};

// Gestione menu
const menuManager = {
  get() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MENU_ORDER) || 'null');
  },
  
  save(order) {
    localStorage.setItem(STORAGE_KEYS.MENU_ORDER, JSON.stringify(order));
  }
};

// Caricamento strumenti AI
let allTools = [];
fetch('tools.json')
  .then(response => response.json())
  .then(data => {
    allTools = data;
    buildToolSections(data);
  })
  .catch(error => console.error('Errore caricamento strumenti:', error));

// Funzioni principale per la creazione delle sezioni strumenti
function buildToolSections(tools) {
  // Assicurati che ogni strumento abbia un ID
  tools.forEach(tool => { 
    tool.id = tool.id || normalizeId(tool.nome); 
  });
  
  const categories = {
    "Chat e Testo": { 
      id: "chat", 
      title: "Chat e Testo", 
      subtitle: "Strumenti AI per scrivere, conversare e creare contenuti testuali." 
    },
    "Immagini": { 
      id: "immagini", 
      title: "Immagini", 
      subtitle: "Strumenti AI per la generazione e modifica di immagini." 
    },
    "Audio e Musica": { 
      id: "audio", 
      title: "Audio e Musica", 
      subtitle: "Generazione vocale e composizione musicale con AI." 
    },
    "Video": { 
      id: "video", 
      title: "Video", 
      subtitle: "Strumenti AI per video editing e creazione automatica." 
    },
    "Codice e Sviluppo": { 
      id: "codice", 
      title: "Codice e Sviluppo", 
      subtitle: "AI per la programmazione e supporto agli sviluppatori." 
    },
    "Altri Strumenti": { 
      id: "altri", 
      title: "Altri Strumenti", 
      subtitle: "Assistenti, ricerca, presentazioni, produttività." 
    }
  };
  
  const container = document.getElementById('tools-sections') || document.body;
  const groups = {};
  
  // Raggruppa strumenti per categoria
  tools.forEach(tool => {
    if (Array.isArray(tool.categorie)) {
      tool.categorie.forEach(cat => {
        (groups[cat] = groups[cat] || []).push(tool);
      });
    } else if (tool.categoria) {
      (groups[tool.categoria] = groups[tool.categoria] || []).push(tool);
    }
  });
  
  // Crea sezioni per ogni categoria
  for (const category in groups) {
    const categoryTools = groups[category];
    const sectionId = normalizeId(category);
    const section = document.createElement('section');
    
    section.classList.add('page-section', 'portfolio-section');
    section.id = sectionId;
    
    const categoryInfo = categories[category] || { 
      title: category, 
      subtitle: '' 
    };
    
    section.innerHTML = `
      <div class="container">
        <div class="text-center mb-3">
          <h2 class="section-heading text-uppercase">${categoryInfo.title || category}</h2>
          <h3 class="section-subheading text-muted">${categoryInfo.subtitle || ''}</h3>
        </div>
        <div class="row g-3"></div>
        <div class="text-end mt-3">
          <button class="btn btn-link reset-order-btn" data-sezione-id="${sectionId}">
            <i class="fas fa-rotate-right"></i> Resetta ordine
          </button>
        </div>
      </div>
    `;
    
    const row = section.querySelector('.row');
    
    // Ordina strumenti secondo l'ordine salvato
    const savedOrder = sectionOrderManager.get(sectionId);
    if (savedOrder.length) {
      categoryTools.sort((a, b) => 
        savedOrder.indexOf(a.id) - savedOrder.indexOf(b.id)
      );
    }
    
    // Salva l'ordine originale per poterlo ripristinare
    row.dataset.originalOrder = JSON.stringify(categoryTools.map(t => t.id));
    
    // Popola la riga con gli strumenti
    row.innerHTML = categoryTools.map(tool => createToolCardHTML(tool)).join('');
    
    container.appendChild(section);
    
    // Aggiungi event listener per i pulsanti preferiti
    section.querySelectorAll('.star-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        favoritesManager.toggle(btn.getAttribute('data-id'));
      });
    });
  }
  
  // Inizializza funzionalità aggiuntive
  enableDragSortForSections();
  setupResetOrderButtons();
  setupExpandCollapseSections();
  setupNavigation(Object.keys(groups));
  
  // Inizializza la ricerca
  setupSearch();
  
  // Aggiorna sezione preferiti
  updateFavoritesSection();
}

// Crea HTML per la card di uno strumento
function createToolCardHTML(tool) {
  const id = tool.id || normalizeId(tool.nome);
  const favorites = favoritesManager.get();
  
  return `
    <div class="col-4 col-sm-4 col-lg-4 mb-4">
      <div class="portfolio-item">
        <a class="portfolio-link" href="${tool.url}" target="_blank" rel="noopener noreferrer">
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
          <div class="portfolio-caption-subheading text-muted">${tool.descrizione}</div>
          <button class="star-btn ${favorites.includes(id) ? 'active' : ''}" data-id="${id}">
            <i class="fas fa-star"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Aggiorna la sezione preferiti
function updateFavoritesSection() {
  const favorites = favoritesManager.get();
  const favoritesSection = document.getElementById('preferiti-section');
  const navMenu = document.querySelector('#navbarResponsive ul') || document.getElementById('nav-dynamic');
  
  // Rimuovi il link "Preferiti" dalla navbar se non ci sono preferiti
  function removeNavLink() {
    const link = navMenu?.querySelector('a[href="#preferiti-section"]');
    if (link?.parentElement) {
      navMenu.removeChild(link.parentElement);
    }
  }
  
  // Se non ci sono preferiti, nascondi la sezione
  if (favorites.length === 0) {
    if (favoritesSection) favoritesSection.style.display = 'none';
    removeNavLink();
    return;
  }
  
  // Filtra gli strumenti preferiti
  const favoriteTools = allTools.filter(tool => 
    favorites.includes(normalizeId(tool.nome))
  );
  
  // Se non ci sono strumenti preferiti, nascondi la sezione
  if (!favoriteTools.length) {
    if (favoritesSection) favoritesSection.style.display = 'none';
    removeNavLink();
    return;
  }
  
  // Crea o aggiorna la sezione preferiti
  let section = favoritesSection;
  if (!section) {
    section = document.createElement('section');
    section.classList.add('page-section', 'portfolio-section');
    section.id = 'preferiti-section';
    
    const container = document.getElementById('tools-sections') || document.body;
    container.insertBefore(section, container.firstChild);
  }
  
  section.style.display = 'block';
  
  // Struttura HTML della sezione
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
  const savedOrder = sectionOrderManager.get('preferiti-section');
  
  // Ordina in base all'ordine salvato
  if (savedOrder.length) {
    favoriteTools.sort((a, b) => 
      savedOrder.indexOf(normalizeId(a.nome)) - savedOrder.indexOf(normalizeId(b.nome))
    );
  }
  
  // Salva l'ordine originale
  row.dataset.originalOrder = JSON.stringify(favoriteTools.map(t => normalizeId(t.nome)));
  
  // Popola gli strumenti
  row.innerHTML = favoriteTools.map(tool => createToolCardHTML(tool)).join('');
  
  // Aggiungi event listener per i pulsanti preferiti
  section.querySelectorAll('.star-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const id = btn.dataset.id;
      const tool = favoriteTools.find(t => normalizeId(t.nome) === id);
      if (tool) favoritesManager.toggle(tool.nome);
    });
  });
  
  // Aggiorna funzionalità di drag & drop
  enableDragSortForSections();
  setupResetOrderButtons();
  setupExpandCollapseSections();
  
  // Aggiungi link nella navbar se non c'è già
  if (navMenu && !navMenu.querySelector('a[href="#preferiti-section"]')) {
    const li = document.createElement('li');
    li.className = 'nav-item no-drag';
    li.dataset.sectionId = 'preferiti-section';
    li.innerHTML = `<a class="nav-link" href="#preferiti-section">Preferiti</a>`;
    navMenu.insertBefore(li, navMenu.firstChild);
  }
}

// Abilita drag & drop per le sezioni
const sortableMap = new Map();

function enableDragSortForSections() {
  document.querySelectorAll('.portfolio-section .row').forEach(row => {
    const section = row.closest('.portfolio-section');
    if (!section) return;
    const sectionId = section.id;
    
    // Distruggi l'istanza Sortable esistente se presente
    if (sortableMap.has(row)) {
      sortableMap.get(row).destroy();
    }
    
    // Crea nuova istanza Sortable
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
        // Salva il nuovo ordine
        const ids = Array.from(row.children)
          .map(el => el.querySelector('.star-btn')?.dataset.id)
          .filter(Boolean);
          
        if (ids.length) {
          sectionOrderManager.save(sectionId, ids);
        }
      }
    });
    
    sortableMap.set(row, sortable);
  });
}

// Configura i pulsanti di reset ordine
function setupResetOrderButtons() {
  document.querySelectorAll('.reset-order-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const sectionId = btn.getAttribute('data-sezione-id');
      if (sectionId) sectionOrderManager.reset(sectionId);
    });
  });
}

// Configura espansione/compressione sezioni
function setupExpandCollapseSections() {
  document.querySelectorAll('.portfolio-section').forEach(section => {
    const row = section.querySelector('.row');
    const items = Array.from(row.children);
    
    
     // NON aggiungere sezione se già c'è il pulsante
     if (section.querySelector('.load-more-btn') || items.length <= 6) return;


    // Applica solo se ci sono più di 6 elementi
    if (items.length <= 6) return;
    
    // Nascondi gli elementi oltre il 6°
    items.slice(6).forEach(el => el.style.display = 'none');
    
    // Crea il pulsante "Mostra altro"
    const btn = document.createElement('button');
    btn.className = 'load-more-btn btn-oval';
    btn.innerHTML = `
      <span class="dots"><i class="fas fa-ellipsis-h"></i></span>
      <span class="arrow"><i class="fas fa-chevron-down"></i></span>
    `;
    
    let expanded = false;
    
    // Evento click sul pulsante
    btn.addEventListener('click', () => {
      expanded = !expanded;
      items.slice(6).forEach(el => el.style.display = expanded ? '' : 'none');
      btn.querySelector('.arrow').innerHTML = `<i class="fas fa-chevron-${expanded ? 'up' : 'down'}"></i>`;
      btn.style.animation = expanded ? 'none' : '';
    });
    
    // Aggiungi il pulsante alla fine della sezione
    const wrapper = document.createElement('div');
    wrapper.className = 'text-center mt-3';
    wrapper.appendChild(btn);
    row.parentNode.insertBefore(wrapper, row.nextSibling);
  });
}

// Configura la navigazione
function setupNavigation(categories) {
  const menu = document.querySelector('#navbarResponsive ul') || document.getElementById('nav-dynamic');
  if (!menu) return;
  
  // Aggiungi voci di menu per ogni categoria
  categories.forEach(category => {
    const id = normalizeId(category);
    if (!menu.querySelector(`li[data-section-id="${id}"]`)) {
      const li = document.createElement('li');
      li.className = 'nav-item';
      li.dataset.sectionId = id;
      li.innerHTML = `<a class="nav-link" href="#${id}">${category}</a>`;
      menu.appendChild(li);
    }
  });
  
  // Ripristina ordine menu da localStorage
  const savedOrder = menuManager.get();
  if (savedOrder) {
    savedOrder.forEach(id => {
      const li = menu.querySelector(`li[data-section-id="${id}"]`);
      if (li) menu.appendChild(li);
    });
  }
  
  // Abilita drag & drop sul menu
  new Sortable(menu, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    handle: 'a.nav-link',
    delay: 200,
    delayOnTouchOnly: true,
    touchStartThreshold: 10,
    draggable: 'li:not(.no-drag)',
    onEnd: () => {
      // Salva nuovo ordine menu
      let ids = Array.from(menu.children)
        .map(li => li.dataset.sectionId)
        .filter(Boolean);
      
      // Gestione speciale per la sezione preferiti
      if (ids.includes('preferiti-section')) {
        // Rimuovi preferiti dall'ordine
        ids = ids.filter(id => id !== 'preferiti-section');
        // Reinseriscilo in testa
        ids.unshift('preferiti-section');
      }
      
      menuManager.save(ids);
      
      // Riordina il menu
      const favLi = menu.querySelector('li[data-section-id="preferiti-section"]');
      if (favLi) menu.insertBefore(favLi, menu.firstChild);
      
      ids.slice(1).forEach(id => {
        const li = menu.querySelector(`li[data-section-id="${id}"]`);
        if (li) menu.appendChild(li);
      });
      
      // Riordina le sezioni nel contenuto
      const container = document.getElementById('tools-sections') || document.body;
      ids.forEach(id => {
        const section = document.getElementById(id);
        if (section) container.appendChild(section);
      });
    }
  });
}

// Configura la ricerca
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  
  const container = document.getElementById('tools-sections') || document.body;
  let filteredSection = null;
  
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    
    // Rimuovi sezione risultati precedente
    if (filteredSection) {
      filteredSection.remove();
      filteredSection = null;
    }
    
    if (!query) return;
    
    // Trova tutti i portfolio-item che corrispondono alla ricerca
    const allMatches = Array.from(document.querySelectorAll('.portfolio-item')).filter(item => {
      const name = item.querySelector('.portfolio-caption-heading')?.textContent.toLowerCase() || '';
      const desc = item.querySelector('.portfolio-caption-subheading')?.textContent.toLowerCase() || '';
      return name.includes(query) || desc.includes(query);
    });
    
    // Deduplicazione per data-id
    const seen = new Set();
    const matches = allMatches.filter(item => {
      const id = item.querySelector('.star-btn')?.dataset.id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    
    if (!matches.length) return;
    
    // Crea sezione risultati ricerca
    filteredSection = document.createElement('section');
    filteredSection.classList.add('page-section', 'portfolio-section');
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
    
    // Clona i risultati e aggiungi event listener
    matches.forEach(item => {
      const originalCol = item.closest('.col-4, .col-sm-4, .col-lg-4');
      if (!originalCol) return;
      
      const clone = originalCol.cloneNode(true);
      const star = clone.querySelector('.star-btn');
      
      if (star) {
        const id = star.dataset.id;
        // Aggiorna stato stella
        if (favoritesManager.get().includes(id)) {
          star.classList.add('active');
        } else {
          star.classList.remove('active');
        }
        
        // Aggiungi event listener
        star.addEventListener('click', e => {
          e.preventDefault();
          const name = clone.querySelector('.portfolio-caption-heading')?.textContent;
          if (name) favoritesManager.toggle(name);
        });
      }
      
      row.appendChild(clone);
    });
    
    // Inserisci sezione risultati in cima
    container.parentNode.insertBefore(filteredSection, container);
  });
}

// Configura navbar responsive
document.addEventListener('DOMContentLoaded', () => {
  // Navbar shrink function
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./js/sw.js')
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
  
  // Shrink navbar iniziale
  navbarShrink();
  document.addEventListener('scroll', navbarShrink);
  
  // Attiva Bootstrap scrollspy
  const mainNav = document.body.querySelector('#mainNav');
  if (mainNav) {
    new bootstrap.ScrollSpy(document.body, {
      target: '#mainNav',
      rootMargin: '0px 0px -40%'
    });
  }
  
  // Collassa navbar responsive quando si clicca
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
  
  // Disabilita menù contestuale
  document.addEventListener('contextmenu', e => e.preventDefault());
  
  // Gestione link portfolio
  document.querySelectorAll('.portfolio-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      
      const webUrl = link.dataset.url || link.href;
      const intentUri = link.dataset.intent;
      const appUri = link.dataset.app;
      
      // Priorità: 1) intent_uri (Android), 2) app_uri (schema custom), 3) url web
      const primary = intentUri || appUri;
      const fallback = webUrl;
      
      if (primary) {
        // Prova ad aprire l'app nativa
        window.location.href = primary;
        
        // Fallback sul web dopo 1.5s
        setTimeout(() => {
          window.open(fallback, '_blank');
        }, 1500);
      } else {
        // Solo web
        window.open(webUrl, '_blank');
      }
    });
  });
});

// Funzione per mostrare/nascondere descrizioni
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggle-descrizioni-btn');
  if (!toggleBtn) return;

  let descrizioniVisibili = true;

  toggleBtn.addEventListener('click', () => {
    descrizioniVisibili = !descrizioniVisibili;

    document.querySelectorAll('.portfolio-caption-subheading').forEach(el => {
      el.style.display = descrizioniVisibili ? '' : 'none';
    });

    toggleBtn.textContent = descrizioniVisibili ? 'Nascondi descrizioni' : 'Mostra descrizioni';
  });
});



