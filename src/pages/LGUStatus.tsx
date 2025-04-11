import { useState, useEffect } from 'react';
import { Modal, Paper, Typography, Button, Box, Avatar } from '@mui/material';
import config from '../config';
import avatarImg from "../assets/images/avatar.jpg";
import { useChatContext } from 'stream-chat-react';

interface Incident {
  _id: string;
  incidentType: string;
  incidentDetails: {
    incident: string;
    incidentDescription: string;
    coordinates: {
      lat: number;
      lon: number;
    };
  };
  lgu: string;
  lguStatus: string;
}

const LGUStatus = () => {
  const { client } = useChatContext();
  const [connectingIncident, setConnectingIncident] = useState<Incident | null>(null);
  const [isInvisible, setIsInvisible] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const lguId = user?.id;

  const toggleStatus = async () => {
    await client.upsertUser({
      id: lguId,
      invisible: !isInvisible,
    });
    setIsInvisible(!isInvisible);
  };

  useEffect(() => {
    const checkConnectingIncidents = async () => {
      if (!lguId || isInvisible) return; // Only check if online

      try {
        const response = await fetch(`${config.PERSONAL_API}/incidents`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Filter for incidents where this LGU is assigned and status is connecting
          const connectingIncident = data.find((incident: Incident) => 
            incident.lgu === lguId && incident.lguStatus === 'connecting'
          );
          
          if (connectingIncident) {
            setConnectingIncident(connectingIncident);
            setOpenModal(true);
          } else if (connectingIncident && connectingIncident.lguStatus === 'idle') {
            // Close modal if status changes to idle
            setConnectingIncident(null);
            setOpenModal(false);
          }
        }
      } catch (error) {
        console.error('Error checking connecting incidents:', error);
      }
    };

    const interval = setInterval(checkConnectingIncidents, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [lguId, token, isInvisible]); // Add isInvisible to dependencies

  const handleAccept = async () => {
    if (!connectingIncident) return;

    try {
      const response = await fetch(`${config.PERSONAL_API}/incidents/update/${connectingIncident._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lguStatus: 'connected',
          lguConnectedAt: new Date(),
          lgu: lguId
        })
      });

      if (response.ok) {
        setConnectingIncident(null);
        setOpenModal(false);
      }
    } catch (error) {
      console.error('Error accepting incident:', error);
    }
  };

  const handleDecline = async () => {
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
        setOpenModal(false);
      }
    } catch (error) {
      console.error('Error declining incident:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#e3e5e8] flex items-center justify-center">
      <Avatar 
        src={avatarImg}
        sx={{ 
          position: 'absolute', 
          top: 16,  
          right: 16,  
          width: 70, 
          height: 70,
          border: `2px solid ${!isInvisible ? 'green' : 'red'}`,
          boxSizing: 'border-box',
          borderRadius: '50%'
        }}
        alt={user?.name}
      />

      <Paper elevation={3}
        sx={{ 
          padding: '0 4px 0 4px',
          width: '100%',
          height: '250px',
          backgroundColor: 'gray',
          display: 'flex',
          justifyContent: 'center',
          border: 'none',
          borderRadius: 0
        }}
      >
        <Paper elevation={0}
          sx={{
            padding: '16px 0 16px 0',
            backgroundColor: '#1B4965',
            width: '60%',
            border: 'none',
            borderRadius: 0,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div className="flex flex-col items-center gap-4 w-full">
            <Typography 
              variant="h3"
              sx={{ 
                textTransform: 'uppercase',
                fontWeight: 'bold',
                letterSpacing: '2px', 
                color: isInvisible ? 'red' : 'green',
              }}
            >
              {isInvisible ? "Offline" : "Online"}
            </Typography>
            <div className="text-center w-full">
              <Typography variant="h4" sx={{ mb: 1, color: 'white' }}>
                OPERATION CENTER
              </Typography>
              <Box
                sx={{
                  background: '#f7faff',
                  width: '100%'
                }}
              >
                <Typography variant="h6" sx={{ color: 'RED' }}>
                  {!isInvisible ? "ON ACTIVE STAND-BY, WAITING DISPATCH" : "ON BREAK"}
                </Typography>
              </Box>

              <div className="flex items-center justify-center mt-4">
                <Button 
                  variant="contained" 
                  color={!isInvisible ? "error" : "success"}
                  onClick={toggleStatus}
                  sx={{
                    padding: '10px 20px',  
                    fontSize: '15px',       
                    textTransform: 'none', 
                    width: '150px',     
                  }}
                >
                  {!isInvisible ? "CHECK-OUT" : "CHECK-IN"}
                </Button>
              </div>
            </div>
          </div>
        </Paper>
      </Paper>

      <Modal
        open={openModal}
        onClose={() => {}} 
        aria-labelledby="incident-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* <Paper 
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
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
              NEW INCIDENT ASSIGNMENT
            </Typography>
          </div>
          <div style={{ 
            backgroundColor: "#ffffff", 
            padding: '20px 40px', 
            display: 'flex', 
            flexDirection: 'column',
            gap: '16px'
          }}>
            {connectingIncident && (
              <>
                <Typography variant="h6" sx={{ color: 'black', fontWeight: 'bold' }}>
                  Type: {connectingIncident.incidentType}
                </Typography>
                <Typography variant="body1" sx={{ color: 'black' }}>
                  Description: {connectingIncident.incidentDetails.incidentDescription}
                </Typography>
                <Typography variant="body1" sx={{ color: 'black' }}>
                  Location: {connectingIncident.incidentDetails.coordinates.lat}, {connectingIncident.incidentDetails.coordinates.lon}
                </Typography>
              </>
            )}
          </div>
          <div style={{ 
            backgroundColor: "#1e4976", 
            padding: '24px', 
            display: 'flex', 
            justifyContent: 'center',
            gap: '16px'
          }}>
            <Button
              variant="contained"
              onClick={handleAccept}
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
              onClick={handleDecline}
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
        </Paper> */}

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
                    // backgroundColor: "#4a7ab8", 
                    // padding: '14px 40px 14px 40px', 
                    display: 'flex', 
                    flexDirection: 'column',
                    // justifyContent: 'start',
                    alignItems: 'center',
                    // gap: '1rem'
                  }}>
                    {connectingIncident && (
                      <>
                        <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '30px', textTransform: 'uppercase' }}>
                        {connectingIncident.incidentType}
                        </Typography>
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {connectingIncident.incidentDetails.incident}
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {connectingIncident.incidentDetails.coordinates.lat}, {connectingIncident.incidentDetails.coordinates.lon}
                        </Typography>
                      </>
                    )}
                  </div>
                  
                </div>
                <div style={{ 
                  backgroundColor: "#1B4965", 
                  padding: '24px', 
                  display: 'flex', 
                  justifyContent: 'center',
                  gap: '16px'
                }}>
                  {/* <Button 
                    variant="contained" 
                    // onClick={handleAcceptIncident}
                    sx={{ 
                      backgroundColor: '#6ad37a',
                      color: 'white',
                      padding: '5px 24px',
                      width: '40%',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      '&:hover': {
                        backgroundColor: '#5bc26b'
                      },
                      '&:disabled': {
                        backgroundColor: '#97d8a1',
                        color: '#e0e0e0'
                      }
                    }}
                  >
                    RESPOND
                  </Button> */}
                  <Button
              variant="contained"
              onClick={handleAccept}
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
              onClick={handleDecline}
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
      </Modal>
    </div>
  );
};

export default LGUStatus;
