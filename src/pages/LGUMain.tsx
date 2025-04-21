import { useState, useEffect, useCallback } from 'react';
import { Modal, Paper, Typography, Button, Box, Avatar, Container } from '@mui/material';
import avatarImg from "../assets/images/user.png";
import GuardianIcon from "../assets/images/Guardian.png";
import Grid from "@mui/material/Grid2";
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import General from "../assets/images/General.png";
import Police from "../assets/images/Police.png";
import Medical from "../assets/images/Medical.png";
import Fire from "../assets/images/Fire.png";
import FireTruckIcon from '@mui/icons-material/FireTruck';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
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
    useChatContext
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
import { RingingCall } from "../components/RingingCall";

const getIncidentIcon = (incidentType: string) => {
    const type = incidentType?.toLowerCase() || '';

    switch (type) {
      case 'medical':
      case 'Medical':
        return {
          icon: Medical
        };
      case 'fire':
      case 'Fire':
        return {
          icon: Fire
        };
      case 'police':
      case 'Police':
        return {
          icon: Police
        };
      case 'general':
      case 'General':
      default:
        return {
          icon: General
        };
    }
  };

  

const IncidentCard = ({ incident, handleMapClick, handleCreateRingCall, handleSelectIncidentForChat }: any) => {
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

    const shortId = incident._id ? incident._id.substring(5, 9) : "";

    
    
    return (
        <Paper
            elevation={3}
            sx={{
                width: '300px',
                borderRadius: '10px',
                overflow: 'hidden',
                m: 2
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
                    src={getIncidentIcon(incident.incidentType?.toLowerCase() || 'general').icon}
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
                        ID: {incident.incidentType ? `${incident.incidentType}-${shortId}` : ""}
                    </Typography>
                    <Typography sx={{
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                    }}>
                        {incident.incidentType ? `${incident.incidentType.toUpperCase()} CALL` : ""}
                    </Typography>
                    <Typography sx={{
                        color: 'white',
                        fontSize: '0.8rem'
                    }}>
                        {incident.address || "Loading address..."}
                    </Typography>
                </Box>
            </Box>
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
                    RECEIVED : {formatReceivedTime(incident.receivedTime)}
                </Typography>
            </Box>
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
                    {incident.incidentDetails?.incident ? incident.incidentDetails.incident.toUpperCase() : (incident.incidentType ? incident.incidentType.toUpperCase() : "LOADING...")}
                </Typography>
            </Box>
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
                    LAPS TIME: {formatLapsTime(incident.timeLapsed)}
                </Typography>
            </Box>
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
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-around',
                p: 1,
                bgcolor: 'white'
            }}>
                <Button 
                    sx={{ minWidth: 0, color: '#666' }}
                    onClick={() => incident.channelId && handleSelectIncidentForChat(incident.channelId)}
                >
                    💬
                </Button>
                <Button 
                    sx={{ minWidth: 0, color: '#666' }}
                    onClick={() => handleCreateRingCall(incident)}
                >
                    📞
                </Button>
                <Button sx={{ minWidth: 0, color: '#666' }}>📹</Button>
            </Box>
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
                onClick={() => handleMapClick(incident._id)}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    🗺️ VIEW MAP
                </Box>
            </Button>
        </Paper>
    );
};

const LGUMain = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [openModal, setOpenModal] = useState(false);
    const [chatClient, setChatClient] = useState<StreamChat | null>(null);
    const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
    const [isChatExpanded, setIsChatExpanded] = useState(false);
    const [isRinging, setIsRinging] = useState(false);
    const userStr = localStorage.getItem("user");
    const userStr2 = userStr ? JSON.parse(userStr) : null;
    const userId = userStr2?.id;
    const token = localStorage.getItem("token");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [address, setAddress] = useState<string>('');
    const [isInvisible, setIsInvisible] = useState(true);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [connectingIncident, setConnectingIncident] = useState<any>(null);
    const { client } = useChatContext();
    const [incidents, setIncidents] = useState<any[]>([]);
    const [activeCall, setActiveCall] = useState<string | null>(null);
    const handleSelectIncidentForChat = (channelId: string) => {
        setActiveCall(channelId);
        setIsChatExpanded(true);
    };
    
    const fetchIncidents = async () => {
        if (!userId) {
            setIsLoading(false);
            navigate('/');
            return;
        }

        try {
            const response = await fetch(`${config.PERSONAL_API}/incidents`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch incidents');
            }

            const data = await response.json();
            
            const connectedIncidents = data.filter((incident: any) => 
                incident.lgu === userId && incident.lguStatus === 'connected'
            );
            const processedIncidents = await Promise.all(
                connectedIncidents.map(async (incident: any) => {
                    let address = "";
                    if (incident.incidentDetails?.coordinates?.lat && incident.incidentDetails?.coordinates?.lon) {
                        try {
                            address = await getAddressFromCoordinates(
                                incident.incidentDetails.coordinates.lat.toString(),
                                incident.incidentDetails.coordinates.lon.toString()
                            );
                        } catch (error) {
                            console.error('Error getting address:', error);
                            address = "Unknown location";
                        }
                    }
                    const receivedTime = new Date(incident.acceptedAt || incident.createdAt);
                    const now = new Date();
                    const timeLapsed = Math.floor((now.getTime() - receivedTime.getTime()) / 1000);
                    
                    return {
                        ...incident,
                        address,
                        timeLapsed,
                        receivedTime: incident.acceptedAt || incident.createdAt
                    };
                })
            );
            
            setIncidents(processedIncidents);
        } catch (error) {
            console.error('Error fetching incidents:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        
        if (!isInvisible) {
            fetchIncidents();
            interval = setInterval(fetchIncidents, 15000);
        } else {
            setIsLoading(false);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isInvisible, userId, token]);


useEffect(() => {
    const timer = setInterval(() => {
        setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
}, []);


useEffect(() => {
    const updateIncidentTimes = () => {
        setIncidents(prevIncidents => 
            prevIncidents.map(incident => {
                const receivedTime = new Date(incident.receivedTime);
                const now = new Date();
                const timeLapsed = Math.floor((now.getTime() - receivedTime.getTime()) / 1000);
                
                return {
                    ...incident,
                    timeLapsed
                };
            })
        );
    };
    
    updateIncidentTimes();
    const timer = setInterval(updateIncidentTimes, 1000);
    
    return () => clearInterval(timer);
}, []);
    const toggleStatus = async () => {
        try {
            if (!client || !userId) return;
            
            await client.upsertUser({
                id: userId,
                invisible: !isInvisible,
            });

            setIsInvisible(!isInvisible);
            if (!isInvisible) {
                setShowStatusModal(false);
            }
        } catch (error) {
            console.error('Error toggling LGU status:', error);
        }
    };
    useEffect(() => {
        const checkUserStatus = async () => {
            if (!client || !userId) return;
            
            try {
                const user = await client.queryUsers({ id: userId });
                if (user.users && user.users.length > 0) {
                    setIsInvisible(!!user.users[0].invisible);
                    
                    // Only show status modal if user is offline/invisible
                    if (user.users[0].invisible) {
                        setShowStatusModal(true);
                    }
                }
            } catch (error) {
                console.error('Error checking user status:', error);
                setIsInvisible(true);
                setShowStatusModal(true);
            }
        };
        
        checkUserStatus();
    }, [client, userId]);
    useEffect(() => {
        const checkConnectingIncidents = async () => {
            if (!userId || isInvisible) return; 
    
            try {
                const response = await fetch(`${config.PERSONAL_API}/incidents`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
    
                if (response.ok) {
                    const data = await response.json();
                    const connectingIncident = data.find((incident: any) => 
                        incident.lgu === userId && incident.lguStatus === 'connecting'
                    );
                    
                    if (connectingIncident) {
                        setConnectingIncident(connectingIncident);
                        setShowStatusModal(true);
                        if (connectingIncident.incidentDetails.coordinates.lat && connectingIncident.incidentDetails.coordinates.lon) {
                            const formattedAddress = await getAddressFromCoordinates(
                                connectingIncident.incidentDetails.coordinates.lat.toString(),
                                connectingIncident.incidentDetails.coordinates.lon.toString()
                            );
                            setAddress(formattedAddress);
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking connecting incidents:', error);
            }
        };
    
        const interval = setInterval(checkConnectingIncidents, 5000); 
        return () => clearInterval(interval);
    }, [userId, token, isInvisible]);
    const getNextChannelId = async (incidentType: string, incidentId: string) => {
        try {
            const data = incidentId.substring(4,9);
            return `${incidentType.toLowerCase()}-${data}`;
        } catch (error) {
            console.error('Error generating channel ID:', error);
            return `${incidentType.toLowerCase()}-error`;
        }
    };
    const handleAcceptIncident = async () => {
        if (!connectingIncident) return;
    
        try {
            const channelId = await getNextChannelId(connectingIncident.incidentType, connectingIncident._id);
            const channel = client.channel('messaging', channelId, {
                name: `${connectingIncident.incidentType} Incident #${channelId.split('-')[1]}`,
                members: [connectingIncident.user._id, userId]
            });
            
            await channel.create();
    
            const response = await fetch(`${config.PERSONAL_API}/incidents/update/${connectingIncident._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    lguStatus: 'connected',
                    lguConnectedAt: new Date(),
                    lgu: userId,
                    channelId: channelId
                })
            });
    
            if (response.ok) {
                localStorage.setItem('currentIncidentId', connectingIncident._id);
                localStorage.setItem('currentChannelId', channelId);
    
                setConnectingIncident(null);
                setShowStatusModal(false);
                fetchIncidents();
            }
        } catch (error) {
            console.error('Error accepting incident:', error);
        }
    };
    const handleDeclineIncident = async () => {
        if (!connectingIncident) return;
    
        try {
            const response = await fetch(`${config.PERSONAL_API}/incidents/update/${connectingIncident._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    lguStatus: 'idle',
                    lgu: null
                })
            });
    
            if (response.ok) {
                setConnectingIncident(null);
                setShowStatusModal(false);
            }
        } catch (error) {
            console.error('Error declining incident:', error);
        }
    };

    useEffect(() => {
        const initChatClient = async () => {
            console.log('Initializing chat client with userId:', userId);
            const chat = new StreamChat(config.STREAM_APIKEY);
            await chat.connectUser(
                {
                    id: userId,
                    name: userStr2?.firstName && userStr2?.lastName 
                        ? `${userStr2.firstName} ${userStr2.lastName}` 
                        : userStr2?.email || "Unknown User",
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

    // useEffect(() => {
    //     const timer = setInterval(() => {
    //         setCurrentTime(new Date());
    //         if (receivedTime) {
    //             const received = new Date(receivedTime);
    //             const now = new Date();
    //             const diff = Math.floor((now.getTime() - received.getTime()) / 1000);
    //             setLapsTime(diff);
    //         }
    //     }, 1000);

    //     return () => clearInterval(timer);
    // }, [receivedTime]);

    useEffect(() => {
        if (!videoClient && userId && token) {
            console.log("Initializing video client for user:", userId);
            
            try {
                const client = StreamVideoClient.getOrCreateInstance({
                    apiKey: config.STREAM_APIKEY,
                    user: {
                        id: userId,
                        name: userStr2?.firstName && userStr2?.lastName 
                            ? `${userStr2.firstName} ${userStr2.lastName}` 
                            : userStr2?.email || "Unknown User",
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

    const formatTime = () => {
        const hours = currentTime.getHours().toString().padStart(2, '0');
        const minutes = currentTime.getMinutes().toString().padStart(2, '0');
        const seconds = currentTime.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
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

    const handleCreateRingCall = async (incident: any) => {
        if (!videoClient || !incident?.responder) {
            console.error("Video client not initialized or no responder ID available");
            return;
        }
        
        try {
            setIsRinging(true);
            const responderId = incident.responder.toString();
            console.log("Creating new ring call with user ID:", userId);
            console.log("Calling responder ID:", responderId);
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
                        { user_id: "67ee19d01cf35d8bbbf6257e" }
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

    const handleMapClick = (incidentId: string) => {
        const width = window.screen.width;
        const height = window.screen.height;
        const newWindow = window.open(`/responder-map?incidentId=${incidentId}`, '_blank', `width=${width},height=${height},left=0,top=0`);
        if (newWindow) {
            newWindow.moveTo(0, 0);
            newWindow.resizeTo(screen.availWidth, screen.availHeight);
            newWindow.focus();
        }
    };
    if (isLoading) {
        return <div className="min-h-screen bg-[#1B4965] flex items-center justify-center">
            <Typography variant="h5" sx={{ color: 'white' }}>Loading...</Typography>
        </div>;
    }

    return (
        <div className="min-h-screen bg-[#1B4965] flex items-center justify-center">
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
                        borderRadius: '50%',
                        border: `2px solid ${!isInvisible ? 'green' : 'red'}`,
                        cursor: 'pointer'
                        }}
                        alt={userStr2?.firstName + " " + userStr2?.lastName}
                        onClick={() => setShowStatusModal(true)}
                        />

                    </Grid>
                        
                    
                    
                </Grid>

            </Grid>
            
            </Container>
            <div className="min-h-screen bg-[#1B4965] flex items-center justify-center pt-24">
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        width: '100%',
                        maxWidth: '1200px',
                        px: 2
                    }}
                >
                    {incidents.length > 0 ? (
                        incidents.map((incident) => (
                            <IncidentCard
                                key={incident._id}
                                incident={incident}
                                handleMapClick={handleMapClick}
                                handleCreateRingCall={handleCreateRingCall}
                                handleSelectIncidentForChat={handleSelectIncidentForChat}
                            />
                        ))
                    ) : (
                        <Box
                            sx={{
                                textAlign: 'center',
                                p: 4,
                                bgcolor: 'rgba(255,255,255,0.1)',
                                borderRadius: 2
                            }}
                        >
                            <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
                                No active incidents
                            </Typography>
                            <Typography sx={{ color: 'white' }}>
                                {isInvisible ? "You are currently OFFLINE. Click on your avatar to change your status to ONLINE." : "You are ONLINE. No incidents are currently assigned to you."}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </div>

            {videoClient && (
                <StreamVideo client={videoClient}>
                    <VideoCallHandler />
                </StreamVideo>
            )}
            <Modal
                open={showStatusModal}
                onClose={() => {
                    if (!connectingIncident) {
                        setShowStatusModal(false);
                    }
                }}
                aria-labelledby="status-modal"
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div className="min-h-[250px] flex items-center justify-center">
                    {connectingIncident ? (
                        <Paper 
                            elevation={3} 
                            className="shake_me"
                            sx={{ 
                                width: '550px',
                                margin: '0 auto',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                padding: 0,
                                border: `1px solid white`,
                            }}
                        >
                            <div style={{ 
                                backgroundColor: "#1B4965", 
                                padding: '24px',
                                display: 'flex',
                                height: "50px",
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                            </div>
                            <div style={{ 
                                backgroundColor: "#F27572", 
                                padding: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <div>
                                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                                        NEW INCIDENT
                                    </Typography>
                                </div>
                            </div>
                            <div style={{ 
                                backgroundColor: "#4a7ab8", 
                                padding: '14px 40px 14px 40px', 
                                display: 'flex', 
                                justifyContent: 'start',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <Avatar 
                                    src={avatarImg}
                                    sx={{ width: 96, height: 96 }}
                                    alt={avatarImg}
                                />
                                <div
                                    style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                    }}>
                                    <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '30px', textTransform: 'uppercase' }}>
                                        {connectingIncident.incidentType}
                                    </Typography>
                                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                        {connectingIncident.incidentDetails.incident}
                                    </Typography>
                                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                                        {address || 'Loading address...'}
                                    </Typography>
                                </div>
                            </div>
                            <div style={{ 
                                backgroundColor: "#1B4965", 
                                padding: '24px', 
                                display: 'flex', 
                                justifyContent: 'center',
                                gap: '16px'
                            }}>
                                <Button
                                    variant="contained"
                                    onClick={handleAcceptIncident}
                                    sx={{
                                        backgroundColor: '#4caf50',
                                        '&:hover': {
                                            backgroundColor: '#388e3c',
                                        },
                                    }}
                                >
                                    Accept
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleDeclineIncident}
                                    sx={{
                                        backgroundColor: '#f44336',
                                        '&:hover': {
                                            backgroundColor: '#d32f2f',
                                        },
                                    }}
                                >
                                    Decline
                                </Button>
                            </div>
                        </Paper>
                    ) : (
                        <Box sx= {{
                            backgroundColor: 'gray',
                            width: '100vw',
                            display: 'flex',
                            justifyContent: 'center',
                        }}>

                        
                        <Box
                            sx={{
                                width: 600,
                                maxWidth: '90%',
                                bgcolor: 'red',
                                borderRadius: 0,
                                overflow: 'hidden',
                            }}
                        >
                            <Box
                                sx={{
                                    bgcolor: '#1D5673',
                                    padding: '20px',
                                    textAlign: 'center',
                                }}
                            >
                                <Typography 
                                    variant="h2"
                                    sx={{ 
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        fontSize: '4rem',
                                        lineHeight: 1,
                                        color: isInvisible ? 'red' : 'green',
                                    }}
                                >
                                    {isInvisible ? "OFFLINE" : "ONLINE"}
                                </Typography>
                                <Typography 
                                    variant="h4"
                                    sx={{ 
                                        color: 'white',
                                        textTransform: 'uppercase',
                                        mt: 1,
                                    }}
                                >
                                    OPERATION CENTER
                                </Typography>
                            </Box>
                            
                            <Box
                                sx={{
                                    bgcolor: 'white',
                                    padding: '10px 20px',
                                    textAlign: 'center',
                                }}
                            >
                                <Typography 
                                    variant="h6"
                                    sx={{ 
                                        color: 'red',
                                        textTransform: 'uppercase',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {!isInvisible ? "ON ACTIVE STAND-BY, WAITING DISPATCH" : "ON BREAK"}
                                </Typography>
                            </Box>
                            
                            <Box
                                sx={{
                                    bgcolor: '#1D5673',
                                    padding: '20px',
                                    textAlign: 'center',
                                }}
                            >
                                <Button 
                                    variant="contained" 
                                    onClick={toggleStatus}
                                    sx={{
                                        padding: '10px 40px',  
                                        fontSize: '16px',
                                        textTransform: 'uppercase', 
                                        fontWeight: 'bold',
                                        bgcolor: !isInvisible ? '#FF6B6B' : '#4AE54A',
                                        color: 'white',
                                        '&:hover': {
                                            bgcolor: !isInvisible ? '#E05959' : '#3AC53A',
                                        },
                                        borderRadius: '25px',
                                    }}
                                >
                                    {!isInvisible ? "CHECK-OUT" : "CHECK-IN"}
                                </Button>
                            </Box>
                            </Box>
                        </Box>
                    )}
                </div>
            </Modal>
        </div>
    )

}

const VideoCallHandler = () => {
    const calls = useCalls();
    const navigate = useNavigate();
    
    useEffect(() => {
        if (calls.length > 0) {
            console.log("Active calls in LGUMain:", calls.length);
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


