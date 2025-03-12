import { useState, useEffect } from "react";
import {
  Box,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import axios from "axios";

const HUBSPOT_CLIENT_ID = "2a2b7459-db80-418e-9fc4-9961fc07c203";
const REDIRECT_URI = "http://localhost:8000/integrations/hubspot/callback";

export const HubSpotIntegration = ({
  user,
  org,
  integrationParams,
  setIntegrationParams,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [contacts, setContacts] = useState([]);

  // Function to open OAuth authorization page
  const handleConnectClick = () => {
    const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${HUBSPOT_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=crm.objects.contacts.read%20crm.objects.contacts.write%20oauth`;
    window.location.href = authUrl;
  };

  // Function to retrieve credentials after authentication
  const handleWindowClosed = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/integrations/hubspot/credentials",
      );
      const credentials = response.data;

      if (credentials?.access_token) {
        localStorage.setItem("hubspot_token", credentials.access_token); // Store token
        setIsConnected(true);
        setIntegrationParams((prev) => ({
          ...prev,
          credentials: credentials,
          type: "HubSpot",
        }));
      }
    } catch (e) {
      alert("Failed to retrieve HubSpot credentials");
    }
  };

  // Function to fetch HubSpot contacts
  const fetchHubSpotContacts = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/integrations/hubspot/items",
      );
      setContacts(response.data);
      console.log("HubSpot Contacts:", response.data);
    } catch (error) {
      alert("Failed to fetch contacts. Please try again.");
    }
  };

  useEffect(() => {
    // ✅ Check if redirected after authentication
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("hubspot_connected") === "true") {
      handleWindowClosed(); // Automatically fetch credentials
      window.history.replaceState({}, document.title, "/"); // Remove query param from URL
    }
  }, []);

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{ mt: 2 }}
      >
        <Button
          variant="contained"
          onClick={isConnected ? undefined : handleConnectClick}
          color={isConnected ? "success" : "primary"}
          disabled={isConnecting}
          style={{
            pointerEvents: isConnected ? "none" : "auto",
            cursor: isConnected ? "default" : "pointer",
            opacity: isConnected ? 1 : undefined,
          }}
        >
          {isConnected ? (
            "HubSpot Connected"
          ) : isConnecting ? (
            <CircularProgress size={20} />
          ) : (
            "Connect to HubSpot"
          )}
        </Button>
        {isConnected && (
          <Button
            variant="contained"
            sx={{ ml: 2 }}
            onClick={fetchHubSpotContacts}
          >
            Fetch HubSpot Contacts
          </Button>
        )}
      </Box>

      {/* ✅ Render Contacts */}
      {contacts.length > 0 && (
        <List
          sx={{
            mt: 3,
            width: "100%",
            maxWidth: 500,
            bgcolor: "background.paper",
          }}
        >
          {contacts.map((contact, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={contact.name}
                secondary={`${contact.email || "No email"} | ${contact.phone || "No phone"}`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};
