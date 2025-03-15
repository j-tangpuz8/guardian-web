import {useEffect} from "react";
import {
  useCallStateHooks,
  ParticipantView,
  CallControls,
  StreamVideo,
  StreamCall,
  StreamTheme,
  useCall,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import {Channel} from "stream-chat";
import {useNavigate} from "react-router-dom";

type VideoCallProps = {
  channel: Channel;
  callId: string;
};

const VideoCall = () => {
  const {useRemoteParticipants, useCallCallingState} = useCallStateHooks();
  const call = useCall();
  const participants = useRemoteParticipants();
  const callingState = useCallCallingState();
  const navigate = useNavigate();

  const handleEndCall = async () => {
    await call?.endCall();
    navigate("/main");
  };

  if (!participants || participants.length === 0) {
    return (
      <div className="text-white">
        Waiting for participants to join...
        <br />
        End Call{" "}
        <span className="text-blue-400 cursor-pointer" onClick={handleEndCall}>
          HERE
        </span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#1a1a1a] z-[1000] flex flex-col">
      <div className="flex-1 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4 p-4 overflow-auto">
        {participants.map((participant) => (
          <ParticipantView
            participant={participant}
            key={participant.sessionId}
            trackType="videoTrack"
          />
        ))}
      </div>
      <CallControls />
    </div>
  );
};

const CallContainer = ({videoClient, call}: {videoClient: any; call: any}) => {
  if (!call || !videoClient) return null;

  return (
    <StreamVideo client={videoClient}>
      <StreamTheme>
        <StreamCall call={call}>
          <VideoCall />
        </StreamCall>
      </StreamTheme>
    </StreamVideo>
  );
};

export default CallContainer;
