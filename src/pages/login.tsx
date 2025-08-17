import React from 'react';
import { Github, HelpCircle } from 'lucide-react';
import forgeWhiteLogo from '../assets/img/forge-white.jpg';
import forgeMasterImg from '../assets/img/forgeMaster.jpg';

const Login: React.FC = () => {
  const handleGitHubLogin = () => {
    window.location.href = `${import.meta.env.VITE_SERVER_URL}/auth/github`;
  };

  return (
    <div className="min-h-screen bg-[#191818] relative">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img src={forgeWhiteLogo} alt="Forge" className="h-10 w-10 rounded-lg" />
          <span className="text-white text-xl font-semibold">forgeDao.dev</span>
        </div>
        <button className="px-4 py-2 bg-transparent border border-gray-600 text-gray-300 rounded-lg hover:border-gray-500 transition-colors">
          <HelpCircle className="h-5 w-5 inline-block mr-2" />
          Support
        </button>
      </header>

      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={forgeMasterImg} 
          alt="Forge Master" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#191818]/80 via-[#191818]/70 to-[#191818]/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Hero Text */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight" style={{fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
            Build the Future Together
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed" style={{fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
            A collaborative development platform that empowers teams to create, 
            propose, and build together in the decentralized world.
          </p>

          {/* Sign in Button */}
          <div className="pt-8">
            <button
              onClick={handleGitHubLogin}
              className="bg-white text-black font-semibold py-4 px-8 rounded-xl hover:bg-gray-100 transition-all duration-300 flex items-center space-x-3 text-lg mx-auto transform hover:scale-105"
            >
              <Github className="h-6 w-6" />
              <span>Sign in with GitHub</span>
            </button>
          </div>

          {/* Trusted by section */}
          <div className="pt-12">
            <p className="text-gray-500 text-sm mb-6">Trusted by developers worldwide</p>
            <div className="flex items-center justify-center space-x-8 text-gray-400">
              <div className="font-medium">Demo Labs</div>
              <div className="font-medium">BuildCorp</div>
              <div className="font-medium">DevStudio</div>
              <div className="font-medium">CodeForge</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;