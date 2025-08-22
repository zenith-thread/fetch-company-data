# Project Setup and Usage

## Prerequisites

Before you start, make sure you have the necessary certificates for HTTPS:

- **SSL Certificates**:  
  Place the following files in the project root directory:
  - `key.pem`
  - `cert.pem`

  If you prefer HTTP, you can remove these files.

  - **.env File Requirements**:  
  Place the following in your .env file:
  - `CLIENT_ID`
  - `CLIENT_SECRET`
  - `REDIRECT_URI`
  - `PORT`

## Installation

### Step 1: Install Dependencies

Run the following command to install all required dependencies:

```bash
npm install
```

## Start the service

Run the following command to start the service:

```bash
npm start
```

go to the https://localhost:{PORT}/xero/connect, to connect to the xero client.
