import {
  ChatPromptTemplate,
  PromptTemplate,
  SystemMessagePromptTemplate,
  AIMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "langchain/prompts";


async function promptTextWithChatGPT(input_language, output_language, text) {
  const template = "You are a helpful assistant that translates {input_language} to {output_language}. This is what you have to translate: ";
  const systemMessagePrompt = SystemMessagePromptTemplate.fromTemplate(template);
  const humanTemplate = "{text}";
  const humanMessagePrompt = HumanMessagePromptTemplate.fromTemplate(humanTemplate);

  const prompt = new PromptTemplate({
    template: "You are a helpful assistant that translates {input_language} to {output_language}.",
    inputVariables: ["input_language", "output_language"],
  });

  const chatPrompt = ChatPromptTemplate.fromPromptMessages([systemMessagePrompt, humanMessagePrompt]);

  // Format the messages
  const messages = await chatPrompt.formatMessages({
    input_language,
    output_language,
    text
  });

  // Convert the messages array into a string
  const formattedChatPrompt = messages.map(message => message.content).join('\n');

  return formattedChatPrompt;
}

export { promptTextWithChatGPT };
