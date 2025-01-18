require('dotenv').config();

const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const https = require('https');
const fs = require('fs');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

async function validateTurnstile(token, remoteip = null) {
    try {
        const response = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            secret: TURNSTILE_SECRET_KEY,
            response: token,
            remoteip: remoteip
        });

        return response.data.success;
    } catch (error) {
        console.error('Turnstile verification error:', error);
        return false;
    }
}

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

app.post('/submit', async (req, res) => {
    const token = req.body['cf-turnstile-response'];
    const remoteip = req.ip;

    if (!token) {
        return res.status(400).send('CAPTCHA token missing');
    }

    const isValid = await validateTurnstile(token, remoteip);
    
    if (!isValid) {
        return res.status(403).send('CAPTCHA verification failed');
    }

    // If CAPTCHA is valid, process your form data here
    res.send('Form submitted successfully');
});

// Serve static files from the same directory as server.js
app.use(express.static(path.join(__dirname)));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Add a route for your turnstile.html
app.get('/turnstile', (req, res) => {
    res.render('turnstile', {
        domain: process.env.ALLOWED_DOMAINS.split(',')[0],
        ErrorMessage: req.query.error || null
    });
});

// Get allowed domains from environment variable
const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS.split(',');

// Add domain-specific middleware
app.use((req, res, next) => {
    const allowed = ALLOWED_DOMAINS.some(domain => {
        const regex = new RegExp(`^(www\.)?${domain.replace('.', '\\.')}$`);
        return regex.test(req.hostname);
    });
    
    if (!allowed) {
        console.log(`Blocked request from ${req.hostname}`);
        return res.status(403).send('Forbidden');
    }
    next();
});

const options = {
    key: fs.readFileSync('/path/to/privkey.pem'),
    cert: fs.readFileSync('/path/to/fullchain.pem')
};

https.createServer(options, app).listen(443, () => {
    const primaryDomain = process.env.ALLOWED_DOMAINS.split(',')[0];
    console.log(`Server running on https://${primaryDomain}`);
}); 

if (!process.env.ALLOWED_DOMAINS) {
    console.error('ALLOWED_DOMAINS environment variable is required');
    process.exit(1);
} 