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
import avatarImg from "../assets/images/avatar.jpg";
import {useEffect, useState, useCallback} from "react";
import {useNavigate, useLocation} from "react-router-dom";
import config from "../config";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import all from "../utils/Responders";
import {Button, Paper, Typography} from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import { RingingCall } from "../components/RingingCall";

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
  const [isCallInitialized, setIsCallInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initCall = async () => {
      try {
        console.log("Initializing call with user ID:", userId);
        console.log("Token available:", !!token);

        const videoClient = StreamVideoClient.getOrCreateInstance({
          apiKey: config.STREAM_APIKEY,
          user,
          token: token || undefined,
        });

        console.log("User connected successfully");

        const newCall = videoClient.call("default", "fad-call");
        console.log("Call created:", newCall.id);
        
        await newCall.getOrCreate();
        console.log("Call initialized successfully");

        if (mounted) {
          setClient(videoClient);
          setCall(newCall);
          setIsCallInitialized(true);
          await newCall.join({create: true});
          console.log("Joined call successfully");
        }
      } catch (error) {
        console.error("Error initializing call:", error);
      }
    };

    if (!client && !call) {
      initCall();
    }

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

  if (!client || !call || !isCallInitialized) {
    return <div className="flex justify-center items-center h-screen">Initializing call...</div>;
  }

  return (
    <div className="flex h-screen bg-[#1B4965] p-5 sm:gap-10 md:gap-2">
      <div className="w-[350px] bg-gray-300 rounded-lg">
        <div className="flex items-center gap-4 p-5">
          <div className="bg-green-200 p-2 rounded-full border-1">
            <WarningIcon sx={{color: "maroon", fontSize: "3em"}} />
          </div>
          <div>
            <h2 className="text-xl font-bold">ID: {call?.id}</h2>
            <p className="text-green-700 font-bold text-lg">GENERAL CALL</p>
            <p className="text-sm">A. S. Fortune St, Mandaue City</p>
            <p className="text-sm">Coordinates: 10.343897, 123.932080</p>
          </div>
        </div>

        <div className="my-1 bg-white p-5">
          <div className="flex items-center gap-4">
            <img
              src={avatarImg}
              alt="avatar"
              className="w-20 h-20 rounded-full"
            />
            <div>
              <h3 className="text-xl uppercase font-bold">{user?.name}</h3>
              <p className="text-sm">1234567890</p>
              <p className="text-sm">GuardianPH Opcen</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <label className="text-lg font-bold">Directory</label>
          <input
            type="text"
            placeholder="Search"
            className="w-full p-2 border rounded bg-white"
          />
        </div>

        <div className="px-5 overflow-auto h-[460px]">
          <div>
            <label className="text-lg font-bold">Operation Centers</label>
            {all.opCenters.map((opCenter, index) => (
              <Paper
                key={index}
                elevation={2}
                sx={{
                  padding: "12px",
                  cursor: "pointer",
                  marginBottom: "1px",
                  transition: "all 0.2s ease",
                  backgroundColor: "white",
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                    transform: "translateX(4px)",
                  },
                }}>
                {opCenter}
              </Paper>
            ))}
          </div>

          <div className="mt-5">
            <label className="text-lg font-bold">Police Stations</label>
            {all.policeStations.map((stations, index) => (
              <Paper
                key={index}
                elevation={2}
                sx={{
                  padding: "12px",
                  cursor: "pointer",
                  marginBottom: "1px",
                  transition: "all 0.2s ease",
                  backgroundColor: "white",
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                    transform: "translateX(4px)",
                  },
                }}>
                {stations}
              </Paper>
            ))}
          </div>
          <div className="mt-5">
            <label className="text-lg font-bold">Hospitals</label>
            {all.hospitals.map((hospital, index) => (
              <Paper
                key={index}
                elevation={2}
                sx={{
                  padding: "12px",
                  cursor: "pointer",
                  marginBottom: "1px",
                  transition: "all 0.2s ease",
                  backgroundColor: "white",
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                    transform: "translateX(4px)",
                  },
                }}>
                {hospital}
              </Paper>
            ))}
          </div>
        </div>
      </div>

      {/* video call*/}
      <div className="flex-1">
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <VideoCall />
          </StreamCall>
        </StreamVideo>
      </div>
    </div>
  );
}

export const VideoCall = () => {
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

  // const handleInviteParticipant = useCallback(async () => {
  //   try {
  //     await call?.getOrCreate({
  //       ring: true, 
  //       data: {
  //         members: [
  //           { user_id: userId }, 
  //           { user_id: "1beozaei5ny" }
  //         ]
  //       }
  //     });
  //   } catch (error) {
  //     console.error("Error inviting participant:", error);
  //   }
  // }, [call]);

  // if (callingState === CallingState.RINGING) {
  //   console.log("Call is in RINGING state");
  //   return <RingingCall includeSelf={true} totalMembersToShow={4} />;
  // }

  // if (callingState === CallingState.JOINING) {
  //   console.log("Call is in JOINING state");
  //   return <div className="text-center p-8">Joining call...</div>;
  // }

  // if (callingState !== CallingState.JOINED) {
  //   console.log("Call state:", callingState);
  //   return <div className="text-center p-8">Loading call...</div>;
  // }

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
          Participants in this call: {participantCount}
        </Typography>
      </div>
      <div className="flex gap-5 items-center justify-center">
        <Button
          variant="contained"
          onClick={() => handleRemoveParticipant()}
          sx={{backgroundColor: "white", color: "maroon"}}>
          Remove Caller
        </Button>
        <Button 
          variant="contained" 
          // onClick={handleInviteParticipant}
        >
          <span className="text-xl">+&nbsp;</span> Invite Participant
        </Button>
      </div>
    </StreamTheme>
  );
};
