import React, { useState, useEffect } from 'react';
import {
    Plus,
    GitBranch,
    User
} from 'lucide-react';
import { CreateProposalSidebar, WalletModal } from './modal';
import ProposalOwner from './collaboration/proposalOwner';


interface User {
    id: string;
    username: string;
    bio: string;
    walletAddress?: string;
    rank?: string;
}

interface Proposal {
    id: string;
    title: string;
    description: string;
    repositoryLink: string;
    githubIssueLink?: string;
    branchName?: string;
    createdBy: {
        username: string;
        walletAddress?: string;
    };
    createdAt: string;
}

interface DashboardProps {
    user: User;
    onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateProposal, setShowCreateProposal] = useState(false);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [walletAddress, setWalletAddress] = useState(user.walletAddress || '');
    const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);

    useEffect(() => {
        console.log('Dashboard user object:', user); // Debug log
        fetchProposals();
    }, [user.id, user.username]);

    useEffect(() => {
        console.log('selectedProposalId changed to:', selectedProposalId);
    }, [selectedProposalId]);

    const handleProposalClick = (proposalId: string) => {
        console.log('Proposal clicked:', proposalId);
        console.log('Current selectedProposalId:', selectedProposalId);
        setSelectedProposalId(proposalId);
        console.log('Setting selectedProposalId to:', proposalId);
    };


    const fetchProposals = async () => {
        try {
            // If user.id is missing, fetch all proposals as fallback
            const endpoint = user.id 
                ? `${import.meta.env.VITE_SERVER_URL}/api/proposals/user/${user.id}`
                : `${import.meta.env.VITE_SERVER_URL}/api/proposals'`
                
            console.log('Fetching proposals from:', endpoint); // Debug log
            
            const response = await fetch(endpoint, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                
                console.log('Raw proposals data:', data); // Debug log
                
                // If we fetched all proposals but have user info, filter by username
                if (!user.id && user.username) {
                    const userProposals = data.filter((proposal: Proposal) => 
                        proposal.createdBy?.username === user.username
                    );
                    console.log('Filtered user proposals:', userProposals);
                    setProposals(userProposals);
                } else {
                    console.log('Setting all proposals:', data);
                    setProposals(data);
                }
                
                // Log proposal IDs for debugging
                const proposalIds = (data || []).map((p: Proposal) => p.id);
                console.log('Proposal IDs:', proposalIds);
            }
        } catch (error) {
            console.error('Error fetching proposals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProposal = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);

        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/proposals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    title: formData.get('title'),
                    description: formData.get('description'),
                    repositoryLink: formData.get('repositoryLink'),
                    githubIssueLink: formData.get('githubIssueLink'),
                }),
            });

            if (response.ok) {
                setShowCreateProposal(false);
                fetchProposals();
                (e.target as HTMLFormElement).reset();
            }
        } catch (error) {
            console.error('Error creating proposal:', error);
        }
    };

    const updateWalletAddress = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/user/wallet`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ walletAddress }),
            });

            if (response.ok) {
                setShowWalletModal(false);
            }
        } catch (error) {
            console.error('Error updating wallet:', error);
        }
    };

    // Removed early return for ProposalOwner to keep split layout

    if (loading) {
        return (
            <div className="h-full bg-[#191818] flex items-center justify-center" style={{fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-400"></div>
                    <p className="text-gray-400 mt-4 text-sm">Loading proposals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-[#191818] flex" style={{fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
            {/* Left Panel - Proposal Explorer (30%) */}
            <div className="w-[30%] bg-[#191818] flex flex-col">
                {/* Header */}
                <div className="p-4">
                    <div className="bg-[#191818] rounded p-3 text-xs">
                        <div className="text-gray-400 mb-1">
                            <span className="text-gray-500">$</span> forge-dao --user {user.username}
                        </div>
                        <div className="text-gray-300">
                            <span className="text-blue-400">info</span> Managing proposals...
                        </div>
                    </div>
                </div>

                {/* Explorer Header */}
                <div className="px-4 py-3 bg-[#191818] flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-gray-300">
                        <GitBranch className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Proposals</span>
                    </div>
                    <button
                        onClick={() => setShowCreateProposal(true)}
                        className="text-gray-400 hover:text-gray-300 transition-colors"
                        title="New Proposal"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>

                {/* Proposal List */}
                <div className="flex-1 overflow-y-auto">
                    {proposals.length === 0 ? (
                        <div className="p-4 text-center">
                            <div className="text-gray-500 text-sm mb-2">No proposals</div>
                            <button
                                onClick={() => setShowCreateProposal(true)}
                                className="text-xs text-blue-400 hover:text-blue-300"
                            >
                                Create your first proposal
                            </button>
                        </div>
                    ) : (
                        proposals.map((proposal) => (
                            <div
                                key={proposal.id}
                                onClick={() => handleProposalClick(proposal.id)}
                                className={`px-3 py-2 cursor-pointer transition-all duration-150 rounded-md mx-2 mb-1 ${
                                    selectedProposalId === proposal.id
                                        ? 'bg-gray-700'
                                        : 'hover:bg-gray-700/50'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-500">
                                            {proposal.createdAt && !isNaN(new Date(proposal.createdAt).getTime()) 
                                                ? new Date(proposal.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                                                : 'Recent'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-sm text-white font-medium truncate mb-1">
                                    {proposal.title}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                    {proposal.createdBy?.username || user.username}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel - Content Area (70%) */}
            <div className="flex-1 bg-[#191818]">
                {(() => {
                    console.log('Rendering right panel, selectedProposalId:', selectedProposalId);
                    console.log('Boolean check selectedProposalId:', !!selectedProposalId);
                    
                    return selectedProposalId ? (
                        <ProposalOwner 
                            proposalId={selectedProposalId} 
                            currentUser={user} 
                            onBack={() => setSelectedProposalId(null)}
                            onWalletClick={() => setShowWalletModal(true)}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center bg-[#191818]">
                            <div className="text-center">
                                <GitBranch className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-300 mb-2">Select a proposal</h3>
                                <p className="text-gray-500 text-sm">Choose a proposal from the left panel to view details</p>
                            </div>
                        </div>
                    );
                })()}
            </div>
        
            {/* Sidebar */}
            <CreateProposalSidebar
                isOpen={showCreateProposal}
                onClose={() => setShowCreateProposal(false)}
                onSubmit={handleCreateProposal}
            />

            <WalletModal
                isOpen={showWalletModal}
                onClose={() => setShowWalletModal(false)}
                walletAddress={walletAddress}
                onWalletChange={setWalletAddress}
                onSave={updateWalletAddress}
            />
        </div>
    );
};

export default Dashboard;