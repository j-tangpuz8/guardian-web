import { useState, useEffect } from 'react';
import { Modal, Paper, Typography, Button, Box, Avatar, Container } from '@mui/material';
import avatarImg from "../assets/images/avatar.jpg";
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

const LGUMain = () => {

    const [currentTime, setCurrentTime] = useState(new Date());
    const [openModal, setOpenModal] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

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
        <div className="min-h-screen bg-[#1B4965]">

            {/* NAVBAR */}
            <Container maxWidth="xl" disableGutters sx={{height: "100%", backgroundColor: "#F0F0F0"}}>
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
                        <AccountCircleIcon
                        sx={{
                            fontSize: "4rem",
                            color: "black",
                        }}
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

            {/* MODAL */}

            <Modal
          open={openModal}
        //   onClose={handleCloseModal}
          aria-labelledby="incident-modal"
          aria-describedby="incident-description"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            
          }}
        >
          {(() => {
            // const colors = getIncidentColors(currentIncident.incidentType);
            
            return (
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
                    <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '30px' }}>
                      MEDICAL
                    </Typography>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                      VEHICULAR COLLISION
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    "A. S. Fortuna St, Mandaue City"
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
                  </Button>
                </div>
              </Paper>
            );
          })()}
        </Modal>
            



        </div>
    )

}

export default LGUMain;


