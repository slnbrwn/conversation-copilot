let languageSession = null;
let sessionPromise = null;

const correctionSchema = {
    type: "object",
    properties: {
        corrections: {
            type: "array",
            maxItems: 3,
            items: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        enum: [
                            "Grammar",
                            "Vocabulary",
                            "Preposition",
                            "Natural expression",
                            "Register"
                        ]
                    },
                    original: {
                        type: "string"
                    },
                    correction: {
                        type: "string"
                    },
                    explanation: {
                        type: "string"
                    }
                },
                required: [
                    "type",
                    "original",
                    "correction",
                    "explanation"
                ],
                additionalProperties: false
            }
        }
    },
    required: ["corrections"],
    additionalProperties: false
};

export async function reviewTranscriptWithAI(text) {
    const cleanText = String(text || "").trim();

    if (!cleanText) {
        return [];
    }

    try {
        const session = await getLanguageSession();

        const prompt = `
Review this English learner transcript:

"${cleanText}"

Return the most useful language corrections for the teacher.

Look for:
- grammar
- verb forms
- prepositions
- vocabulary
- collocations
- awkward or non-native phrasing
- register or style issues useful for advanced learners
- wording that obscures or changes the intended meaning

You may flag language that is understandable but noticeably unnatural when the correction would be genuinely useful.

Ignore:
- punctuation
- capitalization
- commas and periods
- formatting caused by speech-to-text
- obvious overlap duplication
- harmless conversational fragments
- minor fillers unless they seriously affect clarity

Do not suggest a change merely because it is shorter or because you personally prefer the style.

Prioritize meaningful language issues over punctuation or formatting.

Return no more than three corrections.
If there is no useful language issue, return an empty corrections array.
`;

        const response = await session.prompt(
            prompt,
            {
                responseConstraint:
                    correctionSchema
            }
        );

        const parsed = JSON.parse(response);

        return Array.isArray(parsed.corrections)
            ? parsed.corrections
            : [];
    } catch (error) {
        console.error(
            "AI language review failed:",
            error
        );

        return [];
    }
}

async function getLanguageSession() {
    if (languageSession) {
        return languageSession;
    }

    if (sessionPromise) {
        return sessionPromise;
    }

    sessionPromise = LanguageModel.create({
        languages: ["en"],

        initialPrompts: [
            {
                role: "system",
                content: `
You are assisting an English teacher during live conversation lessons.

Your job is to catch useful language issues that the teacher may miss while concentrating on the conversation.

Prioritize:
- incorrect grammar
- incorrect verb forms
- incorrect prepositions
- wrong word choice
- unnatural collocations
- awkward or non-native phrasing
- register or style issues that would help an advanced learner sound more natural
- wording that changes, weakens, or obscures the intended meaning

You may flag language that is understandable but noticeably unnatural, especially when a more natural expression would be genuinely useful to the learner.

Do not flag:
- punctuation
- capitalization
- commas
- periods
- formatting caused by speech-to-text
- repetition clearly caused by overlapping transcript chunks
- a contraction versus a full form unless the form is grammatically wrong
- a sentence only because another version is slightly shorter

Do not overcorrect ordinary conversational features such as:
- sentence fragments that are natural in speech
- discourse markers
- mild repetition
- common fillers

When deciding what to flag, ask:
1. Is this grammatically wrong?
2. Is the word choice or collocation unnatural?
3. Would an advanced learner benefit from knowing a more natural expression?
4. Is this likely a real learner issue rather than a transcription artifact?

Examples:
- "he's a piano" may mean "he has a piano"
- "sitting in the sofa" should be "sitting on the sofa"
- "prefer X than Y" should be "prefer X to Y"
- "spark up a conversation" should be "strike up a conversation"

Return at most three high-value corrections.
`
            }
        ]
    });

    try {
        languageSession =
            await sessionPromise;

        return languageSession;
    } finally {
        sessionPromise = null;
    }
}