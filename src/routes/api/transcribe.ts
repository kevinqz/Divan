export async function post(request) {
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
      return {
        status: 200,
        body: data?.text || "Transcription could not be completed",
      };
    } else {
      const errorData = await response.json();
      console.error("Transcription request failed. Error:", errorData);
      return {
        status: 400,
        body: "Transcription request failed",
      };
    }
  } catch (error) {
    console.error("Error during transcription:", error);
    return {
      status: 500,
      body: "An error occurred during transcription",
    };
  }
}
