const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const router = express.Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Check usage counter
function getUsageCount(req) {
  const count = req.signedCookies.usageCount;
  return count ? parseInt(count, 10) : 0;
}

function incrementUsage(res, currentCount) {
  const newCount = currentCount + 1;
  res.cookie('usageCount', newCount.toString(), {
    signed: true,
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dagen
  });
  return newCount;
}

// POST /api/analysis/scan
router.post('/scan', async (req, res) => {
  try {
    const { cvText, jobText } = req.body;
    
    // Validatie
    if (!cvText || !jobText) {
      return res.status(400).json({ error: 'CV tekst en vacature tekst zijn beide verplicht' });
    }
    
    if (cvText.trim().length < 50 || jobText.trim().length < 50) {
      return res.status(400).json({ error: 'CV en vacature moeten minimaal 50 karakters bevatten' });
    }

    // Check usage
    const currentUsage = getUsageCount(req);
    
    if (currentUsage >= 3) {
      return res.status(402).json({ 
        error: 'Gratis limit bereikt',
        message: 'Je hebt je 3 gratis analyses gebruikt. Upgrade voor onbeperkte toegang.',
        needsPayment: true
      });
    }

    // Claude API call
    const prompt = `Analyseer de match tussen dit CV en deze vacature. Geef een score van 0-100 en een gedetailleerde onderbouwing.

CV:
${cvText}

Vacature:
${jobText}

Geef je antwoord in dit exacte JSON formaat:
{
  "score": <nummer 0-100>,
  "onderbouwing": {
    "skills": "<analyse van skills match>",
    "ervaring": "<analyse van ervaring match>",
    "opleiding": "<analyse van opleiding match>",
    "overig": "<overige relevante punten>"
  },
  "sterke_punten": ["<punt 1>", "<punt 2>"],
  "verbeterpunten": ["<punt 1>", "<punt 2>"]
}`;

    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    let analysisResult;
    try {
      analysisResult = JSON.parse(response.content[0].text);
    } catch (parseError) {
      // Fallback als JSON parsing failt
      analysisResult = {
        score: 50,
        onderbouwing: {
          skills: 'Kon analyse niet volledig verwerken',
          ervaring: 'Herprobeeer met duidelijkere input',
          opleiding: 'Kon gegevens niet goed matchen',
          overig: 'Technische fout bij verwerking'
        },
        sterke_punten: ['Herprobeeer analyse'],
        verbeterpunten: ['Verbeter input kwaliteit']
      };
    }

    // Increment usage
    const newUsage = incrementUsage(res, currentUsage);
    
    res.json({
      ...analysisResult,
      remainingFree: Math.max(0, 3 - newUsage)
    });
    
  } catch (error) {
    console.error('Claude API error:', error);
    
    if (error.status === 401) {
      return res.status(502).json({ error: 'API configuratie fout - neem contact op met support' });
    }
    
    if (error.status === 429) {
      return res.status(502).json({ error: 'Service tijdelijk overbelast - probeer later opnieuw' });
    }
    
    res.status(502).json({ error: 'Kon CV analyse niet voltooien - probeer opnieuw' });
  }
});

// GET /api/analysis/usage
router.get('/usage', (req, res) => {
  const currentUsage = getUsageCount(req);
  res.json({
    used: currentUsage,
    remaining: Math.max(0, 3 - currentUsage),
    needsPayment: currentUsage >= 3
  });
});

module.exports = router;