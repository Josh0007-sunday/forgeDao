import React, { useState, useEffect } from 'react';
import { User, Star, GitCommit, GitPullRequest, MessageSquare, Activity, Target } from 'lucide-react';

interface RankingData {
  userId: string;
  username: string;
  rank: string;
  totalScore: number;
  lastRankUpdate: string;
  breakdown?: {
    githubStars: { score: number; weight: string; value: number };
    totalCommits: { score: number; weight: string; value: number };
    pullRequests: { score: number; weight: string; value: number };
    issues: { score: number; weight: string; value: number };
    recentActivity: { score: number; weight: string; value: number };
    proposals: { score: number; weight: string; value: number };
    contributions: { score: number; weight: string; value: number };
  };
}

interface LeaderboardUser {
  id: string;
  username: string;
  rank: string;
  totalScore: number;
  lastRankUpdate: string;
}

interface RankingStats {
  totalUsers: number;
  ranks: {
    'Code Novice': number;
    'Dev Savage': number;
    'Forge Elite': number;
    'Tech Maestro': number;
    'Forge Master': number;
  };
  averageScore: number;
  topScore: number;
}

const ValidateRank: React.FC = () => {
  const [userRanking, setUserRanking] = useState<RankingData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [stats, setStats] = useState<RankingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'myrank' | 'stats'>('myrank');

  const API_BASE_URL = `${import.meta.env.VITE_SERVER_URL}`;

  useEffect(() => {
    loadRankingData();
  }, []);

  const loadRankingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user ranking, leaderboard, and stats in parallel
      const [userResponse, leaderboardResponse, statsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/ranking/me`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/ranking/leaderboard?limit=10`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/ranking/stats`, { credentials: 'include' })
      ]);

      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.success) {
          setUserRanking(userData.data);
        }
      }

      if (leaderboardResponse.ok) {
        const leaderboardData = await leaderboardResponse.json();
        if (leaderboardData.success) {
          setLeaderboard(leaderboardData.data.users);
        }
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }
    } catch (err) {
      setError('Failed to load ranking data');
      console.error('Error loading ranking data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateRanking = async () => {
    try {
      setCalculating(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/ranking/me/calculate`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();
      console.log('Calculate ranking response:', data);

      if (response.ok && data.success) {
        setUserRanking(data.data);
        // Reload leaderboard to reflect updated rankings
        loadRankingData();
      } else {
        const errorMessage = data.message || `Server error: ${response.status} ${response.statusText}`;
        setError(errorMessage);
        console.error('Ranking calculation failed:', data);
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error calculating ranking:', err);
    } finally {
      setCalculating(false);
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Forge Master': return 'text-yellow-400';
      case 'Tech Maestro': return 'text-purple-400';
      case 'Forge Elite': return 'text-blue-400';
      case 'Dev Savage': return 'text-green-400';
      case 'Code Novice': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  // const getRankBadgeColor = (rank: string) => {
  //   switch (rank) {
  //     case 'Forge Master': return 'bg-yellow-400/10 border-yellow-400/30';
  //     case 'Tech Maestro': return 'bg-purple-400/10 border-purple-400/30';
  //     case 'Forge Elite': return 'bg-blue-400/10 border-blue-400/30';
  //     case 'Dev Savage': return 'bg-green-400/10 border-green-400/30';
  //     case 'Code Novice': return 'bg-gray-400/10 border-gray-400/30';
  //     default: return 'bg-gray-400/10 border-gray-400/30';
  //   }
  // };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#191818]" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-lg">Loading ranking data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#191818] p-2" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Developer Rankings</h1>
          <p className="text-gray-400">Track your development progress and compete with other developers</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          {[
            { id: 'myrank', label: 'My Rank', icon: User },
            { id: 'stats', label: 'Statistics', icon: Target }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeTab === id
                  ? 'bg-gray-600 text-white'
                  : 'bg-transparent text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </div>

        {/* My Rank Tab */}
        {activeTab === 'myrank' && (
          <div className="space-y-6">
            {userRanking ? (
              <>
                {/* Current Rank Card */}
                <div className="bg-[#191818] rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Your Current Rank</span>
                    <button
                      onClick={calculateRanking}
                      disabled={calculating}
                      className="bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      {calculating ? 'Calculating...' : 'Recalculate Rank'}
                    </button>
                    <span className={`font-medium ${getRankColor(userRanking.rank)}`}>
                      {userRanking.rank}
                    </span>
                    <span className="text-white font-bold">{Number(userRanking.totalScore || 0).toFixed(2)}</span>
                    <span className="text-gray-400 text-sm">Total Score</span>
                    {userRanking.lastRankUpdate && (
                      <span className="text-gray-400 text-sm">
                        Last updated: {new Date(userRanking.lastRankUpdate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Leaderboard Table */}
                <div className="space-y-0">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2">Developer Rankings</h3>
                    <p className="text-gray-400 text-sm">{leaderboard.length} developer{leaderboard.length !== 1 ? 's' : ''} ranked</p>
                  </div>

                  {/* Table Header */}
                  <div className="bg-[#191818] rounded-t-lg">
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-600">
                      <div className="col-span-1">Rank</div>
                      <div className="col-span-3">Developer</div>
                      <div className="col-span-3">Tier</div>
                      <div className="col-span-2">Score</div>
                      <div className="col-span-3">Last Updated</div>
                    </div>
                  </div>

                  {/* Table Body */}
                  <div className="bg-[#191818]">
                    {leaderboard.map((user, index) => (
                      <div 
                        key={user.id} 
                        className={`grid grid-cols-12 gap-4 px-4 py-4 hover:bg-gray-700/50 transition-colors ${
                          userRanking.userId === user.id ? 'bg-gray-700/30' : ''
                        }`}
                      >
                        {/* Rank */}
                        <div className="col-span-1 flex items-center">
                          <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                        </div>

                        {/* Developer */}
                        <div className="col-span-3 flex items-center">
                          <img 
                            src={`https://github.com/${user.username}.png`} 
                            alt={user.username}
                            className="w-6 h-6 rounded-full mr-2"
                            onError={(e) => {
                              e.currentTarget.src = `https://github.com/identicons/${user.username}.png`;
                            }}
                          />
                          <span className="text-white font-medium">{user.username}</span>
                        </div>

                        {/* Tier */}
                        <div className="col-span-3 flex items-center">
                          <span className={`font-medium ${getRankColor(user.rank)}`}>
                            {user.rank}
                          </span>
                        </div>

                        {/* Score */}
                        <div className="col-span-2 flex items-center">
                          <span className="text-white font-bold">{Number(user.totalScore || 0).toFixed(2)}</span>
                        </div>

                        {/* Last Updated */}
                        <div className="col-span-3 flex items-center">
                          <span className="text-gray-400 text-sm">
                            {user.lastRankUpdate ? new Date(user.lastRankUpdate).toLocaleDateString() : 'Never'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Score Breakdown */}
                {userRanking.breakdown && (
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Score Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(userRanking.breakdown).map(([key, data], index) => {
                        const icons = {
                          githubStars: Star,
                          totalCommits: GitCommit,
                          pullRequests: GitPullRequest,
                          issues: MessageSquare,
                          recentActivity: Activity,
                          proposals: Target,
                          contributions: User
                        };
                        const Icon = icons[key as keyof typeof icons] || User;
                        
                        // Ensure data is valid
                        if (!data || typeof data !== 'object') return null;
                        
                        return (
                          <div key={`${key}-${index}`} className="bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <Icon className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-white text-sm font-medium capitalize">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-2xl font-bold text-white">
                                {Number(data.score || 0).toFixed(1)}
                              </span>
                              <span className="text-gray-400 text-sm">{data.weight || 'N/A'}</span>
                            </div>
                            <p className="text-gray-400 text-xs mt-1">
                              Value: {data.value || 0}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <p className="text-gray-400 mb-4">No ranking data found. Calculate your rank to get started!</p>
                <button
                  onClick={calculateRanking}
                  disabled={calculating}
                  className="bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {calculating ? 'Calculating...' : 'Calculate My Rank'}
                </button>
              </div>
            )}
          </div>
        )}


        {/* Statistics Tab */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#191818] rounded-lg p-6 text-center">
                <p className="text-3xl font-bold text-white">{Number(stats.totalUsers || 0)}</p>
                <p className="text-gray-400">Total Developers</p>
              </div>
              <div className="bg-[#191818] rounded-lg p-6 text-center">
                <p className="text-3xl font-bold text-white">{Number(stats.averageScore || 0).toFixed(1)}</p>
                <p className="text-gray-400">Average Score</p>
              </div>
              <div className="bg-[#191818] rounded-lg p-6 text-center">
                <p className="text-3xl font-bold text-white">{Number(stats.topScore || 0).toFixed(1)}</p>
                <p className="text-gray-400">Highest Score</p>
              </div>
            </div>

            {/* Rank Distribution Table */}
            <div className="space-y-0">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">Rank Distribution</h3>
                <p className="text-gray-400 text-sm">Distribution of developers across different ranks</p>
              </div>

              {/* Table Header */}
              <div className="bg-[#191818] rounded-t-lg">
                <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-600">
                  <div className="col-span-4">Rank Tier</div>
                  <div className="col-span-2">Count</div>
                  <div className="col-span-2">Percentage</div>
                  <div className="col-span-4">Distribution</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="bg-[#191818]">
                {Object.entries(stats.ranks).map(([rank, count]) => {
                  const percentage = stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0;
                  return (
                    <div 
                      key={rank} 
                      className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-gray-700/50 transition-colors"
                    >
                      {/* Rank Tier */}
                      <div className="col-span-4 flex items-center">
                        <span className={`font-medium ${getRankColor(rank)}`}>{rank}</span>
                      </div>

                      {/* Count */}
                      <div className="col-span-2 flex items-center">
                        <span className="text-white font-medium">{count}</span>
                      </div>

                      {/* Percentage */}
                      <div className="col-span-2 flex items-center">
                        <span className="text-gray-400">{percentage.toFixed(1)}%</span>
                      </div>

                      {/* Distribution Bar */}
                      <div className="col-span-4 flex items-center">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getRankColor(rank).replace('text-', 'bg-')}`}
                            style={{
                              width: `${percentage}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidateRank;