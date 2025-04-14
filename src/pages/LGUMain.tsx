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
import { useLocation } from 'react-router-dom';
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

const LGUMain = () => {
    const location = useLocation();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [openModal, setOpenModal] = useState(false);
    const [currentChannelId, setCurrentChannelId] = useState<string>('');
    const [incidentType, setIncidentType] = useState<string>('');
    const [address, setAddress] = useState<string>('');
    const [coordinates, setCoordinates] = useState({ lat: '', long: '' });
    const [incidentId, setIncidentId] = useState<string>('');
    const [receivedTime, setReceivedTime] = useState<string>('');
    const [lapsTime, setLapsTime] = useState<number>(0);
    const [chatClient, setChatClient] = useState<StreamChat | null>(null);
    const [isChatExpanded, setIsChatExpanded] = useState(false);
    const userStr = localStorage.getItem("user");
    const userStr2 = userStr ? JSON.parse(userStr) : null;
    const userId = userStr2?.id;
    const token = localStorage.getItem("token");

    useEffect(() => {
        const storedChannelId = localStorage.getItem('currentChannelId');
        if (storedChannelId) {
            setCurrentChannelId(storedChannelId);
            console.log('Retrieved channel ID:', storedChannelId);
        } else {
            console.log('No channel ID found in localStorage');
        }
    }, []);

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
        const storedIncidentId = localStorage.getItem('currentIncidentId');
        if (storedIncidentId) {
            setIncidentId(storedIncidentId);
            fetchIncidentData(storedIncidentId);
        }
    }, []);

    const fetchIncidentData = async (id: string) => {
        try {
            const response = await fetch(`${config.PERSONAL_API}/incidents/${id}`);
            if (response.ok) {
                const data = await response.json();
                setIncidentType(data.incidentType);
                setReceivedTime(data.acceptedAt || data.createdAt);
                if (data.incidentDetails?.coordinates) {
                    setCoordinates({
                        lat: data.incidentDetails.coordinates.lat,
                        long: data.incidentDetails.coordinates.lon
                    });
                    
                    // Get address from coordinates
                    const formattedAddress = await getAddressFromCoordinates(
                        data.incidentDetails.coordinates.lat,
                        data.incidentDetails.coordinates.lon
                    );
                    setAddress(formattedAddress);
                }
            }
        } catch (error) {
            console.error('Error fetching incident data:', error);
        }
    };

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
                                ID: {incidentType ? `${incidentType}-${incidentId?.substring(5,9)}` : ""}
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
                        <Button sx={{ minWidth: 0, color: '#666' }}>📞</Button>
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
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            🗺️ VIEW MAP
                        </Box>
                    </Button>
                </Paper>
            </div>

            {/* Chat Widget */}
            {chatClient && currentChannelId && (
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
                        <Typography sx={{ fontWeight: 'bold' }}>
                            Channel ID: {currentChannelId.toUpperCase()}
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
        </div>
    )

}

export default LGUMain;


