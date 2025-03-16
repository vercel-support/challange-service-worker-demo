# Vercel Challenge Handler Demo

This project demonstrates how to handle Vercel's DDoS protection challenges in a Next.js application, particularly for API requests, WebSockets, and service worker interactions.

## The Problem

Vercel's Web Application Firewall (WAF) and DDoS protection system can sometimes challenge requests to protect your application from attacks. While this works well for regular page navigation, it can cause issues with:

- API requests made via `fetch()`
- WebSocket connections (like Socket.io)
- Service worker intercepted requests

The challenge occurs because:

1. Vercel sends a 403 response with a challenge
2. For regular page navigation, the browser can complete this challenge
3. For fetch/API requests, the challenge can't be properly completed
4. This leads to failed requests and broken functionality

Common symptoms include:
- API requests failing with 403 errors
- WebSocket connections being dropped
- "Failed to verify your browser" messages
- Issues occurring more in Chrome than other browsers

## The Solution

This demo implements a comprehensive solution that:

1. Detects when a request is being challenged by Vercel
2. Redirects to a full-page challenge resolution flow
3. Returns to the original page/functionality after the challenge is resolved
4. Handles service worker interactions properly

## Demo Instructions

### Setup

1. Clone this repository
2. Install dependencies:

