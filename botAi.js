import OpenAI from "openai";
import { config } from "dotenv";
config();
const openai = new OpenAI({
  apiKey: process.env.CHAT_GPT,
});

export const completion = async (question) => {
  return openai.chat.completions.create({
    model: "gpt-4o-mini",
    store: true,
    messages: [{ role: "user", content: question }],
  });
};
// completion.then((result) => console.log(result.choices[0].message));
