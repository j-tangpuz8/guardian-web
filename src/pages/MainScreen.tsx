import {Navigate, useLocation, useNavigate} from "react-router-dom";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid2";
import {
  Avatar,
  Paper,
  Typography,
  FormControlLabel,
  Switch,
  Divider,
  Button,
  Modal,
  Box,
  TextField
} from "@mui/material";
import avatarImg from "../assets/images/avatar.jpg";
import Icon from "../assets/images/Medical.png";
import SystemSecurityUpdateWarningIcon from "@mui/icons-material/SystemSecurityUpdateWarning";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import AddIcCallIcon from "@mui/icons-material/AddIcCall";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import {useState, useEffect, useCallback} from "react";
import {StreamChat} from "stream-chat";
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import {
  StreamVideo,
  StreamCall,
  CallingState,
  StreamVideoClient,
  useCallStateHooks,
  useCalls,
  Call
} from "@stream-io/video-react-sdk";
import {RingingCall} from "../components/RingingCall";

import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  Window,
} from "stream-chat-react";
import config from "../config";
import msgTemplates from "../utils/MsgTemplates";
import { CallPanel } from "../components/CallPanel";
import medicalIcon from '../assets/images/Medical.png';
import generalIcon from '../assets/images/General.png';
import fireIcon from '../assets/images/Fire.png';
import crimeIcon from '../assets/images/Police.png';
import { getAddressFromCoordinates } from '../utils/geocoding';
import { generateMapUrl } from '../utils/maps';
import MapView from '../components/MapView';

type User = {
  id: string;
  email: string;
  name: string;
};

interface Incident {
  _id: string;
  incidentType: string;
  isVerified: boolean;
  isResolved: boolean;
  isAccepted: boolean;
  responderCoordinates?: {
    lat: number;
    lon: number;
  };
  incidentDetails?: {
    coordinates?: {
      lat: number;
      lon: number;
    };
  };
}

const MainScreen = () => {
  const location = useLocation();
  const userStr = localStorage.getItem("user");
  const userStr2 = userStr ? JSON.parse(userStr) : null;
  const userId = userStr2?.id;
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const incident = location.state?.incident;
  const incidentId = location.state?.incidentId || localStorage.getItem('currentIncidentId');

  useEffect(() => {
    if (incidentId) {
      console.log('MainScreen Component - Received Incident ID:', incidentId);
    } else {
      console.log('MainScreen Component - No Incident ID received');
    }
  }, [incidentId]);
  

  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>("");

  const [isRinging, setIsRinging] = useState(false);

  const [currentChannelId, setCurrentChannelId] = useState<string>('fad-call');

  const [isVerified, setIsVerified] = useState(incident?.isVerified || false);

  const [isUpdating, setIsUpdating] = useState(false);

  const [openModal, setOpenModal] = useState(false);

  const [incidentType, setIncidentType] = useState<string | null>(null);

  const [coordinates, setcoordinates] = useState<{ lat: string; long: string }>({ lat: "", long: "" });

  const [volunteerID, setVolunteerID] = useState<string>("");

  const [userData, setUserData] = useState<{ firstName: string; lastName: string; phone: string } | null>(null);

  const [isResolved, setIsResolved] = useState(false);

  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);

  const [lapsTime, setLapsTime] = useState(0);

  const [lguUsers, setLguUsers] = useState<any[]>([]);

  const [selectedLgu, setSelectedLgu] = useState<any>(null);

  const [modalIncident, setModalIncident] = useState<string>("");

  const [modalIncidentDescription, setModalIncidentDescription] = useState<string>("");

  const [connectingModalOpen, setConnectingModalOpen] = useState(false);

  const [connectingLguName, setConnectingLguName] = useState<{ firstName: string; lastName: string } | null>(null);

  const [lguConnectingAt, setLguConnectingAt] = useState<Date | null>(null);

  const [address, setAddress] = useState<string>('');

  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [currentAddress, setCurrentAddress] = useState<string>('');

  const [mapModalOpen, setMapModalOpen] = useState(false);

  const [showMap, setShowMap] = useState(false);

  const [responderCoordinates, setResponderCoordinates] = useState<{lat: number; lon: number} | null>(null);

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
  };

  const handleSendTemplate = async () => {
    if (!selectedTemplate || !chatClient) return;

    try {
      const channel = chatClient.channel("messaging", currentChannelId);
      await channel.sendMessage({
        text: selectedTemplate,
      });
      setSelectedTemplate(null);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleVerificationToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVerificationStatus = event.target.checked;
    setIsUpdating(true);
    
    try {
      const id = incident?._id || incidentId;
      
      if (!id) {
        console.error('No incident ID available for update');
        return;
      }
      
      console.log('Updating verification status for incident:', id);
      
      const response = await fetch(`${config.PERSONAL_API}/incidents/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isVerified: newVerificationStatus
        })
      });

      if (response.ok) {
        setIsVerified(newVerificationStatus);
      } else {
        setIsVerified(!newVerificationStatus);
        console.error('Failed to update incident verification status');
      }
    } catch (error) {
      setIsVerified(!newVerificationStatus);
      console.error('Error updating incident:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseIncident = async () => {
    const id = incident?._id || incidentId;
    
    if (!id) {
        console.error('No incident ID available for closing');
        return;
    }
    
    try {
        const response = await fetch(`${config.PERSONAL_API}/incidents/update/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                isResolved: true
            })
        });

        if (response.ok) {
            setIsResolved(true);
            console.log('Incident closed successfully');
        } else {
            console.error('Failed to close incident');
        }
    } catch (error) {
        console.error('Error closing incident:', error);
    }
  };

  

  const user = {
    id: userId,
    name: userStr2?.name || "User",
  };

  const getIncidentIcon = (incidentType: string) => {
    const type = incidentType?.toLowerCase() || '';

    switch (type) {
      case 'medical':
        return {
          icon: medicalIcon
        };
      case 'fire':
        return {
          icon: fireIcon
          
        };
      case 'police':
        return {
          icon: crimeIcon
        };
      case 'general':
      default:
        return {
          icon: generalIcon
        };
    }
  };

  
  

  useEffect(() => {
    const initChatClient = async () => {
      const chat = new StreamChat(config.STREAM_APIKEY);
      await chat.connectUser(
        {
          id: userId,
          image: avatarImg,
        },
        token
      );
      setChatClient(chat);
    };

    if (userId && !chatClient) {
      initChatClient();
      console.log(token);
      console.log(userId);
    }

    return () => {
      if (chatClient) {
        chatClient.disconnectUser();
        setChatClient(null);
      }
    };
  }, [userId]);

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

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.clear();
    
    // Redirect to login page
    navigate("/");
  };

  const handleCreateRingCall = async () => {
    if (!videoClient || !volunteerID) {
      console.error("Video client not initialized or no volunteer ID available");
      return;
    }
    
    try {
      setIsRinging(true);
      console.log("Creating new ring call with user ID:", userId);
      console.log("Calling volunteer ID:", volunteerID);
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
            { user_id: volunteerID }
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
  }

  useEffect(() => {
    const storedChannelId = localStorage.getItem('currentChannelId');
    if (storedChannelId) {
      setCurrentChannelId(storedChannelId);
    }
  }, []);

  useEffect(() => {
    const fetchIncidentType = async () => {
      const storedIncidentId = localStorage.getItem('currentIncidentId');
      if (storedIncidentId) {
        try {
          const response = await fetch(`/api/incidents/${storedIncidentId}`);
          if (response.ok) {
            const incidentData = await response.json();
            setIncidentType(incidentData.incidentType);
          } else {
            console.error('Failed to fetch incident data');
          }
        } catch (error) {
          console.error('Error fetching incident data:', error);
        }
      }
    };

    fetchIncidentType();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentIncidentId = incident?._id || incidentId || localStorage.getItem('currentIncidentId');
      
      if (currentIncidentId) {
        try {
          // First fetch the incident to get the user ID
          const incidentResponse = await fetch(`/api/incidents/${currentIncidentId}`);
          if (!incidentResponse.ok) throw new Error('Failed to fetch incident');
          
          const incidentData = await incidentResponse.json();
          
          let userId;
          if (typeof incidentData.user === 'string') {
            userId = incidentData.user;
          } else if (incidentData.user && incidentData.user._id) {
            userId = incidentData.user._id;
          } else if (incidentData.user && typeof incidentData.user.toString === 'function') {
            userId = incidentData.user.toString();
          }

          setVolunteerID(userId);
          
          console.log('User ID extracted:', userId);

          if (userId) {
            const userResponse = await fetch(`/api/users/${userId}`);
            if (!userResponse.ok) throw new Error('Failed to fetch user');
            
            const userData = await userResponse.json();
            console.log('User data fetched:', userData);
            
            setUserData({
              firstName: userData.firstName,
              lastName: userData.lastName,
              phone: userData.phone
            });
          } else {
            console.error('Could not extract valid user ID from incident data', incidentData);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };
  
    fetchUserData();
  }, [incident, incidentId]);
  

  useEffect(() => {
    const fetchIncidentData = async () => {
      const id = incident?._id || incidentId || localStorage.getItem('currentIncidentId');
      
      if (id) {
        try {
          const response = await fetch(`${config.PERSONAL_API}/incidents/${id}`);
          if (response.ok) {
            const data = await response.json();
            console.log('Fetched incident data:', data);
            console.log('Responder coordinates:', data.responderCoordinates);
            
            setIsResolved(data.isResolved);
            setAcceptedAt(data.acceptedAt);
            setIsVerified(data.isVerified);
            setcoordinates({
              lat: data.incidentDetails.coordinates.lat.toString(),
              long: data.incidentDetails.coordinates.lon.toString()
            });
            setResponderCoordinates(data.responderCoordinates || null);
            
            // Get address from coordinates
            if (data.incidentDetails.coordinates.lat && data.incidentDetails.coordinates.lon) {
              const formattedAddress = await getAddressFromCoordinates(
                data.incidentDetails.coordinates.lat.toString(),
                data.incidentDetails.coordinates.lon.toString()
              );
              setAddress(formattedAddress);
            }
          } else {
            console.error('Failed to fetch incident data');
          }
        } catch (error) {
          console.error('Error fetching incident data:', error);
        }
      }
    };
  
    fetchIncidentData();
  }, [incident, incidentId]);

  

  useEffect(() => {
    const interval = setInterval(() => {
      if (acceptedAt) {
        const now = new Date();
        const acceptedTime = new Date(acceptedAt);
        const elapsedSeconds = Math.floor((now.getTime() - acceptedTime.getTime()) / 1000);
        setLapsTime(elapsedSeconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [acceptedAt]);

  useEffect(() => {
    if (lguConnectingAt === null) {
      setConnectingModalOpen(false);
      setConnectingLguName(null);
    }
  }, [lguConnectingAt]);

  // Function to format laps time
  const formatLapsTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} sec`;
  };

  const fetchLguUsers = async () => {
    try {
      const response = await fetch(`${config.PERSONAL_API}/users/role/LGU`);
      if (response.ok) {
        const data = await response.json();
        setLguUsers(data.users || []);
      } else {
        console.error('Failed to fetch LGU users');
      }
    } catch (error) {
      console.error('Error fetching LGU users:', error);
    }
  };

  useEffect(() => {
    fetchLguUsers();
  }, []);

  const handleConnect = async (lguUser: any) => {
    try {
      const id = incident?._id || incidentId;
      if (!id) {
        console.error('No incident ID available');
        return;
      }

      const connectingTime = new Date();
      setLguConnectingAt(connectingTime);
      setConnectingLguName({ firstName: lguUser.firstName, lastName: lguUser.lastName });
      setConnectingModalOpen(true);

      const response = await fetch(`${config.PERSONAL_API}/incidents/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lgu: lguUser._id,
          lguStatus: "connecting",
          lguConnectingAt: connectingTime,
          incidentDetails: {
            coordinates: {
              lat: coordinates.lat,
              lon: coordinates.long
            },
            incident: modalIncident || "Vehicular Collision",
            incidentDescription: modalIncidentDescription || "No description provided"
          }
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("Update response:", responseData);
        setSelectedLgu(lguUser);
        // Don't close the LGU selection modal here
      } else {
        console.error('Failed to update incident with LGU');
        const errorData = await response.json();
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Error updating incident:', error);
    }
  };

  useEffect(() => {
    const checkLguStatus = async () => {
      if (lguConnectingAt) {
        const now = new Date();
        const timeDiff = (now.getTime() - lguConnectingAt.getTime()) / 1000; // Convert to seconds
        
        // First check if the incident has been accepted (status is connected) or declined (status is idle)
        try {
          const id = incident?._id || incidentId;
          if (!id) return;

          const response = await fetch(`${config.PERSONAL_API}/incidents/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const incidentData = await response.json();
            
            // If status is connected, close both modals
            if (incidentData.lguStatus === 'connected') {
              setLguConnectingAt(null);
              setConnectingModalOpen(false);
              setConnectingLguName(null);
              setOpenModal(false); // Close the LGU selection modal
              return;
            }
            
            // If status is idle, close the connecting modal but keep LGU selection modal open
            if (incidentData.lguStatus === 'idle') {
              setLguConnectingAt(null);
              setConnectingModalOpen(false);
              setConnectingLguName(null);
              setSelectedLgu(null);
              return;
            }
          }
        } catch (error) {
          console.error('Error checking incident status:', error);
        }

        // If not connected and time exceeds 15 seconds, revert to idle
        if (timeDiff > 15) {
          const id = incident?._id || incidentId;
          if (!id) return;

          try {
            const response = await fetch(`${config.PERSONAL_API}/incidents/update/${id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                lguStatus: "idle",
                lgu: null
              })
            });

            if (response.ok) {
              console.log("LGU status reverted to idle after timeout");
              setLguConnectingAt(null);
              setConnectingModalOpen(false);
              setConnectingLguName(null);
              setSelectedLgu(null);
            }
          } catch (error) {
            console.error('Error reverting LGU status:', error);
          }
        }
      }
    };

    const interval = setInterval(checkLguStatus, 1000);
    return () => clearInterval(interval);
  }, [lguConnectingAt, incident, incidentId, token]);

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          // Get address from current location
          const formattedAddress = await getAddressFromCoordinates(
            latitude.toString(),
            longitude.toString()
          );
          setCurrentAddress(formattedAddress);
        },
        (error) => {
          console.error('Error getting location:', error);
          setCurrentAddress('Location access denied');
        }
      );
    } else {
      setCurrentAddress('Geolocation not supported');
    }
  }, []);

  const handleLocationClick = () => {
    if (coordinates.lat && coordinates.long && responderCoordinates) {
      const mapUrl = generateMapUrl(
        responderCoordinates.lat,
        responderCoordinates.lon,
        coordinates.lat,
        coordinates.long
      );
      
      // Open map in a new window
      window.open(mapUrl, '_blank', 'width="100%",height="100%"');
    } else {
      console.error('Responder coordinates not available');
    }
  };

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!chatClient || !userData || !incidentType ) {
    return <div>Loading chat...</div>;
  }

  const handleCloseModal = () => setOpenModal(false);
  const handleOpenModal = () => setOpenModal(true);

  const { icon } = getIncidentIcon(incidentType || 'general');

  

  return (
    <div className="min-h-screen bg-[#1B4965]">
    {/* // <div className="h-screen max-h-screen bg-[#1B4965] overflow-hidden"> */}
      <Container maxWidth="xl" sx={{height: "100%"}}>
        <Grid container spacing={1}>
          <Grid size={{xs: 12}} padding={"0.7rem"} 
          // backgroundColor={"red"} 
          height={"20vh"}>
            <Grid container spacing={8}>
              <Grid
                size={{md: 4}}
                display={"flex"}
                flexDirection={"row"}
                alignItems={"center"}
                gap={"1rem"}>

                <img src={icon}
                style={{
                  width: '6.5rem',
                  height: '6.5rem',
                  borderRadius: '100%',
                  border: 'solid white 1px',
                  boxShadow: '0 0 7px 0 white'
                  }} />


                <div className="text-white">
                  <Typography sx={{fontWeight: "bold"}}>
                    ID: {currentChannelId.toUpperCase()}
                  </Typography>
                  <Typography sx={{fontWeight: "bold"}}>
                    {incidentType ? incidentType.toUpperCase() : ""}
                  </Typography>
                  {/* <Typography sx={{fontWeight: "bold"}}>
                    {coordinates ? coordinates.lat + " " + coordinates.long : ""}
                  </Typography> */}
                  <Typography sx={{fontWeight: "bold"}}>
                    {address || "Loading address..."}
                  </Typography>
                  
                </div>
              </Grid>
              <Grid
                size={{md: 4}}
                display={"flex"}
                flexDirection={"row"}
                alignItems={"center"}
                gap={"1rem"}>
                <Avatar src={avatarImg} sx={{width: 105, height: 105}} />
                <div className="text-white">
                {userData && (
                  <div className="text-white">
                    <Typography sx={{ fontWeight: "bold" }} variant="h5">
                      {userData.firstName.toUpperCase()} {userData.lastName.toUpperCase()}
                    </Typography>
                    <Typography sx={{ fontWeight: "bold" }}>
                      {userData.phone}
                    </Typography>
                    <Typography sx={{ fontWeight: "bold" }}>
                      GuardianPHOpcen
                    </Typography>
                    <Typography sx={{ fontWeight: "bold" }}>
                      Angel Rank
                    </Typography>
                    {/* <Typography sx={{ fontWeight: "bold" }}>
                      Current Location: {currentAddress || "Loading location..."}
                    </Typography> */}
                  </div>
                )}
                </div>
              </Grid>
              
              <Grid size={{md: 4}}>
                <div className="flex flex-col gap-4 justify-center">
                  <div className="flex flex-row items-center gap-6">
                    <div className="flex flex-row items-center gap-3 border text-white p-1 rounded-lg">
                      <SystemSecurityUpdateWarningIcon
                        sx={{
                          fontSize: "3rem",
                          border: "solid white 1px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          padding: "4px",
                          transition: "transform 150ms ease",
                          "&:hover": {
                            transform: "scale(1.05)",
                          },
                        }}
                      />
                      <NotificationsActiveIcon
                        sx={{
                          fontSize: "3rem",
                          border: "solid white 1px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          padding: "4px",
                          transition: "transform 150ms ease",
                          "&:hover": {
                            transform: "scale(1.05)",
                          },
                        }}
                        onClick={handleOpenModal}
                      />
                      <MyLocationIcon
                        onClick={handleLocationClick}
                        sx={{
                          fontSize: "3rem",
                          border: "solid white 1px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          padding: "4px",
                          transition: "transform 150ms ease",
                          "&:hover": {
                            transform: "scale(1.05)",
                          },
                        }}
                      />
                      <VideoCallIcon
                        onClick={handleCreateRingCall}
                        sx={{
                          fontSize: "3rem",
                          border: "solid white 1px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          padding: "4px",
                          transition: "transform 150ms ease",
                          "&:hover": {
                            transform: "scale(1.05)",
                          },
                        }}
                      />
                      <AddIcCallIcon
                        sx={{
                          fontSize: "3rem",
                          border: "solid white 1px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          padding: "4px",
                          transition: "transform 150ms ease",
                          "&:hover": {
                            transform: "scale(1.05)",
                          },
                        }}
                      />
                      {/* <Button
    variant="contained"
    onClick={handleLogout}
    sx={{
      backgroundColor: "#ef5350",
      color: "white",
      marginTop: "0.5rem",
      "&:hover": {
        backgroundColor: "#d32f2f",
      },
    }}
  >
    Logout
  </Button> */}
                    </div>
                    <AccountCircleIcon
                      sx={{
                        fontSize: "4rem",
                        color: "white",
                      }}
                    />
                    
                  </div>
                  <div className="flex flex-row items-center gap-6">
                    <Paper
                      sx={{
                        backgroundColor: "lightgreen",
                        flex: "1 1 auto",
                        width: "fit-content",
                        display: "flex",
                        justifyContent: "center",
                        paddingY: "4px",
                      }}>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={isVerified}
                            onChange={handleVerificationToggle}
                            disabled={ isUpdating}
                          />
                        }
                        label={isUpdating ? "Updating..." : "Incident Verified"}
                      />
                    </Paper>
                    <div style={{width: "4rem"}}></div>
                  </div>
                </div>
              </Grid>
            </Grid>
          </Grid>
          <Grid
            size={{xs: 12}}
            // backgroundColor={"green"}
            height={"70vh"}
            sx={{border: "12px solid skyblue", borderRadius: "16px"}}>
            <div
              style={{
                height: "100%",
                display: "flex",
                gap: "8px",
                backgroundColor: "skyblue",
              }}>
              <div style={{flex: "3", minWidth: 0}}>
                <Chat client={chatClient} theme="messaging light">
                  <Channel channel={chatClient.channel("messaging", currentChannelId)}>
                    <Window>
                      <MessageList
                        closeReactionSelectorOnClick
                        hideDeletedMessages
                        messageActions={["edit", "delete", "react", "reply"]}
                      />
                      <MessageInput />
                    </Window>
                  </Channel>
                </Chat>
              </div>
              <div
                style={{
                  flex: "1",
                  backgroundColor: "white",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}>
                <Typography
                  variant="h6"
                  sx={{marginBottom: 2, textAlign: "center"}}>
                  Message Templates
                </Typography>
                <Divider />
                <div
                  className="flex flex-col gap-3"
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    marginBottom: "16px",
                    marginTop: "16px",
                  }}>
                  {msgTemplates.map((template, index) => (
                    <Paper
                      key={index}
                      elevation={1}
                      onClick={() => handleTemplateSelect(template)}
                      sx={{
                        padding: "12px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        backgroundColor:
                          selectedTemplate === template ? "#e3f2fd" : "white",
                        "&:hover": {
                          backgroundColor: "#f5f5f5",
                          transform: "translateX(4px)",
                        },
                      }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontSize: "0.9rem",
                          color: "#2c3e50",
                        }}>
                        {template}
                      </Typography>
                    </Paper>
                  ))}
                </div>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={!selectedTemplate}
                  onClick={handleSendTemplate}
                  sx={{
                    backgroundColor: "#1B4965",
                    "&:hover": {
                      backgroundColor: "#163d54",
                    },
                  }}>
                  {selectedTemplate ? "Send Template" : "Select a Template"}
                </Button>
              </div>
            </div>
          </Grid>
          
          <Grid size={{xs: 12}}
          >
            {videoClient && (
              <div style={{ display: 'contents' }}>
                <StreamVideo client={videoClient}>
                  <VideoCallHandler />
                </StreamVideo>
              </div>
            )}
          </Grid>

        <Grid container size={{xs: 12}}
        marginBottom={"0px"}
        paddingLeft={"20px"}
        height={"6vh"}
        sx={{ 
          // backgroundColor: 'red',
        }}>

        <Grid size={{md: 6}}
        sx={{
          display: 'flex',
          // backgroundColor: 'green',
          }}>
            <Grid size={{md:6}}
            sx={{
              display: 'flex',
              gap: '20px'
              }}>
                
              <Typography variant="h6" sx={{ color: 'white' }}>
                RECEIVED:
              </Typography>
              <Typography variant="h6" sx={{ color: 'white' }}>
                {acceptedAt ? new Date(acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : "Not Accepted"}
              </Typography>
            </Grid>

            <Grid size={{md:6}}sx={{
              display: 'flex',
              gap: '20px'
              }}>
              <Typography variant="h6" sx={{ color: 'white' }}>
                ELAPSED TIME:
              </Typography>
              <Typography variant="h6" sx={{ color: 'white' }}>
                {formatLapsTime(lapsTime)}
              </Typography>
              
            </Grid>
          
          
        </Grid>

        <Grid size={{md: 6}}
        
        alignItems={"center"}
        sx={{ 
          // backgroundColor: 'yellow',
          display: 'flex',
          justifyContent: 'flex-end',
          paddingRight: '20px'
          }}>
          <Button
            onClick={handleCloseIncident}
            variant="contained"
            disabled={isResolved}
            sx={{
            backgroundColor: "#ef5350",
            height: "2.5rem",
            paddingLeft: "3rem",
            paddingRight: "3rem",
            borderRadius: "8px",
            "&:hover": {
            backgroundColor: "darkred",


            },}}
            >
          <Typography 
          color="white"
          sx={{ 
            fontSize: "18px"
          }}
        >
          Close Incident
        </Typography>
          </Button>
        </Grid>
        </Grid>
        </Grid>
        {/* {videoClient && (
          <div style={{ 
            position: 'fixed', 
            bottom: 10, 
            right: 10, 
            backgroundColor: 'green', 
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 1000 
          }}>
            Video Client Connected
          </div>
        )} */}

        
        

      </Container>

     


      
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="incident-modal"
        aria-describedby="incident-description"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
      <Paper 
        elevation={3}
        sx={{
        boxShadow: 24,
        p: 0,
        borderRadius: 2,
        width: '70%',
        background: '#1e4976',
      
      }}>
      
      <Box
  sx={{
    background: '#ef5350',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between', 
    padding: '12px',
    marginTop: '20px' 
  }}>
  <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', margin: '0 auto' }}>
    CONNECT TO OPERATION CENTER
  </Typography>
  
  <IconButton 
    onClick={handleCloseModal}
    sx={{ 
      color: 'white',
      padding: '2px',
      border: '3px solid white', 
      borderRadius: '50%',
      '& .MuiSvgIcon-root': { 
        fontSize: '20px', 
      }
    }}
    aria-label="close"
    size="small"
  >
    <CloseIcon />
  </IconButton>
  
</Box>
      <Box
        sx={{
          background: '#1e4976',
          p: '6px 0 6px 0',
          display: 'flex',
          height: '100%',
          borderRadius: '0 0 8px 8px',
        }}
      >
        <Box 
          sx={{ 
          width: '50%',
          borderRight: '1px solid white',
          padding: 4,
          boxSizing: 'border-box'
        }}
        >
        <div style={{
        display: 'flex',
        gap: '10px',
        }}>
        <div>
        <Avatar 
          src={Icon}
          sx={{ width: 96, height: 96 }}
          alt={Icon}
        />
        </div>
        <div style={{
        // backgroundColor: 'green',
        padding: '4px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'start',
        flexDirection: 'column',
        }}>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
          MEDICAL CALL
        </Typography>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          A.S Fortuna St, Mandaue City
        </Typography>
        </div>
        </div>
        <div style={{
        // backgroundColor: 'green',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
        }}>
        <Typography variant="h5" sx={{ color: '#ef5350', fontWeight: 'bold' }}>
          NEED AMBULANCE
        </Typography>
        </div>
        <div>
        <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
          Type
        </Typography>
        <TextField
            select
            fullWidth
            value={modalIncident}
            onChange={(e) => {
              console.log("Selected incident type:", e.target.value);
              setModalIncident(e.target.value);
            }}
            variant="outlined"
            sx={{ 
              mb: 2,
              backgroundColor: 'white',
              borderRadius: 2,
            }}
            SelectProps={{
              native: true,
            }}
          >
            <option value="Vehicular Collision">Vehicular Collision</option>
            <option value="Medical Emergency">Medical Emergency</option>
            <option value="Fire">Fire</option>
            <option value="Police">Police</option>
          </TextField>
          <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
            Message
          </Typography>
          <TextField
            multiline
            rows={4}
            fullWidth
            value={modalIncidentDescription}
            onChange={(e) => setModalIncidentDescription(e.target.value)}
            variant="outlined"
            sx={{ 
              backgroundColor: 'white',
              borderRadius: 2,
            }}
          />
        </div>

        
        </Box>
        <Box 
  sx={{ 
    flex: 1,
    borderLeft: '1px solid white',
    p: 4,
  }}
>
  <div style={{background: '#f5f5f5', padding: '20px', borderRadius: '8px'}}>
    <h2>Available Operation Center</h2>
    
    <div style={{display: 'flex', marginBottom: '15px'}}>
      <input type="text" placeholder="Search" style={{flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}} />
      <button style={{marginLeft: '10px', padding: '8px 15px', background: '#1e5a71', color: 'white', border: 'none', borderRadius: '4px'}}>Search</button>
    </div>
    
    {lguUsers.map((user) => (
      <div key={user._id} style={{display: 'flex', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee', marginBottom: '5px'}}>
        <div style={{flex: 1}}>
          <div>{user.firstName} {user.lastName}</div>
        </div>
        <div style={{marginRight: '15px', textAlign: 'right'}}>
          <div>13 Min</div>
          <div>2.3 KM</div>
        </div>
        <button 
          onClick={() => handleConnect(user)}
          style={{padding: '8px 15px', background: '#1e5a71', color: 'white', border: 'none', borderRadius: '4px'}}
        >
          Connect
        </button>
      </div>
    ))}
    
    {lguUsers.length === 0 && (
      <div style={{textAlign: 'center', padding: '20px', color: '#666'}}>
        No LGU users available
      </div>
    )}
    
    <div style={{textAlign: 'center', marginTop: '10px'}}>
      <button style={{background: 'none', border: 'none', color: '#1e5a71'}}>More</button>
    </div>
  </div>
</Box>
      </Box>
      </Paper>
      

      




      </Modal>
      
      <Modal
        open={connectingModalOpen}
        onClose={() => {}} 
        aria-labelledby="connecting-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          bgcolor: 'transparent',  
          backdropFilter: 'none',  
          boxShadow: 'none',       
          '& .MuiBackdrop-root': {
            backgroundColor: 'transparent',
            opacity: 0            
          }
        }}
      >
        <div style={{
          backgroundColor: "rgba(220, 53, 69, 0.4)",
          width: '100%',
          height: 'fit-content',
          borderTop: '1px solid white',
          borderBottom: '1px solid white',
        }}
        >
        <Paper 
          elevation={3} 
          sx={{ 
            width: '550px',
            margin: '0 auto',
            overflow: 'hidden',
            padding: 0
          }}
        >
          <div style={{ 
            backgroundColor: "#1e4976", 
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                CONNECTING...
              </Typography>
            </div>
          </div>
          <div style={{ 
            backgroundColor: "#ffffff", 
            padding: '14px 40px 14px 40px', 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center'
          }}>
              {connectingLguName && (
                <Typography variant="h6" sx={{ color: 'black', fontWeight: 'bold', mb: 3 }}>
                  {connectingLguName.firstName} {connectingLguName.lastName} Command Center
                </Typography>
              )}
          </div>
          <div style={{ 
            backgroundColor: "#1e4976", 
            padding: '24px', 
            display: 'flex', 
            justifyContent: 'center',
            gap: '16px'
          }}>
          </div>
        </Paper>

        </div>
        
      </Modal>
  
    </div>
  );
};

const VideoCallHandler = () => {
  const calls = useCalls();
  const navigate = useNavigate();
  
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

// const CallStateHandler = ({ 
//   call, 
//   onCallAccepted 
// }: { 
//   call: Call; 
//   onCallAccepted: () => void; 
// }) => {
//   const { useCallCallingState } = useCallStateHooks();
//   const callingState = useCallCallingState();
  
//   console.log(`Call ${call.cid} state:`, callingState);
  
//   useEffect(() => {
//     console.log(`Call state changed to: ${callingState}`);
    
//     if (callingState === CallingState.JOINED) {
//       console.log("Call joined, triggering accepted callback");
//       onCallAccepted();
//     }
//   }, [callingState, onCallAccepted]);
  
//   if (callingState === CallingState.RINGING) {
//     console.log("Rendering RingingCall UI");
//     return (
//       <div style={{ 
//         position: 'fixed', 
//         top: 0, 
//         left: 0, 
//         right: 0, 
//         bottom: 0, 
//         zIndex: 9999,
//         backgroundColor: 'rgba(0,0,0,0.7)',
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center'
//       }}>
//         <RingingCall includeSelf={true} totalMembersToShow={4} />
//       </div>
//     );
//   }
  
//   return null;
// };

export default MainScreen;
