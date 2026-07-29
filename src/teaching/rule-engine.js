const RULES = [
    {
        id: "modal-have",
        category: "grammar",
        pattern: /\b(could|should|would|might|must)(n't)?\s+of\b/gi,
        createFinding(match) {
            const modal = match[1];
            const negative = match[2] || "";

            return {
                type: "Grammar",
                original: match[0],
                correction: `${modal}${negative} have`,
                explanation:
                    `After “${modal}${negative},” use “have,” not “of.”`
            };
        }
    },

    {
        id: "couldnt-have",
        category: "grammar",
        pattern: /\bcouldnt\b/gi,
        createFinding(match) {
            return {
                type: "Grammar",
                original: match[0],
                correction: "couldn’t",
                explanation:
                    "Use an apostrophe in the contraction “couldn’t.”"
            };
        }
    },

    {
        id: "subject-verb-he-she-it",
        category: "grammar",
        pattern:
            /\b(he|she|it)\s+(go|want|need|like|work|live|seem|feel|think|know)\b/gi,
        createFinding(match) {
            const subject = match[1];
            const verb = match[2];

            const irregularForms = {
                go: "goes"
            };

            const correctedVerb =
                irregularForms[verb.toLowerCase()] ||
                `${verb}s`;

            return {
                type: "Grammar",
                original: match[0],
                correction:
                    `${subject} ${correctedVerb}`,
                explanation:
                    `In the present simple, add “-s” to the verb after “${subject}.”`
            };
        }
    },

    {
        id: "people-is",
        category: "grammar",
        pattern: /\bpeople\s+is\b/gi,
        createFinding(match) {
            return {
                type: "Grammar",
                original: match[0],
                correction: "people are",
                explanation:
                    "“People” is plural, so use “are.”"
            };
        }
    },

    {
        id: "there-is-plural",
        category: "grammar",
        pattern:
            /\bthere\s+is\s+(many|several|a lot of|lots of)\b/gi,
        createFinding(match) {
            return {
                type: "Grammar",
                original: match[0],
                correction:
                    match[0].replace(
                        /\bthere\s+is\b/i,
                        "there are"
                    ),
                explanation:
                    "Use “there are” before a plural noun."
            };
        }
    },

    {
        id: "discuss-about",
        category: "vocabulary",
        pattern: /\bdiscuss(?:ed|ing)?\s+about\b/gi,
        createFinding(match) {
            return {
                type: "Vocabulary",
                original: match[0],
                correction:
                    match[0].replace(/\s+about\b/i, ""),
                explanation:
                    "“Discuss” takes a direct object, so “about” is unnecessary."
            };
        }
    },

    {
        id: "explain-me",
        category: "grammar",
        pattern:
            /\bexplain(?:ed|ing)?\s+(me|him|her|us|them)\b/gi,
        createFinding(match) {
            const pronoun =
                match[1].toLowerCase();

            return {
                type: "Grammar",
                original: match[0],
                correction:
                    match[0].replace(
                        new RegExp(
                            `\\s+${pronoun}\\b`,
                            "i"
                        ),
                        ` to ${pronoun}`
                    ),
                explanation:
                    "Use “explain something to someone.”"
            };
        }
    },

    {
        id: "married-with",
        category: "vocabulary",
        pattern: /\bmarried\s+with\b/gi,
        createFinding(match) {
            return {
                type: "Vocabulary",
                original: match[0],
                correction: "married to",
                explanation:
                    "The usual expression is “married to someone.”"
            };
        }
    },

    {
        id: "depend-of",
        category: "vocabulary",
        pattern: /\bdepend(?:s|ed|ing)?\s+of\b/gi,
        createFinding(match) {
            return {
                type: "Vocabulary",
                original: match[0],
                correction:
                    match[0].replace(/\bof\b/i, "on"),
                explanation:
                    "The usual expression is “depend on.”"
            };
        }
    },

    {
        id: "interested-by",
        category: "vocabulary",
        pattern: /\binterested\s+by\b/gi,
        createFinding(match) {
            return {
                type: "Vocabulary",
                original: match[0],
                correction: "interested in",
                explanation:
                    "Use “interested in” before a topic or activity."
            };
        }
    },

    {
        id: "good-in",
        category: "vocabulary",
        pattern: /\bgood\s+in\b/gi,
        createFinding(match) {
            return {
                type: "Vocabulary",
                original: match[0],
                correction: "good at",
                explanation:
                    "Use “good at” for skills and activities."
            };
        }
    },

    {
        id: "listen-missing-to",
        category: "grammar",
        pattern:
            /\blisten(?:ed|ing|s)?\s+(?!to\b)(music|the radio|a podcast|him|her|me|them|us)\b/gi,
        createFinding(match) {
            const object = match[1];

            return {
                type: "Grammar",
                original: match[0],
                correction:
                    match[0].replace(
                        object,
                        `to ${object}`
                    ),
                explanation:
                    "Use “listen to” before the thing or person being heard."
            };
        }
    },

    {
        id: "arrive-to",
        category: "vocabulary",
        pattern:
            /\barrive(?:d|s|ing)?\s+to\s+(the|a|an)\b/gi,
        createFinding(match) {
            return {
                type: "Vocabulary",
                original: match[0],
                correction:
                    match[0].replace(/\bto\b/i, "at"),
                explanation:
                    "Use “arrive at” for most specific places."
            };
        }
    },

    {
        id: "spark-up-conversation",
        category: "vocabulary",
        pattern:
            /\bspark(?:ed|ing)?\s+up\s+(a\s+)?conversation\b/gi,
        createFinding(match) {
            return {
                type: "Vocabulary",
                original: match[0],
                correction: "strike up a conversation",
                explanation:
                    "The natural collocation is “strike up a conversation.”"
            };
        }
    },

    {
        id: "make-a-party",
        category: "vocabulary",
        pattern: /\bmake\s+(a\s+)?party\b/gi,
        createFinding(match) {
            return {
                type: "Vocabulary",
                original: match[0],
                correction:
                    "have a party / throw a party",
                explanation:
                    "English usually uses “have” or “throw” with “party.”"
            };
        }
    },

    {
        id: "do-a-mistake",
        category: "vocabulary",
        pattern: /\bdo\s+(a\s+)?mistake\b/gi,
        createFinding(match) {
            return {
                type: "Vocabulary",
                original: match[0],
                correction: "make a mistake",
                explanation:
                    "The natural collocation is “make a mistake.”"
            };
        }
    },

    {
        id: "more-easier",
        category: "grammar",
        pattern:
            /\bmore\s+(easier|better|worse|faster|slower|bigger|smaller)\b/gi,
        createFinding(match) {
            return {
                type: "Grammar",
                original: match[0],
                correction: match[1],
                explanation:
                    "Do not use “more” with an adjective that is already comparative."
            };
        }
    },

    {
        id: "very-much-adjective",
        category: "grammar",
        pattern:
            /\bvery\s+much\s+(happy|sad|tired|angry|nervous|excited|confused)\b/gi,
        createFinding(match) {
            return {
                type: "Grammar",
                original: match[0],
                correction: `very ${match[1]}`,
                explanation:
                    "Use “very” directly before most adjectives."
            };
        }
    },

    {
        id: "since-duration",
        category: "grammar",
        pattern:
            /\bsince\s+(\d+\s+(?:day|days|week|weeks|month|months|year|years))\b/gi,
        createFinding(match) {
            return {
                type: "Grammar",
                original: match[0],
                correction: `for ${match[1]}`,
                explanation:
                    "Use “for” with a duration and “since” with a starting point."
            };
        }
    },

    {
        id: "for-starting-point",
        category: "grammar",
        pattern:
            /\bfor\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|yesterday|last\s+\w+|20\d{2})\b/gi,
        createFinding(match) {
            return {
                type: "Grammar",
                original: match[0],
                correction: `since ${match[1]}`,
                explanation:
                    "Use “since” with a specific starting point."
            };
        }
    },

    {
        id: "filler-like",
        category: "fluency",
        pattern: /\blike\b/gi,
        minimumCount: 5,
        createFinding(match, context) {
            return {
                type: "Fluency",
                original:
                    `“like” used ${context.count} times`,
                correction:
                    "Pause briefly, or replace some uses with “for example,” “I mean,” or no filler.",
                explanation:
                    "Frequent filler words can make an answer harder to follow."
            };
        }
    },

    {
        id: "filler-you-know",
        category: "fluency",
        pattern: /\byou know\b/gi,
        minimumCount: 4,
        createFinding(match, context) {
            return {
                type: "Fluency",
                original:
                    `“you know” used ${context.count} times`,
                correction:
                    "Use a short pause or state the idea directly.",
                explanation:
                    "Repeated fillers may reduce clarity."
            };
        }
    }
];

export function analyzeTranscriptChunk(text) {
    const cleanText = String(text || "").trim();

    if (!cleanText) {
        return {
            text: "",
            findings: [],
            followUp: ""
        };
    }

    const findings = [];
    const seen = new Set();

    for (const rule of RULES) {
        const matches = [
            ...cleanText.matchAll(rule.pattern)
        ];

        if (matches.length === 0) {
            continue;
        }

        if (
            rule.minimumCount &&
            matches.length < rule.minimumCount
        ) {
            continue;
        }

        const matchesToReport =
            rule.minimumCount
                ? [matches[0]]
                : matches.slice(0, 2);

        for (const match of matchesToReport) {
            const finding =
                rule.createFinding(match, {
                    count: matches.length,
                    text: cleanText
                });

            const key = [
                finding.type,
                finding.original,
                finding.correction
            ].join("|");

            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            findings.push(finding);
        }
    }

    return {
        text: cleanText,
        findings,
        followUp:
            createSimpleFollowUp(cleanText)
    };
}

function createSimpleFollowUp(text) {
    const lowerText = text.toLowerCase();

    if (
        lowerText.includes("because") ||
        lowerText.includes("reason")
    ) {
        return "What do you think was the main reason for that?";
    }

    if (
        lowerText.includes("feel") ||
        lowerText.includes("felt")
    ) {
        return "How did that experience make you feel afterward?";
    }

    if (
        lowerText.includes("decide") ||
        lowerText.includes("decided")
    ) {
        return "What influenced that decision?";
    }

    if (
        lowerText.includes("work") ||
        lowerText.includes("job")
    ) {
        return "How does that affect your work or daily routine?";
    }

    if (
        lowerText.includes("friend") ||
        lowerText.includes("relationship")
    ) {
        return "How did the other person respond?";
    }

    return "What happened next?";
}