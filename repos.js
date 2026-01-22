// Repository Manager JavaScript

let githubToken = '';
let repositories = [];

// DOM Elements
const githubTokenInput = document.getElementById('githubToken');
const loadReposBtn = document.getElementById('loadReposBtn');
const makeAllPrivateBtn = document.getElementById('makeAllPrivateBtn');
const repoSection = document.getElementById('repoSection');
const repoContainer = document.getElementById('repoContainer');
const statusMessage = document.getElementById('statusMessage');

// Event Listeners
loadReposBtn.addEventListener('click', loadRepositories);
makeAllPrivateBtn.addEventListener('click', makeAllRepositoriesPrivate);

// Load token from localStorage if available
document.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('githubToken');
    if (savedToken) {
        githubTokenInput.value = savedToken;
    }
});

// Show status message
function showStatus(message, type = 'info') {
    statusMessage.innerHTML = `<div class="status-message ${type}">${message}</div>`;
    setTimeout(() => {
        if (type !== 'error') {
            statusMessage.innerHTML = '';
        }
    }, 5000);
}

// Load repositories from GitHub API
async function loadRepositories() {
    githubToken = githubTokenInput.value.trim();
    
    if (!githubToken) {
        showStatus('Please enter a GitHub Personal Access Token', 'error');
        return;
    }

    // Save token to localStorage
    localStorage.setItem('githubToken', githubToken);

    loadReposBtn.disabled = true;
    loadReposBtn.textContent = 'Loading...';
    showStatus('Loading your repositories...', 'info');

    try {
        // Get authenticated user
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!userResponse.ok) {
            throw new Error('Authentication failed. Please check your token.');
        }

        const user = await userResponse.json();
        
        // Get all repositories (including private ones)
        const reposResponse = await fetch(`https://api.github.com/user/repos?per_page=100&affiliation=owner`, {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!reposResponse.ok) {
            throw new Error('Failed to load repositories');
        }

        repositories = await reposResponse.json();
        
        // Sort repositories: public first, then by name
        repositories.sort((a, b) => {
            if (a.private === b.private) {
                return a.name.localeCompare(b.name);
            }
            return a.private ? 1 : -1;
        });

        displayRepositories();
        repoSection.style.display = 'block';
        showStatus(`Successfully loaded ${repositories.length} repositories for ${user.login}`, 'success');
        
    } catch (error) {
        showStatus(error.message, 'error');
    } finally {
        loadReposBtn.disabled = false;
        loadReposBtn.textContent = 'Load My Repositories';
    }
}

// Display repositories in the UI
function displayRepositories() {
    if (repositories.length === 0) {
        repoContainer.innerHTML = '<p>No repositories found.</p>';
        return;
    }

    const publicCount = repositories.filter(repo => !repo.private).length;
    const privateCount = repositories.filter(repo => repo.private).length;

    let html = `<p style="margin-bottom: 15px; color: #666;">
        Total: ${repositories.length} repositories 
        (${publicCount} public, ${privateCount} private)
    </p>`;

    repositories.forEach(repo => {
        const visibility = repo.private ? 'private' : 'public';
        const visibilityText = repo.private ? 'Private' : 'Public';
        
        html += `
            <div class="repo-item ${visibility}">
                <div class="repo-info">
                    <div class="repo-name">
                        ${repo.name}
                        <span class="repo-visibility ${visibility}">${visibilityText}</span>
                    </div>
                    <div style="font-size: 12px; color: #666;">
                        ${repo.description || 'No description'}
                    </div>
                </div>
                ${!repo.private ? `
                    <button class="btn btn-success" onclick="makeRepositoryPrivate('${repo.name}', '${repo.owner.login}')">
                        Make Private
                    </button>
                ` : `
                    <span style="color: #4caf50;">✓ Private</span>
                `}
            </div>
        `;
    });

    repoContainer.innerHTML = html;
}

// Make a single repository private
async function makeRepositoryPrivate(repoName, owner) {
    if (!confirm(`Are you sure you want to make "${repoName}" private?`)) {
        return;
    }

    showStatus(`Making ${repoName} private...`, 'info');

    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                private: true
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update repository');
        }

        showStatus(`✓ Successfully made ${repoName} private`, 'success');
        
        // Reload repositories to update the list
        await loadRepositories();

    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
    }
}

// Make all public repositories private
async function makeAllRepositoriesPrivate() {
    const publicRepos = repositories.filter(repo => !repo.private);
    
    if (publicRepos.length === 0) {
        showStatus('All repositories are already private!', 'success');
        return;
    }

    const confirmMessage = `This will make ${publicRepos.length} public ${publicRepos.length === 1 ? 'repository' : 'repositories'} private:\n\n${publicRepos.map(r => `• ${r.name}`).join('\n')}\n\nAre you sure?`;
    
    if (!confirm(confirmMessage)) {
        return;
    }

    makeAllPrivateBtn.disabled = true;
    makeAllPrivateBtn.textContent = 'Processing...';

    let successCount = 0;
    let failCount = 0;

    for (const repo of publicRepos) {
        try {
            showStatus(`Making ${repo.name} private (${successCount + failCount + 1}/${publicRepos.length})...`, 'info');

            const response = await fetch(`https://api.github.com/repos/${repo.owner.login}/${repo.name}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    private: true
                })
            });

            if (response.ok) {
                successCount++;
            } else {
                failCount++;
                console.error(`Failed to update ${repo.name}`);
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            failCount++;
            console.error(`Error updating ${repo.name}:`, error);
        }
    }

    // Show final result
    if (failCount === 0) {
        showStatus(`✓ Successfully made all ${successCount} repositories private!`, 'success');
    } else {
        showStatus(`Completed: ${successCount} successful, ${failCount} failed. Check console for details.`, 'error');
    }

    makeAllPrivateBtn.disabled = false;
    makeAllPrivateBtn.textContent = 'Make All Public Repositories Private';

    // Reload repositories to update the list
    await loadRepositories();
}

// Make function globally available for onclick handlers
window.makeRepositoryPrivate = makeRepositoryPrivate;
