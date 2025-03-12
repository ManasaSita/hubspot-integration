import os
import requests
from fastapi import APIRouter, Request, HTTPException
from dotenv import load_dotenv
from fastapi.responses import RedirectResponse

router = APIRouter()

# Load environment variables
load_dotenv()

HUBSPOT_CLIENT_ID = os.getenv("HUBSPOT_CLIENT_ID")
HUBSPOT_CLIENT_SECRET = os.getenv("HUBSPOT_CLIENT_SECRET")
HUBSPOT_REDIRECT_URI = os.getenv("HUBSPOT_REDIRECT_URI")

# Storage (Replace with Redis or DB in production)
oauth_tokens = {}  # Temporary dictionary to store credentials


@router.get("/hubspot/authorize")
async def authorize_hubspot():
    """Redirect user to HubSpot OAuth authorization page"""
    auth_url = (
        f"https://app.hubspot.com/oauth/authorize?"
        f"client_id={HUBSPOT_CLIENT_ID}&"
        f"redirect_uri={HUBSPOT_REDIRECT_URI}&"
        f"scope=crm.objects.contacts.read%20crm.objects.contacts.write%20oauth"
    )
    return {"auth_url": auth_url}


@router.get("/hubspot/callback")
async def oauth2callback_hubspot(request: Request):
    """Handles OAuth callback and exchanges code for access token"""
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code missing")

    token_url = "https://api.hubapi.com/oauth/v1/token"
    payload = {
        "grant_type": "authorization_code",
        "client_id": HUBSPOT_CLIENT_ID,
        "client_secret": HUBSPOT_CLIENT_SECRET,
        "redirect_uri": HUBSPOT_REDIRECT_URI,
        "code": code,
    }

    response = requests.post(token_url, data=payload)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get access token")

    tokens = response.json()
    oauth_tokens[
        "hubspot"
    ] = tokens  # Temporary storage (Replace with Redis in production)

    # ✅ Redirect to frontend instead of returning JSON
    return RedirectResponse(url="http://localhost:3000?hubspot_connected=true")


@router.post("/hubspot/credentials")
async def get_hubspot_credentials():
    """Retrieve stored HubSpot credentials"""
    tokens = oauth_tokens.get("hubspot")
    if not tokens:
        raise HTTPException(status_code=401, detail="HubSpot credentials not found")

    return tokens


async def create_integration_item_metadata_object(response_json):
    """Converts HubSpot API response into a structured format for frontend display."""

    items = []

    for item in response_json.get("results", []):
        items.append(
            {
                "id": item.get("id"),
                "name": item.get("properties", {}).get("firstname", "Unknown")
                + " "
                + item.get("properties", {}).get("lastname", "Unknown"),
                "email": item.get("properties", {}).get("email", "N/A"),
                "company": item.get("properties", {}).get("company", "N/A"),
                "phone": item.get("properties", {}).get("phone", "N/A"),
            }
        )

    return items


@router.post("/hubspot/items")
async def get_items_hubspot():
    """Fetches contacts from HubSpot API using stored credentials and formats them into integration items."""

    tokens = oauth_tokens.get("hubspot")  # Get stored credentials
    if not tokens:
        raise HTTPException(status_code=401, detail="No HubSpot credentials found")

    access_token = tokens.get("access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Access token is missing")

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    # Fetch contacts from HubSpot API
    hubspot_url = "https://api.hubapi.com/crm/v3/objects/contacts?properties=firstname,lastname,email,phone,company"

    response = requests.get(hubspot_url, headers=headers)

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail="Failed to fetch contacts from HubSpot",
        )

    response_json = response.json()
    return await create_integration_item_metadata_object(response_json)
