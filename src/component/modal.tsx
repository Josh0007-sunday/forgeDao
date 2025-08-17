import React from 'react';

interface CreateProposalSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    walletAddress: string;
    onWalletChange: (address: string) => void;
    onSave: () => void;
}

export const CreateProposalSidebar: React.FC<CreateProposalSidebarProps> = ({ 
    isOpen, 
    onClose, 
    onSubmit 
}) => {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-transparent backdrop-blur-sm z-40" onClick={onClose}></div>
            
            {/* Sidebar */}
            <div className={`fixed right-0 top-0 h-full w-96 bg-[#191818] shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
                isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Create New Proposal</h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-300 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <form onSubmit={onSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    className="w-full px-3 py-2 bg-[#191818] border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400"
                                    placeholder="Enter proposal title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                <textarea
                                    name="description"
                                    required
                                    rows={4}
                                    className="w-full px-3 py-2 bg-[#191818] border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
                                    placeholder="Describe your proposal"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Repository Link</label>
                                <input
                                    type="url"
                                    name="repositoryLink"
                                    required
                                    className="w-full px-3 py-2 bg-[#191818] border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400"
                                    placeholder="https://github.com/username/repo"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">GitHub Issue Link (Optional)</label>
                                <input
                                    type="url"
                                    name="githubIssueLink"
                                    className="w-full px-3 py-2 bg-[#191818] border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400"
                                    placeholder="https://github.com/username/repo/issues/1"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex space-x-3 pt-6">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 text-gray-400 border border-gray-600 rounded-lg hover:bg-gray-700 hover:text-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 border border-green-700 text-green-400 bg-transparent hover:bg-green-700/10 hover:border-green-600 rounded-lg transition-all duration-200"
                                >
                                    Create Proposal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export const WalletModal: React.FC<WalletModalProps> = ({ 
    isOpen, 
    onClose, 
    walletAddress, 
    onWalletChange, 
    onSave 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect Wallet</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Address</label>
                        <input
                            type="text"
                            value={walletAddress}
                            onChange={(e) => onWalletChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="0x..."
                        />
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSave}
                            className="flex-1 px-4 py-2 border border-green-700 text-green-400 bg-transparent hover:bg-green-700/10 hover:border-green-600 rounded-lg transition-all duration-200"
                        >
                            Save Wallet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};