/**
 * AQUASCAPE Landing Page — Script
 *
 * Loads project data from repos.json, renders project cards,
 * handles search/filter, and displays README in a modal.
 */

(function () {
  'use strict';

  // --- State ---
  let allRepos = [];
  let activeLanguageFilter = 'all';
  let searchQuery = '';

  // --- DOM refs ---
  const projectsGrid = document.getElementById('projects-grid');
  const loadingState = document.getElementById('loading-state');
  const searchInput = document.getElementById('search-input');
  const filterTagsContainer = document.getElementById('filter-tags');
  const resultsInfo = document.getElementById('results-info');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalMeta = document.getElementById('modal-meta');
  const modalReadmeContent = document.getElementById('modal-readme-content');
  const modalClose = document.getElementById('modal-close');
  const siteHeader = document.getElementById('site-header');

  // Stats
  const statRepos = document.getElementById('stat-repos');
  const statLanguages = document.getElementById('stat-languages');
  const statUpdated = document.getElementById('stat-updated');
  const footerUpdate = document.getElementById('footer-update');

  // --- Language color map (GitHub-style) ---
  const LANG_COLORS = {
    'JavaScript': '#f1e05a',
    'TypeScript': '#3178c6',
    'Python': '#3572A5',
    'Java': '#b07219',
    'Go': '#00ADD8',
    'Rust': '#dea584',
    'C': '#555555',
    'C++': '#f34b7d',
    'C#': '#178600',
    'PHP': '#4F5D95',
    'Ruby': '#701516',
    'Swift': '#F05138',
    'Kotlin': '#A97BFF',
    'Dart': '#00B4AB',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'Shell': '#89e051',
    'Vue': '#41b883',
    'Svelte': '#ff3e00',
    'Jupyter Notebook': '#DA5B0B',
    'Dockerfile': '#384d54',
  };

  // --- Init ---
  async function init() {
    try {
      const response = await fetch('repos.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      allRepos = data.repos || [];
      const generatedAt = data.generated_at || null;

      updateStats(generatedAt);
      buildLanguageFilters();
      renderProjects();
      bindEvents();
    } catch (err) {
      console.error('Failed to load repos.json:', err);
      showError();
    }
  }

  // --- Stats ---
  function updateStats(generatedAt) {
    statRepos.textContent = allRepos.length;

    const langs = new Set(allRepos.map(r => r.language).filter(Boolean));
    statLanguages.textContent = langs.size;

    if (generatedAt) {
      const date = new Date(generatedAt);
      statUpdated.textContent = formatRelativeDate(date);
      footerUpdate.textContent = `Data terakhir diperbarui: ${date.toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })}`;
    }
  }

  // --- Language Filters ---
  function buildLanguageFilters() {
    const langCount = {};
    allRepos.forEach(repo => {
      if (repo.language) {
        langCount[repo.language] = (langCount[repo.language] || 0) + 1;
      }
    });

    // Sort by count descending
    const sorted = Object.entries(langCount).sort((a, b) => b[1] - a[1]);

    sorted.forEach(([lang]) => {
      const btn = document.createElement('button');
      btn.className = 'filter-tag';
      btn.dataset.lang = lang;
      btn.textContent = lang;
      filterTagsContainer.appendChild(btn);
    });
  }

  // --- Render ---
  function renderProjects() {
    const filtered = getFilteredRepos();

    // Clear grid (but keep loading state reference clean)
    projectsGrid.innerHTML = '';

    if (filtered.length === 0) {
      projectsGrid.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          <div class="empty-state-title">Tidak ada proyek ditemukan</div>
          <div class="empty-state-description">Coba ubah kata kunci pencarian atau filter.</div>
        </div>
      `;
      resultsInfo.textContent = '';
      return;
    }

    resultsInfo.innerHTML = `Menampilkan <span class="results-count">${filtered.length}</span> dari ${allRepos.length} proyek`;

    filtered.forEach((repo, index) => {
      const card = createProjectCard(repo, index);
      projectsGrid.appendChild(card);
    });
  }

  function createProjectCard(repo, index) {
    const card = document.createElement('article');
    card.className = 'project-card';
    card.style.animationDelay = `${index * 0.05}s`;
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Baca README ${repo.name}`);

    const langDot = repo.language
      ? `<span class="project-card-lang-dot" style="background: ${LANG_COLORS[repo.language] || '#8b8b8b'}"></span>`
      : '';

    const topics = (repo.topics || [])
      .map(t => `<span class="project-card-topic">${escapeHtml(t)}</span>`)
      .join('');

    card.innerHTML = `
      <div class="project-card-header">
        <h3 class="project-card-name">${escapeHtml(repo.name)}</h3>
        <span class="project-card-visibility">${repo.visibility || 'private'}</span>
      </div>
      ${repo.description ? `<p class="project-card-description">${escapeHtml(repo.description)}</p>` : ''}
      <div class="project-card-meta">
        ${repo.language ? `<span class="project-card-lang">${langDot} ${escapeHtml(repo.language)}</span>` : ''}
        <span class="project-card-date">${formatDate(repo.updated_at)}</span>
      </div>
      ${topics ? `<div class="project-card-topics">${topics}</div>` : ''}
    `;

    card.addEventListener('click', () => openModal(repo));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(repo);
      }
    });

    return card;
  }

  // --- Filter logic ---
  function getFilteredRepos() {
    return allRepos.filter(repo => {
      const matchesLang = activeLanguageFilter === 'all' || repo.language === activeLanguageFilter;
      const matchesSearch = !searchQuery ||
        repo.name.toLowerCase().includes(searchQuery) ||
        (repo.description || '').toLowerCase().includes(searchQuery) ||
        (repo.topics || []).some(t => t.toLowerCase().includes(searchQuery));
      return matchesLang && matchesSearch;
    });
  }

  // --- Modal ---
  function openModal(repo) {
    modalTitle.textContent = repo.name;

    // Meta info
    const metaItems = [];
    if (repo.language) {
      metaItems.push(`<span class="modal-meta-item">
        <span class="project-card-lang-dot" style="background: ${LANG_COLORS[repo.language] || '#8b8b8b'}; width: 10px; height: 10px; border-radius: 50; display: inline-block;"></span>
        ${escapeHtml(repo.language)}
      </span>`);
    }
    if (repo.updated_at) {
      metaItems.push(`<span class="modal-meta-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Updated ${formatDate(repo.updated_at)}
      </span>`);
    }
    if (repo.visibility) {
      metaItems.push(`<span class="modal-meta-item">${repo.visibility}</span>`);
    }
    modalMeta.innerHTML = metaItems.join('');

    // README content
    if (repo.readme) {
      try {
        modalReadmeContent.innerHTML = marked.parse(repo.readme, {
          breaks: true,
          gfm: true,
        });
      } catch (e) {
        modalReadmeContent.innerHTML = `<pre>${escapeHtml(repo.readme)}</pre>`;
      }
    } else {
      modalReadmeContent.innerHTML = '<p class="no-readme">Tidak ada README untuk repository ini.</p>';
    }

    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }

  function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // --- Events ---
  function bindEvents() {
    // Search
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = e.target.value.trim().toLowerCase();
        renderProjects();
      }, 200);
    });

    // Language filter
    filterTagsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-tag');
      if (!btn) return;

      filterTagsContainer.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeLanguageFilter = btn.dataset.lang;
      renderProjects();
    });

    // Modal close
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay.classList.contains('open')) {
        closeModal();
      }
    });

    // Header scroll effect
    let lastScrollY = 0;
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      siteHeader.classList.toggle('scrolled', scrollY > 20);
      lastScrollY = scrollY;
    }, { passive: true });
  }

  // --- Error state ---
  function showError() {
    projectsGrid.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div class="empty-state-title">Gagal memuat data proyek</div>
        <div class="empty-state-description">Pastikan file repos.json tersedia. Jika ini deploy pertama, jalankan GitHub Actions terlebih dahulu.</div>
      </div>
    `;
  }

  // --- Helpers ---
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function formatRelativeDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'baru saja';
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Start ---
  document.addEventListener('DOMContentLoaded', init);
})();
