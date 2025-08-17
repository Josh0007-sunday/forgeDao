import React, { useState, useEffect } from 'react';
import {
    GitBranch,
    GitPullRequest,
    User,
    Calendar,
    ExternalLink,
    Merge,
    Eye,
    Clock,
    AlertCircle,
    CheckCircle,
    RefreshCw,
    Users,
    GitFork,
    Wallet,
    Copy
} from 'lucide-react';


interface Proposal {
    id: string;
    title: string;
    description: string;
    repositoryLink: string;
    githubIssueLink?: string;
    createdBy: {
        _id?: string;
        id?: string;
        username: string;
        walletAddress?: string;
    };
    createdAt: string;
    updatedAt?: string;
    branchName?: string;
}

interface BranchActivity {
    id: string;
    branch_name: string;
    action: string;
    username: string;
    user_id: string;
    created_at: string;
}

interface PullRequestActivity {
    id: string;
    pr_number: number;
    branch_name: string;
    action: string;
    username: string;
    user_id: string;
    created_at: string;
}

interface OpenPullRequest {
    number: number;
    title: string;
    body: string;
    head: string;
    base: string;
    user: {
        login: string;
        avatar_url: string;
    };
    html_url: string;
    created_at: string;
    updated_at: string;
}

interface Collaborator {
    username: string;
    user_id: string;
    github_login: string;
    avatar_url: string;
    wallet_address?: string;
    branches_count: number;
    prs_count: number;
    first_contribution: string;
    last_activity: string;
    merged_prs: number;
    open_prs: number;
    branches: BranchActivity[];
    pull_requests: PullRequestActivity[];
}

interface User {
    id?: string;
    username: string;
    bio?: string;
    walletAddress?: string;
}

interface ProposalOwnerProps {
    proposalId: string;
    currentUser?: User;
    onBack: () => void;
    onLogout?: () => void;
    onWalletClick?: () => void;
}

const ProposalOwner: React.FC<ProposalOwnerProps> = ({ proposalId, currentUser, onBack,  }) => {
    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [activity, setActivity] = useState<{
        branches: BranchActivity[];
        pullRequests: PullRequestActivity[];
    }>({ branches: [], pullRequests: [] });
    const [openPRs, setOpenPRs] = useState<OpenPullRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'activity' | 'prs' | 'collaborators'>('activity');
    const [mergingPR, setMergingPR] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

    useEffect(() => {
        setLoading(true);
        setProposal(null);
        fetchProposalData();
        fetchActivity();
        fetchOpenPRs();
        fetchCollaborators();
    }, [proposalId]);

    const refreshAll = async () => {
        setRefreshing(true);
        setError(null);
        try {
            await Promise.all([
                fetchProposalData(),
                fetchActivity(), 
                fetchOpenPRs(),
                fetchCollaborators()
            ]);
            setSuccess('Data refreshed successfully');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Failed to refresh data');
        } finally {
            setRefreshing(false);
        }
    };

    const fetchProposalData = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/proposals/${proposalId}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const proposal = await response.json();
                setProposal(proposal);
            }
        } catch (error) {
            console.error('Error fetching proposal:', error);
        }
    };

    const fetchActivity = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}api/proposals/${proposalId}/activity`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setActivity(data);
                // Process collaborators after activity data is loaded
                await processCollaboratorsFromActivity(data);
            }
        } catch (error) {
            console.error('Error fetching activity:', error);
        }
    };

    const fetchOpenPRs = async () => {
        // Only fetch PRs if current user is the proposal owner
        if (!isProposalOwner()) {
            setOpenPRs([]);
            setLoading(false);
            return;
        }

        try {
            setError(null);
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/proposals/${proposalId}/pull-requests`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                setOpenPRs(data);
            } else if (response.status === 403) {
                setError('You are not authorized to view pull requests for this proposal');
                setOpenPRs([]);
            } else if (response.status === 401) {
                setError('Please log in to view pull requests');
                setOpenPRs([]);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.message || 'Failed to fetch pull requests');
                setOpenPRs([]);
            }
        } catch (error) {
            console.error('Error fetching PRs:', error);
            setError('Network error while fetching pull requests');
            setOpenPRs([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCollaborators = async () => {
        try {
            // Since we already have activity data, let's process it to create collaborator summaries
            // This function will be called after fetchActivity, so we'll process the existing data
            if (activity.branches || activity.pullRequests) {
                await processCollaboratorsFromActivity(activity);
            }
        } catch (error) {
            console.error('Error processing collaborators:', error);
        }
    };

    const fetchUserDetails = async (userIds: string[]) => {
        try {
            const userDetailsMap = new Map();
            
            console.log('Fetching user details for IDs:', userIds);
            
            // Fetch user details for each collaborator
            for (const userId of userIds) {
                const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/user/${userId}`, {
                    credentials: 'include'
                });
                
                console.log(`Response for user ${userId}:`, response.status);
                
                if (response.ok) {
                    const userData = await response.json();
                    console.log(`User data for ${userId}:`, userData);
                    userDetailsMap.set(userId, userData);
                } else {
                    console.error(`Failed to fetch user ${userId}:`, response.status, response.statusText);
                }
            }
            
            console.log('Final user details map:', userDetailsMap);
            return userDetailsMap;
        } catch (error) {
            console.error('Error fetching user details:', error);
            return new Map();
        }
    };

    const processCollaboratorsFromActivity = async (activityData: any = activity) => {
        const collaboratorMap = new Map<string, Collaborator>();
        const userIds = new Set<string>();

        // First pass: collect all user IDs and build basic collaborator data
        activityData.branches?.forEach((branch: BranchActivity) => {
            const key = branch.user_id;
            userIds.add(branch.user_id);
            
            if (!collaboratorMap.has(key)) {
                collaboratorMap.set(key, {
                    username: branch.username,
                    user_id: branch.user_id,
                    github_login: branch.username,
                    avatar_url: `https://github.com/${branch.username}.png`,
                    wallet_address: undefined, // Will be filled from database
                    branches_count: 0,
                    prs_count: 0,
                    first_contribution: branch.created_at,
                    last_activity: branch.created_at,
                    merged_prs: 0,
                    open_prs: 0,
                    branches: [],
                    pull_requests: []
                });
            }
            
            const collaborator = collaboratorMap.get(key)!;
            collaborator.branches_count++;
            collaborator.branches.push(branch);
            
            // Update first/last activity dates
            if (new Date(branch.created_at) < new Date(collaborator.first_contribution)) {
                collaborator.first_contribution = branch.created_at;
            }
            if (new Date(branch.created_at) > new Date(collaborator.last_activity)) {
                collaborator.last_activity = branch.created_at;
            }
        });

        // Process pull requests
        activityData.pullRequests?.forEach((pr: PullRequestActivity) => {
            const key = pr.user_id;
            userIds.add(pr.user_id);
            
            if (!collaboratorMap.has(key)) {
                collaboratorMap.set(key, {
                    username: pr.username,
                    user_id: pr.user_id,
                    github_login: pr.username,
                    avatar_url: `https://github.com/${pr.username}.png`,
                    wallet_address: undefined, // Will be filled from database
                    branches_count: 0,
                    prs_count: 0,
                    first_contribution: pr.created_at,
                    last_activity: pr.created_at,
                    merged_prs: 0,
                    open_prs: 0,
                    branches: [],
                    pull_requests: []
                });
            }
            
            const collaborator = collaboratorMap.get(key)!;
            collaborator.prs_count++;
            collaborator.pull_requests.push(pr);
            
            if (pr.action === 'merged') {
                collaborator.merged_prs++;
            } else if (pr.action === 'created') {
                collaborator.open_prs++;
            }
            
            // Update first/last activity dates
            if (new Date(pr.created_at) < new Date(collaborator.first_contribution)) {
                collaborator.first_contribution = pr.created_at;
            }
            if (new Date(pr.created_at) > new Date(collaborator.last_activity)) {
                collaborator.last_activity = pr.created_at;
            }
        });

        // Fetch user details from database
        const userDetailsMap = await fetchUserDetails(Array.from(userIds));
        
        // Merge user details with collaborator data
        collaboratorMap.forEach((collaborator, userId) => {
            const userDetails = userDetailsMap.get(userId);
            console.log(`Processing collaborator ${userId}:`, collaborator);
            console.log(`User details for ${userId}:`, userDetails);
            
            if (userDetails) {
                collaborator.wallet_address = userDetails.walletAddress || userDetails.wallet_address;
                console.log(`Set wallet address for ${userId}:`, collaborator.wallet_address);
                
                // Update avatar URL if we have better data
                if (userDetails.avatar_url) {
                    collaborator.avatar_url = userDetails.avatar_url;
                }
            } else {
                console.log(`No user details found for ${userId}`);
            }
        });

        // Convert map to array and sort by last activity
        const collaboratorsArray = Array.from(collaboratorMap.values())
            .sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime());
        
        setCollaborators(collaboratorsArray);
    };

    const copyWalletAddress = async (walletAddress: string) => {
        try {
            await navigator.clipboard.writeText(walletAddress);
            setSuccess('Wallet address copied to clipboard!');
            setTimeout(() => setSuccess(null), 2000);
        } catch (error) {
            console.error('Failed to copy wallet address:', error);
            setError('Failed to copy wallet address');
        }
    };

    const isProposalOwner = (): boolean => {
        if (!proposal || !currentUser) return false;
        
        // Check by ID if both have IDs
        if (proposal.createdBy.id && currentUser.id) {
            return String(proposal.createdBy.id) === String(currentUser.id);
        }
        
        // Fallback to username comparison
        return proposal.createdBy.username === currentUser.username;
    };

    const handleMergePR = async (prNumber: number, mergeMethod: 'merge' | 'squash' | 'rebase' = 'merge') => {
        const confirmed = window.confirm(
            `Are you sure you want to merge pull request #${prNumber}?\n\nThis action cannot be undone.`
        );
        
        if (!confirmed) return;

        setMergingPR(prNumber);
        setError(null);
        setSuccess(null);
        
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/proposals/${proposalId}/merge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ pullRequestNumber: prNumber, mergeMethod }),
            });

            if (response.ok) {
                setSuccess(`Pull request #${prNumber} merged successfully!`);
                await fetchOpenPRs(); // Refresh the list
                await fetchActivity(); // Refresh activity
                setTimeout(() => setSuccess(null), 5000);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.message || `Failed to merge pull request #${prNumber}`);
            }
        } catch (error) {
            console.error('Error merging PR:', error);
            setError('Network error while merging pull request');
        } finally {
            setMergingPR(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#191818] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
                    <p className="text-gray-400 text-sm">Loading proposal...</p>
                </div>
            </div>
        );
    }

    if (!proposal) {
        return (
            <div className="min-h-screen bg-[#191818] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-300 mb-2">Proposal not found</h2>
                    <button onClick={onBack} className="text-gray-400 hover:text-gray-300">
                        Go back to dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-[#191818] overflow-auto" style={{fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
            <div className="p-4">
                {/* Compact Header */}
                <div className="mb-4">
                    <div className="bg-[#191818] border border-gray-600 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                    <GitBranch className="h-4 w-4 text-gray-400" />
                                    <h1 className="text-lg font-bold text-white">{proposal.title}</h1>
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                </div>
                                <p className="text-gray-400 mb-3 text-xs leading-relaxed line-clamp-2">{proposal.description}</p>
                                <div className="flex items-center space-x-3 text-xs">
                                    <div className="flex items-center space-x-1 text-gray-500">
                                        <Calendar className="h-3 w-3" />
                                        <span className="font-mono">{new Date(proposal.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <span className="px-2 py-1 text-xs font-mono bg-blue-900/50 text-blue-400 rounded">
                                        OWNER
                                    </span>
                                </div>
                            </div>

                            <div className="flex space-x-1 ml-2">
                                <button
                                    onClick={refreshAll}
                                    disabled={refreshing}
                                    className="border border-gray-600 text-gray-400 bg-transparent hover:bg-gray-700/30 hover:border-gray-500 hover:text-gray-300 disabled:opacity-50 px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 transition-all duration-200"
                                >
                                    <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                                    <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                                </button>
                                <a
                                    href={proposal.repositoryLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="border border-gray-600 text-gray-400 bg-transparent hover:bg-gray-700/10 hover:border-gray-500 px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 transition-all duration-200"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    <span className="hidden sm:inline">Repo</span>
                                </a>
                                {proposal.githubIssueLink && (
                                    <a
                                        href={proposal.githubIssueLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="border border-gray-600 text-gray-400 bg-transparent hover:bg-gray-700/30 hover:border-gray-500 hover:text-gray-300 px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 transition-all duration-200"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        <span className="hidden sm:inline">Issue</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="mb-6 bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg">
                        <div className="flex">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                            <div className="ml-3">
                                <p className="text-sm text-red-300">{error}</p>
                                <button
                                    onClick={() => setError(null)}
                                    className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="mb-6 bg-gray-800/50 border-l-4 border-gray-400 p-4 rounded-lg">
                        <div className="flex">
                            <CheckCircle className="h-5 w-5 text-gray-400" />
                            <div className="ml-3">
                                <p className="text-sm text-gray-300">{success}</p>
                                <button
                                    onClick={() => setSuccess(null)}
                                    className="mt-2 text-xs text-gray-400 hover:text-gray-300 underline"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="mb-4">
                    <div className="border-b border-gray-700">
                        <nav className="-mb-px flex space-x-4">
                            <button
                                onClick={() => setActiveTab('activity')}
                                className={`py-2 px-1 border-b-2 font-medium text-xs ${activeTab === 'activity'
                                        ? 'border-gray-400 text-gray-400'
                                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-center space-x-1">
                                    <Eye className="h-3 w-3" />
                                    <span>Activity</span>
                                    <span className="bg-gray-700 text-gray-300 py-1 px-1.5 rounded-full text-xs">
                                        {activity.branches.length + activity.pullRequests.length}
                                    </span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('prs')}
                                className={`py-2 px-1 border-b-2 font-medium text-xs ${activeTab === 'prs'
                                        ? 'border-gray-400 text-gray-400'
                                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-center space-x-1">
                                    <Merge className="h-3 w-3" />
                                    <span>PRs</span>
                                    <span className="bg-gray-700 text-gray-300 py-1 px-1.5 rounded-full text-xs">
                                        {openPRs.length}
                                    </span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('collaborators')}
                                className={`py-2 px-1 border-b-2 font-medium text-xs ${activeTab === 'collaborators'
                                        ? 'border-gray-400 text-gray-400'
                                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-center space-x-1">
                                    <Users className="h-3 w-3" />
                                    <span>Team</span>
                                    <span className="bg-gray-700 text-gray-300 py-1 px-1.5 rounded-full text-xs">
                                        {collaborators.length}
                                    </span>
                                </div>
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'activity' && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-300">Collaboration Activity</h3>

                        {/* Combined Activity Timeline */}
                        <div>
                            {activity.branches.length === 0 && activity.pullRequests.length === 0 ? (
                                <div className="text-center py-6">
                                    <Clock className="h-8 w-8 text-gray-500 mx-auto mb-3" />
                                    <h4 className="text-sm font-medium text-gray-300 mb-1">No activity yet</h4>
                                    <p className="text-gray-500 text-xs">Collaborators haven't started working on this proposal yet.</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    {/* Combined and sorted activities */}
                                    {[...activity.branches.map(branch => ({...branch, type: 'branch'})), 
                                      ...activity.pullRequests.map(pr => ({...pr, type: 'pr'}))]
                                      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                      .map((item, index, sortedItems) => (
                                        <div key={`${item.type}-${item.id}`} className="relative flex items-start space-x-2 pb-6">
                                            {/* Connector Line */}
                                            {index < sortedItems.length - 1 && (
                                                <div className="absolute left-2 top-6 w-0.5 h-6 bg-gray-600"></div>
                                            )}
                                            
                                            {/* Icon */}
                                            {item.type === 'branch' ? (
                                                <GitBranch className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0 relative z-10 bg-[#191818] rounded-full p-0.5" />
                                            ) : (
                                                <GitPullRequest className="h-4 w-4 text-indigo-400 mt-0.5 flex-shrink-0 relative z-10 bg-[#191818] rounded-full p-0.5" />
                                            )}
                                            
                                            {/* Content */}
                                            <div className="flex-1">
                                                <p className="text-gray-300 text-sm">
                                                    <span className={`font-medium ${item.type === 'branch' ? 'text-orange-400' : 'text-indigo-400'}`}>
                                                        {item.username}
                                                    </span>{' '}
                                                    {item.type === 'branch' 
                                                        ? `${item.action} branch ${item.branch_name}`
                                                        : `${item.action} pull request #${(item as any).pr_number}${item.branch_name ? ` from ${item.branch_name}` : ''}`
                                                    }
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">{new Date(item.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'prs' && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-300">Open Pull Requests</h3>

                        {openPRs.length === 0 ? (
                            <div className="bg-[#191818] rounded-lg border border-gray-600 p-8 text-center">
                                <GitPullRequest className="h-8 w-8 text-gray-500 mx-auto mb-3" />
                                <h4 className="text-sm font-medium text-gray-300 mb-1">No open pull requests</h4>
                                <p className="text-gray-500 text-xs mb-3">There are no pull requests waiting for your review.</p>
                                {error && (
                                    <div className="inline-flex items-center px-3 py-2 bg-red-900/20 text-red-300 rounded-lg text-xs">
                                        <AlertCircle className="h-3 w-3 mr-2" />
                                        {error}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {openPRs.map((pr) => (
                                    <div key={pr.number} className="bg-[#191818] rounded-lg border border-gray-600 hover:border-gray-500 transition-all p-4">
                                        <div className="flex items-start space-x-3 mb-3">
                                            <div className="flex-shrink-0">
                                                <img
                                                    src={pr.user.avatar_url}
                                                    alt={pr.user.login}
                                                    className="w-8 h-8 rounded-full border-2 border-gray-600"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <GitPullRequest className="h-4 w-4 text-gray-400" />
                                                    <h4 className="text-sm font-semibold text-gray-200">
                                                        #{pr.number}: {pr.title}
                                                    </h4>
                                                </div>
                                                
                                                {pr.body && (
                                                    <div className="mb-3 p-2 bg-gray-700 rounded-lg border border-gray-600">
                                                        <p className="text-gray-300 text-xs whitespace-pre-line">
                                                            {pr.body.length > 200 ? `${pr.body.substring(0, 200)}...` : pr.body}
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-3">
                                                    <div className="flex items-center space-x-1">
                                                        <User className="h-3 w-3" />
                                                        <span className="font-medium">{pr.user.login}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <GitBranch className="h-3 w-3" />
                                                        <span className="bg-blue-800 text-blue-300 px-1.5 py-0.5 rounded text-xs font-mono">
                                                            {pr.head}
                                                        </span>
                                                        <span>→</span>
                                                        <span className="bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded text-xs font-mono">
                                                            {pr.base}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{new Date(pr.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    {pr.updated_at !== pr.created_at && (
                                                        <div className="flex items-center space-x-1">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{new Date(pr.updated_at).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    <a
                                                        href={pr.html_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs font-medium transition-colors"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                        <span>GitHub</span>
                                                    </a>

                                                    <button
                                                        onClick={() => handleMergePR(pr.number)}
                                                        disabled={mergingPR === pr.number}
                                                        className="inline-flex items-center space-x-1 px-3 py-1.5 border border-gray-600 text-gray-400 bg-transparent hover:bg-gray-700/10 hover:border-gray-500 disabled:bg-gray-600 disabled:text-gray-400 disabled:border-gray-600 disabled:cursor-not-allowed rounded text-xs font-medium transition-all duration-200"
                                                    >
                                                        {mergingPR === pr.number ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-400"></div>
                                                                <span>Merging...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Merge className="h-3 w-3" />
                                                                <span>Merge</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'collaborators' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-300">Project Collaborators</h3>
                            <div className="text-xs text-gray-500">
                                {collaborators.length} active contributor{collaborators.length !== 1 ? 's' : ''}
                            </div>
                        </div>

                        {collaborators.length === 0 ? (
                            <div className="bg-[#191818] rounded-lg border border-gray-600 p-8 text-center">
                                <Users className="h-8 w-8 text-gray-500 mx-auto mb-3" />
                                <h4 className="text-sm font-medium text-gray-300 mb-1">No collaborators yet</h4>
                                <p className="text-gray-500 text-xs">No one has contributed to this proposal yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {collaborators.map((collaborator) => (
                                    <div key={collaborator.user_id} className="bg-[#191818] rounded-lg border border-gray-600 hover:border-gray-500 transition-all p-3">
                                        {/* Collaborator Header - Compact */}
                                        <div className="flex items-center space-x-3 mb-3">
                                            <img
                                                src={collaborator.avatar_url}
                                                alt={collaborator.github_login}
                                                className="w-8 h-8 rounded-full border border-gray-200"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-white truncate">
                                                    {collaborator.username}
                                                </h4>
                                                <a
                                                    href={`https://github.com/${collaborator.github_login}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center truncate"
                                                >
                                                    <span>@{collaborator.github_login}</span>
                                                    <ExternalLink className="h-2.5 w-2.5 ml-1 flex-shrink-0" />
                                                </a>
                                            </div>
                                        </div>

                                                        {/* Wallet Address */}
                                        <div className="mb-3 p-2 bg-gray-700 rounded-md">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-1">
                                                    <Wallet className="h-3 w-3 text-gray-400" />
                                                    <span className="text-xs font-medium text-gray-300">Wallet</span>
                                                </div>
                                                {collaborator.wallet_address && (
                                                    <button
                                                        onClick={() => copyWalletAddress(collaborator.wallet_address!)}
                                                        className="p-1 hover:bg-gray-600 rounded transition-colors"
                                                        title="Copy wallet address"
                                                    >
                                                        <Copy className="h-3 w-3 text-gray-400" />
                                                    </button>
                                                )}
                                            </div>
                                                <div className="mt-1 text-xs font-mono text-gray-200 truncate">
                                                {collaborator.wallet_address || (
                                                    <span className="text-gray-500 italic">No wallet address set</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Compact Stats */}
                                        <div className="flex space-x-3 mb-3">
                                            <div className="flex items-center space-x-1">
                                                <GitFork className="h-3 w-3 text-blue-600" />
                                                <span className="text-sm font-semibold text-blue-700">
                                                    {collaborator.branches_count}
                                                </span>
                                                <span className="text-xs text-gray-500">branches</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <GitPullRequest className="h-3 w-3 text-gray-600" />
                                                <span className="text-sm font-semibold text-gray-600">
                                                    {collaborator.prs_count}
                                                </span>
                                                <span className="text-xs text-gray-500">PRs</span>
                                            </div>
                                        </div>

                                        {/* PR Status - Compact */}
                                        {collaborator.prs_count > 0 && (
                                            <div className="mb-3">
                                                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                                    <span>Merged: {collaborator.merged_prs}</span>
                                                    <span>Open: {collaborator.open_prs}</span>
                                                </div>
                                                <div className="bg-gray-200 rounded-full h-1">
                                                    <div
                                                        className="bg-gray-500 h-1 rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${collaborator.prs_count > 0 ? (collaborator.merged_prs / collaborator.prs_count) * 100 : 0}%`
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Activity Timeline - Compact */}
                                        <div className="text-xs text-gray-500 space-y-1 mb-3">
                                            <div>First: {new Date(collaborator.first_contribution).toLocaleDateString()}</div>
                                            <div>Last: {new Date(collaborator.last_activity).toLocaleDateString()}</div>
                                        </div>

                                        {/* Quick Actions - Compact */}
                                        <div className="flex space-x-1">
                                            <a
                                                href={`https://github.com/${collaborator.github_login}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 inline-flex items-center justify-center space-x-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs font-medium transition-colors"
                                            >
                                                <User className="h-3 w-3" />
                                                <span>Profile</span>
                                            </a>
                                            {collaborator.prs_count > 0 && (
                                                <button
                                                    onClick={() => setActiveTab('prs')}
                                                    className="flex-1 inline-flex items-center justify-center space-x-1 px-2 py-1 bg-purple-800 hover:bg-purple-700 text-purple-300 rounded text-xs font-medium transition-colors"
                                                >
                                                    <GitPullRequest className="h-3 w-3" />
                                                    <span>PRs</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProposalOwner;