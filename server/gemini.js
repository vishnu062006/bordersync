const crypto = require('crypto');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_MAX_RETRIES = Number(process.env.GEMINI_MAX_RETRIES || 3);
const GEMINI_MIN_INTERVAL_MS = Number(process.env.GEMINI_MIN_INTERVAL_MS || 2500);
const GEMINI_CACHE_TTL_MS = Number(process.env.GEMINI_CACHE_TTL_MS || 10 * 60 * 1000);

let nextAllowedRequestAt = 0;
const insightCache = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function trimCache() {
  const now = Date.now();
  for (const [key, value] of insightCache.entries()) {
    if (value.expiresAt <= now) {
      insightCache.delete(key);
    }
  }
}

function createCacheKey(result, traveler) {
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        traveler: {
          fullName: traveler.fullName,
          destinationCountry: traveler.destinationCountry,
          purposeOfVisit: traveler.purposeOfVisit,
          visaType: traveler.visaType,
          arrivalDate: traveler.arrivalDate,
          departureDate: traveler.departureDate,
          stayDurationDays: traveler.stayDurationDays,
        },
        result: {
          overallRisk: result.overallRisk,
          riskBand: result.riskBand,
          recommendedAction: result.recommendedAction,
          reasons: result.reasons,
          warnings: result.warnings,
        },
      })
    )
    .digest('hex');
}

function normalizeFactors(items) {
  return Array.isArray(items) ? items.filter(Boolean).slice(0, 4) : [];
}

function buildFallbackInsight(result, traveler, reason = 'Gemini unavailable') {
  const topFactors = normalizeFactors(result.reasons);
  const topWarnings = normalizeFactors(result.warnings);

  return {
    enabled: false,
    source: 'deterministic-fallback',
    fallbackReason: reason,
    summary: `${traveler.fullName || 'Traveler'} is assessed at ${result.overallRisk}% (${result.riskBand}). Recommended action: ${result.recommendedAction}. ${topFactors[0] || 'Review the listed risk drivers before clearance.'}`,
    operationalNote: topFactors[0] || 'No material risk drivers were detected by the rule-based engine.',
    reviewFocus: topWarnings[0] || topFactors[1] || 'No additional compliance warnings were triggered.',
  };
}

function buildPrompt(result, traveler) {
  const keyFactors = normalizeFactors(result.reasons);
  const warnings = normalizeFactors(result.warnings);

  return [
    'You assist immigration officers.',
    'Write a concise, factual explanation of the existing rule-based result.',
    'Do not invent facts.',
    'Do not use gender, nationality, residence, or name as risk reasons.',
    'Return strict JSON with keys: summary, operationalNote, reviewFocus.',
    '',
    `Risk Score: ${result.overallRisk}%`,
    `Risk Band: ${result.riskBand}`,
    `Recommended Action: ${result.recommendedAction}`,
    `Purpose: ${traveler.purposeOfVisit || 'Unknown'}`,
    `Visa Type: ${traveler.visaType || 'Unknown'}`,
    `Travel Window: ${traveler.arrivalDate || 'Unknown'} to ${traveler.departureDate || 'Unknown'}`,
    `Stay Duration: ${traveler.stayDurationDays || 'Unknown'} days`,
    '',
    'Key Factors:',
    ...(keyFactors.length > 0 ? keyFactors.map((factor) => `- ${factor}`) : ['- No major risk drivers recorded']),
    '',
    'Warnings:',
    ...(warnings.length > 0 ? warnings.map((warning) => `- ${warning}`) : ['- None']),
  ].join('\n');
}

function getRetryDelay(attempt) {
  return Math.min(1000 * 2 ** attempt, 12000);
}

async function waitForRateLimitWindow() {
  const now = Date.now();
  if (nextAllowedRequestAt > now) {
    await sleep(nextAllowedRequestAt - now);
  }
  nextAllowedRequestAt = Date.now() + GEMINI_MIN_INTERVAL_MS;
}

async function generateGeminiInsight(prompt, apiKey) {
  await waitForRateLimitWindow();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.15,
          maxOutputTokens: 220,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`Gemini request failed: ${text}`);
    error.status = response.status;
    error.body = text;
    throw error;
  }

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) {
    throw new Error('Gemini response was empty.');
  }

  const parsed = JSON.parse(raw);
  return {
    enabled: true,
    source: 'gemini',
    summary: parsed.summary,
    operationalNote: parsed.operationalNote,
    reviewFocus: parsed.reviewFocus,
  };
}

async function callGemini(result, traveler) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return buildFallbackInsight(result, traveler, 'Gemini not configured');
  }

  trimCache();
  const cacheKey = createCacheKey(result, traveler);
  const cached = insightCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const prompt = buildPrompt(result, traveler);

  for (let attempt = 0; attempt < GEMINI_MAX_RETRIES; attempt += 1) {
    try {
      const insight = await generateGeminiInsight(prompt, apiKey);
      insightCache.set(cacheKey, {
        value: insight,
        expiresAt: Date.now() + GEMINI_CACHE_TTL_MS,
      });
      return insight;
    } catch (error) {
      const isRateLimited = error.status === 429 || String(error.message).includes('RESOURCE_EXHAUSTED');
      const isLastAttempt = attempt === GEMINI_MAX_RETRIES - 1;

      if (!isRateLimited || isLastAttempt) {
        return buildFallbackInsight(
          result,
          traveler,
          isRateLimited ? 'Gemini quota exhausted' : 'Gemini request failed'
        );
      }

      await sleep(getRetryDelay(attempt));
    }
  }

  return buildFallbackInsight(result, traveler, 'Gemini unavailable');
}

module.exports = {
  callGemini,
  buildFallbackInsight,
};
