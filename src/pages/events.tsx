import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ExternalLink, Trophy, Star, Users, ChevronRight } from 'lucide-react';
import EventDetail from '../component/EventDetail';

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

interface User {
  id: string;
  username: string;
  rank?: string;
}

interface EventsProps {
  currentUser: User;
}

const Events: React.FC<EventsProps> = ({ currentUser }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [currentUser.rank]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the user's actual rank from auth state
      const userRank = currentUser.rank || 'Code Novice';
      console.log('User rank from auth:', currentUser.rank);
      console.log('Fetching events for rank:', userRank);
      
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/events/user-rank/${encodeURIComponent(userRank)}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Events data received:', data);
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
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

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  const handleBackToEvents = () => {
    setSelectedEventId(null);
    // Refresh events list when coming back
    fetchEvents();
  };

  // If an event is selected, show the EventDetail component
  if (selectedEventId) {
    return (
      <EventDetail 
        eventId={selectedEventId} 
        currentUser={currentUser} 
        onBack={handleBackToEvents}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#191818] flex items-center justify-center" style={{fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Loading events for your rank...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#191818]" style={{fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
      <div className="container mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Events</h1>
            <div className={`px-3 py-1.5 rounded-lg border text-sm font-medium flex items-center space-x-2 ${getRankBadgeColor(currentUser.rank || 'Code Novice')}`}>
              {getRankIcon(currentUser.rank || 'Code Novice')}
              <span>{currentUser.rank || 'Code Novice'}</span>
            </div>
          </div>
          <p className="text-gray-400">
            Events available for your current rank. Complete challenges to unlock higher-tier events.
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
            <button 
              onClick={fetchEvents}
              className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Events List */}
        {events.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-300 mb-2">No Events Available</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              There are currently no events available for your rank. Check back later or work on improving your rank to unlock more events.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {events.map((event) => (
              <div 
                key={event.id} 
                className="bg-[#191818] rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-200 overflow-hidden"
              >
                {/* Event Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-semibold text-white line-clamp-2">
                      {event.title}
                    </h3>
                    {event.isExpired ? (
                      <span className="px-1.5 py-0.5 bg-red-900/30 text-red-400 rounded text-xs font-medium">
                        Expired
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-green-900/30 text-green-400 rounded text-xs font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                    {event.description}
                  </p>

                  {/* Visible Ranks */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Ranks:</p>
                    <div className="flex flex-wrap gap-1">
                      {event.visibleRanks.slice(0, 2).map((rank) => (
                        <span 
                          key={rank}
                          className={`px-1.5 py-0.5 rounded text-xs font-medium border flex items-center space-x-1 ${
                            rank === (currentUser.rank || 'Code Novice') 
                              ? getRankBadgeColor(rank)
                              : 'bg-gray-800/50 text-gray-500 border-gray-700'
                          }`}
                        >
                          {getRankIcon(rank)}
                          <span className="text-xs">{rank.split(' ')[0]}</span>
                        </span>
                      ))}
                      {event.visibleRanks.length > 2 && (
                        <span className="px-1.5 py-0.5 rounded text-xs text-gray-500 bg-gray-800/50 border border-gray-700">
                          +{event.visibleRanks.length - 2}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{new Date(event.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      <span className={event.isExpired ? 'text-red-400' : 'text-green-400'}>
                        {formatTimeRemaining(event.endDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event Footer */}
                <div className="px-4 py-3 bg-gray-800/30 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <a
                      href={event.githubRepo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Repo</span>
                    </a>
                    
                    <button 
                      onClick={() => handleEventClick(event.id)}
                      className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs font-medium transition-colors"
                    >
                      <span>{event.isExpired ? 'View' : 'Join'}</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;