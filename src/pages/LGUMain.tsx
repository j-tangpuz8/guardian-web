import { useState, useEffect } from 'react';
import { Modal, Paper, Typography, Button, Box, Avatar, Container } from '@mui/material';
import avatarImg from "../assets/images/avatar.jpg";
import GuardianIcon from "../assets/images/Guardian.png";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Grid from "@mui/material/Grid2";
import logoImg from "../assets/images/icon.png";
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import General from "../assets/images/General.png";
import Police from "../assets/images/Police.png";
import Medical from "../assets/images/Medical.png";
import Fire from "../assets/images/Fire.png";
import FireTruckIcon from '@mui/icons-material/FireTruck';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import CircleIcon from '@mui/icons-material/Circle';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import WarningIcon from '@mui/icons-material/Warning';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getAddressFromCoordinates } from '../utils/geocoding';
import config from "../config";
import { StreamChat } from 'stream-chat';
import {
    Chat,
    Channel,
    MessageList,
    MessageInput,
    Window,
} from "stream-chat-react";
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import React from 'react';
import {
    StreamVideo,
    StreamCall,
    CallingState,
    StreamVideoClient,
    useCallStateHooks,
    useCalls,
    Call
} from "@stream-io/video-react-sdk";
import { CallPanel } from "../components/CallPanel";

const LGUMain = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { incidentId: urlIncidentId } = useParams();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [openModal, setOpenModal] = useState(false);
    const [currentChannelId, setCurrentChannelId] = useState<string>('');
    const [incidentType, setIncidentType] = useState<string>('');
    const [address, setAddress] = useState<string>('');
    const [coordinates, setCoordinates] = useState({ lat: '', long: '' });
    const [receivedTime, setReceivedTime] = useState<string>('');
    const [lapsTime, setLapsTime] = useState<number>(0);
    const [chatClient, setChatClient] = useState<StreamChat | null>(null);
    const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
    const [isChatExpanded, setIsChatExpanded] = useState(false);
    const [isRinging, setIsRinging] = useState(false);
    const userStr = localStorage.getItem("user");
    const userStr2 = userStr ? JSON.parse(userStr) : null;
    const userId = userStr2?.id;
    const token = localStorage.getItem("token");
    const [lguStatus, setLguStatus] = useState<string>('connected');
    const [responderID, setResponderID] = useState<string>("");
    const [hasAccess, setHasAccess] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkAccess = async () => {
            if (!urlIncidentId || !userId) {
                setHasAccess(false);
                setIsLoading(false);
                navigate('/lgu-status');
                return;
            }

            try {
                const response = await fetch(`${config.PERSONAL_API}/incidents/${urlIncidentId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch incident');
                }

                const data = await response.json();
                
                // Check if this LGU has access to this incident
                const hasValidAccess = data.lgu === userId && 
                                     data.lguStatus !== 'idle' && 
                                     data.lguStatus !== null;

                setHasAccess(hasValidAccess);
                
                if (!hasValidAccess) {
                    navigate('/lgu-status');
                    return;
                }

                // If we have access, proceed with setting up the incident data
                setIncidentType(data.incidentType);
                setReceivedTime(data.acceptedAt || data.createdAt);
                setLguStatus(data.lguStatus);
                setCurrentChannelId(data.channelId || `${data.incidentType.toLowerCase()}-${data._id.substring(4,9)}`);
                if (data.incidentDetails?.coordinates) {
                    setCoordinates({
                        lat: data.incidentDetails.coordinates.lat,
                        long: data.incidentDetails.coordinates.lon
                    });
                    
                    const formattedAddress = await getAddressFromCoordinates(
                        data.incidentDetails.coordinates.lat,
                        data.incidentDetails.coordinates.lon
                    );
                    setAddress(formattedAddress);
                }
                if (data.responder) {
                    setResponderID(data.responder.toString());
                }
            } catch (error) {
                console.error('Error checking incident access:', error);
                setHasAccess(false);
                navigate('/lgu-status');
            } finally {
                setIsLoading(false);
            }
        };

        checkAccess();
    }, [urlIncidentId, userId, navigate]);

    useEffect(() => {
        const initChatClient = async () => {
            console.log('Initializing chat client with userId:', userId);
            const chat = new StreamChat(config.STREAM_APIKEY);
            await chat.connectUser(
                {
                    id: userId,
                    image: avatarImg,
                },
                token
            );
            setChatClient(chat);
            console.log('Chat client initialized successfully');
        };

        if (userId && !chatClient) {
            initChatClient();
        } else {
            console.log('Skipping chat client initialization:', { userId, hasChatClient: !!chatClient });
        }

        return () => {
            if (chatClient) {
                chatClient.disconnectUser();
                setChatClient(null);
            }
        };
    }, [userId]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
            if (receivedTime) {
                const received = new Date(receivedTime);
                const now = new Date();
                const diff = Math.floor((now.getTime() - received.getTime()) / 1000);
                setLapsTime(diff);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [receivedTime]);

    useEffect(() => {
        if (!videoClient && userId && token) {
            console.log("Initializing video client for user:", userId);
            
            try {
                const client = StreamVideoClient.getOrCreateInstance({
                    apiKey: config.STREAM_APIKEY,
                    user: {
                        id: userId,
                        name: userStr2?.name || 'User',
                        image: avatarImg,
                    },
                    token: token,
                    options: {
                        logLevel: "info", 
                    }
                });
                
                client.on('all', (event: any) => {
                    if (event.type?.includes('call')) {
                        console.log('Call event received:', {
                            type: event.type,
                            callCid: event.call_cid,
                            details: event
                        });
                    }
                });
                
                client.on('connection.changed', (event: any) => {
                    console.log('Connection state changed:', event);
                });
                
                setVideoClient(client);
                console.log("Video client initialized successfully");
            } catch (error) {
                console.error("Error initializing video client:", error);
            }
        }
    }, [userId, token]);

    const formatLapsTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes} min ${remainingSeconds} sec`;
    };

    const formatReceivedTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatTime = () => {
        const hours = currentTime.getHours().toString().padStart(2, '0');
        const minutes = currentTime.getMinutes().toString().padStart(2, '0');
        const seconds = currentTime.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}: ${seconds}`;
    };

    const formatDate = () => {
        const options = { 
            weekday: 'long' as const, 
            year: 'numeric' as const, 
            month: 'long' as const, 
            day: 'numeric' as const 
        };
        return currentTime.toLocaleDateString('en-US', options);
    };

    const handleCreateRingCall = async () => {
        if (!videoClient || !responderID) {
            console.error("Video client not initialized or no responder ID available");
            return;
        }
        
        try {
            setIsRinging(true);
            console.log("Creating new ring call with user ID:", userId);
            console.log("Calling responder ID:", responderID);
            console.log("Video client state:", videoClient.state);
            
            const callId = `call-${Date.now()}`;
            console.log("Creating call with ID:", callId);
            
            const newCall = videoClient.call("default", callId);
            console.log("New call created with ID:", newCall.id);
            
            await newCall.getOrCreate({
                ring: true,
                data: {
                    members: [
                        { user_id: userId },
                        { user_id: responderID }
                    ],
                    settings_override: {
                        ring: {
                            incoming_call_timeout_ms: 30000,
                            auto_cancel_timeout_ms: 30000
                        }
                    }
                }
            });
            
            console.log("Ring call created successfully", {
                callId: newCall.id,
                isCreatedByMe: newCall.isCreatedByMe,
                members: newCall.state.members
            });
        } catch (error) {
            console.error("Error creating ring call:", error);
        } finally {
            setIsRinging(false);
        }
    };

    const handleMapClick = () => {
        // Open responder map in a new window
        const width = window.screen.width;
        const height = window.screen.height;
        const newWindow = window.open(`/responder-map?incidentId=${urlIncidentId}`, '_blank', `width=${width},height=${height},left=0,top=0`);

        // Attempt to maximize the window
        if (newWindow) {
            newWindow.moveTo(0, 0);
            newWindow.resizeTo(screen.availWidth, screen.availHeight);
            newWindow.focus();
        }
    };

    // Only render the main content if the user has access and loading is complete
    if (isLoading) {
        return <div className="min-h-screen bg-[#1B4965] flex items-center justify-center">
            <Typography variant="h5" sx={{ color: 'white' }}>Loading...</Typography>
        </div>;
    }

    if (!hasAccess) {
        return null; // The useEffect will handle navigation, so we don't need to render anything
    }

    return (
        <div className="min-h-screen bg-[#1B4965] flex items-center justify-center">

            {/* NAVBAR */}
            <Container 
  maxWidth="xl" 
  disableGutters 
  sx={{
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F0F0F0"
  }}
>
            <Grid container spacing={1}>
                <Grid size={{xs: 12}}
                // backgroundColor = {"blue"}
                display= {"flex"}>
                    <Grid
                    size={{md: 4.5}}
                    display={"flex"}
                    flexDirection={"row"}
                    alignItems={"center"}
                    // backgroundColor = {"green"}
                    padding = {"1rem 1rem 1rem 3rem"}
                    gap={"1rem"}>
                        {/* <AccountCircleIcon
                        sx={{
                            fontSize: "4rem",
                            color: "black",
                        }}
                        /> */}
                        <Avatar 
                        src={GuardianIcon}
                        sx={{   
                        width: 70, 
                        height: 70,
                        boxSizing: 'border-box',
                        borderRadius: '50%'
                        }}
                        alt={avatarImg}
                        />
                        
                        <Box>
                                    <Typography variant="h4" sx={{ fontWeight: "bold", color: "red", letterSpacing: '0.1em' }}>
                                        {formatTime()}
                                    </Typography>
                                    <Typography sx={{ fontWeight: "bold", letterSpacing: '0.1em', fontSize: "15px" }}>
                                        {formatDate()}
                                    </Typography>
                                </Box>

                        

                    </Grid>
                    
                    <Grid
                    size={{md: 3}}
                    display={"flex"}
                    flexDirection={"row"}
                    alignItems={"center"}
                    justifyContent={"center"}
                    // backgroundColor = {"red"}
                    gap={"1rem"}>
                        <Typography variant="h4" sx={{fontWeight: "bold", color: "red", letterSpacing: '0.1em', fontFamily: "Helvetica, Arial, sans-serif",}}>
                            INCIDENTS
                        </Typography>
                    </Grid>
                    
                    <Grid
  size={{md: 3.5}}
  display={"flex"}
  flexDirection={"column"} 
  alignItems={"CENTER"}
//   backgroundColor={"yellow"}
>
    LIVE DATA
  {/* Top Section */}
  <Grid 
    display={"flex"}
    flexDirection={"row"}
    alignItems={"center"}
    justifyContent={"center"}
    gap={"1rem"}
    padding={"0.5rem 0.5rem 0 0.5rem"}
  >
    <Box sx={{ 
      bgcolor: '#B93B48', 
      borderRadius: 1, 
      p: 0.5,
      display: 'flex', 
      alignItems: 'center',
      gap: 1 
    }}>
      <FireTruckIcon sx={{ color: 'white' }} />
      <Typography sx={{ color: 'white', fontWeight: 'bold' }}>10</Typography>
    </Box>
    
    <Box sx={{ 
      bgcolor: '#4285A8', 
      borderRadius: 1, 
      p: 0.5,
      display: 'flex', 
      alignItems: 'center',
      gap: 1 
    }}>
      <DirectionsCarIcon sx={{ color: 'white' }} />
      <Typography sx={{ color: 'white', fontWeight: 'bold' }}>20</Typography>
    </Box>
    
    <Box sx={{ 
      bgcolor: '#4285A8', 
      borderRadius: 1, 
      p: 0.5,
      display: 'flex', 
      alignItems: 'center',
      gap: 1 
    }}>
      <LocalPoliceIcon sx={{ color: 'white' }} />
      <Typography sx={{ color: 'white', fontWeight: 'bold' }}>20</Typography>
    </Box>
    
    <Box sx={{ 
      bgcolor: '#4A4740', 
      borderRadius: 1, 
      p: 0.5,
      display: 'flex', 
      alignItems: 'center',
      gap: 1 
    }}>
      <TwoWheelerIcon sx={{ color: 'white' }} />
      <Typography sx={{ color: 'white', fontWeight: 'bold' }}>10</Typography>
    </Box>
  </Grid>
  
  {/* Bottom Section - Duplicate of the top section */}
  <Grid 
    display={"flex"}
    flexDirection={"row"}
    alignItems={"center"}
    justifyContent={"center"}
    gap={"1rem"}
    padding={"0.5rem"}
  >
    <Box sx={{ 
      bgcolor: '#B93B48', 
      borderRadius: 1, 
      p: 0.5, 
      display: 'flex', 
      alignItems: 'center',
      gap: 1 
    }}>
      <Avatar 
                    src={Medical}
                    sx={{ width: 24, height: 24 }}
                    alt={Medical}
                  />
      {/* <FireTruckIcon2/> */}
      <Typography sx={{ color: 'white', fontWeight: 'bold' }}>10</Typography>
    </Box>
    
    <Box sx={{ 
      bgcolor: '#4285A8', 
      borderRadius: 1, 
      p: 0.5, 
      display: 'flex', 
      alignItems: 'center',
      gap: 1 
    }}>
      <Avatar 
                    src={Fire}
                    sx={{ width: 24, height: 24 }}
                    alt={Fire}
                  />
      {/* <DirectionsCarIcon sx={{ color: 'white' }} /> */}
      <Typography sx={{ color: 'white', fontWeight: 'bold' }}>20</Typography>
    </Box>
    
    <Box sx={{ 
      bgcolor: '#4285A8', 
      borderRadius: 1, 
      p: 0.5, 
      display: 'flex', 
      alignItems: 'center',
      gap: 1 
    }}>
      <Avatar 
                    src={Police}
                    sx={{ width: 24, height: 24 }}
                    alt={Police }
                  />
      {/* <DirectionsCarIcon sx={{ color: 'white' }} /> */}
      <Typography sx={{ color: 'white', fontWeight: 'bold' }}>20</Typography>
    </Box>
    
    <Box sx={{ 
      bgcolor: '#4A4740', 
      borderRadius: 1, 
      p: 0.5,
      display: 'flex', 
      alignItems: 'center',
      gap: 1 
    }}>
      <Avatar 
                    src={General}
                    sx={{ width: 24, height: 24 }}
                    alt={General}
                  />
      {/* <TwoWheelerIcon sx={{ color: 'white' }} /> */}
      <Typography sx={{ color: 'white', fontWeight: 'bold' }}>10</Typography>
    </Box>
  </Grid>
</Grid>
                    <Grid
                    size={{md: 1}}
                    display={"flex"}
                    flexDirection={"row"}
                    alignItems={"center"}
                    padding = {"1rem 3rem 1rem 1rem"}
                    justifyContent={"center"}
                    // backgroundColor = {"orange"}
                    gap={"1rem"}>
                        <Avatar 
                        src={avatarImg}
                        sx={{   
                        width: 70, 
                        height: 70,
                        boxSizing: 'border-box',
                        borderRadius: '50%'
                        }}
                        alt={avatarImg}
                        />

                    </Grid>
                        
                    
                    
                </Grid>

            </Grid>
            
            </Container>
            <div className="min-h-screen bg-[#1B4965] flex items-center justify-center">
                <Paper
                    elevation={3}
                    sx={{
                        width: '300px',
                        borderRadius: '10px',
                        overflow: 'hidden'
                    }}
                >
                    {/* Header */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        bgcolor: '#4a90e2'
                    }}>
                        <Avatar
                            src={Medical}
                            sx={{
                                width: 50,
                                height: 50,
                                bgcolor: 'white',
                                p: 1
                            }}
                        />
                        <Box>
                            <Typography sx={{
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                textTransform: 'uppercase'
                                }}>
                                ID: {incidentType ? `${incidentType}-${urlIncidentId?.substring(5,9)}` : ""}
                            </Typography>
                            <Typography sx={{color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.9rem'}}>
                                    {incidentType ? `${incidentType.toUpperCase()} CALL` : ""}
                                </Typography>
                            <Typography sx={{
                                color: 'white',
                                fontSize: '0.8rem'
                            }}>
                                {address || "Loading address..."}
                            </Typography>
                        </Box>
                        {/* <Typography sx={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            bgcolor: 'red',
                            color: 'white',
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            fontWeight: 'bold'
                        }}>
                            2
                        </Typography> */}
                    </Box>

                    {/* Received Time */}
                    <Box sx={{
                        bgcolor: '#e8f5e9',
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Typography sx={{
                            color: '#2e7d32',
                            fontSize: '0.9rem'
                        }}>
                            RECEIVED : {formatReceivedTime(receivedTime)}
                        </Typography>
                    </Box>

                    {/* Incident Type */}
                    <Box sx={{
                        bgcolor: 'white',
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Typography sx={{
                            fontWeight: 'bold'
                        }}>
                            {incidentType ? incidentType.toUpperCase() : "LOADING..."}
                        </Typography>
                    </Box>

                    {/* Laps Time */}
                    <Box sx={{
                        bgcolor: 'white',
                        p: 1,
                        borderTop: '1px solid #eee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Typography sx={{
                            color: 'red',
                            fontSize: '0.9rem'
                        }}>
                            LAPS TIME: {formatLapsTime(lapsTime)}
                        </Typography>
                    </Box>

                    {/* Dispatch */}
                    <Box sx={{
                        bgcolor: '#333',
                        color: 'white',
                        p: 1.5,
                        textAlign: 'center'
                    }}>
                        <Typography>
                            DISPATCH
                        </Typography>
                    </Box>

                    {/* Communication Icons */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-around',
                        p: 1,
                        bgcolor: 'white'
                    }}>
                        <Button sx={{ minWidth: 0, color: '#666' }}>💬</Button>
                        <Button 
                            sx={{ minWidth: 0, color: '#666' }}
                            onClick={handleCreateRingCall}
                        >
                            📞
                        </Button>
                        <Button sx={{ minWidth: 0, color: '#666' }}>📹</Button>
                    </Box>

                    {/* View Map */}
                    <Button
                        fullWidth
                        sx={{
                            bgcolor: '#4a90e2',
                            color: 'white',
                            py: 1.5,
                            borderRadius: 0,
                            '&:hover': {
                                bgcolor: '#357abd'
                            }
                        }}
                        onClick={handleMapClick}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            🗺️ VIEW MAP
                        </Box>
                    </Button>
                </Paper>
            </div>

            {/* Chat Widget */}
            {chatClient && currentChannelId && lguStatus === 'connected' && (
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: 0,
                        right: 20,
                        width: '350px',
                        backgroundColor: 'white',
                        borderRadius: '10px 10px 0 0',
                        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
                        transition: 'height 0.3s ease',
                        height: isChatExpanded ? '500px' : '50px',
                        overflow: 'hidden'
                    }}
                >
                    {/* Chat Header */}
                    <Box
                        onClick={() => setIsChatExpanded(!isChatExpanded)}
                        sx={{
                            bgcolor: '#4a90e2',
                            color: 'white',
                            p: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                        }}
                    >
                        <Typography sx={{ fontWeight: 'bold', textTransform: "uppercase" }}>
                            Channel ID: {incidentType ? `${incidentType}-${urlIncidentId?.substring(5,9)}` : ""}
                        </Typography>
                        {isChatExpanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />}
                    </Box>

                    {/* Chat Content */}
                    <Box
                        sx={{
                            height: 'calc(100% - 40px)',
                            display: isChatExpanded ? 'block' : 'none'
                        }}
                    >
                        <Chat client={chatClient} theme="messaging light">
                            <Channel channel={chatClient.channel("messaging", currentChannelId)}>
                                <Window>
                                    <MessageList />
                                    <MessageInput />
                                </Window>
                            </Channel>
                        </Chat>
                    </Box>
                </Box>
            )}

            {/* Add video client component */}
            {videoClient && (
                <StreamVideo client={videoClient}>
                    <VideoCallHandler />
                </StreamVideo>
            )}
        </div>
    )

}

// Add VideoCallHandler component
const VideoCallHandler = () => {
    const calls = useCalls();
    const { incidentId: urlIncidentId } = useParams();
    
    useEffect(() => {
        if (calls.length > 0) {
            console.log("Active calls:", calls.length);
            calls.forEach(call => {
                console.log(`Call ${call.cid} state:`, call.state.callingState);
            });
        }
    }, [calls]);
    
    return (
        <>
            {calls.map((call) => (
                <StreamCall call={call} key={call.cid}>
                    <CallPanel />
                </StreamCall>
            ))}
        </>
    );
};

export default LGUMain;


