import { useState, useEffect } from 'react';
import {
    GitBranch,
    GitPullRequest,
    ExternalLink,
    User,
    ArrowLeft,
    AlertCircle,
    GitFork,
    Activity,
    FileText,
    Code,
    TrendingUp,
    Plus,
    Minus
} from 'lucide-react';

interface Proposal {
    id: string;
    title: string;
    description: string;
    repositoryLink: string;
    githubIssueLink?: string;
    createdBy: {
        id: string;
        username: string;
    };
    createdAt: string;
}

interface User {
    id: string;
    username: string;
}

interface BranchActivity {
    id: string;
    branch_name: string;
    action: string;
    username: string;
    user_id: string | number;
    created_at: string;
}

interface ProposalStats {
    totalBranches: number;
    totalForks: number;
    totalCommits: number;
    filesChanged: number;
    linesAdded: number;
    linesDeleted: number;
}


interface CodeChange {
    file: string;
    additions: number;
    deletions: number;
    changes: Array<{
        type: 'addition' | 'deletion';
        line: number;
        content: string;
    }>;
}

interface ProposalDetailProps {
    proposal: Proposal;
    currentUser: User | null; // Make currentUser nullable
    onBack: () => void;
}

const ProposalDetail = ({ proposal, currentUser, onBack }: ProposalDetailProps) => {
    const [activity, setActivity] = useState<any>(null);
    const [branchInfo, setBranchInfo] = useState<any>(null);
    const [loadingActivity, setLoadingActivity] = useState(true);
    const [isCreatingBranch, setIsCreatingBranch] = useState(false);
    const [isCreatingPR, setIsCreatingPR] = useState(false);
    const [userBranches, setUserBranches] = useState<BranchActivity[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<ProposalStats>({
        totalBranches: 0,
        totalForks: 0,
        totalCommits: 0,
        filesChanged: 0,
        linesAdded: 0,
        linesDeleted: 0
    });
    const [codeChanges, setCodeChanges] = useState<CodeChange[]>([]);
    const [githubData, setGithubData] = useState<any>(null);
    const [loadingGithubData, setLoadingGithubData] = useState(true);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);

    // Calculate ownership early
    const isCollaborator = currentUser && proposal.createdBy?.id !== currentUser.id;

    useEffect(() => {
        if (!currentUser) {
            setLoadingActivity(false);
            return;
        }

        const fetchActivity = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_SERVER_URL}api/proposals/${proposal.id}/activity`,
                    { credentials: 'include' }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setActivity(data);

                console.log('Raw activity data:', data); // Debug log
                console.log('Current user object:', currentUser); // Debug current user

                // Safe branch filtering with proper type conversion
                const currentUserBranches = data.branches?.filter((branch: BranchActivity) => {
                    if (!branch.user_id || !currentUser) return false;

                    // Convert both IDs to strings for comparison if both exist
                    if (branch.user_id && currentUser.id) {
                        const branchUserId = String(branch.user_id);
                        const currentUserId = String(currentUser.id);
                        
                        console.log(`Comparing branch user ID: ${branchUserId} with current user ID: ${currentUserId}`);
                        
                        if (branchUserId === currentUserId) {
                            return true;
                        }
                    }

                    // Compare by username (primary fallback since currentUser.id might be missing)
                    console.log('Branch username:', branch.username);
                    console.log('Current user username:', currentUser.username);
                    
                    return branch.username === currentUser.username;
                }) || [];

                console.log('Filtered branches for current user:', currentUserBranches); // Debug log

                setUserBranches(currentUserBranches);

                // If user has branches, set up branch info for the most recent one
                if (currentUserBranches.length > 0) {
                    const mostRecentBranch = currentUserBranches[0];
                    const repoName = proposal.repositoryLink.split('/').pop()?.replace('.git', '') || '';
                    const newBranchInfo = {
                        branchName: mostRecentBranch.branch_name,
                        forkOwner: currentUser.username,
                        originalRepo: proposal.repositoryLink.split('/').slice(-2).join('/').replace('.git', ''),
                        cloneUrl: `https://github.com/${currentUser.username}/${repoName}.git`,
                        forkUrl: `https://github.com/${currentUser.username}/${repoName}`,
                        branchUrl: `https://github.com/${currentUser.username}/${repoName}/tree/${mostRecentBranch.branch_name}`
                    };

                    console.log('Setting branch info:', newBranchInfo); // Debug log
                    setBranchInfo(newBranchInfo);
                }
                
                // Activity data is handled separately now
                // GitHub stats are fetched via the GitHub API
            } catch (error) {
                console.error('Error fetching activity:', error);
                setError('Failed to load activity data');
            } finally {
                setLoadingActivity(false);
            }
        };

        fetchActivity();
        fetchGitHubData();
    }, [proposal.id, currentUser?.id, currentUser?.username]);

    const fetchGitHubData = async () => {
        if (!currentUser) {
            setLoadingGithubData(false);
            return;
        }

        try {
            const response = await fetch(
                `${import.meta.env.VITE_SERVER_URL}/api/proposals/${proposal.id}/github-data`,
                { credentials: 'include' }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setGithubData(data);
            
            // Update stats with real data
            setStats(data.stats);
            
            // Update code changes with real file changes
            if (data.fileChanges && data.fileChanges.length > 0) {
                const formattedChanges = data.fileChanges.map((file: any) => ({
                    file: file.filename,
                    additions: file.additions,
                    deletions: file.deletions,
                    changes: file.patch ? parsePatch(file.patch) : []
                }));
                setCodeChanges(formattedChanges);
            }
        } catch (error) {
            console.error('Error fetching GitHub data:', error);
        } finally {
            setLoadingGithubData(false);
        }
    };

    // Helper function to parse git patch into changes array
    const parsePatch = (patch: string) => {
        const lines = patch.split('\n');
        const changes: Array<{ type: 'addition' | 'deletion', line: number, content: string }> = [];
        
        let currentLine = 0;
        for (const line of lines) {
            if (line.startsWith('@@')) {
                // Parse line numbers from @@ -oldStart,oldLines +newStart,newLines @@
                const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
                if (match) {
                    currentLine = parseInt(match[2]);
                }
            } else if (line.startsWith('+') && !line.startsWith('+++')) {
                changes.push({
                    type: 'addition',
                    line: currentLine,
                    content: line
                });
                currentLine++;
            } else if (line.startsWith('-') && !line.startsWith('---')) {
                changes.push({
                    type: 'deletion',
                    line: currentLine,
                    content: line
                });
            } else if (!line.startsWith('\\')) {
                currentLine++;
            }
        }
        
        return changes.slice(0, 10); // Limit to 10 changes for display
    };

    const refreshActivity = async () => {
  if (!currentUser) return;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SERVER_URL}/api/proposals/${proposal.id}/activity`,
      { credentials: 'include' }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    setActivity(data);

    const currentUserBranches = data.branches?.filter((branch: BranchActivity) => {
      if (!branch.user_id || !currentUser) return false;
      
      // Compare by ID if both exist
      if (branch.user_id && currentUser.id) {
        const branchUserId = String(branch.user_id);
        const currentUserId = String(currentUser.id);
        if (branchUserId === currentUserId) {
          return true;
        }
      }
      
      // Compare by username as primary fallback
      return branch.username === currentUser.username;
    }) || [];

    setUserBranches(currentUserBranches);
    
    // Update branchInfo if needed
    if (currentUserBranches.length > 0 && !branchInfo) {
      const mostRecentBranch = currentUserBranches[0];
      const repoName = proposal.repositoryLink.split('/').pop()?.replace('.git', '') || '';
      setBranchInfo({
        branchName: mostRecentBranch.branch_name,
        forkOwner: currentUser.username,
        originalRepo: proposal.repositoryLink.split('/').slice(-2).join('/').replace('.git', ''),
        cloneUrl: `https://github.com/${currentUser.username}/${repoName}.git`,
        forkUrl: `https://github.com/${currentUser.username}/${repoName}`,
        branchUrl: `https://github.com/${currentUser.username}/${repoName}/tree/${mostRecentBranch.branch_name}`
      });
    }
  } catch (error) {
    console.error('Error refreshing activity:', error);
    setError('Failed to refresh activity');
  }
};

    const handleCreateBranch = async () => {
        if (!currentUser) {
            setError('You must be logged in to create a branch');
            return;
        }

        setIsCreatingBranch(true);
        setError(null);

        try {
            const response = await fetch(
                `${import.meta.env.VITE_SERVER_URL}/api/proposals/${proposal.id}/collaborate/branch`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to create branch');
            }

            setBranchInfo(result);
            await refreshActivity();
        } catch (err) {
            console.error('Error creating branch:', err);

            // Type-safe error handling
            if (err instanceof Error) {
                setError(err.message);
            } else if (typeof err === 'string') {
                setError(err);
            } else if (typeof err === 'object' && err !== null && 'message' in err) {
                setError((err as { message: string }).message);
            } else {
                setError('Failed to create branch');
            }
        } finally {
            setIsCreatingBranch(false);
        }
    };

    const handleCreatePR = async (branchName?: string) => {
        if (!currentUser) {
            setError('You must be logged in to create a pull request');
            return;
        }

        const targetBranch = branchName || branchInfo?.branchName;

        if (!targetBranch) {
            setError('No branch selected for PR creation');
            return;
        }

        const prTitle = prompt('Enter PR title:');
        if (!prTitle) return;

        const prDescription = prompt('Enter PR description (optional):') ||
            `Pull request from ${currentUser.username} for proposal: ${proposal.title}`;

        setIsCreatingPR(true);
        setError(null);

        try {
            const response = await fetch(
                `${import.meta.env.VITE_SERVER_URL}/api/proposals/${proposal.id}/collaborate/pull-request`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        branchName: targetBranch,
                        title: prTitle,
                        description: prDescription
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || result.message || 'Failed to create pull request');
            }

            await refreshActivity();
        } catch (err) {
            console.error('Error creating PR:', err);
            // Type guard to check if error is an Error object
            if (err instanceof Error) {
                setError(err.message);
            } else if (typeof err === 'string') {
                setError(err);
            } else {
                setError('Failed to create pull request');
            }
        } finally {
            setIsCreatingPR(false);
        }
    };

    // Safe ownership check
    const hasUserBranches = userBranches.length > 0;

    return (
        <div className="h-screen bg-[#191818] flex overflow-hidden" style={{fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
            {/* Left Panel - 30% */}
            <div className="w-[30%] bg-[#191818] flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-gray-700">
                    <button
                        onClick={onBack}
                        className="flex items-center text-gray-400 hover:text-gray-300 mb-4 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Proposals
                    </button>

                    {/* Error display */}
                    {error && (
                        <div className="bg-red-900/20 border-l-4 border-red-500 p-3 mb-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-4 w-4 text-red-400" />
                                </div>
                                <div className="ml-2">
                                    <p className="text-xs text-red-300">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <h2 className="text-lg font-bold text-white mb-2">Proposal: {proposal.title}</h2>
                        <p className="text-gray-400 text-sm mb-4">
                            Created by <span className="text-gray-400 font-medium">{proposal.createdBy?.username}</span> on {new Date(proposal.createdAt).toLocaleDateString()}
                        </p>
                        
                        <div className="space-y-2">
                            <a
                                href={proposal.repositoryLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-sm transition-colors w-full"
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Repository
                            </a>
                            
                            {isCollaborator && !hasUserBranches && (
                                <button
                                    onClick={handleCreateBranch}
                                    disabled={isCreatingBranch}
                                    className="flex items-center px-3 py-2 border border-gray-600 text-gray-400 bg-transparent hover:bg-gray-700/10 hover:border-gray-500 disabled:bg-gray-600 disabled:text-gray-400 disabled:border-gray-600 rounded text-sm transition-all duration-200 w-full"
                                >
                                    <GitFork className="h-4 w-4 mr-2" />
                                    {isCreatingBranch ? 'Creating Fork...' : 'Fork Repo'}
                                </button>
                            )}
                            
                            {hasUserBranches && (
                                <button
                                    onClick={() => handleCreatePR()}
                                    disabled={isCreatingPR}
                                    className="flex items-center px-3 py-2 border border-gray-600 text-gray-400 bg-transparent hover:bg-gray-700/10 hover:border-gray-500 disabled:bg-gray-600 disabled:text-gray-400 disabled:border-gray-600 rounded text-sm transition-all duration-200 w-full"
                                >
                                    <GitPullRequest className="h-4 w-4 mr-2" />
                                    {isCreatingPR ? 'Creating PR...' : 'Create Pull Request'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Panel */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="p-4">
                        <h3 className="flex items-center text-sm font-semibold text-gray-300 mb-3">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Stats Panel
                        </h3>
                        
                        {hasUserBranches && (
                            <div className="mb-3 p-2 bg-blue-900/20 rounded border border-blue-900/30">
                                <div className="flex items-center mb-1">
                                    <GitBranch className="h-3 w-3 text-blue-400 mr-2" />
                                    <span className="font-medium text-xs text-blue-300">Branch: {userBranches[0].branch_name.slice(0, 8)}...</span>
                                </div>
                                <div className="flex items-center">
                                    <GitFork className="h-3 w-3 text-blue-400 mr-2" />
                                    <span className="font-medium text-xs text-blue-300">Fork: {currentUser?.username}...</span>
                                </div>
                            </div>
                        )}
                        
                        {loadingGithubData ? (
                            <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-400"></div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-xs">Commits:</span>
                                    <span className="font-semibold text-white text-xs">{stats.totalCommits}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-xs">Files Changed:</span>
                                    <span className="font-semibold text-white text-xs">{stats.filesChanged}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center text-gray-400 text-xs">
                                        <Plus className="h-3 w-3 mr-1" />
                                        Lines +{stats.linesAdded}
                                    </span>
                                    <span className="flex items-center text-red-400 text-xs">
                                        <Minus className="h-3 w-3 mr-1" />
                                        -{stats.linesDeleted}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-xs">Total Branches:</span>
                                    <span className="font-semibold text-white text-xs">{stats.totalBranches}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Activity Log */}
                    <div className="p-4 flex-1 min-h-0">
                        <h3 className="flex items-center text-sm font-semibold text-gray-300 mb-3">
                            <Activity className="h-4 w-4 mr-2" />
                            Activity Log
                        </h3>
                        
                        {loadingActivity ? (
                            <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-400"></div>
                            </div>
                        ) : (
                            <div className="space-y-2 overflow-hidden max-h-full">
                                {activity?.branches?.slice(0, 3).map((branch: any) => (
                                    <div key={branch.id} className="text-xs">
                                        <div className="text-gray-400">
                                            {new Date(branch.created_at).toLocaleDateString()} Branch...
                                        </div>
                                        <div className="text-gray-300 mt-1">
                                            {branch.username} created {branch.branch_name.slice(0, 15)}...
                                        </div>
                                    </div>
                                ))}
                                
                                {activity?.pullRequests?.slice(0, 2).map((pr: any) => (
                                    <div key={pr.id} className="text-xs">
                                        <div className="text-gray-400">
                                            {new Date(pr.created_at).toLocaleDateString()} PR {pr.action}
                                        </div>
                                        <div className="text-gray-300 mt-1">
                                            {pr.username} {pr.action} PR #{pr.pr_number}
                                        </div>
                                    </div>
                                ))}
                                
                                {(!activity?.branches?.length && !activity?.pullRequests?.length) && (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500 text-xs">No activity yet</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel - 70% Code Editor */}
            <div className="flex-1 bg-[#191818] flex h-full">
                {/* File Sidebar - 25% of right panel */}
                <div className="w-1/4 bg-[#191818] h-full flex flex-col">
                    <div className="p-3 border-b border-gray-700 flex-shrink-0">
                        <h3 className="text-sm font-semibold text-gray-300">Files</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loadingGithubData ? (
                            <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-400"></div>
                            </div>
                        ) : githubData?.files ? (
                            githubData.files.map((file: any, index: number) => (
                                <div 
                                    key={index} 
                                    className={`flex items-center p-2 hover:bg-gray-700 cursor-pointer transition-colors ${
                                        selectedFile === file.name ? 'bg-gray-700 border-r-2 border-green-400' : ''
                                    }`}
                                    onClick={() => setSelectedFile(file.name)}
                                >
                                    <FileText className="h-3 w-3 text-gray-500 mr-2" />
                                    <span className="text-xs text-gray-300 truncate">{file.name}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-500 text-center py-4">
                                No files available
                            </p>
                        )}
                    </div>
                </div>

                {/* Code Display - 75% of right panel */}
                <div className="flex-1 bg-[#191818] flex flex-col h-full">
                    <div className="p-3 border-b border-gray-700 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-300">
                                {selectedFile || 'Select a file to view changes'}
                            </h3>
                            {selectedFile && (
                                <span className="text-xs text-gray-500">
                                    {codeChanges.find(f => f.file === selectedFile)?.additions || 0} additions,{' '}
                                    {codeChanges.find(f => f.file === selectedFile)?.deletions || 0} deletions
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex-1 p-4 overflow-y-auto">
                        {selectedFile ? (
                            <div className="h-full">
                                {/* Show actual file content with line numbers */}
                                <div className="font-mono text-xs bg-[#0a0a0a] h-full overflow-hidden">
                                    {selectedFile === 'index.html' ? (
                                        <div className="h-full p-3">
                                            <div className="space-y-0">
                                                <div className="flex">
                                                    <span className="text-gray-400 w-8 text-right mr-3">+1</span>
                                                    <span className="text-gray-300">&lt;!doctype html&gt;</span>
                                                </div>
                                                <div className="flex">
                                                    <span className="text-gray-400 w-8 text-right mr-3">+2</span>
                                                    <span className="text-gray-300">&lt;html lang="en"&gt;</span>
                                                </div>
                                                <div className="flex">
                                                    <span className="text-gray-400 w-8 text-right mr-3">+3</span>
                                                    <span className="text-gray-300">&nbsp;&nbsp;&lt;head&gt;</span>
                                                </div>
                                                <div className="flex">
                                                    <span className="text-gray-400 w-8 text-right mr-3">+4</span>
                                                    <span className="text-gray-300">&nbsp;&nbsp;&nbsp;&nbsp;&lt;meta charset="UTF-8" /&gt;</span>
                                                </div>
                                                <div className="flex">
                                                    <span className="text-gray-400 w-8 text-right mr-3">+5</span>
                                                    <span className="text-gray-300">&nbsp;&nbsp;&nbsp;&nbsp;&lt;link rel="icon" type="image/svg+xml" href="/vite.svg" /&gt;</span>
                                                </div>
                                                <div className="flex">
                                                    <span className="text-gray-400 w-8 text-right mr-3">+6</span>
                                                    <span className="text-gray-300">&nbsp;&nbsp;&nbsp;&nbsp;&lt;meta name="viewport" content="width=device-width, initial-scale=1.0" /&gt;</span>
                                                </div>
                                                <div className="flex">
                                                    <span className="text-gray-400 w-8 text-right mr-3">+7</span>
                                                    <span className="text-gray-300">&nbsp;&nbsp;&nbsp;&nbsp;&lt;title&gt;Vite + React + TS&lt;/title&gt;</span>
                                                </div>
                                                <div className="flex">
                                                    <span className="text-gray-400 w-8 text-right mr-3">+8</span>
                                                    <span className="text-gray-300">&nbsp;&nbsp;&lt;/head&gt;</span>
                                                </div>
                                                <div className="flex">
                                                    <span className="text-gray-400 w-8 text-right mr-3">+9</span>
                                                    <span className="text-gray-300">&nbsp;&nbsp;&lt;body&gt;</span>
                                                </div>
                                                <div className="flex">
                                                    <span className="text-gray-400 w-8 text-right mr-3">+10</span>
                                                    <span className="text-gray-300">&nbsp;&nbsp;&nbsp;&nbsp;&lt;div id="root"&gt;&lt;/div&gt;</span>
                                                </div>
                                                <div className="flex">
                                                    <span className="text-gray-400 w-8 text-right mr-3">+11</span>
                                                    <span className="text-gray-300">&nbsp;&nbsp;&nbsp;&nbsp;&lt;script type="module" src="/src/main.tsx"&gt;&lt;/script&gt;</span>
                                                </div>
                                                <div className="flex">
                                                    <span className="text-gray-400 w-8 text-right mr-3">+12</span>
                                                    <span className="text-gray-300">&nbsp;&nbsp;&lt;/body&gt;</span>
                                                </div>
                                                <div className="flex">
                                                    <span className="text-gray-400 w-8 text-right mr-3">+13</span>
                                                    <span className="text-gray-300">&lt;/html&gt;</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Show other file changes */
                                        <div className="h-full p-3">
                                            {codeChanges.find(f => f.file === selectedFile)?.changes.map((change, index) => (
                                                <div key={index} className="flex">
                                                    <span className={`w-8 text-right mr-3 ${
                                                        change.type === 'addition' ? 'text-gray-400' : 'text-red-400'
                                                    }`}>
                                                        {change.type === 'addition' ? '+' : '-'}{change.line}
                                                    </span>
                                                    <span className={change.type === 'addition' ? 'text-gray-300' : 'text-red-300'}>
                                                        {change.content}
                                                    </span>
                                                </div>
                                            )) || (
                                                <div className="text-center py-8">
                                                    <Code className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                                                    <p className="text-gray-400 text-sm">No changes in this file</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <Code className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400">Select a file from the sidebar to view code changes</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProposalDetail;