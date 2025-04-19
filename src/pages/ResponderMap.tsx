import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer, TrafficLayer, OverlayView } from '@react-google-maps/api';
import { Box, Typography, Alert, IconButton, Drawer, Button } from '@mui/material';
import config from "../config";
import medicalIcon from '../assets/images/Medical.png';
import generalIcon from '../assets/images/General.png';
import fireIcon from '../assets/images/Fire.png';
import crimeIcon from '../assets/images/Police.png';
import ambulanceIcon from '../assets/images/ambulance.png';
import policecarIcon from '../assets/images/policecar.png';
import firetruckIcon from '../assets/images/firetruck.png';
import Grid from "@mui/material/Grid2";
import avatarImg from "../assets/images/avatar.jpg";
import { getAddressFromCoordinates } from '../utils/geocoding';
import { TextField, InputAdornment} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
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

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const ResponderMap = () => {
  const navigate = useNavigate();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [responderCoords, setResponderCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [incidentCoords, setIncidentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [incidentType, setIncidentType] = useState<string>('');
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [infoWindowPosition, setInfoWindowPosition] = useState<google.maps.LatLng | null>(null);
  const [routeInfo, setRouteInfo] = useState<{duration: string, distance: string} | null>(null);
  const [coordinates, setCoordinates] = useState({ lat: '', long: '' });
  const [address, setAddress] = useState<string>('');
  const [incidentId, setIncidentId] = useState<string>('');
  const [currentChannelId, setCurrentChannelId] = useState<string>('');
  const [secondChannelId, setSecondChannelId] = useState<string>('');
  const [userData, setUserData] = useState<{ firstName: string; lastName: string; phone: string } | null>(null);
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);
  const [lapsTime, setLapsTime] = useState(0);
  const [incident, setIncident] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [responderUsers, setResponderUsers] = useState<any[]>([]);
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isSecondChatExpanded, setIsSecondChatExpanded] = useState(false);
  const userStr = localStorage.getItem("user");
  const userStr2 = userStr ? JSON.parse(userStr) : null;
  const userId = userStr2?.id;
  const token = localStorage.getItem("token");
  const [lguStatus, setLguStatus] = useState<string>('connected');
  

  const getIncidentIcon = useCallback((type: string): google.maps.Icon | undefined => {
    if (!isGoogleLoaded) return undefined;

    const iconUrl = (() => {
      switch (type.toLowerCase()) {
        case 'medical':
          return medicalIcon;
        case 'fire':
          return fireIcon;
        case 'police':
          return crimeIcon;
        case 'general':
        default:
          return generalIcon;
      }
    })();

    return {
      url: iconUrl,
      scaledSize: new google.maps.Size(40, 40),
      anchor: new google.maps.Point(20, 40)
    };
  }, [isGoogleLoaded]);

  const fetchDirections = useCallback(async (origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) => {
    if (!isGoogleLoaded) {
      console.log('Google Maps not loaded yet');
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    
    try {
      const result = await directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        },
        provideRouteAlternatives: true
      });
      
      setDirections(result);
      
      if (result.routes[0]?.legs[0]) {
        const leg = result.routes[0].legs[0];
        setRouteInfo({
          duration: leg.duration_in_traffic?.text || leg.duration?.text || '',
          distance: leg.distance?.text || ''
        });
        
        const path = result.routes[0].overview_path;
        if (path && path.length > 0) {
          const midIndex = Math.floor(path.length / 2);
          setInfoWindowPosition(path[midIndex]);
        }
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
      setError('Failed to load route directions');
    }
  }, [isGoogleLoaded]);

  const getIncidentIconUrl = useCallback((type: string): string => {
    switch (type?.toUpperCase()) {
      case 'MEDICAL':
        return medicalIcon;
      case 'FIRE':
        return fireIcon;
      case 'POLICE':
        return crimeIcon;
      case 'GENERAL':
      default:
        return generalIcon;
    }
  }, []);

  useEffect(() => {
    const fetchIncidentData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const incidentId = urlParams.get('incidentId');
      
      if (!incidentId) {
        console.error('No incident ID found in URL');
        setError('No incident ID found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${config.PERSONAL_API}/incidents/${incidentId}`);
        if (response.ok) {
          const data = await response.json();
          setIncidentType(data.incidentType);
          setIncident(data.incidentDetails.incident || "Not specified");
          setIncidentId(data._id);
          setCurrentChannelId(data.channelId || `${data.incidentType.toLowerCase()}-${data._id.substring(4,9)}`);
          setSecondChannelId(data.channelId || `${data.incidentType.toLowerCase()}-${data._id.substring(5,10)}`);
          setAcceptedAt(data.acceptedAt);
          
          if (data.incidentDetails?.coordinates) {
            setIncidentCoords({
              lat: Number(data.incidentDetails.coordinates.lat),
              lng: Number(data.incidentDetails.coordinates.lon)
            });
            setCoordinates({
              lat: data.incidentDetails.coordinates.lat,
              long: data.incidentDetails.coordinates.lon
            });
            
            const formattedAddress = await getAddressFromCoordinates(
              data.incidentDetails.coordinates.lat.toString(),
              data.incidentDetails.coordinates.lon.toString()
            );
            setAddress(formattedAddress);
          }

          if (data.responderCoordinates) {
            setResponderCoords({
              lat: Number(data.responderCoordinates.lat),
              lng: Number(data.responderCoordinates.lon)
            });
          }

          let userId;
          if (typeof data.user === 'string') {
            userId = data.user;
          } else if (data.user && data.user._id) {
            userId = data.user._id;
          } else if (data.user && typeof data.user.toString === 'function') {
            userId = data.user.toString();
          }

          if (userId) {
            const userResponse = await fetch(`${config.PERSONAL_API}/users/${userId}`);
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setUserData({
                firstName: userData.firstName,
                lastName: userData.lastName,
                phone: userData.phone
              });
            }
          }
        } else {
          console.error('Failed to fetch incident data');
          setError('Failed to fetch incident data');
        }
      } catch (error) {
        console.error('Error fetching incident data:', error);
        setError('Error fetching incident data');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidentData();
  }, []);

  // Function to dispatch a responder
  const handleDispatchResponder = async (responderId: string) => {
    try {
      // Get incident ID from URL
      const urlParams = new URLSearchParams(window.location.search);
      const incidentId = urlParams.get('incidentId');
      
      if (!incidentId) {
        console.error('No incident ID found for dispatching responder');
        return;
      }
      
      // Update the incident with the responder ID
      const response = await fetch(`${config.PERSONAL_API}/incidents/update/${incidentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          responder: responderId
        })
      });
      
      if (!response.ok) {
        console.error('Failed to dispatch responder');
        return;
      }
      
      console.log(`Successfully dispatched responder ${responderId} to incident ${incidentId}`);
      
      // After successful dispatch, send the initial message to the second channel
      await sendInitialMessage(responderId);
    } catch (error) {
      console.error('Error dispatching responder:', error);
    }
  };
  
  // Function to send initial message
  const sendInitialMessage = async (responderId: string) => {
    if (!chatClient || !userId || !token || !secondChannelId) {
      console.error('Missing required data for sending initial message');
      return;
    }
    
    try {
      // Get incident ID from URL
      const urlParams = new URLSearchParams(window.location.search);
      const incidentId = urlParams.get('incidentId');
      
      if (!incidentId) {
        console.error('No incident ID found for sending initial message');
        return;
      }
      
      // Fetch incident data directly from API
      const response = await fetch(`${config.PERSONAL_API}/incidents/${incidentId}`);
      if (!response.ok) {
        console.error('Failed to fetch incident data for initial message');
        return;
      }
      
      const incidentData = await response.json();
      
      // Get incident details directly from the response
      const incidentDetails = {
        incident: incidentData.incidentDetails?.incident || "Not specified",
        incidentDescription: incidentData.incidentDetails?.incidentDescription || "No description provided"
      };
      
      const channel = chatClient.channel("messaging", secondChannelId);
      
      // Create the channel if it doesn't exist
      await channel.create();
      
      // Send the initial message
      await channel.sendMessage({
        text: `Incident: ${incidentDetails.incident}\nDescription: ${incidentDetails.incidentDescription}`,
        user_id: userId
      });
      
      console.log('Initial message sent to second channel after dispatch');
    } catch (error) {
      console.error('Error sending initial message to second channel:', error);
    }
  };

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

  // Function to format laps time
  const formatLapsTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} sec`;
  };

  useEffect(() => {
    const fetchResponderUsers = async () => {
      try {
        const response = await fetch(`${config.PERSONAL_API}/users/role/Responder`);
        if (response.ok) {
          const data = await response.json();
          setResponderUsers(data.users || []);
        } else {
          console.error('Failed to fetch responder users');
        }
      } catch (error) {
        console.error('Error fetching responder users:', error);
      }
    };

    fetchResponderUsers();
  }, []);

  useEffect(() => {
    if (responderCoords && incidentCoords && isGoogleLoaded) {
      fetchDirections(responderCoords, incidentCoords);
    }
  }, [responderCoords, incidentCoords, fetchDirections, isGoogleLoaded]);

  const onLoad = (map: google.maps.Map) => {
    setMap(map);
    setIsGoogleLoaded(true);
  };

  const onUnmount = () => {
    setMap(null);
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

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
  }, [userId, token]);

  // Replace the useEffect that automatically sends the initial message
  useEffect(() => {
    // Don't auto-send the initial message anymore
    // We'll send it only after dispatching a responder
  }, [chatClient, userId, token, secondChannelId]);

  if (loading && !error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#1B4965',
        color: 'white'
      }}>
        <Typography variant="h5">Loading map...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#1B4965'
      }}>
        <Alert severity="error" sx={{ maxWidth: '80%' }}>{error}</Alert>
      </Box>
    );
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Google Maps API key is missing</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: '100vh' }}>
      <Drawer
        anchor="left"
        open={isDrawerOpen}
        onClose={toggleDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: '350px',
            backgroundColor: "rgba(27, 73, 101, 0.8)",
            color: 'white',
            top: '115px',
            left: '10px',
            height: 'calc(100% - 90px)',
            
          }
        }}
        variant="persistent"
      >
        <Box sx={{ width: '100%' }}>
          <Box sx={{ mb: 1 }}>
            <Box sx={{
              p: 3,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold'}}>
                DISPATCH
              </Typography>
            </Box>
            
            <Box sx={{
              backgroundColor: '#4285F4',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'center',
              py: 1,
              px: 2,
            }}>
              <Box sx={{
                width: '25%',
                // backgroundColor: 'white'
              }}>
              <Box 
            component="img" 
            src={getIncidentIconUrl(incidentType)}
            alt="Emergency Icon"
            sx={{ width: 70, height: 70}}
          />
              </Box>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                // backgroundColor: 'red'
              }}>
            <Typography variant="subtitle1" sx={{ mb: 0.5, textAlign: 'center', }}>
              {incidentType.toUpperCase()}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', }}>
            {incident}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', }}>
              {address || "Loading address..."}
            </Typography>

              </Box>
            
            </Box>
            
          </Box>
          

        <Box sx={{ mb: 4, p: 1 }}>
        
        {/* Search Bar Addition */}
        <Box sx={{ 
          display: 'flex', 
          mb: 1, 
          px: 1,
          gap: 1
        }}>
          <TextField
            size="small"
            placeholder="Search"
            variant="outlined"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              sx: { 
                backgroundColor: 'white',
                borderRadius: 1
              }
            }}
          />
          <Button 
            variant="contained" 
            sx={{ 
              backgroundColor: '#4285F4',
              '&:hover': { backgroundColor: '#4285F4' }
            }}
          >
            Search
          </Button>
        </Box>
        

        {/* AMBULANCE SECTION */}
        <Typography variant="h6" sx={{ color: 'black' }}>AMBULANCE</Typography>
        {responderUsers
          .filter(user => user.type?.toLowerCase() === 'ambulance' || user.firstName?.toLowerCase().includes('ambu'))
          .map((user, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 0.7,
                backgroundColor: 'rgba(255,255,255)',
                width: '100%'
              }}
            >
              <Box sx={{color: 'black', display: 'flex', justifyContent: 'space-between', width: '100%', px: 1}}>
                <Box 
                  component="img" 
                  src={ambulanceIcon}
                  alt="Ambulance" 
                  sx={{ width: 50, height: 40}} 
                />
                <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', textTransform: 'uppercase'}}>
                  <Typography variant="subtitle2">{user.firstName} {user.lastName}</Typography>
                </Box>
                <Box sx={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                  <Typography variant="caption">13 Min</Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>2.3km</Typography>
                </Box>
              </Box>
              <Button
                sx={{
                  backgroundColor: '#1976D2',
                  color: 'white',
                  '&:hover': { backgroundColor: '#1565C0' }
                }}
                onClick={() => handleDispatchResponder(user._id)}
              >
                <Typography variant="caption">Dispatch</Typography>
              </Button>
            </Box>
          ))}
        

        {/* FIRETRUCK SECTION */}
        <Typography variant="h6" sx={{color: 'black' }}>FIRETRUCK</Typography>
        <Box sx={{  }}>
          
          {responderUsers
            .filter(user => user.type?.toLowerCase() === 'firetruck')
            .map((user, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 0.7,
                  backgroundColor: 'rgba(255,255,255)',
                  width: '100%'
                }}
              >
                <Box sx={{color: 'black', display: 'flex', justifyContent: 'space-between', width: '100%', px: 1}}>
                  <Box 
                    component="img" 
                    src={firetruckIcon}
                    alt="Firetruck" 
                    sx={{ width: 50, height: 40}} 
                  />
                  <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', textTransform: 'uppercase'}}>
                    <Typography variant="subtitle2">{user.firstName} {user.lastName}</Typography>
                  </Box>
                  <Box sx={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                    <Typography variant="caption">13 Min</Typography>
                    <Typography variant="caption" sx={{ display: 'block' }}>2.3km</Typography>
                  </Box>
                </Box>
                <Button
                  sx={{
                    backgroundColor: '#1976D2',
                    color: 'white',
                    '&:hover': { backgroundColor: '#1565C0' }
                  }}
                  onClick={() => handleDispatchResponder(user._id)}
                >
                  <Typography variant="caption">Dispatch</Typography>
                </Button>
              </Box>
            ))}
        </Box>

<Typography variant="h6" sx={{  color: 'black' }}>POLICE</Typography>
        {/* POLICE SECTION */}
        <Box sx={{ mb: 1 }}>
          
          {responderUsers
            .filter(user => user.type?.toLowerCase() === 'police')
            .map((user, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                  p: 0.7,
                  backgroundColor: 'rgba(255,255,255)',
                }}
              >
                <Box sx={{color: 'black', display: 'flex', justifyContent: 'space-between', width: '100%', px: 1}}>
                  <Box 
                    component="img" 
                    src={policecarIcon}
                    alt="Police" 
                    sx={{ width: 50, height: 40}} 
                  />
                  <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', textTransform: 'uppercase'}}>
                    <Typography variant="subtitle2">{user.firstName} {user.lastName}</Typography>
                  </Box>
                  <Box sx={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                    <Typography variant="caption">13 Min</Typography>
                    <Typography variant="caption" sx={{ display: 'block' }}>2.3km</Typography>
                  </Box>
                </Box>
                <Button
                  sx={{
                    backgroundColor: '#1976D2',
                    color: 'white',
                    '&:hover': { backgroundColor: '#1565C0' }
                  }}
                  onClick={() => handleDispatchResponder(user._id)}
                >
                  <Typography variant="caption">Dispatch</Typography>
                </Button>
              </Box>
            ))}
        </Box>
        </Box>
        </Box>
      </Drawer>

      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={responderCoords || { lat: 10.3157, lng: 123.8854 }}
          zoom={15}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            zoomControl: true,
            streetViewControl: true,
            mapTypeControl: true,
            fullscreenControl: true,
          }}
        >
          <TrafficLayer />
          
          {responderCoords && !directions && (
            <Marker
              position={responderCoords}
              icon={{
                url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
              }}
              title="Responder Location"
            />
          )}
          
          {incidentCoords && !directions && (
            <Marker
              position={incidentCoords}
              icon={getIncidentIcon(incidentType)}
              title="Incident Location"
            />
          )}
          
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: false,
                polylineOptions: {
                  strokeColor: '#1976D2',
                  strokeWeight: 5,
                  strokeOpacity: 0.8
                }
              }}
            />
          )}
          
          {infoWindowPosition && routeInfo && (
            <OverlayView
              position={infoWindowPosition}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              getPixelPositionOffset={(width, height) => ({
                x: -(width / 2),
                y: -height 
              })}
            >
              <div style={{
                backgroundColor: 'white',
                padding: '8px 12px',
                borderRadius: '4px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                textAlign: 'center',
                minWidth: '100px',
                transform: 'translateY(-50%)'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976D2', fontSize: '1rem', margin: 0 }}>
                  {routeInfo.duration}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem', margin: 0 }}>
                  {routeInfo.distance}
                </Typography>
              </div>
            </OverlayView>
          )}
        </GoogleMap>
      </LoadScript>
      <Grid container spacing={1}>
        <Grid size={{xs: 12}}
        sx = {{
          position: "absolute",
          top: "0",
          padding: "0.7rem",
          display: "flex",
          gap: "1rem"
        }}>
          <Grid size={{md: 9}}
          sx = {{
          padding: "2",
          borderRadius: '10px'
        }}>
          <Box sx={{ 
        backgroundColor: "rgba(27, 73, 101, 0.8)",
        borderRadius: 2,
        color: 'white',
        padding: 0.7,
        display: 'flex',
        alignItems: 'center',
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
      }}>
  <Box sx={{ 
  display: 'flex', 
  flexDirection: 'row',
  alignItems: 'center', 
  justifyContent: 'center',
  width: '7%',
}}>
  <button 
    onClick={toggleDrawer}
    aria-label="Menu"
    style={{
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      height: '16px',
      justifyContent: 'space-between',
      padding: 0,
      marginLeft: '8px',
    }}
  >
    <span style={{ display: 'block', height: '2px', width: '20px', backgroundColor: 'white', borderRadius: '1px' }} />
    <span style={{ display: 'block', height: '2px', width: '20px', backgroundColor: 'white', borderRadius: '1px' }} />
    <span style={{ display: 'block', height: '2px', width: '20px', backgroundColor: 'white', borderRadius: '1px' }} />
  </button>
</Box>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'row',
          alignItems: 'center', 
          justifyContent: 'start',
          marginRight: 2,
          width: '31%',
          borderRight: '1px solid rgba(255,255,255,0.3)',
        }}>
          <Box 
            component="img" 
            src={getIncidentIconUrl(incidentType)}
            alt="Emergency Icon"
            sx={{ width: 70, height: 70}}
          />
          <Box sx ={{
            display: 'flex',
            flexDirection: 'column',
            marginLeft: '1rem'
          }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
            ID: {incidentType ? `${incidentType}-${incidentId?.substring(5,9)}` : ""}
          </Typography>
          <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
            {incidentType ? `${incidentType.toUpperCase()} CALL` : ""}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
            {address || "Loading address..."}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
            Coordinates: {coordinates ? coordinates.lat + " " + coordinates.long : ""}
          </Typography>
          </Box>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'row',
          alignItems: 'center', 
          justifyContent: 'start',
          marginRight: 2,
          width: '31%',
          borderRight: '1px solid rgba(255,255,255,0.3)',
        }}>
          <Box 
            component="img" 
            src={avatarImg}
            alt="Emergency Icon"
            sx={{ width: 70, height: 70, borderRadius: '50%'}}
          />
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            marginLeft: '1rem'
          }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {userData ? `${userData.firstName} ${userData.lastName}` : 'Loading...'}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
            {userData ? userData.phone : 'Loading...'}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
            GuardianPH Opcen
          </Typography>
          </Box>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'row',
          alignItems: 'center', 
          justifyContent: 'start',
          marginRight: 2,
          width: '31%',
        }}>
          <Box sx ={{
            display: 'flex',
            flexDirection: 'column',
            marginLeft: '1rem'
          }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            RECEIVED AT: {acceptedAt ? new Date(acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : "Not Accepted"}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
            {incident}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
            LAPS TIME: {formatLapsTime(lapsTime)}
          </Typography>
          </Box>
        </Box>
        
        {/* <IconButton 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            right: 0, 
            color: 'white', 
            backgroundColor: 'rgba(255,255,255,0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.2)'
            },
            width: 30,
            height: 30,
            padding: 0
          }}
        >
          <Box component="span" sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>×</Box>
        </IconButton> */}
      </Box>
      </Grid>
      <Grid size={{md: 1.5}}
      sx ={{
        // backgroundColor: 'red',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        
        backgroundColor: "rgba(27, 73, 101, 0.8)",
        padding: "2",
        borderRadius: '10px'
        
      }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white'}}>
          2
        </Typography>
        <Box 
            component="img" 
            src={ambulanceIcon}
            alt="Ambulance" 
            sx={{ width: 80, height: 70}} 
          />
      </Grid>
      <Grid size={{md: 1.5}}
      sx ={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: "rgba(27, 73, 101, 0.8)",
        padding: "2",
        borderRadius: '10px'
      }}>
        <Box 
            component="img" 
            src={avatarImg}
            alt="Emergency Icon"
            sx={{ width: 70, height: 70, borderRadius: '50%'}}
          />
      </Grid>
      
      
        </Grid>
        </Grid>
      
      {/* First Chat Widget */}
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
            overflow: 'hidden',
            zIndex: 1000
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
              Channel ID: {incidentType ? `${incidentType}-${incidentId?.substring(5,9)}` : ""}
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
      
      {/* Second Chat Widget */}
      {chatClient && secondChannelId && lguStatus === 'connected' && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            right: 380, // Position it to the left of the first chat widget
            width: '350px',
            backgroundColor: 'white',
            borderRadius: '10px 10px 0 0',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
            transition: 'height 0.3s ease',
            height: isSecondChatExpanded ? '500px' : '50px',
            overflow: 'hidden',
            zIndex: 1000
          }}
        >
          {/* Chat Header */}
          <Box
            onClick={() => setIsSecondChatExpanded(!isSecondChatExpanded)}
            sx={{
              bgcolor: '#e53935', // Different color for the second chat
              color: 'white',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <Typography sx={{ fontWeight: 'bold', textTransform: "uppercase" }}>
              Channel ID: {incidentType ? `${incidentType}-${incidentId?.substring(5,10)}` : ""}
            </Typography>
            {isSecondChatExpanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />}
          </Box>

          {/* Chat Content */}
          <Box
            sx={{
              height: 'calc(100% - 40px)',
              display: isSecondChatExpanded ? 'block' : 'none'
            }}
          >
            <Chat client={chatClient} theme="messaging light">
              <Channel channel={chatClient.channel("messaging", secondChannelId)}>
                <Window>
                  <MessageList />
                  <MessageInput />
                </Window>
              </Channel>
            </Chat>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ResponderMap; 