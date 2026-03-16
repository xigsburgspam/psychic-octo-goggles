/**
 * Addagle Moderation Service
 * 
 * - Profanity filter using bad-words library
 * - Pattern-based detection for common abuse
 * - Optional: OpenAI moderation API
 */

const Filter = require('bad-words');
const filter = new Filter();

// Additional patterns to detect
const ABUSE_PATTERNS = [
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,          // Phone numbers
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // Email addresses
  /(https?:\/\/[^\s]+)/gi,                    // URLs (flag but don't block)
  /\b(kik|snapchat|telegram|whatsapp|discord)\b/i, // Social platforms
];

const URL_PATTERN = /(https?:\/\/[^\s]+)/gi;

/**
 * Moderate a message
 * @param {string} text Raw message text
 * @returns {{ clean: string, flagged: boolean, reason: string|null }}
 */
async function moderateMessage(text) {
  if (!text || typeof text !== 'string') {
    return { clean: '', flagged: false, reason: null };
  }

  // Truncate very long messages
  const truncated = text.slice(0, 2000);

  try {
    // Step 1: Profanity filter
    let clean = truncated;
    let hasProfanity = false;

    try {
      if (filter.isProfane(truncated)) {
        clean = filter.clean(truncated);
        hasProfanity = true;
      }
    } catch (e) {
      // bad-words can throw on some inputs
    }

    // Step 2: Check for personal info sharing
    const hasPhone = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(truncated);
    const hasEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(truncated);

    // Flag for personal info but still send (just warn)
    if (hasPhone || hasEmail) {
      return {
        clean,
        flagged: false,
        reason: null,
        warning: 'Personal info detected',
      };
    }

    // Step 3: Extreme profanity = block entirely
    const BLOCKED_WORDS = ['nigger', 'faggot', 'kys', 'kill yourself'];
    const hasExtreme = BLOCKED_WORDS.some(word =>
      truncated.toLowerCase().includes(word)
    );

    if (hasExtreme) {
      return {
        clean: '',
        flagged: true,
        reason: 'hate_speech',
      };
    }

    // Step 4: Optional OpenAI moderation (if key available)
    if (process.env.OPENAI_API_KEY && text.length > 20) {
      const aiResult = await checkWithOpenAI(truncated);
      if (aiResult.flagged) {
        return {
          clean: '',
          flagged: true,
          reason: aiResult.reason,
        };
      }
    }

    return { clean, flagged: false, reason: null };

  } catch (error) {
    console.error('Moderation error:', error);
    // On error, allow message through
    return { clean: truncated, flagged: false, reason: null };
  }
}

/**
 * Optional OpenAI moderation check
 */
async function checkWithOpenAI(text) {
  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ input: text }),
    });

    const data = await response.json();
    const result = data.results?.[0];

    if (result?.flagged) {
      const categories = result.categories;
      const reason = Object.entries(categories)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(', ');

      return { flagged: true, reason };
    }

    return { flagged: false };
  } catch (err) {
    return { flagged: false };
  }
}

/**
 * Generate AI icebreaker suggestions
 */
function getIcebreakerSuggestions(interests = []) {
  const generic = [
    "What's something interesting that happened to you recently?",
    "If you could travel anywhere right now, where would you go?",
    "What's the last thing that made you laugh?",
    "What are you working on these days?",
    "What's your favorite way to spend a weekend?",
  ];

  const interestBased = {
    music: ["What's your favorite album of all time?", "Who have you been listening to lately?"],
    gaming: ["What game are you currently obsessed with?", "PC or console?"],
    movies: ["Seen anything good lately?", "What's your all-time favorite film?"],
    travel: ["What's the best place you've ever visited?", "Dream destination?"],
    food: ["What's the best meal you've ever had?", "Can you cook?"],
    tech: ["What tech are you excited about right now?", "Tabs or spaces?"],
    art: ["What's your medium?", "Who's your favorite artist?"],
    sports: ["Who do you support?", "Do you play or just watch?"],
  };

  const suggestions = [...generic];

  for (const interest of interests) {
    const key = Object.keys(interestBased).find(k =>
      interest.toLowerCase().includes(k)
    );
    if (key) {
      suggestions.push(...interestBased[key]);
    }
  }

  // Return 3 random suggestions
  return suggestions.sort(() => Math.random() - 0.5).slice(0, 3);
}

module.exports = { moderateMessage, getIcebreakerSuggestions };
