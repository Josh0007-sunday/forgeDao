import React, { useState, useEffect } from 'react';
import { GitPullRequest, GitMerge, ExternalLink, User, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface PullRequest {
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

interface User {
  id: string;
  username: string;
}

interface Proposal {
  id: string;
  title: string;
  repositoryLink: string;
  createdBy: {
    id: string;
    username: string;
  };
}

interface PullRequestManagerProps {
  proposal: Proposal;
  currentUser: User;
  onBack: () => void;
}

const PullRequestManager: React.FC<PullRequestManagerProps> = ({ proposal, currentUser, onBack }) => {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if current user is the proposal owner
  const isOwner = proposal.createdBy.id === currentUser.id;

  useEffect(() => {
    if (!isOwner) {
      setError('Only proposal owners can manage pull requests');
      setLoading(false);
      return;
    }

    fetchPullRequests();
  }, [proposal.id, isOwner]);

  const fetchPullRequests = async () => {
    try {
      setError(null);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/proposals/${proposal.id}/pull-requests`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch pull requests');
      }

      const data = await response.json();
      setPullRequests(data);
    } catch (err) {
      console.error('Error fetching pull requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pull requests');
    } finally {
      setLoading(false);
    }
  };

  const handleMergePR = async (pullRequestNumber: number, mergeMethod: string = 'merge') => {
    try {
      setMerging(pullRequestNumber);
      setError(null);
      setSuccess(null);

      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/proposals/${proposal.id}/merge`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            pullRequestNumber,
            mergeMethod 
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to merge pull request');
      }

      await response.json();
      setSuccess(`Pull request #${pullRequestNumber} merged successfully!`);
      
      // Refresh the PR list after successful merge
      await fetchPullRequests();
    } catch (err) {
      console.error('Error merging pull request:', err);
      setError(err instanceof Error ? err.message : 'Failed to merge pull request');
    } finally {
      setMerging(null);
    }
  };

  const confirmMerge = (pullRequest: PullRequest) => {
    const confirmed = window.confirm(
      `Are you sure you want to merge PR #${pullRequest.number}: "${pullRequest.title}"?\n\nThis action cannot be undone.`
    );
    
    if (confirmed) {
      handleMergePR(pullRequest.number);
    }
  };

  if (!isOwner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Access Denied: Only proposal owners can manage pull requests.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 mb-4 transition-colors"
        >
          ← Back to Proposal
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manage Pull Requests</h1>
            <p className="text-gray-600 mt-1">
              Proposal: <span className="font-medium">{proposal.title}</span>
            </p>
          </div>
          
          <button
            onClick={fetchPullRequests}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pull Requests List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-gray-600">Loading pull requests...</p>
        </div>
      ) : pullRequests.length === 0 ? (
        <div className="text-center py-12">
          <GitPullRequest className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Open Pull Requests</h3>
          <p className="text-gray-500">
            There are currently no open pull requests for this proposal.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-sm text-gray-600 mb-4">
            Found {pullRequests.length} open pull request{pullRequests.length !== 1 ? 's' : ''}
          </div>
          
          {pullRequests.map((pr) => (
            <div key={pr.number} className="bg-white rounded-lg shadow-md border border-gray-200">
              {/* PR Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <GitPullRequest className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-800">
                        #{pr.number}: {pr.title}
                      </h3>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <img
                          src={pr.user.avatar_url}
                          alt={pr.user.login}
                          className="w-6 h-6 rounded-full mr-2"
                        />
                        <span className="font-medium">{pr.user.login}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Created {new Date(pr.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      <span className="bg-blue-50 px-2 py-1 rounded text-blue-700 font-mono text-xs">
                        {pr.head}
                      </span>
                      <span className="mx-2">→</span>
                      <span className="bg-gray-50 px-2 py-1 rounded text-gray-700 font-mono text-xs">
                        {pr.base}
                      </span>
                    </div>

                    {pr.body && (
                      <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded-md">
                        <div className="whitespace-pre-line">{pr.body}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* PR Actions */}
              <div className="p-6 bg-gray-50">
                <div className="flex items-center justify-between">
                  <a
                    href={pr.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on GitHub
                  </a>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => confirmMerge(pr)}
                      disabled={merging === pr.number}
                      className="flex items-center px-4 py-2 border border-green-700 text-green-400 bg-transparent hover:bg-green-700/10 hover:border-green-600 disabled:bg-gray-400 disabled:text-gray-300 disabled:border-gray-400 rounded-md transition-all duration-200"
                    >
                      <GitMerge className="h-4 w-4 mr-2" />
                      {merging === pr.number ? 'Merging...' : 'Merge Pull Request'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Repository Link */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center">
          <ExternalLink className="h-5 w-5 text-blue-600 mr-2" />
          <span className="text-blue-800 font-medium">Repository:</span>
          <a
            href={proposal.repositoryLink}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-blue-600 hover:text-blue-800 underline"
          >
            {proposal.repositoryLink}
          </a>
        </div>
      </div>
    </div>
  );
};

export default PullRequestManager;