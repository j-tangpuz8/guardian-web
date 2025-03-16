import {
  Call,
  CallingState,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCall,
  useCallStateHooks,
  StreamTheme,
  SpeakerLayout,
  CallControls,
  User,
} from "@stream-io/video-react-sdk";
// import CallContainer from "../components/CallContainer";
import {useEffect, useState} from "react";
import {useNavigate, useLocation} from "react-router-dom";
import config from "../config";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import {
  MyFloatingLocalParticipant,
  MyParticipantList,
} from "../components/Participants";
import {Button, Typography} from "@mui/material";

const userStr = localStorage.getItem("user");
const userStr2 = userStr ? JSON.parse(userStr) : null;
const userId = userStr2?.id;
const token = localStorage.getItem("token");

const user: User = {
  id: userId,
  name: "Jolony Tangpuy",
};

export default function Calls() {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);

  useEffect(() => {
    let mounted = true;

    const initCall = async () => {
      try {
        const videoClient = StreamVideoClient.getOrCreateInstance({
          apiKey: config.STREAM_APIKEY,
          user,
          token: token || undefined,
        });

        const newCall = videoClient.call("default", "newCallByJolo");
        await newCall.getOrCreate();

        if (mounted) {
          setClient(videoClient);
          setCall(newCall);
          await newCall.join({create: true});
        }
      } catch (error) {
        console.error("Error initializing call:", error);
      }
    };

    if (!client && !call) {
      initCall();
    }
    console.log(token);
    console.log(userId);

    return () => {
      mounted = false;
      if (call) {
        call.leave();
      }
      if (client) {
        client.disconnectUser();
        setClient(null);
        setCall(null);
      }
    };
  }, []);

  if (!client || !call) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#01041c]">
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <MyUILayout />
        </StreamCall>
      </StreamVideo>
    </div>
  );
}

export const MyUILayout = () => {
  const call = useCall();
  const navigate = useNavigate();

  const {
    useCallCallingState,
    useParticipantCount,
    useLocalParticipant,
    useRemoteParticipants,
  } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  const handleLeaveCall = async () => {
    try {
      await call?.endCall();
      navigate("/main");
    } catch (error) {
      console.error("Error leaving call:", error);
    }
  };

  if (callingState !== CallingState.JOINED) {
    return <div>Loading...</div>;
  }

  const handleRemoveParticipant = async () => {
    try {
      await call?.unblockUser("oxup2cku8bg");
    } catch (error) {
      console.error("Error removing participant:", error);
    }
  };

  return (
    <StreamTheme>
      {/* <MyParticipantList participants={remoteParticipants} /> */}
      {/* <MyFloatingLocalParticipant participant={localParticipant} /> */}
      <SpeakerLayout participantsBarPosition="bottom" />
      <div className="flex justify-center items-center gap-5">
        <CallControls />
        <Button
          onClick={() => handleLeaveCall()}
          variant="contained"
          sx={{backgroundColor: "maroon"}}>
          Leave Call
        </Button>
        <Typography variant="h6" color="white">
          There are {participantCount} participants in this call
        </Typography>
      </div>
      <div className="flex flex-col items-center justify-center">
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleRemoveParticipant()}>
          Remove Other Participant
        </Button>
        <Button variant="contained" color="primary" sx={{marginTop: "10px"}}>
          Let Other Participant Join
        </Button>
      </div>
    </StreamTheme>
  );
};
