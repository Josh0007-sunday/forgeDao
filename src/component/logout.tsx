import React from 'react';
import { LogOut } from 'lucide-react';

interface LogoutProps {
    onLogout: () => void;
}

const Logout: React.FC<LogoutProps> = ({ onLogout }) => {
    const handleLogout = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/logout`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                // Call the onLogout prop to update auth state
                onLogout();
                // Or reload the page to reset everything
                window.location.reload();
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
        >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Logout</span>
        </button>
    );
};

export default Logout;