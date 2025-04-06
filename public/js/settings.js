// DOM Elements
const settingsForm = document.getElementById('settings-form');
const settingsContainer = document.getElementById('settings-container');
const settingsUnauthenticated = document.getElementById('settings-unauthenticated');
const disconnectBtn = document.getElementById('disconnect-btn');
const displayNameInput = document.getElementById('display-name');
const emailNotificationsToggle = document.getElementById('email-notifications');
const themeSelect = document.getElementById('theme');
const scopeGistCheckbox = document.getElementById('scope-gist');

// Settings state
let userSettings = {
  displayName: '',
  emailNotifications: false,
  theme: 'light',
  additionalScopes: []
};

// Function to check authentication and load settings
async function loadSettings() {
  try {
    const response = await fetch('/api/user');
    
    if (response.status === 401) {
      // User is not authenticated
      showUnauthenticatedState();
      return;
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }
    
    const userData = await response.json();
    
    // Show authenticated view
    settingsUnauthenticated.classList.add('hidden');
    settingsContainer.classList.remove('hidden');
    
    // Try to load existing settings from localStorage
    const savedSettings = localStorage.getItem(`github-auth-settings-${userData.id}`);
    if (savedSettings) {
      userSettings = JSON.parse(savedSettings);
      
      // Populate form with saved settings
      displayNameInput.value = userSettings.displayName || userData.name || userData.login;
      emailNotificationsToggle.checked = userSettings.emailNotifications;
      themeSelect.value = userSettings.theme;
      
      if (userSettings.additionalScopes.includes('gist')) {
        scopeGistCheckbox.checked = true;
      }
      
      // Apply theme if set
      applyTheme(userSettings.theme);
    } else {
      // Default to user's GitHub name/login
      displayNameInput.value = userData.name || userData.login;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    showUnauthenticatedState();
  }
}

// Function to show unauthenticated state
function showUnauthenticatedState() {
  settingsContainer.classList.add('hidden');
  settingsUnauthenticated.classList.remove('hidden');
}

// Function to save settings
function saveSettings(event) {
  event.preventDefault();
  
  // Get values from form
  userSettings.displayName = displayNameInput.value.trim();
  userSettings.emailNotifications = emailNotificationsToggle.checked;
  userSettings.theme = themeSelect.value;
  
  // Handle additional scopes
  userSettings.additionalScopes = [];
  if (scopeGistCheckbox.checked) {
    userSettings.additionalScopes.push('gist');
  }
  
  // Apply theme
  applyTheme(userSettings.theme);
  
  // Save to localStorage (in a real app, send to server)
  fetch('/api/user')
    .then(response => response.json())
    .then(userData => {
      localStorage.setItem(`github-auth-settings-${userData.id}`, JSON.stringify(userSettings));
      showSaveConfirmation();
    })
    .catch(error => {
      console.error('Error saving settings:', error);
    });
}

// Function to apply theme
function applyTheme(theme) {
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.style.setProperty('--text-color', '#e1e4e8');
    root.style.setProperty('--text-muted', '#959da5');
    root.style.setProperty('--bg-color', '#24292e');
    root.style.setProperty('--bg-secondary', '#2f363d');
    root.style.setProperty('--border-color', '#444d56');
    document.body.classList.add('dark-theme');
  } else if (theme === 'system') {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.style.setProperty('--text-color', '#e1e4e8');
      root.style.setProperty('--text-muted', '#959da5');
      root.style.setProperty('--bg-color', '#24292e');
      root.style.setProperty('--bg-secondary', '#2f363d');
      root.style.setProperty('--border-color', '#444d56');
      document.body.classList.add('dark-theme');
    } else {
      // Reset to light theme defaults
      root.style.removeProperty('--text-color');
      root.style.removeProperty('--text-muted');
      root.style.removeProperty('--bg-color');
      root.style.removeProperty('--bg-secondary');
      root.style.removeProperty('--border-color');
      document.body.classList.remove('dark-theme');
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      applyTheme('system');
    });
  } else {
    // Light theme (default)
    root.style.removeProperty('--text-color');
    root.style.removeProperty('--text-muted');
    root.style.removeProperty('--bg-color');
    root.style.removeProperty('--bg-secondary');
    root.style.removeProperty('--border-color');
    document.body.classList.remove('dark-theme');
  }
}

// Function to show save confirmation
function showSaveConfirmation() {
  const confirmationEl = document.createElement('div');
  confirmationEl.className = 'save-confirmation';
  confirmationEl.textContent = 'Settings saved successfully!';
  
  document.body.appendChild(confirmationEl);
  
  // Animate in
  setTimeout(() => {
    confirmationEl.classList.add('visible');
  }, 10);
  
  // Animate out after 3s
  setTimeout(() => {
    confirmationEl.classList.remove('visible');
    setTimeout(() => {
      confirmationEl.remove();
    }, 300);
  }, 3000);
}

// Function to handle disconnect account
function disconnectAccount() {
  if (confirm('Are you sure you want to disconnect your GitHub account? This will revoke access and log you out.')) {
    // Clear local settings
    fetch('/api/user')
      .then(response => response.json())
      .then(userData => {
        localStorage.removeItem(`github-auth-settings-${userData.id}`);
        // Log out
        window.location.href = '/logout';
      })
      .catch(error => {
        console.error('Error during disconnect:', error);
        // Still redirect to logout on error
        window.location.href = '/logout';
      });
  }
}

// Initialize the settings page
document.addEventListener('DOMContentLoaded', () => {
  // Load settings and check auth state
  loadSettings();
  
  // Set up event listeners
  settingsForm.addEventListener('submit', saveSettings);
  disconnectBtn.addEventListener('click', disconnectAccount);
  
  // Listen for theme changes
  themeSelect.addEventListener('change', () => {
    applyTheme(themeSelect.value);
  });
});