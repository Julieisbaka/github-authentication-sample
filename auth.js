// GitHub OAuth Settings
const CLIENT_ID = 'Ov23liYJv9yGDtXz1DDK'; // Your GitHub OAuth App Client ID
const REDIRECT_URI = window.location.origin + window.location.pathname;
const REPO_OWNER = 'julieisbaka'; // Your GitHub username
const REPO_NAME = 'github-authentication-sample'; // Your repository name

// Storage keys
const TOKEN_KEY = 'github_token';
const USER_KEY = 'github_user';
const CALLBACK_ID_KEY = 'oauth_callback_id';

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
    // Generate a unique callback ID
    const callbackId = Date.now().toString();
    localStorage.setItem(CALLBACK_ID_KEY, callbackId);
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user,repo&state=${callbackId}`;
    window.location.href = authUrl;
}

/**
 * Handles the OAuth callback and exchanges code for token via GitHub Actions
 */
async function handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (!code) {
        console.error('No code received from GitHub');
        return;
    }
    
    try {
        // Remove the code from URL without refreshing
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Display loading state
        loginButton.disabled = true;
        loginButton.textContent = 'Authenticating...';
        
        // Trigger the GitHub Action to exchange the code for a token
        // This is a production implementation using GitHub Actions workflow_dispatch
        const callbackId = state || localStorage.getItem(CALLBACK_ID_KEY);
        
        // Trigger the workflow dispatch event
        await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/project-submission.yml/dispatches`, {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                // No auth token needed for public repos
            },
            body: JSON.stringify({
                ref: 'main', // or master, depending on your default branch
                inputs: {
                    action: 'handle_oauth',
                    code: code,
                    callback_id: callbackId
                }
            })
        });
        
        // Now poll for the token
        const token = await pollForToken(callbackId);
        if (!token) {
            throw new Error('Failed to retrieve token after multiple attempts');
        }
        
        // Get user data with the token
        const userData = await fetchUserData(token);
        
        // Store authentication data
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        
        // Update UI
        updateUI(true, userData);
    } catch (error) {
        console.error('Authentication error:', error);
        alert('Authentication failed. Please try again.');
        loginButton.disabled = false;
        loginButton.textContent = 'Sign in with GitHub';
    }
}

/**
 * Polls for the token from the temporary gist created by the GitHub Action
 */
async function pollForToken(callbackId, maxAttempts = 10) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            // Try to find the gist with our token
            const response = await fetch(`https://api.github.com/gists?per_page=100`);
            const gists = await response.json();
            
            // Look for our token gist
            const tokenGist = gists.find(gist => {
                return Object.keys(gist.files).some(filename => 
                    filename.includes(`token-${callbackId}.json`)
                );
            });
            
            if (tokenGist) {
                // Get the gist content
                const gistFile = Object.values(tokenGist.files)[0];
                const gistResponse = await fetch(gistFile.raw_url);
                const gistData = await gistResponse.json();
                
                // Delete the gist since we've retrieved the token
                return gistData.token;
            }
            
            // Wait 3 seconds before next attempt
            await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
            console.error(`Error polling for token (attempt ${attempt + 1}):`, error);
            // Continue to next attempt
        }
    }
    
    return null; // Failed to get token after all attempts
}

/**
 * Fetches user data from GitHub API
 */
async function fetchUserData(token) {
    const response = await fetch('https://api.github.com/user', {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch user data');
    }
    
    return await response.json();
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
    
    // Validate the existing token periodically
    if (token) {
        validateToken(token);
    }
}

/**
 * Validates an existing token
 */
async function validateToken(token) {
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            // Token is invalid, log the user out
            logout();
        }
    } catch (error) {
        console.error('Error validating token:', error);
    }
}

/**
 * Updates the UI based on authentication state
 */
function updateUI(isLoggedIn, user) {
    if (isLoggedIn && user) {
        loggedInElement.classList.remove('hidden');
        loggedOutElement.classList.add('hidden');
        welcomeSection.classList.add('hidden');
        
        if (submissionForm) submissionForm.classList.remove('hidden');
        if (projectsList) projectsList.classList.remove('hidden');
        
        usernameElement.textContent = user.name || user.login;
        avatarElement.src = user.avatar_url;
        
        // Load user's projects
        loadProjects();
    } else {
        loggedInElement.classList.add('hidden');
        loggedOutElement.classList.remove('hidden');
        welcomeSection.classList.remove('hidden');
        
        if (submissionForm) submissionForm.classList.add('hidden');
        if (projectsList) projectsList.classList.add('hidden');
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
    if (!container) {
        console.error('Projects container not found');
        return;
    }
    
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