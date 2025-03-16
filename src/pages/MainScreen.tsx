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
} from "@mui/material";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import avatarImg from "../assets/images/avatar.jpg";
import SystemSecurityUpdateWarningIcon from "@mui/icons-material/SystemSecurityUpdateWarning";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import AddIcCallIcon from "@mui/icons-material/AddIcCall";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import {useState, useEffect} from "react";
import {StreamChat} from "stream-chat";
import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  Window,
} from "stream-chat-react";
import config from "../config";
import msgTemplates from "../utils/MsgTemplates";

type User = {
  id: string;
  email: string;
  name: string;
};

const MainScreen = () => {
  const location = useLocation();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.id;
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [chatClient, setChatClient] = useState<StreamChat | null>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>("");

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
  };

  const handleSendTemplate = async () => {
    if (!selectedTemplate || !chatClient) return;

    try {
      const channel = chatClient.channel("messaging", "general");
      await channel.sendMessage({
        text: selectedTemplate,
      });
      setSelectedTemplate(null);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  useEffect(() => {
    const initChatClient = async () => {
      const chat = new StreamChat(config.STREAM_APIKEY);
      await chat.connectUser(
        {
          id: userId,
          name: user.email,
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

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!chatClient) {
    return <div>Loading chat...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#1B4965]">
      <Container maxWidth="xl" sx={{height: "100%"}}>
        <Grid container spacing={1}>
          <Grid size={{xs: 12}} padding={"2rem"}>
            <Grid container spacing={8}>
              <Grid
                size={{md: 4}}
                display={"flex"}
                flexDirection={"row"}
                alignItems={"center"}
                gap={"1rem"}>
                <HealthAndSafetyIcon
                  sx={{
                    fontSize: "6.5rem",
                    color: "skyblue",
                    border: "solid white 1px",
                    borderRadius: "100%",
                    padding: "4px",
                    boxShadow: "0 0 7px 0 white",
                  }}
                />
                <div className="text-white">
                  <Typography sx={{fontWeight: "bold"}}>
                    ID: CONVERSATION ID
                  </Typography>
                  <Typography sx={{fontWeight: "bold"}}>
                    TYPE OF CALL
                  </Typography>
                  <Typography sx={{fontWeight: "bold"}}>
                    GEOLOCATION ADDRESS OF CALLER
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
                  <Typography sx={{fontWeight: "bold"}} variant="h5">
                    {user.email}
                  </Typography>
                  <Typography sx={{fontWeight: "bold"}}>09175468814</Typography>
                  <Typography sx={{fontWeight: "bold"}}>GuardianPH</Typography>
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
                      />
                      <MyLocationIcon
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
                        onClick={() => navigate("/call")}
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
                        control={<Switch />}
                        label="Incident Verified"
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
            sx={{border: "12px solid skyblue", borderRadius: "16px"}}>
            <div
              style={{
                height: "540px",
                display: "flex",
                gap: "8px",
                backgroundColor: "skyblue",
              }}>
              <div style={{flex: "3", minWidth: 0}}>
                <Chat client={chatClient} theme="messaging light">
                  <Channel channel={chatClient.channel("messaging", "general")}>
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
          <Grid size={{xs: 12}}>
            {/* {videoClient ? (
              <StreamVideo client={videoClient}>
                <CallContainer videoClient={videoClient} call={call} />
              </StreamVideo>
            ) : (
              <div>Loading video client...</div>
            )} */}
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default MainScreen;
