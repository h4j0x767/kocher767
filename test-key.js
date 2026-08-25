import { GoogleGenAI } from "@google/genai";

const apiKey = "AIzaSyDCOEE8nnwKLncv1AorvBjKRyalL-OGjtY";
const ai = new GoogleGenAI({ apiKey });

async function run() {
    try {
        const model = "gemini-2.5-flash";
        const response = await ai.models.generateContent({
            model: model,
            contents: [{ parts: [{ text: "Hello" }] }]
        });
        console.log("Success:", response.text);
    } catch (error) {
        console.error("Error:", error);
    }
}

run();
