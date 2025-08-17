import React from 'react';
import { User, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

interface User {
    id: string;
    username: string;
    bio: string;
    walletAddress?: string;
}

interface NavbarProps {
    user: User;
    onLogout: () => void;
    onWalletClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onWalletClick }) => {
    return (
        <header className="bg-[#191818] shadow-lg" style={{fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-end items-center h-16">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={onWalletClick}
                            className="flex items-center px-3 py-2 border border-gray-600 text-gray-400 bg-transparent rounded-md hover:bg-gray-700/10 hover:border-gray-500 transition-all duration-200"
                        >
                            <Wallet className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">
                                {user.walletAddress 
                                    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` 
                                    : 'Connect Wallet'
                                }
                            </span>
                        </button>

                        <Link 
                            to="/profile"
                            className="flex items-center px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-md transition-all duration-200"
                        >
                            <User className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">{user.username}</span>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;