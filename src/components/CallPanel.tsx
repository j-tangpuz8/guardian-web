import { CallingState } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { RingingCall } from './RingingCall';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export const CallPanel = () => {
  const call = useCall();
  const navigate = useNavigate();
  const { useCallCallingState, useCallCreatedBy } = useCallStateHooks();
  const callingState = useCallCallingState();
  const creator = useCallCreatedBy();

  useEffect(() => {
    console.log(`Call state in CallPanel: ${callingState}`);
    console.log("Call creator:", creator);
    if (callingState === CallingState.JOINED) {
      console.log("Call joined, navigating to call screen");
      navigate('/call');
    }
  }, [callingState, navigate, creator]);

  if (!call) {
    console.log("No call object available");
    return null;
  }

  console.log("Call details:", {
    id: call.id,
    cid: call.cid,
    isCreatedByMe: call.isCreatedByMe,
    callingState: callingState,
    creator: creator,
    members: call.state.members
  });

  if ([CallingState.RINGING, CallingState.JOINING].includes(callingState)) {
    console.log("Rendering RingingCall UI for call state:", callingState);
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <RingingCall includeSelf={true} totalMembersToShow={4} />
      </div>
    );
  }

  return null;
}; 