import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ExternalLink, 
  Trophy, 
  Star, 
  Users, 
  GitBranch, 
  GitCommit, 
  GitPullRequest,
  Activity,
  Copy,
  CheckCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  githubRepo: string;
  visibleRanks: string[];
  endDate: string;
  createdBy: string;
  createdAt: string;
  active: boolean;
  isExpired: boolean;
}

interface Participation {
  id: string;
  eventId: string;
  userId: string;
  githubForkUrl: string;
  branchName: string;
  participationDate: string;
  isActive: boolean;
  totalCommits: number;
  totalPrs: number;
  linesAdded: number;
  linesDeleted: number;
  score: number;
  lastActivityDate?: string;
}

interface LeaderboardEntry {
  position: number;
  userId: string;
  username: string;
  userRank: string;
  score: number;
  totalCommits: number;
  totalPrs: number;
  linesAdded: number;
  linesDeleted: number;
  participationDate: string;
}

interface Activity {
  id: string;
  userId: string;
  username: string;
  userRank: string;
  activityType: string;
  commitMessage?: string;
  scoreEarned: number;
  activityDate: string;
  metadata?: any;
}

interface User {
  id: string;
  username: string;
  rank?: string;
}

interface EventDetailProps {
  eventId: string;
  currentUser: User;
  onBack: () => void;
}

const EventDetail: React.FC<EventDetailProps> = ({ eventId, currentUser, onBack }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [participation, setParticipation] = useState<Participation | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [participating, setParticipating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'activity'>('overview');

  useEffect(() => {
    fetchEventDetails();
    fetchParticipationStatus();
    fetchLeaderboard();
    fetchActivityFeed();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/events/${eventId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch event details');
      }
      
      const data = await response.json();
      setEvent(data.data);
    } catch (err) {
      console.error('Error fetching event details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load event');
    }
  };

  const fetchParticipationStatus = async () => {
    try {
      // Skip if user is not authenticated
      if (!currentUser.id) return;

      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/events/${eventId}/participation-status`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.isParticipating) {
          setParticipation(data.data.participation);
        }
      }
    } catch (err) {
      console.error('Error fetching participation status:', err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/events/${eventId}/leaderboard?limit=20`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLeaderboard(data.data.leaderboard);
        }
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityFeed = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/events/${eventId}/activity-feed?limit=20`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setActivities(data.data.activities);
        }
      }
    } catch (err) {
      console.error('Error fetching activity feed:', err);
    }
  };

  const handleParticipate = async () => {
    try {
      setParticipating(true);
      setError(null);
      
      // Check if user is authenticated
      if (!currentUser.id) {
        setError('Please log in to participate in events');
        return;
      }

      const response = await fetch(` ${import.meta.env.VITE_SERVER_URL}/api/events/${eventId}/participate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setParticipation(data.data.participation);
        setSuccessMessage(data.message);
        // Refresh leaderboard and activity feed
        fetchLeaderboard();
        fetchActivityFeed();
      } else {
        setError(data.message || 'Failed to participate in event');
      }
    } catch (err) {
      console.error('Error participating in event:', err);
      setError(err instanceof Error ? err.message : 'Failed to participate in event');
    } finally {
      setParticipating(false);
    }
  };

  const getRankBadgeColor = (rank: string) => {
    switch (rank) {
      case 'Code Novice':
        return 'bg-gray-800 text-gray-300 border-gray-600';
      case 'Dev Savage':
        return 'bg-green-900 text-green-300 border-green-600';
      case 'Forge Elite':
        return 'bg-blue-900 text-blue-300 border-blue-600';
      case 'Tech Maestro':
        return 'bg-purple-900 text-purple-300 border-purple-600';
      case 'Forge Master':
        return 'bg-yellow-900 text-yellow-300 border-yellow-600';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-600';
    }
  };

  const getRankIcon = (rank: string) => {
    switch (rank) {
      case 'Code Novice':
        return <Users className="h-3 w-3" />;
      case 'Dev Savage':
        return <Star className="h-3 w-3" />;
      case 'Forge Elite':
        return <Trophy className="h-3 w-3" />;
      case 'Tech Maestro':
        return <Trophy className="h-3 w-3" />;
      case 'Forge Master':
        return <Trophy className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'commit':
        return <GitCommit className="h-4 w-4 text-blue-400" />;
      case 'pr_created':
      case 'pr_merged':
        return <GitPullRequest className="h-4 w-4 text-green-400" />;
      case 'fork_created':
      case 'branch_created':
        return <GitBranch className="h-4 w-4 text-yellow-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      return `${hours}h remaining`;
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${minutes}m remaining`;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isEventVisibleToRank = (event: Event, userRank: string) => {
    return event.visibleRanks.includes(userRank);
  };

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-[#191818] flex items-center justify-center" style={{fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Loading event details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#191818]" style={{fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
      <div className="container mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={onBack}
            className="mb-4 text-blue-400 hover:text-blue-300 flex items-center space-x-2"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            <span>Back to Events</span>
          </button>
          
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{event.title}</h1>
              <p className="text-gray-400 text-lg">{event.description}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {event.isExpired ? (
                <span className="px-3 py-1.5 bg-red-900/30 text-red-400 rounded-lg text-sm font-medium">
                  Expired
                </span>
              ) : (
                <span className="px-3 py-1.5 bg-green-900/30 text-green-400 rounded-lg text-sm font-medium">
                  Active
                </span>
              )}
            </div>
          </div>

          {/* Event Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-[#191818] bg-opacity-60 backdrop-blur-sm border border-gray-600 rounded-lg p-4">
              <div className="flex items-center text-gray-400 mb-2">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="text-sm">End Date</span>
              </div>
              <p className="text-white font-medium">{new Date(event.endDate).toLocaleDateString()}</p>
              <p className={`text-sm ${event.isExpired ? 'text-red-400' : 'text-green-400'}`}>
                {formatTimeRemaining(event.endDate)}
              </p>
            </div>

            <div className="bg-[#191818] bg-opacity-60 backdrop-blur-sm border border-gray-600 rounded-lg p-4">
              <div className="flex items-center text-gray-400 mb-2">
                <Users className="h-4 w-4 mr-2" />
                <span className="text-sm">Participants</span>
              </div>
              <p className="text-white font-medium text-2xl">{leaderboard.length}</p>
            </div>

            <div className="bg-[#191818] bg-opacity-60 backdrop-blur-sm border border-gray-600 rounded-lg p-4">
              <div className="flex items-center text-gray-400 mb-2">
                <ExternalLink className="h-4 w-4 mr-2" />
                <span className="text-sm">Repository</span>
              </div>
              <a
                href={event.githubRepo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1"
              >
                <span>View on GitHub</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Participation Section */}
          {!participation ? (
            <div className="bg-[#191818] bg-opacity-60 backdrop-blur-sm border border-gray-600 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Join this Event</h3>
                  <p className="text-gray-400">
                    One-click participation will fork the repository and create your working branch.
                  </p>
                </div>
                <button
                  onClick={handleParticipate}
                  disabled={participating || event.isExpired || !isEventVisibleToRank(event, currentUser.rank || 'Code Novice')}
                  className="px-6 py-3 bg-blue-600 bg-opacity-80 hover:bg-blue-700 hover:bg-opacity-90 disabled:bg-gray-600 disabled:bg-opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 backdrop-blur-sm"
                >
                  {participating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Joining...</span>
                    </>
                  ) : (
                    <>
                      <GitBranch className="h-4 w-4" />
                      <span>Participate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#191818] bg-opacity-60 backdrop-blur-sm border border-green-500/30 rounded-lg p-6 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <h3 className="text-lg font-medium text-white">You're participating!</h3>
                  </div>
                  <p className="text-gray-400 mb-4">Your progress in this event:</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-400">Score</p>
                      <p className="text-xl font-bold text-green-400">{participation.score}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Commits</p>
                      <p className="text-xl font-bold text-blue-400">{participation.totalCommits}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Pull Requests</p>
                      <p className="text-xl font-bold text-purple-400">{participation.totalPrs}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Lines Added</p>
                      <p className="text-xl font-bold text-yellow-400">{participation.linesAdded}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <a
                      href={participation.githubForkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Your Fork</span>
                    </a>
                    <button
                      onClick={() => copyToClipboard(`git clone ${participation.githubForkUrl}.git && cd ${participation.githubForkUrl.split('/').pop()} && git checkout ${participation.branchName}`)}
                      className="inline-flex items-center space-x-1 text-gray-400 hover:text-gray-300 text-sm"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Copy Clone Command</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="bg-[#191818] bg-opacity-60 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <p className="text-green-400">{successMessage}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-[#191818] bg-opacity-60 backdrop-blur-sm border border-red-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="text-red-400">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700 mb-6">
          <nav className="flex space-x-8">
            {['overview', 'leaderboard', 'activity'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Visible Ranks */}
            <div className="bg-[#191818] bg-opacity-60 backdrop-blur-sm border border-gray-600 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Eligible Ranks</h3>
              <div className="flex flex-wrap gap-2">
                {event.visibleRanks.map((rank) => (
                  <span 
                    key={rank}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border flex items-center space-x-2 ${
                      rank === (currentUser.rank || 'Code Novice') 
                        ? getRankBadgeColor(rank)
                        : 'bg-gray-800/50 text-gray-500 border-gray-700'
                    }`}
                  >
                    {getRankIcon(rank)}
                    <span>{rank}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Recent Activity Preview */}
            <div className="bg-[#191818] bg-opacity-60 backdrop-blur-sm border border-gray-600 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    {getActivityIcon(activity.activityType)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        <span className="font-medium">{activity.username}</span> {activity.activityType.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(activity.activityDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs text-green-400 font-medium">+{activity.scoreEarned}</span>
                  </div>
                ))}
                {activities.length === 0 && (
                  <p className="text-gray-500 text-sm">No activity yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-[#191818] bg-opacity-60 backdrop-blur-sm border border-gray-600 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-6">Leaderboard</h3>
            <div className="space-y-4">
              {leaderboard.map((entry, index) => (
                <div 
                  key={entry.userId}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    index < 3 ? 'bg-yellow-900/20 border border-yellow-500/30' : 'bg-gray-700/30'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-500 text-black' :
                      'bg-gray-600 text-white'
                    }`}>
                      {entry.position}
                    </div>
                    <div>
                      <p className="font-medium text-white">{entry.username}</p>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border flex items-center space-x-1 ${getRankBadgeColor(entry.userRank)}`}>
                        {getRankIcon(entry.userRank)}
                        <span>{entry.userRank}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <p className="text-white font-bold">{entry.score}</p>
                      <p className="text-gray-400">Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-blue-400 font-medium">{entry.totalCommits}</p>
                      <p className="text-gray-400">Commits</p>
                    </div>
                    <div className="text-center">
                      <p className="text-purple-400 font-medium">{entry.totalPrs}</p>
                      <p className="text-gray-400">PRs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-green-400 font-medium">{entry.linesAdded}</p>
                      <p className="text-gray-400">Lines+</p>
                    </div>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <p className="text-gray-500 text-center py-8">No participants yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-[#191818] bg-opacity-60 backdrop-blur-sm border border-gray-600 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-6">Activity Feed</h3>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 bg-[#191818] bg-opacity-40 backdrop-blur-sm border border-gray-700 rounded-lg">
                  {getActivityIcon(activity.activityType)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-white">{activity.username}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getRankBadgeColor(activity.userRank)}`}>
                        {activity.userRank}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(activity.activityDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 capitalize">
                      {activity.activityType.replace('_', ' ')}
                      {activity.commitMessage && `: ${activity.commitMessage}`}
                    </p>
                  </div>
                  <span className="text-sm text-green-400 font-medium">+{activity.scoreEarned}</span>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-gray-500 text-center py-8">No activity yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetail;