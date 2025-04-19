import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer, TrafficLayer, OverlayView } from '@react-google-maps/api';
import { Box, Typography, IconButton, Alert } from '@mui/material';
import Grid from "@mui/material/Grid2";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUp from '@mui/icons-material/KeyboardArrowUp';
import config from "../config";
import medicalIcon from '../assets/images/Medical.png';
import generalIcon from '../assets/images/General.png';
import fireIcon from '../assets/images/Fire.png';
import crimeIcon from '../assets/images/Police.png';
import avatarImg from "../assets/images/avatar.jpg";
import { getAddressFromCoordinates } from '../utils/geocoding';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  Window,
} from "stream-chat-react";

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const MapView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [responderCoords, setResponderCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [incidentCoords, setIncidentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [coordinates, setCoordinates] = useState({ lat: '', long: '' });
  const [address, setAddress] = useState<string>('');
  const [incidentId, setIncidentId] = useState<string>('');
  const [incidentType, setIncidentType] = useState<string>('');
  const [userData, setUserData] = useState<{ firstName: string; lastName: string; phone: string } | null>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [infoWindowPosition, setInfoWindowPosition] = useState<google.maps.LatLng | null>(null);
  const [routeInfo, setRouteInfo] = useState<{duration: string, distance: string} | null>(null);
  const [isResolved, setIsResolved] = useState(false);
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [responderData, setResponderData] = useState({
    firstName: '',
    lastName: ''
  });
  const [currentChannelId, setCurrentChannelId] = useState<string>('');
  const userStr = localStorage.getItem("user");
  const userStr2 = userStr ? JSON.parse(userStr) : null;
  const userId = userStr2?.id;
  const token = localStorage.getItem("token");
  const [lguStatus, setLguStatus] = useState<string>('connected');
  const [responderAddress, setResponderAddress] = useState<string>('');

  const getIncidentIcon = useCallback((type: string): google.maps.Icon | undefined => {
    if (!isGoogleLoaded) return undefined;

    const iconUrl = (() => {
      switch (type) {
        case 'MEDICAL':
        case 'Medical':
          return medicalIcon;
        case 'FIRE':
        case 'Fire':
          return fireIcon;
        case 'POLICE':
        case 'Police':
          return crimeIcon;
        case 'GENERAL':
        case 'General':
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

  const fetchDirections = useCallback(async (origin: { lat: number; lng: number } | null, destination: { lat: number; lng: number }) => {
    if (!isGoogleLoaded || !origin) {
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
      setDirections(null);
      setRouteInfo(null);
      setInfoWindowPosition(null);
    }
  }, [isGoogleLoaded]);

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
          setIncidentId(data._id);
          setIsResolved(data.isResolved);
          setAcceptedAt(data.acceptedAt);
          setIsVerified(data.isVerified);
          setLguStatus(data.lguStatus);
          setCurrentChannelId(data.channelId || `${data.incidentType.toLowerCase()}-${data._id.substring(4,9)}`);
          
          if (data.incidentDetails?.coordinates) {
            const incidentCoords = {
              lat: Number(data.incidentDetails.coordinates.lat),
              lng: Number(data.incidentDetails.coordinates.lon)
            };
            setIncidentCoords(incidentCoords);
            setCoordinates({
              lat: data.incidentDetails.coordinates.lat,
              long: data.incidentDetails.coordinates.lon
            });
            
            const formattedAddress = await getAddressFromCoordinates(
              incidentCoords.lat.toString(),
              incidentCoords.lng.toString()
            );
            setAddress(formattedAddress);
          }

          if (data.responderCoordinates) {
            const responderCoords = {
              lat: Number(data.responderCoordinates.lat),
              lng: Number(data.responderCoordinates.lon)
            };
            setResponderCoords(responderCoords);
            
            // Fetch responder's address
            const responderFormattedAddress = await getAddressFromCoordinates(
              responderCoords.lat.toString(),
              responderCoords.lng.toString()
            );
            setResponderAddress(responderFormattedAddress);
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
          if (data.responderId || (data.responder && typeof data.responder === 'string')) {
            const responderId = data.responderId || data.responder;
            
            try {
              const responderResponse = await fetch(`${config.PERSONAL_API}/users/${responderId}`);
              if (responderResponse.ok) {
                const responderData = await responderResponse.json();
                setResponderData({
                  firstName: responderData.firstName,
                  lastName: responderData.lastName
                });
              } else {
                console.error('Failed to fetch responder data');
              }
            } catch (error) {
              console.error('Error fetching responder data:', error);
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

  useEffect(() => {
    if (incidentCoords && isGoogleLoaded) {
      fetchDirections(responderCoords, incidentCoords);
    }
  }, [responderCoords, incidentCoords, fetchDirections, isGoogleLoaded]);

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
    }

    return () => {
      if (chatClient) {
        chatClient.disconnectUser();
        setChatClient(null);
      }
    };
  }, [userId]);

  useEffect(() => {
    const storedChannelId = localStorage.getItem('currentChannelId');
    if (storedChannelId) {
      setCurrentChannelId(storedChannelId);
    }
  }, []);

  const onLoad = (map: google.maps.Map) => {
    setMap(map);
    setIsGoogleLoaded(true);
  };

  const onUnmount = () => {
    setMap(null);
  };


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

  // console.log(`Channel ID: ${currentChannelId}`);

  return (
    <Box sx={{ position: 'relative', height: '100vh' }}>
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={incidentCoords || { lat: 10.3157, lng: 123.8854 }}
          zoom={responderCoords ? 15 : 12}
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
          
          {responderCoords && (
            <Marker
              position={responderCoords}
              icon={{
                url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
              }}
              title="Responder Location"
            />
          )}
          
          {incidentCoords && (
            <Marker
              position={incidentCoords}
              icon={getIncidentIcon(incidentType)}
              title="Incident Location"
            />
          )}
          
          {directions && responderCoords && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: '#1976D2',
                  strokeWeight: 5,
                  strokeOpacity: 0.8
                }
              }}
            />
          )}
          
          {/* {infoWindowPosition && routeInfo && responderCoords && (
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
          )} */}
        </GoogleMap>
      </LoadScript>

      <Grid container spacing={1}>
        <Grid size={{xs: 12}}
        sx = {{
          position: "absolute",
          bottom: "0",
          padding: "0.7rem",
          display: "flex",
          gap: "1rem"
        }}>
          <Grid size={{md: 9}}
          sx = {{
          backgroundColor: "rgba(27, 73, 101, 0.1)",
          padding: "2",
          borderRadius: '10px'
        }}>
          <Box sx={{ 
        backgroundColor: 'rgba(29, 51, 84, 0.9)',
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
          justifyContent: 'start',
          marginRight: 2,
          width: '33%',
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
            ID: {incidentType.toUpperCase()}-{incidentId?.substring(5,9)}
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
          width: '33%',
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
          width: '33%',
        }}>
          <Box 
            component="img" 
            src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgNTAiPjxyZWN0IHg9IjEwIiB5PSIyMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjIwIiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSJyZWQiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjUwIiB5PSIxMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjIwIiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSJyZWQiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjI1IiBjeT0iNDUiIHI9IjgiIGZpbGw9ImJsYWNrIi8+PGNpcmNsZSBjeD0iNzUiIGN5PSI0NSIgcj0iOCIgZmlsbD0iYmxhY2siLz48cGF0aCBkPSJNNjAsMjBINzVWMzVINjBaIiBmaWxsPSJyZWQiLz48cGF0aCBkPSJNNjMsMjNIMjZWMzJINjNaIiBmaWxsPSJyZWQiLz48L3N2Zz4=" 
            alt="Ambulance" 
            sx={{ width: 70, height: 70, marginBottom: 1 }} 
          />
          <Box sx ={{
            display: 'flex',
            flexDirection: 'column',
            marginLeft: '1rem'
          }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {responderData ? `${responderData.firstName} ${responderData.lastName}` : 'Loading...'}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
            {responderAddress || "Loading address..."}
          </Typography>
          </Box>
        </Box>
        
        <IconButton 
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
        </IconButton>
      </Box>
      </Grid>
      <Grid size={{md: 3}}
      sx ={{
      }}>
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
            <Box
              onClick={() => setIsChatExpanded(!isChatExpanded)}
              sx={{
                bgcolor: '#4a90e2',
                color: 'white',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <Typography sx={{ fontWeight: 'bold', textTransform: 'uppercase'  }}>
                Channel ID: {incidentType.toUpperCase()}-{incidentId?.substring(5,9)}
              </Typography>
              {isChatExpanded ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
            </Box>

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
      </Grid>
        </Grid>
        </Grid>
    </Box>
  );
};

export default MapView;