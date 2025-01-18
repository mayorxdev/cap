# Cloudflare Turnstile Implementation

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file:
   ```bash
   cp sample.env .env
   ```
4. Update `.env` with your credentials
5. Start the server:
   ```bash
   node server.js
   ```

## Environment Variables

| Variable            | Description                          |
|---------------------|--------------------------------------|
| TURNSTILE_SECRET_KEY| Cloudflare Turnstile secret key      |
| ALLOWED_DOMAINS     | Comma-separated list of allowed domains |

## Security

- Never commit `.env` files
- Keep SSL certificates secure
- Use environment variables for all sensitive data 