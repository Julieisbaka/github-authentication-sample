// Form elements
const projectForm = document.getElementById('project-form');
const toolUploadForm = document.getElementById('tool-upload-form');
const selectFolderBtn = document.getElementById('select-folder-btn');
const selectedFolderPath = document.getElementById('selected-folder-path');

// Store the selected folder path
let selectedFolder = null;

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    if (projectForm) {
        projectForm.addEventListener('submit', handleProjectSubmission);
    }
    
    if (toolUploadForm) {
        toolUploadForm.addEventListener('submit', handleToolSubmission);
    }
    
    if (selectFolderBtn) {
        selectFolderBtn.addEventListener('click', handleFolderSelection);
    }
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
        }
    ];
}

/**
 * Handle folder selection for tool upload using the File System Access API
 */
async function handleFolderSelection() {
    try {
        // Check if File System Access API is supported
        if (!window.showDirectoryPicker) {
            throw new Error('File System Access API is not supported in this browser');
        }
        
        // Open directory picker
        const directoryHandle = await window.showDirectoryPicker();
        const dirName = directoryHandle.name;
        
        // Collect file entries from the selected directory
        const files = [];
        for await (const entry of directoryHandle.values()) {
            if (entry.kind === 'file') {
                files.push(entry.name);
            }
        }
        
        // Store the directory info
        selectedFolder = {
            handle: directoryHandle,
            name: dirName,
            path: dirName, // Note: For security reasons, full path isn't available
            files: files
        };
        
        // Update UI to show selected folder
        selectedFolderPath.textContent = `${dirName} (${files.length} files)`;
        console.log('Folder selected:', selectedFolder);
    } catch (error) {
        console.error('Error selecting folder:', error);
        
        // Fallback for unsupported browsers or if user cancels
        if (error.name !== 'AbortError') {
            alert(`Failed to select folder: ${error.message}`);
            
            // Provide fallback method for unsupported browsers
            const manualFolderName = prompt('Enter the name of your tool folder:');
            if (manualFolderName) {
                selectedFolder = {
                    name: manualFolderName,
                    path: manualFolderName,
                    files: ['(Files not enumerated)']
                };
                selectedFolderPath.textContent = manualFolderName;
            }
        }
    }
}

/**
 * Handle tool submission form
 */
async function handleToolSubmission(event) {
    event.preventDefault();
    
    // Check if user is authenticated
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        alert('You must be logged in to submit a tool');
        return;
    }
    
    // Check if a folder was selected
    if (!selectedFolder) {
        alert('Please select a folder containing your tool');
        return;
    }
    
    // Get form data
    const formData = new FormData(toolUploadForm);
    const toolData = {
        name: formData.get('tool-name'),
        description: formData.get('tool-description'),
        tags: formData.get('tool-tags').split(',').map(tag => tag.trim()).filter(tag => tag),
        folder: selectedFolder,
        timestamp: new Date().toISOString(),
        user: JSON.parse(localStorage.getItem(USER_KEY)).login
    };
    
    try {
        // Submit the tool through GitHub Issues/PR
        await submitToolViaGitHub(toolData);
        
        alert('Tool submitted successfully! A pull request will be created under your GitHub account.');
        toolUploadForm.reset();
        selectedFolderPath.textContent = 'No folder selected';
        selectedFolder = null;
        
        // Add the tool to the UI for immediate feedback
        const mockTools = [
            {
                name: toolData.name,
                description: toolData.description,
                status: "pending",
                tags: toolData.tags,
                user: toolData.user,
                timestamp: toolData.timestamp
            },
            ...loadExistingTools()
        ];
        
        displayTools(mockTools);
    } catch (error) {
        console.error('Error submitting tool:', error);
        alert('Failed to submit tool. Please try again.');
    }
}

/**
 * Submits a tool via GitHub API by creating a pull request
 */
async function submitToolViaGitHub(toolData) {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY));
    const targetRepoOwner = 'julieisbaka'; // Replace with target repository owner
    const targetRepoName = 'github-authentication-sample'; // Replace with target repository name
    const toolFolderName = toolData.name.toLowerCase().replace(/\s+/g, '-');
    const branchName = `tool/${toolFolderName}-${Date.now()}`;
    
    try {
        // Show progress notification
        const progressNotification = document.createElement('div');
        progressNotification.className = 'progress-notification';
        progressNotification.innerHTML = `
            <div class="progress-spinner"></div>
            <div class="progress-message">Processing tool submission...</div>
        `;
        document.body.appendChild(progressNotification);
        
        updateProgress('Checking if repository is already forked...');
        
        // 1. Check if repo is already forked
        let forkOwner = user.login;
        let forkExists = false;
        
        try {
            const forksResponse = await fetch(`https://api.github.com/repos/${targetRepoOwner}/${targetRepoName}/forks`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (forksResponse.ok) {
                const forks = await forksResponse.json();
                forkExists = forks.some(fork => fork.owner.login === user.login);
            }
        } catch (error) {
            console.error('Error checking for existing fork:', error);
        }
        
        // 2. Fork the repo if not already forked
        if (!forkExists) {
            updateProgress('Forking repository...');
            const forkResponse = await fetch(`https://api.github.com/repos/${targetRepoOwner}/${targetRepoName}/forks`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!forkResponse.ok) {
                throw new Error('Failed to fork repository');
            }
            
            // Wait a moment for the fork to complete
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // 3. Get the default branch of the target repo
        updateProgress('Getting repository details...');
        const repoResponse = await fetch(`https://api.github.com/repos/${targetRepoOwner}/${targetRepoName}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!repoResponse.ok) {
            throw new Error('Failed to get repository details');
        }
        
        const repoData = await repoResponse.json();
        const defaultBranch = repoData.default_branch;
        
        // 4. Get the reference to the default branch
        const refResponse = await fetch(`https://api.github.com/repos/${forkOwner}/${targetRepoName}/git/ref/heads/${defaultBranch}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!refResponse.ok) {
            throw new Error('Failed to get branch reference');
        }
        
        const refData = await refResponse.json();
        const sha = refData.object.sha;
        
        // 5. Create a new branch
        updateProgress('Creating branch for your tool...');
        const createBranchResponse = await fetch(`https://api.github.com/repos/${forkOwner}/${targetRepoName}/git/refs`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ref: `refs/heads/${branchName}`,
                sha: sha
            })
        });
        
        if (!createBranchResponse.ok) {
            throw new Error('Failed to create branch');
        }
        
        // 6. Read files from the selected folder and upload them
        updateProgress('Uploading tool files...');
        
        // Create a directory structure for the tool
        const toolPath = `tools/${toolFolderName}`;
        
        // Create a metadata.json file
        const metadata = {
            name: toolData.name,
            description: toolData.description,
            tags: toolData.tags,
            author: user.login,
            created: new Date().toISOString()
        };
        
        // Upload metadata.json
        await createOrUpdateFile(
            forkOwner,
            targetRepoName,
            `${toolPath}/metadata.json`,
            JSON.stringify(metadata, null, 2),
            `Add metadata for ${toolData.name} tool`,
            branchName,
            token
        );
        
        // Create README.md if not exists
        const readmeContent = `# ${toolData.name}\n\n${toolData.description}\n\n## Tags\n${toolData.tags.map(tag => `- ${tag}`).join('\n')}\n\n## Author\n@${user.login}`;
        
        await createOrUpdateFile(
            forkOwner,
            targetRepoName,
            `${toolPath}/README.md`,
            readmeContent,
            `Add README for ${toolData.name} tool`,
            branchName,
            token
        );
        
        // Upload the actual files from the selected directory
        if (toolData.folder.handle) {
            // Using File System Access API
            for await (const entry of toolData.folder.handle.values()) {
                if (entry.kind === 'file') {
                    const file = await entry.getFile();
                    const content = await file.text();
                    
                    // Skip very large files (GitHub API has a limit)
                    if (content.length > 1000000) {
                        console.warn(`Skipping large file: ${entry.name}`);
                        continue;
                    }
                    
                    await createOrUpdateFile(
                        forkOwner,
                        targetRepoName,
                        `${toolPath}/${entry.name}`,
                        content,
                        `Add ${entry.name} for ${toolData.name} tool`,
                        branchName,
                        token
                    );
                }
            }
        }
        
        // 7. Create a pull request
        updateProgress('Creating pull request...');
        const prResponse = await fetch(`https://api.github.com/repos/${targetRepoOwner}/${targetRepoName}/pulls`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: `Add Tool: ${toolData.name}`,
                body: `
# Tool Submission: ${toolData.name}

${toolData.description}

## Tags
${toolData.tags.map(tag => `- ${tag}`).join('\n')}

## Files
${toolData.folder.files.map(file => `- ${file}`).join('\n')}

Submitted by: @${user.login}
                `,
                head: `${forkOwner}:${branchName}`,
                base: defaultBranch
            })
        });
        
        if (!prResponse.ok) {
            const errorData = await prResponse.json();
            throw new Error(`Failed to create pull request: ${errorData.message}`);
        }
        
        const prData = await prResponse.json();
        
        // Remove progress notification
        document.body.removeChild(progressNotification);
        
        return prData;
    } catch (error) {
        console.error('Failed to create pull request:', error);
        // Remove progress notification if it exists
        const notification = document.querySelector('.progress-notification');
        if (notification) {
            document.body.removeChild(notification);
        }
        
        throw error;
    }
}

/**
 * Helper function to update progress notification
 */
function updateProgress(message) {
    const progressMessage = document.querySelector('.progress-message');
    if (progressMessage) {
        progressMessage.textContent = message;
    }
    console.log(message);
}

/**
 * Helper function to create or update a file in GitHub
 */
async function createOrUpdateFile(owner, repo, path, content, message, branch, token) {
    // Check if file exists
    let sha;
    try {
        const fileResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (fileResponse.ok) {
            const fileData = await fileResponse.json();
            sha = fileData.sha;
        }
    } catch (error) {
        console.log(`File ${path} doesn't exist yet, will create it`);
    }
    
    // Create or update file
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: message,
            content: btoa(unescape(encodeURIComponent(content))), // Convert to base64
            branch: branch,
            sha: sha
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        console.error(`Error creating/updating file ${path}:`, errorData);
        throw new Error(`Failed to create/update file ${path}: ${errorData.message}`);
    }
    
    return await response.json();
}

/**
 * Load existing tools
 */
function loadExistingTools() {
    // Demo tool data
    return [
        {
        }
    ];
}