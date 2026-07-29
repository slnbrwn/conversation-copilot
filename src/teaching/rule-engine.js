const RULES = [
    {
        id: "modal-have",
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
        id: "subject-verb-he-she-it",
        pattern:
            /\b(he|she|it)\s+(go|want|need|like|work|live|seem|feel|think|know)\b/gi,
        createFinding(match) {
            const subject = match[1];
            const verb = match[2].toLowerCase();

            const correctedForms = {
                go: "goes",
                want: "wants",
                need: "needs",
                like: "likes",
                work: "works",
                live: "lives",
                seem: "seems",
                feel: "feels",
                think: "thinks",
                know: "knows"
            };

            return {
                type: "Grammar",
                original: match[0],
                correction:
                    `${subject} ${correctedForms[verb]}`,
                explanation:
                    `In the present simple, the verb changes after “${subject}.”`
            };
        }
    },

    {
        id: "people-is",
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
        pattern: /\bdiscuss(?:ed|ing|es)?\s+about\b/gi,
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
        id: "explain-person",
        pattern:
            /\b(explain(?:ed|ing|s)?)\s+(me|him|her|us|them)\b/gi,
        createFinding(match) {
            return {
                type: "Grammar",
                original: match[0],
                correction:
                    `${match[1]} it to ${match[2]}`,
                explanation:
                    "Use “explain something to someone.”"
            };
        }
    },

    {
        id: "married-with",
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
        pattern:
            /\b(arrive(?:d|s|ing)?)\s+to\s+(the|a|an)\b/gi,
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
        id: "more-comparative",
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

    // --------------------------------------------------
    // New preposition and collocation rules
    // --------------------------------------------------

    {
        id: "bring-take-at-school",
        pattern:
            /\b(bring|take|brought|took)\s+(.{1,35}?)\s+at\s+school\b/gi,
        createFinding(match) {
            return {
                type: "Preposition",
                original: match[0],
                correction:
                    `${match[1]} ${match[2]} to school`,
                explanation:
                    "Use “to” when describing movement toward a destination."
            };
        }
    },

    {
        id: "go-in-work",
        pattern:
            /\b(go|goes|going|went)\s+in\s+work\b/gi,
        createFinding(match) {
            return {
                type: "Preposition",
                original: match[0],
                correction:
                    `${match[1]} to work`,
                explanation:
                    "The usual expression is “go to work.”"
            };
        }
    },

    {
        id: "help-for",
        pattern:
            /\b(help|helped|helping)\s+(me|him|her|us|them)?\s*for\s+(something|anything|this|that|the\s+\w+|\w+ing)\b/gi,
        createFinding(match) {
            const person =
                match[2] ? ` ${match[2]}` : "";

            return {
                type: "Preposition",
                original: match[0],
                correction:
                    `${match[1]}${person} with ${match[3]}`,
                explanation:
                    "Use “help with” before a task, problem, or activity."
            };
        }
    },

    {
        id: "need-help-for",
        pattern:
            /\bneed(?:s|ed)?\s+help\s+for\s+(.{1,30})/gi,
        createFinding(match) {
            return {
                type: "Preposition",
                original: match[0],
                correction:
                    `need help with ${match[1]}`,
                explanation:
                    "Use “help with” before the thing causing difficulty."
            };
        }
    },

    {
        id: "responsible-of",
        pattern: /\bresponsible\s+of\b/gi,
        createFinding(match) {
            return {
                type: "Preposition",
                original: match[0],
                correction: "responsible for",
                explanation:
                    "The usual expression is “responsible for.”"
            };
        }
    },

    {
        id: "afraid-from",
        pattern: /\bafraid\s+from\b/gi,
        createFinding(match) {
            return {
                type: "Preposition",
                original: match[0],
                correction: "afraid of",
                explanation:
                    "The usual expression is “afraid of.”"
            };
        }
    },

    {
        id: "wait-missing-for",
        pattern:
            /\b(wait|waited|waiting|waits)\s+(me|him|her|us|them|you|somebody|someone|people)\b/gi,
        createFinding(match) {
            return {
                type: "Preposition",
                original: match[0],
                correction:
                    `${match[1]} for ${match[2]}`,
                explanation:
                    "Use “wait for” before the person or thing you are expecting."
            };
        }
    },

    {
        id: "ask-to-person",
        pattern:
            /\b(ask|asked|asking|asks)\s+to\s+(me|him|her|us|them|you|someone|somebody)\b/gi,
        createFinding(match) {
            return {
                type: "Grammar",
                original: match[0],
                correction:
                    `${match[1]} ${match[2]}`,
                explanation:
                    "Use “ask someone,” without “to,” when requesting information."
            };
        }
    },

    {
        id: "enter-into-place",
        pattern:
            /\b(enter|entered|entering|enters)\s+into\s+(the|a|an)\s+(room|building|house|office|store|shop|classroom)\b/gi,
        createFinding(match) {
            return {
                type: "Preposition",
                original: match[0],
                correction:
                    `${match[1]} ${match[2]} ${match[3]}`,
                explanation:
                    "“Enter” normally takes a place directly, without “into.”"
            };
        }
    },

    {
        id: "contact-to-person",
        pattern:
            /\b(contact|contacted|contacting|contacts)\s+to\s+(me|him|her|us|them|you|someone|somebody)\b/gi,
        createFinding(match) {
            return {
                type: "Grammar",
                original: match[0],
                correction:
                    `${match[1]} ${match[2]}`,
                explanation:
                    "Use “contact someone,” without “to.”"
            };
        }
    },

    {
        id: "call-to-person",
        pattern:
            /\b(call|called|calling|calls)\s+to\s+(me|him|her|us|them|you|someone|somebody)\b/gi,
        createFinding(match) {
            return {
                type: "Grammar",
                original: match[0],
                correction:
                    `${match[1]} ${match[2]}`,
                explanation:
                    "Use “call someone,” without “to.”"
            };
        }
    },

    {
        id: "answer-to-person",
        pattern:
            /\b(answer|answered|answering|answers)\s+to\s+(me|him|her|us|them|you|someone|somebody)\b/gi,
        createFinding(match) {
            return {
                type: "Grammar",
                original: match[0],
                correction:
                    `${match[1]} ${match[2]}`,
                explanation:
                    "Use “answer someone,” without “to.”"
            };
        }
    },

    {
        id: "attend-to-event",
        pattern:
            /\b(attend|attended|attending|attends)\s+to\s+(the|a|an)\s+(meeting|class|event|conference|lesson|party)\b/gi,
        createFinding(match) {
            return {
                type: "Grammar",
                original: match[0],
                correction:
                    `${match[1]} ${match[2]} ${match[3]}`,
                explanation:
                    "Use “attend an event,” without “to.”"
            };
        }
    },

    {
        id: "participate-to",
        pattern:
            /\b(participate|participated|participating|participates)\s+to\b/gi,
        createFinding(match) {
            return {
                type: "Preposition",
                original: match[0],
                correction:
                    `${match[1]} in`,
                explanation:
                    "The usual expression is “participate in.”"
            };
        }
    },

    {
        id: "concentrate-in",
        pattern:
            /\b(concentrate|concentrated|concentrating|concentrates)\s+in\b/gi,
        createFinding(match) {
            return {
                type: "Preposition",
                original: match[0],
                correction:
                    `${match[1]} on`,
                explanation:
                    "The usual expression is “concentrate on.”"
            };
        }
    },

    {
        id: "focus-in",
        pattern:
            /\b(focus|focused|focusing|focuses)\s+in\b/gi,
        createFinding(match) {
            return {
                type: "Preposition",
                original: match[0],
                correction:
                    `${match[1]} on`,
                explanation:
                    "The usual expression is “focus on.”"
            };
        }
    },

    {
        id: "pay-attention-in",
        pattern:
            /\bpay(?:ing|s|ed)?\s+attention\s+in\b/gi,
        createFinding(match) {
            return {
                type: "Preposition",
                original: match[0],
                correction:
                    match[0].replace(/\bin\b/i, "to"),
                explanation:
                    "The usual expression is “pay attention to.”"
            };
        }
    },

    {
        id: "proud-for",
        pattern: /\bproud\s+for\b/gi,
        createFinding(match) {
            return {
                type: "Preposition",
                original: match[0],
                correction: "proud of",
                explanation:
                    "Use “proud of” before a person, achievement, or action."
            };
        }
    },

    {
        id: "worried-for-thing",
        pattern:
            /\bworried\s+for\s+(the\s+)?(exam|test|situation|problem|future|result|results|weather)\b/gi,
        createFinding(match) {
            return {
                type: "Preposition",
                original: match[0],
                correction:
                    match[0].replace(/\bfor\b/i, "about"),
                explanation:
                    "Use “worried about” for a situation or concern."
            };
        }
    },

    {
        id: "angry-against",
        pattern: /\bangry\s+against\b/gi,
        createFinding(match) {
            return {
                type: "Preposition",
                original: match[0],
                correction:
                    "angry with / angry at",
                explanation:
                    "Use “angry with” a person or “angry at” a situation."
            };
        }
    },

    {
        id: "different-than-from",
        pattern: /\bdifferent\s+that\b/gi,
        createFinding(match) {
            return {
                type: "Preposition",
                original: match[0],
                correction:
                    "different from / different than",
                explanation:
                    "Use “different from” or, in some contexts, “different than.”"
            };
        }
    },

    {
        id: "similar-with",
        pattern: /\bsimilar\s+with\b/gi,
        createFinding(match) {
            return {
                type: "Preposition",
                original: match[0],
                correction: "similar to",
                explanation:
                    "The usual expression is “similar to.”"
            };
        }
    },

    {
        id: "apply-on-job",
        pattern:
            /\b(apply|applied|applying|applies)\s+on\s+(a|the|this|that)\s+(job|position|role)\b/gi,
        createFinding(match) {
            return {
                type: "Preposition",
                original: match[0],
                correction:
                    `${match[1]} for ${match[2]} ${match[3]}`,
                explanation:
                    "Use “apply for” when seeking a job or position."
            };
        }
    },

    {
        id: "graduate-of",
        pattern:
            /\b(graduate|graduated|graduating)\s+of\s+(school|college|university)\b/gi,
        createFinding(match) {
            return {
                type: "Preposition",
                original: match[0],
                correction:
                    `${match[1]} from ${match[2]}`,
                explanation:
                    "Use “graduate from” a school, college, or university."
            };
        }
    },

    {
        id: "filler-like",
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