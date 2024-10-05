import OpenAI from "openai";

export async function POST(request) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY, // Ensure the API key is correctly set
    });

    try {
        const assistantId = "asst_lSmESvO0CrjOHyjt2PmtETax";  // Pre-created assistant

        // Step 2: Create a thread (conversation)
        const thread = await openai.beta.threads.create();
        console.log("Thread created:", thread);

        // Step 3: Add all user messages to the thread to preserve context
        const { messages } = await request.json();
        for (const msg of messages) {
            await openai.beta.threads.messages.create(thread.id, {
                role: msg.role,
                content: msg.content || "No input message",
            });
        }
        console.log("All messages added to thread:", thread.id);

        // Step 4: Run the assistant on the thread with conversation context
        const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
            assistant_id: assistantId,
            //instructions: "Please address the user as Jane Doe. The user has a premium account.",
        });
        console.log("Run result:", run);

        // Step 5: Check the status and retrieve messages
        if (run.status === 'completed') {
            const threadMessages = await openai.beta.threads.messages.list(run.thread_id);
            console.log("Messages in thread:", threadMessages);

            const assistantResponse = threadMessages.data
                .filter(msg => msg.role === 'assistant')  // Only take assistant messages
                .map((msg) => ({
                    role: msg.role,
                    content: msg.content && msg.content[0]?.text?.value || "No valid response received"
                }));

            // Remove exact duplicate responses and return only the first unique response
            const filteredResponses = assistantResponse.filter((msg, index, self) =>
                index === self.findIndex((m) => m.content === msg.content)  // Remove duplicate responses
            );

            // Return only the first assistant message to avoid multiple similar responses
            const finalResponse = filteredResponses.length > 0 ? filteredResponses[0] : { content: "No response available" };

            console.log("Final Assistant response:", finalResponse);

            // Return the assistant's response as JSON
            return new Response(JSON.stringify({ response: finalResponse }), {
                headers: { "Content-Type": "application/json" },
            });
        } else {
            console.log("Run status:", run.status);
            return new Response(JSON.stringify({ status: run.status }), {
                headers: { "Content-Type": "application/json" },
            });
        }

    } catch (error) {
        console.error("Error in Assistants API call:", error);
        return new Response(JSON.stringify({ error: error.message || "An error occurred while processing the request." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
