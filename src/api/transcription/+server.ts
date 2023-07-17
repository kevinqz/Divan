import { json } from '@sveltejs/kit';

export const POST = async (event: any) => {
  const requestBody = await event.request.formData();
  const requestFile = requestBody.get('file');

  // Request config.
  const file = new Blob([requestFile], { type: 'video/mp4' });

  const formData = new FormData();
  formData.append('file', file, 'video.mp4');
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');

  // Add your OpenAI API secret key here
  const OPENAI_API_SECRET_KEY = process.env['OPENAI_API_SECRET_KEY'];

  // Make the transcription request to OpenAI API
  const transcriptionResponse = await fetch(
    'https://api.openai.com/v1/audio/transcriptions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_SECRET_KEY}`,
        Accept: 'application/json',
      },
      body: formData,
    }
  );

  const data = await transcriptionResponse.json();
  const transcribedText = data?.text || '';

  return json({ transcribedText });
};
