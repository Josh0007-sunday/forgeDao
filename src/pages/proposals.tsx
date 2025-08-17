import { useState, useEffect } from 'react';
import { GitBranch, GitPullRequest, ExternalLink, User } from 'lucide-react';
import ProposalDetail from '../component/collaboration/proposalDetails';

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

const ProposalList = ({ currentUser }: { 
  currentUser: User; 
  onLogout: () => void; 
  onWalletClick: () => void; 
}) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [branchName, setBranchName] = useState('');

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/proposals`, {
          credentials: 'include'
        });
        const data = await response.json();
        setProposals(data);
      } catch (error) {
        console.error('Error fetching proposals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, []);

  const handleCreateBranch = async (proposalId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/proposals/${proposalId}/collaborate/branch`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      if (response.ok) {
        setBranchName(result.branchName);
        alert(`Branch created: ${result.branchName}`);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error creating branch:', error);
      alert('Failed to create branch');
    }
  };

  const handleCreatePR = async (proposalId: string) => {
    if (!branchName) {
      alert('Please create a branch first');
      return;
    }

    const prTitle = prompt('Enter PR title:');
    if (!prTitle) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/proposals/${proposalId}/collaborate/pull-request`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            branchName,
            title: prTitle,
            description: `PR for proposal ${proposalId}`
          })
        }
      );

      const result = await response.json();
      if (response.ok) {
        alert(`PR created: ${result.pullRequest.url}`);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error creating PR:', error);
      alert('Failed to create PR');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#191818]" style={{fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Loading proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#191818]" style={{fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
      <div className="container mx-auto px-6 py-6">
      {selectedProposal ? (
        <ProposalDetail 
          proposal={selectedProposal} 
          currentUser={currentUser}
          onBack={() => setSelectedProposal(null)}
        />
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Open Proposals</h2>
            <p className="text-gray-400 text-sm">{proposals.length} proposal{proposals.length !== 1 ? 's' : ''} available for collaboration</p>
          </div>
          
          {/* Table Header */}
          <div className="bg-[#191818] rounded-t-lg">
            <div className="grid grid-cols-11 gap-4 px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-600">
              <div className="col-span-4">Proposal</div>
              <div className="col-span-2">Author</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-3">Actions</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="bg-[#191818]">
            {proposals.map((proposal, ) => (
              <div 
                key={proposal.id} 
                className="grid grid-cols-11 gap-4 px-4 py-4 hover:bg-gray-700/50 transition-colors cursor-pointer"
                onClick={() => setSelectedProposal(proposal)}
              >
                {/* Proposal Info */}
                <div className="col-span-4">
                  <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">{proposal.title}</h3>
                  <p className="text-gray-400 text-xs line-clamp-2">{proposal.description}</p>
                </div>

                {/* Author */}
                <div className="col-span-2 flex items-center space-x-2">
                  <User className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-300 text-sm font-mono">{proposal.createdBy.username}</span>
                </div>

                {/* Created Date */}
                <div className="col-span-2 flex items-center">
                  <span className="text-gray-400 text-sm font-mono">
                    {new Date(proposal.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: '2-digit'
                    })}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-3 flex items-center space-x-2">
                  <a 
                    href={proposal.repositoryLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Repo</span>
                  </a>

                  {proposal.createdBy.id !== currentUser.id && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateBranch(proposal.id);
                        }}
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-800 hover:bg-blue-700 text-blue-300 rounded text-xs transition-colors"
                      >
                        <GitBranch className="h-3 w-3" />
                        <span>Branch</span>
                      </button>
                      {branchName && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreatePR(proposal.id);
                          }}
                          className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-colors"
                        >
                          <GitPullRequest className="h-3 w-3" />
                          <span>PR</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Table Footer */}
          <div className="bg-[#191818] rounded-b-lg px-4 py-3">
            <div className="text-xs text-gray-500">
              Click on any proposal to view details and manage collaboration
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default ProposalList;