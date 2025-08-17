import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProposalOwner from './proposalOwner';

interface User {
  id: string;
  username: string;
  bio: string;
  walletAddress?: string;
}

interface ProposalOwnerWrapperProps {
  currentUser: User;
}

const ProposalOwnerWrapper: React.FC<ProposalOwnerWrapperProps> = ({ currentUser }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return <div className="bg-[#191818] h-full flex items-center justify-center text-white" style={{fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'}}>Invalid proposal ID</div>;
  }

  const handleBack = () => {
    navigate('/proposals');
  };

  return (
    <ProposalOwner 
      proposalId={id}
      currentUser={currentUser}
      onBack={handleBack}
    />
  );
};

export default ProposalOwnerWrapper;