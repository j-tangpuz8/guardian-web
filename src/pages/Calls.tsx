import {
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  Call,
} from "@stream-io/video-react-sdk";
import CallContainer from "../components/CallContainer";
import {useEffect, useState} from "react";
import {useNavigate, useLocation} from "react-router-dom";
import config from "../config";

type User = {
  id: string;
  email: string;
  name: string;
};

const Calls = () => {
  const location = useLocation();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.id;
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(
    null
  );
  const [call, setCall] = useState<Call | null>(null);

  useEffect(() => {
    const initVideoClient = async () => {
      if (!userId || !user.email) {
        console.error("Missing user data");
        return;
      }

      const video = new StreamVideoClient({
        apiKey: config.STREAM_APIKEY,
        user: {
          id: userId,
          name: user.email,
        },
        token: token || undefined,
      });

      const newCall = video.call("default", "general");
      await newCall.join();
      setCall(newCall);
      setVideoClient(video);
    };

    if (userId && !videoClient) {
      initVideoClient();
    }

    return () => {
      if (videoClient) {
        videoClient.disconnectUser();
        setVideoClient(null);
      }
    };
  }, [userId]);

  return (
    <div className="bg-black h-screen flex justify-center items-center">
      <br />
      <div>
        {videoClient ? (
          <StreamVideo client={videoClient}>
            <CallContainer videoClient={videoClient} call={call} />
          </StreamVideo>
        ) : (
          <div>Loading video client...</div>
        )}
      </div>
    </div>
  );
};

export default Calls;
