import React, { useState, useEffect } from 'react';
import {
    ExternalLink,
    GitBranch,
    GitPullRequest,
    Calendar,
    Activity,
    Code,
    Clock,
    Wallet,
    Copy
} from 'lucide-react';

interface UserProfile {
    id: string;
    username: string;
    bio: string;
    walletAddress?: string;
    githubId: string;
    createdAt: string;
}

interface Proposal {
    id: string;
    title: string;
    description: string;
    repositoryLink: string;
    githubIssueLink?: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
}

interface ActivityItem {
    id: string;
    type: 'branch' | 'pull_request';
    action: string;
    branch_name?: string;
    pr_number?: number;
    proposal_id: string;
    proposal_title: string;
    created_at: string;
}

interface ProfileProps {
    currentUser: UserProfile;
    onLogout: () => void;
    onWalletClick: () => void;
}

const Profile: React.FC<ProfileProps> = ({ currentUser }) => {
    const [profile, setProfile] = useState<UserProfile>(currentUser);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [stats, setStats] = useState({
        totalProposals: 0,
        activeProposals: 0,
        completedProposals: 0,
        totalContributions: 0,
        pullRequestsToProposals: 0,
        joinDate: ''
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'proposals' | 'activity'>('overview');

    useEffect(() => {
        fetchProfileData();
    }, [currentUser.id]);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchUserProfile(),
                fetchUserProposals(),
                fetchUserActivities(),
                fetchUserStats()
            ]);
        } catch (error) {
            console.error('Error fetching profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserProfile = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/user/${currentUser.id}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const userData = await response.json();
                setProfile(userData);
                // Set join date from fetched profile data
                if (userData.createdAt) {
                    const joinDate = new Date(userData.createdAt).toLocaleDateString();
                    setStats(prev => ({ ...prev, joinDate }));
                }
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    const fetchUserProposals = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/proposals/user/${currentUser.id}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const proposalData = await response.json();
                setProposals(proposalData);
                
                const totalProposals = proposalData.length;
                const activeProposals = proposalData.filter((p: Proposal) => p.status === 'pending' || p.status === 'approved').length;
                const completedProposals = proposalData.filter((p: Proposal) => p.status === 'completed').length;
                
                setStats(prev => ({
                    ...prev,
                    totalProposals,
                    activeProposals,
                    completedProposals
                }));
            }
        } catch (error) {
            console.error('Error fetching user proposals:', error);
        }
    };

    const fetchUserActivities = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/user/${currentUser.id}/activities`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setActivities(data.activities);
                setStats(prev => ({ ...prev, totalContributions: data.activities.length }));
            }
        } catch (error) {
            console.error('Error fetching user activities:', error);
            // Fallback to empty array if there's an error
            setActivities([]);
        }
    };

    const fetchUserStats = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/user/${currentUser.id}/stats`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setStats(prev => ({ 
                    ...prev, 
                    pullRequestsToProposals: data.totalPullRequestsToProposals,
                    totalContributions: data.totalContributions
                }));
            }
        } catch (error) {
            console.error('Error fetching user stats:', error);
            // Fallback to 0 if there's an error
            setStats(prev => ({ ...prev, pullRequestsToProposals: 0 }));
        }
    };

    const copyWalletAddress = async () => {
        if (profile.walletAddress) {
            try {
                await navigator.clipboard.writeText(profile.walletAddress);
                // You might want to add a toast notification here
            } catch (error) {
                console.error('Failed to copy wallet address:', error);
            }
        }
    };

    if (loading) {
        return (
            <div className="h-full min-h-screen bg-[#191818] flex items-center justify-center" style={{fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-400 mx-auto mb-4"></div>
                    <p className="text-gray-400 text-sm">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#191818]" style={{fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Header */}
                <div className="bg-[#191818] rounded-xl border border-gray-600 p-8 mb-8">
                    <div className="flex items-start space-x-6">
                        <div className="flex-shrink-0">
                            <img
                                src={`https://github.com/${profile.username}.png`}
                                alt={profile.username}
                                className="w-24 h-24 rounded-full border-4 border-gray-600"
                            />
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                                <h1 className="text-3xl font-bold text-white">{profile.username}</h1>
                                <a
                                    href={`https://github.com/${profile.username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-white"
                                >
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                    </svg>
                                </a>
                            </div>
                            
                            <p className="text-gray-300 mb-4 max-w-2xl">
                                {profile.bio || "Full-stack developer passionate about decentralized technologies and open-source collaboration."}
                            </p>
                            
                            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                <div className="flex items-center space-x-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>Joined {stats.joinDate}</span>
                                </div>
                                
                                {profile.walletAddress && (
                                    <div className="flex items-center space-x-2">
                                        <Wallet className="h-4 w-4" />
                                        <span className="font-mono">
                                            {`${profile.walletAddress.slice(0, 6)}...${profile.walletAddress.slice(-4)}`}
                                        </span>
                                        <button
                                            onClick={copyWalletAddress}
                                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                                        >
                                            <Copy className="h-3 w-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-[#191818] rounded-lg border border-gray-600 p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-gray-700 rounded-lg">
                                <Code className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-400">Total Proposals</p>
                                <p className="text-2xl font-semibold text-white">{stats.totalProposals}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-[#191818] rounded-lg border border-gray-600 p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-gray-700 rounded-lg">
                                <Activity className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-400">Active Projects</p>
                                <p className="text-2xl font-semibold text-white">{stats.activeProposals}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-[#191818] rounded-lg border border-gray-600 p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-gray-700 rounded-lg">
                                <GitBranch className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-400">Contributions</p>
                                <p className="text-2xl font-semibold text-white">{stats.totalContributions}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-[#191818] rounded-lg border border-gray-600 p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-gray-700 rounded-lg">
                                <GitPullRequest className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-400">Pull Requests</p>
                                <p className="text-2xl font-semibold text-white">{stats.pullRequestsToProposals}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                    <div className="border-b border-gray-600">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'overview'
                                        ? 'border-gray-400 text-gray-400'
                                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                                }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('proposals')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'proposals'
                                        ? 'border-green-400 text-gray-400'
                                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                                }`}
                            >
                                Proposals ({proposals.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('activity')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'activity'
                                        ? 'border-green-400 text-gray-400'
                                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                                }`}
                            >
                                Recent Activity
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Recent Proposals */}
                        <div className="bg-[#191818] rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Recent Proposals</h3>
                            <div className="space-y-4">
                                {proposals.slice(0, 3).map((proposal) => (
                                    <div key={proposal.id} className="flex items-start space-x-3 p-3">
                                        <Code className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-white truncate">{proposal.title}</h4>
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{proposal.description}</p>
                                            <div className="flex items-center space-x-2 mt-2">
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                    proposal.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                                                    proposal.status === 'approved' ? 'bg-green-900/50 text-gray-400' :
                                                    'bg-gray-700 text-gray-300'
                                                }`}>
                                                    {proposal.status}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(proposal.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-[#191818] rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                            <div className="space-y-4">
                                {activities.slice(0, 5).map((activity) => (
                                    <div key={activity.id} className="flex items-start space-x-3">
                                        {activity.type === 'branch' ? (
                                            <GitBranch className="h-5 w-5 text-orange-400 mt-1 flex-shrink-0" />
                                        ) : (
                                            <GitPullRequest className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white">
                                                {activity.action} {activity.type === 'branch' ? 'branch' : 'pull request'}
                                                {activity.branch_name && (
                                                    <code className="ml-1 px-1 py-0.5 bg-gray-700 rounded text-xs">
                                                        {activity.branch_name}
                                                    </code>
                                                )}
                                                {activity.pr_number && (
                                                    <span className="ml-1 text-gray-400">#{activity.pr_number}</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">{activity.proposal_title}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(activity.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'proposals' && (
                    <div className="bg-[#191818] rounded-xl p-6">
                        <div className="grid gap-6">
                            {proposals.map((proposal) => (
                                <div key={proposal.id} className="p-6 hover:bg-gray-700/50 transition-colors rounded-lg">
                                    <div className="flex items-start justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-white">{proposal.title}</h3>
                                        <span className={`px-3 py-1 text-sm rounded-full ${
                                            proposal.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                                            proposal.status === 'approved' ? 'bg-green-900/50 text-gray-400' :
                                            'bg-gray-700 text-gray-300'
                                        }`}>
                                            {proposal.status}
                                        </span>
                                    </div>
                                    
                                    <p className="text-gray-400 mb-4 line-clamp-2">{proposal.description}</p>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                            <span>Created {new Date(proposal.createdAt).toLocaleDateString()}</span>
                                            {proposal.updatedAt && (
                                                <span>Updated {new Date(proposal.updatedAt).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                        
                                        <a
                                            href={proposal.repositoryLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-1 text-gray-400 hover:text-gray-300"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            <span className="text-sm">View Repository</span>
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="bg-[#191818] rounded-xl p-6">
                        <div className="space-y-6">
                            {activities.map((activity) => (
                                <div key={activity.id} className="flex items-start space-x-4 p-4">
                                    {activity.type === 'branch' ? (
                                        <div className="p-2 bg-orange-900/50 rounded-lg">
                                            <GitBranch className="h-5 w-5 text-orange-400" />
                                        </div>
                                    ) : (
                                        <div className="p-2 bg-blue-900/50 rounded-lg">
                                            <GitPullRequest className="h-5 w-5 text-blue-400" />
                                        </div>
                                    )}
                                    
                                    <div className="flex-1">
                                        <h4 className="font-medium text-white mb-1">
                                            {activity.action} {activity.type === 'branch' ? 'branch' : 'pull request'}
                                            {activity.branch_name && (
                                                <code className="ml-2 px-2 py-1 bg-gray-600 rounded text-sm">
                                                    {activity.branch_name}
                                                </code>
                                            )}
                                            {activity.pr_number && (
                                                <span className="ml-2 text-gray-400 font-semibold">
                                                    #{activity.pr_number}
                                                </span>
                                            )}
                                        </h4>
                                        <p className="text-gray-400 text-sm mb-2">
                                            in <span className="font-medium">{activity.proposal_title}</span>
                                        </p>
                                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                                            <Clock className="h-3 w-3" />
                                            <span>{new Date(activity.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Profile;