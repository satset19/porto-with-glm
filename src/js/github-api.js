/**
 * GITHUB API INTEGRATION MODULE
 * Fetches repositories and profile data from GitHub
 * Handles rate limiting, caching, and error recovery
 */

// ============================================
// CONFIGURATION
// ============================================
const GITHUB_CONFIG = {
    username: 'satset19',
    apiBaseUrl: 'https://api.github.com',
    // Using public API - no token required for public repos
    // For higher rate limits, add: token: 'YOUR_GITHUB_TOKEN',
    cacheDuration: 5 * 60 * 1000, // 5 minutes
    maxRepos: 12,
    excludeForks: false,
    excludeArchived: true
};

// ============================================
// CACHE MANAGEMENT
// ============================================
const Cache = {
    get(key) {
        const cached = localStorage.getItem(`gh_${key}`);
        if (!cached) return null;

        const { data, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > GITHUB_CONFIG.cacheDuration;

        if (isExpired) {
            localStorage.removeItem(`gh_${key}`);
            return null;
        }

        return data;
    },

    set(key, data) {
        localStorage.setItem(`gh_${key}`, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    }
};

// ============================================
// GITHUB API CLASS
// ============================================
class GitHubAPI {
    constructor(config) {
        this.config = config;
        this.headers = {
            'Accept': 'application/vnd.github.v3+json',
            ...(config.token && { 'Authorization': `token ${config.token}` })
        };
    }

    /**
     * Fetch user profile data
     */
    async getUserProfile() {
        const cacheKey = `profile_${this.config.username}`;
        const cached = Cache.get(cacheKey);

        if (cached) return cached;

        try {
            const response = await fetch(
                `${this.config.apiBaseUrl}/users/${this.config.username}`,
                { headers: this.headers }
            );

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const data = await response.json();
            Cache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    }

    /**
     * Fetch user repositories with pagination
     */
    async getUserRepositories() {
        const cacheKey = `repos_${this.config.username}`;
        const cached = Cache.get(cacheKey);

        if (cached) return cached;

        try {
            let allRepos = [];
            let page = 1;
            const perPage = 100;

            // Fetch all pages
            while (true) {
                const response = await fetch(
                    `${this.config.apiBaseUrl}/users/${this.config.username}/repos?page=${page}&per_page=${perPage}&sort=updated`,
                    { headers: this.headers }
                );

                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.status}`);
                }

                const repos = await response.json();

                if (repos.length === 0) break;

                allRepos = [...allRepos, ...repos];
                page++;

                // Stop if we have enough repos
                if (allRepos.length >= this.config.maxRepos) {
                    allRepos = allRepos.slice(0, this.config.maxRepos);
                    break;
                }
            }

            // Filter repositories
            const filteredRepos = this.filterRepositories(allRepos);
            Cache.set(cacheKey, filteredRepos);
            return filteredRepos;
        } catch (error) {
            console.error('Error fetching repositories:', error);
            throw error;
        }
    }

    /**
     * Filter repositories based on configuration
     */
    filterRepositories(repos) {
        return repos.filter(repo => {
            // Exclude archived if configured
            if (this.config.excludeArchived && repo.archived) {
                return false;
            }

            // Exclude forks if configured
            if (this.config.excludeForks && repo.fork) {
                return false;
            }

            // Exclude empty repositories
            if (!repo.description && repo.size === 0) {
                return false;
            }

            return true;
        });
    }

    /**
     * Get language statistics from repositories
     */
    getLanguageStats(repositories) {
        const stats = {};

        repositories.forEach(repo => {
            if (repo.language) {
                stats[repo.language] = (stats[repo.language] || 0) + 1;
            }
        });

        // Sort by count
        return Object.entries(stats)
            .sort(([, a], [, b]) => b - a)
            .map(([lang, count]) => ({ language: lang, count }));
    }

    /**
     * Enrich repository data with additional information
     */
    enrichRepositoryData(repo) {
        // Determine primary technology
        const tech = repo.language || 'Other';

        // Get description or generate one
        const description = repo.description || `${repo.name} - A ${tech} project`;

        // Format last update
        const lastUpdated = new Date(repo.updated_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Get license
        const license = repo.license ? repo.license.name : null;

        return {
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            description: description,
            url: repo.html_url,
            homepage: repo.homepage,
            language: tech,
            languages: [tech], // Could be expanded with API call
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            watchers: repo.watchers_count,
            issues: repo.open_issues_count,
            isFork: repo.fork,
            isArchived: repo.archived,
            createdAt: repo.created_at,
            updatedAt: repo.updated_at,
            lastUpdated: lastUpdated,
            license: license,
            size: repo.size,
            topics: repo.topics || [],
            visibility: repo.visibility
        };
    }

    /**
     * Fetch all portfolio data in one call
     */
    async fetchPortfolioData() {
        try {
            const [profile, rawRepos] = await Promise.all([
                this.getUserProfile(),
                this.getUserRepositories()
            ]);

            // Enrich repository data
            const repositories = rawRepos.map(repo => this.enrichRepositoryData(repo));

            // Get language statistics
            const languageStats = this.getLanguageStats(rawRepos);

            // Calculate statistics
            const stats = {
                totalRepos: profile.public_repos,
                totalStars: repositories.reduce((sum, r) => sum + r.stars, 0),
                totalForks: repositories.reduce((sum, r) => sum + r.forks, 0),
                followers: profile.followers,
                following: profile.following,
                accountAge: this.calculateAccountAge(profile.created_at)
            };

            return {
                profile: {
                    login: profile.login,
                    name: profile.name || profile.login,
                    bio: profile.bio,
                    avatar: profile.avatar_url,
                    url: profile.html_url,
                    blog: profile.blog,
                    location: profile.location,
                    company: profile.company,
                    email: profile.email,
                    twitter: profile.twitter_username
                },
                repositories,
                languageStats,
                stats
            };
        } catch (error) {
            console.error('Error fetching portfolio data:', error);
            throw error;
        }
    }

    /**
     * Calculate account age in years
     */
    calculateAccountAge(createdAt) {
        const created = new Date(createdAt);
        const now = new Date();
        const years = Math.floor((now - created) / (365.25 * 24 * 60 * 60 * 1000));
        return years;
    }
}

// ============================================
// EXPORT
// ============================================
export { GitHubAPI, GITHUB_CONFIG };
