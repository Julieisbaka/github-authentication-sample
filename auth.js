// GitHub OAuth Settings
const CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID'; // Replace with your GitHub OAuth App client ID
const REDIRECT_URI = window.location.origin + window.location.pathname;

// Storage keys
const TOKEN_KEY = 'github_token';
const USER_KEY = 'github_user';

// DOM Elements
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const loggedInElement = document.getElementById('logged-in');
const loggedOutElement = document.getElementById('logged-out');
const usernameElement = document.getElementById('username');
const avatarElement = document.getElementById('avatar');
const submissionForm = document.getElementById('submission-form');
const projectsList = document.getElementById('projects-list');
const welcomeSection = document.getElementById('welcome-section');

// Event Listeners
loginButton.addEventListener('click', initiateLogin);
logoutButton.addEventListener('click', logout);

// Initialize authentication state
checkAuth();

/**
 * Initiates the GitHub OAuth login flow
 */
function initiateLogin() {
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user,repo`;
    window.location.href = authUrl;
}

/**
 * Handles the OAuth callback and exchanges code for token
 */
async function handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        // For a static site without a server, we'd need to proxy this through a GitHub Action
        // or serverless function since the OAuth exchange requires a client secret
        // 
        // For demo purposes, we'll redirect to a simulated token exchange endpoint
        // In a real app, you would handle this with GitHub Actions as described below
        
        // Remove the code from URL without refreshing
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // In a real app, we would:
        // 1. Create a GitHub Action that handles the OAuth exchange
        // 2. Call that action with the code
        // 3. Get back a token
        
        // For demo, we'll simulate successful authentication
        simulateSuccessfulAuth();
    }
}

/**
 * Simulates a successful authentication (for demo only)
 * In a real app, this would make actual API calls to GitHub
 */
function simulateSuccessfulAuth() {
    // For demo purposes only
    const mockToken = 'mock_' + Math.random().toString(36).substring(2);
    const mockUser = {
        login: 'github_user',
        name: 'GitHub User',
        avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4' // Default GitHub logo
    };
    
    localStorage.setItem(TOKEN_KEY, mockToken);
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
    
    updateUI(true, mockUser);
}

/**
 * Checks if the user is authenticated
 */
function checkAuth() {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    
    // Handle the OAuth callback if code is present
    if (window.location.search.includes('code=')) {
        handleCallback();
        return;
    }
    
    // Update UI based on auth state
    updateUI(!!token, user);
}

/**
 * Updates the UI based on authentication state
 */
function updateUI(isLoggedIn, user) {
    if (isLoggedIn && user) {
        loggedInElement.classList.remove('hidden');
        loggedOutElement.classList.add('hidden');
        welcomeSection.classList.add('hidden');
        submissionForm.classList.remove('hidden');
        projectsList.classList.remove('hidden');
        
        usernameElement.textContent = user.name || user.login;
        avatarElement.src = user.avatar_url;
        
        // Load user's projects
        loadProjects();
    } else {
        loggedInElement.classList.add('hidden');
        loggedOutElement.classList.remove('hidden');
        welcomeSection.classList.remove('hidden');
        submissionForm.classList.add('hidden');
        projectsList.classList.add('hidden');
    }
}

/**
 * Logs the user out
 */
function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    updateUI(false, null);
}

/**
 * Makes authenticated requests to GitHub API
 */
async function fetchGitHub(endpoint, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    
    const defaults = {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    };
    
    try {
        const response = await fetch(`https://api.github.com${endpoint}`, { ...defaults, ...options });
        if (!response.ok) throw new Error(`GitHub API error: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error('GitHub API error:', error);
        return null;
    }
}

/**
 * Loads the user's submitted projects
 * In a real app, this would fetch from a data file in the repo
 */
function loadProjects() {
    // In a real app, this would read from a JSON file in your repo
    // For demo, we'll use a mock project
    const mockProjects = [
        {
            name: "Sample Project",
            url: "https://github.com/username/sample-project",
            description: "This is an example project submission",
            tags: ["javascript", "web", "demo"]
        }
    ];
    
    displayProjects(mockProjects);
}

/**
 * Displays projects in the UI
 */
function displayProjects(projects) {
    const container = document.getElementById('projects-container');
    container.innerHTML = '';
    
    if (projects.length === 0) {
        container.innerHTML = '<p>No projects submitted yet.</p>';
        return;
    }
    
    projects.forEach(project => {
        const projectElement = document.createElement('div');
        projectElement.className = 'project-card';
        
        const tagsHtml = project.tags && project.tags.length 
            ? `<div class="project-tags">${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` 
            : '';
        
        projectElement.innerHTML = `
            <h3>${project.name}</h3>
            <a href="${project.url}" class="project-url" target="_blank">${project.url}</a>
            <p>${project.description}</p>
            ${tagsHtml}
        `;
        
        container.appendChild(projectElement);
    });
}