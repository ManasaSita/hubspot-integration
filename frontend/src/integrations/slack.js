// slack.js

// TODO
import React from "react";

const HUBSPOT_CLIENT_ID = "2a2b7459-db80-418e-9fc4-9961fc07c203";
const REDIRECT_URI =
  "https://app-na2.hubspot.com/oauth/authorize?client_id=2a2b7459-db80-418e-9fc4-9961fc07c203&redirect_uri=http://localhost:8000/hubspot/callback&scope=crm.objects.contacts.write%20oauth%20crm.objects.contacts.read"; // Update with your backend

const HubSpot = () => {
  const connectHubSpot = () => {
    const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${HUBSPOT_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=contacts`;
    window.location.href = authUrl;
  };

  const fetchHubSpotContacts = async () => {
    const token = localStorage.getItem("hubspot_token");
    if (!token) {
      alert("Please connect HubSpot first!");
      return;
    }

    const response = await fetch(
      "https://api.hubapi.com/crm/v3/objects/contacts",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const data = await response.json();
    console.log("HubSpot Contacts:", data);
  };

  return (
    <div>
      <button onClick={connectHubSpot}>Connect HubSpot</button>
      <button onClick={fetchHubSpotContacts}>Fetch Contacts</button>
    </div>
  );
};

export default HubSpot;
