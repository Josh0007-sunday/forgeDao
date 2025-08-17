import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    User,
    LogOut,
    Trophy,
    Calendar
} from 'lucide-react';
import forgeWhiteLogo from '../assets/img/forge-white.jpg';

interface SidebarProps {
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const navigationItems = [
        {
            icon: LayoutDashboard,
            label: 'Dashboard',
            path: '/dashboard',
            active: location.pathname === '/dashboard'
        },
        {
            icon: FileText,
            label: 'Proposals',
            path: '/proposals',
            active: location.pathname === '/proposals' || location.pathname === '/'
        },
        {
            icon: Calendar,
            label: 'Events',
            path: '/events',
            active: location.pathname === '/events'
        },
        {
            icon: Trophy,
            label: 'View Rank',
            path: '/rank',
            active: location.pathname === '/rank'
        },
        {
            icon: User,
            label: 'Profile',
            path: '/profile',
            active: location.pathname === '/profile'
        }
    ];

    const handleNavigation = (path: string) => {
        navigate(path);
    };

    const handleLogout = () => {
        // Redirect to backend logout endpoint
        window.location.href = `${import.meta.env.VITE_SERVER_URL}/auth/logout`;
        onLogout();
    };

    return (
        <div className="h-screen w-64 bg-[#191818] flex flex-col" style={{fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
            {/* Logo/Brand */}
            <div className="flex items-center px-6 py-4">
                <img src={forgeWhiteLogo} alt="Forge" className="h-8 w-8 rounded-lg mr-3" />
                <span className="text-xl font-bold text-white">ForgeDAO</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6">
                <div className="space-y-1">
                    {navigationItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                            <button
                                key={item.path}
                                onClick={() => handleNavigation(item.path)}
                                className={`w-full flex items-center px-3 py-2.5 text-left rounded-md transition-all duration-200 ${
                                    item.active
                                        ? 'bg-[#191818] text-gray-400 border border-gray-600'
                                        : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                                }`}
                            >
                                <IconComponent className="h-5 w-5 mr-3" />
                                <span className="font-medium text-sm">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Bottom Section */}
            <div className="px-3 py-4">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2.5 text-gray-400 hover:bg-gray-800 hover:text-red-400 rounded-md transition-all duration-200"
                >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span className="font-medium text-sm">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;