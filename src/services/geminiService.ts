import { GoogleGenAI, Type } from "@google/genai";
import { Attributes, LifeEvent, Gender } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateBirthEvent(name: string, gender: Gender): Promise<LifeEvent> {
  const prompt = `为名为 ${name} (${gender}) 的婴儿生成一个出生事件。
  包含一段简短、富有诗意的出生描述和家庭背景。
  请使用中文回答。
  返回 JSON 格式。`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "事件标题" },
          description: { type: Type.STRING, description: "事件详细描述" },
        },
        required: ["title", "description"],
      },
    },
  });

  const data = JSON.parse(response.text);
  return {
    id: Math.random().toString(36).substr(2, 9),
    age: 0,
    title: data.title,
    description: data.description,
    type: 'neutral',
  };
}

export async function generateYearlyEvent(age: number, attributes: Attributes): Promise<LifeEvent> {
  const prompt = `角色当前 ${age} 岁。
  当前属性：健康: ${attributes.health}, 幸福: ${attributes.happiness}, 智力: ${attributes.intelligence}, 财富: ${attributes.wealth}, 颜值: ${attributes.looks}。
  生成一个在这个年龄可能发生的随机生活事件。
  可以是简单事件或抉择类事件。
  如果是抉择，请提供 2-3 个选项。
  请务必使用中文回答。
  在事件描述中，如果是非抉择事件，请在 impact 字段中明确数值变化（正负 1-20 之间）。
  返回 JSON 格式。`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "事件标题" },
          description: { type: Type.STRING, description: "事件详细描述" },
          type: { type: Type.STRING, enum: ["neutral", "positive", "negative", "choice"], description: "事件类型" },
          impact: {
            type: Type.OBJECT,
            properties: {
              health: { type: Type.NUMBER },
              happiness: { type: Type.NUMBER },
              intelligence: { type: Type.NUMBER },
              looks: { type: Type.NUMBER },
              wealth: { type: Type.NUMBER },
            }
          },
          choices: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: "选项文字" },
                outcomeDescription: { type: Type.STRING, description: "选择后的结果描述" },
                impact: {
                  type: Type.OBJECT,
                  properties: {
                    health: { type: Type.NUMBER },
                    happiness: { type: Type.NUMBER },
                    intelligence: { type: Type.NUMBER },
                    looks: { type: Type.NUMBER },
                    wealth: { type: Type.NUMBER },
                  }
                }
              },
              required: ["text", "outcomeDescription", "impact"]
            }
          }
        },
        required: ["title", "description", "type"],
      },
    },
  });

  const data = JSON.parse(response.text);
  
  // Ensure choices have IDs
  if (data.choices) {
    data.choices = data.choices.map((c: any) => ({
      ...c,
      id: Math.random().toString(36).substr(2, 9)
    }));
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    age,
    ...data,
  };
}
