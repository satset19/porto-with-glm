/**
 * PROJECTS UI RENDERER MODULE
 * Handles dynamic rendering of GitHub repositories and UI updates
 */

import { GitHubAPI, GITHUB_CONFIG } from './github-api.js';

// ============================================
// PROJECT CARD TEMPLATE
// ============================================
const createProjectCard = (repo, index) => {
    const languageColors = {
        'TypeScript': '#3178C6',
        'JavaScript': '#F7DF1E',
        'Vue': '#4FC08D',
        'HTML': '#E34F26',
        'CSS': '#1572B6',
        'Python': '#3776AB',
        'Java': '#007396',
        'Go': '#00ADD8',
        'Rust': '#DEA584',
        'Other': '#8B949E'
    };

    const languageColor = languageColors[repo.language] || languageColors['Other'];
    const formattedIndex = String(index + 1).padStart(2, '0');

    // Generate topics tags
    const topicsHtml = repo.topics && repo.topics.length > 0
        ? repo.topics.slice(0, 3).map(topic =>
            `<span class="project__topic">#${topic}</span>`
        ).join('')
        : '';

    return `
        <article class="project__card" data-language="${repo.language.toLowerCase()}" data-index="${index}">
            <div class="project__card-inner">
                <div class="project__header">
                    <div class="project__number">${formattedIndex}</div>
                    <div class="project__meta">
                        ${repo.isFork ? '<span class="project__badge project__badge--fork">Fork</span>' : ''}
                        ${repo.isArchived ? '<span class="project__badge project__badge--archived">Archived</span>' : ''}
                    </div>
                </div>
                <h3 class="project__title">
                    <a href="${repo.url}" target="_blank" rel="noopener" class="project__title-link">${repo.name}</a>
                </h3>
                <p class="project__description">${repo.description}</p>

                <div class="project__tech">
                    <span class="tech-tag" style="--tag-color: ${languageColor}">
                        <span class="tech-tag__dot"></span>
                        ${repo.language}
                    </span>
                </div>

                ${topicsHtml ? `<div class="project__topics">${topicsHtml}</div>` : ''}

                <div class="project__stats">
                    <div class="project__stat" title="Stars">
                        <svg class="project__stat-icon" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
                        </svg>
                        <span>${repo.stars}</span>
                    </div>
                    <div class="project__stat" title="Forks">
                        <svg class="project__stat-icon" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
                        </svg>
                        <span>${repo.forks}</span>
                    </div>
                    <div class="project__stat" title="Updated">
                        <svg class="project__stat-icon" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM5.37 5.11l3.4 3.41a.5.5 0 01-.14.73l-2.67 1.39a.5.5 0 01-.69-.63l1.03-2.95-2.42-2.43a.5.5 0 01.49-.84z"/>
                        </svg>
                        <span>${repo.lastUpdated}</span>
                    </div>
                </div>

                <div class="project__actions">
                    <a href="${repo.url}" target="_blank" rel="noopener" class="project__link">
                        <span>View Code</span>
                        <svg class="project__link-icon" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/>
                        </svg>
                    </a>
                    ${repo.homepage ? `
                        <a href="${repo.homepage}" target="_blank" rel="noopener" class="project__link project__link--demo">
                            <span>Live Demo</span>
                            <svg class="project__link-icon" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M10.5 8a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                                <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"/>
                            </svg>
                        </a>
                    ` : ''}
                </div>
            </div>
        </article>
    `;
};

// ============================================
// STATS UPDATER
// ============================================
const updateStats = (stats) => {
    const animateNumber = (element, target) => {
        const duration = 2000;
        const start = 0;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * eased);

            element.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    };

    // Update stat numbers with animation
    const reposEl = document.getElementById('stat-repos');
    const starsEl = document.getElementById('stat-stars');
    const forksEl = document.getElementById('stat-forks');
    const followersEl = document.getElementById('stat-followers');

    if (reposEl) animateNumber(reposEl, stats.totalRepos);
    if (starsEl) animateNumber(starsEl, stats.totalStars);
    if (forksEl) animateNumber(forksEl, stats.totalForks);
    if (followersEl) animateNumber(followersEl, stats.followers);
};

// ============================================
// LANGUAGE STATS RENDERER
// ============================================
const updateLanguageStats = (languageStats) => {
    const languageColors = {
        'TypeScript': '#3178C6',
        'JavaScript': '#F7DF1E',
        'Vue': '#4FC08D',
        'HTML': '#E34F26',
        'CSS': '#1572B6',
        'Python': '#3776AB',
        'Other': '#8B949E'
    };

    const container = document.getElementById('language-stats');
    if (!container || !languageStats.length) return;

    const total = languageStats.reduce((sum, lang) => sum + lang.count, 0);

    container.innerHTML = languageStats.map(lang => {
        const percent = Math.round((lang.count / total) * 100);
        const color = languageColors[lang.language] || languageColors['Other'];

        return `
            <div class="language__stat">
                <span class="language__color" style="background: ${color}"></span>
                <span class="language__name">${lang.language}</span>
                <span class="language__percent">${percent}%</span>
            </div>
        `;
    }).join('');
};

// ============================================
// PROJECT FILTER
// ============================================
const initProjectFilter = () => {
    const filterBtns = document.querySelectorAll('.filter__btn');
    const projectCards = document.querySelectorAll('.project__card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('filter__btn--active'));
            btn.classList.add('filter__btn--active');

            const filter = btn.dataset.filter;

            // Filter cards
            projectCards.forEach(card => {
                const language = card.dataset.language;

                if (filter === 'all' ||
                    filter === language ||
                    (filter === 'other' && !['javascript', 'typescript', 'vue'].includes(language))) {
                    card.style.display = '';
                    // Animate in
                    gsap.fromTo(card, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 });
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
};

// ============================================
// MAIN LOADER FUNCTION
// ============================================
const loadGitHubProjects = async () => {
    const grid = document.getElementById('projects-grid');
    const loading = document.getElementById('projects-loading');

    try {
        // Initialize GitHub API
        const api = new GitHubAPI(GITHUB_CONFIG);

        // Fetch portfolio data
        const data = await api.fetchPortfolioData();

        // Hide loading spinner
        if (loading) loading.style.display = 'none';

        // Render project cards
        if (grid) {
            const projectsHtml = data.repositories.map((repo, index) =>
                createProjectCard(repo, index)
            ).join('');

            grid.innerHTML = projectsHtml;

            // Animate cards in
            gsap.from('.project__card', {
                opacity: 0,
                y: 50,
                stagger: 0.1,
                duration: 0.6,
                ease: 'power3.out'
            });
        }

        // Update stats
        if (data.stats) {
            updateStats(data.stats);
        }

        // Update language stats
        if (data.languageStats) {
            updateLanguageStats(data.languageStats);
        }

        // Initialize filter
        initProjectFilter();

        // Update hero section with profile data
        if (data.profile) {
            const bioEl = document.getElementById('hero-bio');
            if (bioEl && data.profile.bio) {
                bioEl.textContent = data.profile.bio;
            }
        }

        console.log('GitHub data loaded successfully:', data);

    } catch (error) {
        console.error('Error loading GitHub projects:', error);

        // Show error state
        if (loading) {
            loading.innerHTML = `
                <div class="loading__error">
                    <p>Failed to load repositories</p>
                    <a href="https://github.com/satset19?tab=repositories" target="_blank" rel="noopener" class="btn btn--outline">
                        View on GitHub
                    </a>
                </div>
            `;
        }
    }
};

// ============================================
// EXPORT
// ============================================
export { loadGitHubProjects, createProjectCard, updateStats, updateLanguageStats };
