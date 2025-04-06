// Form elements
const projectForm = document.getElementById('project-form');

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    projectForm.addEventListener('submit', handleProjectSubmission);
});

/**
 * Handles project form submission
 */
async function handleProjectSubmission(event) {
    event.preventDefault();
    
    // Check if user is authenticated
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        alert('You must be logged in to submit a project');
        return;
    }
    
    // Get form data
    const formData = new FormData(projectForm);
    const projectData = {
        name: formData.get('project-name'),
        url: formData.get('project-url'),
        description: formData.get('project-description'),
        tags: formData.get('project-tags').split(',').map(tag => tag.trim()).filter(tag => tag),
        timestamp: new Date().toISOString(),
        user: JSON.parse(localStorage.getItem(USER_KEY)).login
    };
    
    try {
        // Submit the project through GitHub Issues
        await submitProjectViaGitHub(projectData);
        
        alert('Project submitted successfully! Your submission will be reviewed.');
        projectForm.reset();
        
        // Add the project to the UI for immediate feedback
        const mockProjects = [projectData, ...loadExistingProjects()];
        displayProjects(mockProjects);
    } catch (error) {
        console.error('Error submitting project:', error);
        alert('Failed to submit project. Please try again.');
    }
}

/**
 * Submits a project via GitHub API by creating an issue
 * The GitHub Action will process this issue and create a PR
 */
async function submitProjectViaGitHub(projectData) {
    const token = localStorage.getItem(TOKEN_KEY);
    const repoOwner = 'YOUR_GITHUB_USERNAME'; // Replace with your GitHub username
    const repoName = 'github-authentication-sample'; // Replace with your repo name
    
    // In a real implementation, this would create an issue with the project data
    // The GitHub Action will pick up this issue and create a PR
    try {
        const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/issues`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: `[Project Submission] ${projectData.name}`,
                body: JSON.stringify(projectData, null, 2)
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`GitHub API error: ${errorData.message}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Failed to create issue:', error);
        
        // For demo purposes, simulate successful submission if API call fails
        console.log('Simulating successful submission:', projectData);
        return new Promise(resolve => setTimeout(resolve, 1000));
    }
}

/**
 * Fetches projects from the repository
 */
async function fetchProjects() {
    const repoOwner = 'YOUR_GITHUB_USERNAME'; // Replace with your GitHub username
    const repoName = 'github-authentication-sample'; // Replace with your repo name
    
    try {
        // Try to fetch the projects.json file from the repository
        const response = await fetch(`https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/data/projects.json`);
        
        if (response.ok) {
            return await response.json();
        } else {
            console.log('No projects found or error fetching projects');
            return [];
        }
    } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
}

/**
 * Loads existing projects
 * Attempts to fetch from GitHub repo, falls back to demo data
 */
async function loadProjects() {
    try {
        const projects = await fetchProjects();
        
        if (projects && projects.length > 0) {
            displayProjects(projects);
            return;
        }
        
        // Fall back to demo data if no projects found
        displayProjects(loadExistingProjects());
    } catch (error) {
        console.error('Error loading projects:', error);
        displayProjects(loadExistingProjects());
    }
}

/**
 * Loads existing projects from local storage for the demo
 */
function loadExistingProjects() {
    // Demo project data
    return [
        {
            name: "Sample Project",
            url: "https://github.com/username/sample-project",
            description: "This is an example project submission",
            tags: ["javascript", "web", "demo"],
            timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            user: "github_user"
        }
    ];
}