# CV Scanner

Werkt op Windows met Node.js 20+

## Beschrijving

CV Scanner is een webapplicatie die CV's matched met vacatures door middel van AI-analyse. Gebruikers kunnen hun CV-tekst en een vacaturetekst invoeren om een match-score (0-100) te krijgen met gedetailleerde onderbouwing.

## Features

- ✅ AI-gestuurde CV en vacature matching via Claude API
- ✅ Gedetailleerde analyse van skills, ervaring en opleiding
- ✅ 3 gratis analyses per gebruiker (cookie-based)
- ✅ Stripe-integratie voor premium toegang
- ✅ Responsive web interface zonder build-step
- ✅ Docker support

## Vereisten

- Node.js 20+
- NPM
- Anthropic API key (Claude)
- Stripe account (optioneel, voor betalingen)

## Installatie

1. Clone de repository:
```bash
git clone <repository-url>
cd cv-scanner
```

2. Installeer dependencies:
```bash
npm install
```

3. Kopieer `.env.example` naar `.env` en vul de waardes in:
```bash
cp .env.example .env
```

4. Vul `.env` in met jouw API keys:
```env
PORT=3000
COOKIE_SECRET=your-secret-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key
CLAUDE_MODEL=claude-3-sonnet-20240229
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PRICE_ID=your-stripe-price-id
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

## Development

```bash
npm run dev
```

De applicatie draait op http://localhost:3000

## Productie

```bash
npm start
```

## Docker

```bash
# Build image
docker build -t cv-scanner .

# Run container
docker run -p 3000:3000 --env-file .env cv-scanner
```

## API Endpoints

### Analysis
- `POST /api/analysis/scan` - Analyseer CV en vacature match
- `GET /api/analysis/usage` - Check usage counter

### Payments
- `POST /api/stripe/create-checkout-session` - Start betaling
- `POST /api/stripe/webhook` - Stripe webhooks

### Health
- `GET /healthz` - Health check

## Project Structuur

```
cv-scanner/
├── public/              # Static frontend files
│   ├── index.html      # Main HTML page
│   ├── style.css       # Styling
│   └── app.js          # Frontend JavaScript
├── routes/             # API routes
│   ├── analysis.js     # CV analysis endpoints
│   └── stripe.js       # Payment endpoints
├── server.js           # Express server
├── package.json        # Dependencies
├── Dockerfile         # Docker configuration
└── README.md          # This file
```

## Usage Limiting

De applicatie gebruikt Express signed cookies om gratis usage te tracken:
- Eerste 3 analyses zijn gratis
- Counter wordt bijgehouden in httpOnly signed cookie
- Na 3 analyses wordt Stripe Checkout getoond

## Security

- Alle cookies zijn httpOnly en signed
- Input validatie op alle endpoints
- Environment variables voor gevoelige data
- CORS en security headers (via Express)

## License

ISC