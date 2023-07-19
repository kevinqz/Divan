import fetch from "node-fetch";
import FormData from "form-data";
import { error } from '@sveltejs/kit';

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request }) => {
    const { audioBlob } = request.body;

    const formData = new FormData();
    formData.append("file", audioBlob);
    formData.append("model", "whisper-1");

    try {
      const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer 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`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { success: true, body: data?.text || "Transcription could not be completed" };
      } else {
        const errorData = await response.json();
        console.error("Transcription request failed. Error:", errorData);
        throw error(400, 'Transcription request failed');
      }
    } catch (error) {
      console.error("Error during transcription:", error);
      throw error(500, 'An error occurred during transcription');
    }
  }
};
