// Type definitions for OpenAI API requests and responses

export interface Hero {
  name: string;
  primaryTrait: string;
  secondaryTrait: string;
  appearance: string;
  specialAbility: string;
  avatarPrompt?: string;
  avatarGenerationId?: string;
}

export interface StoryEvent {
  rawValue: string;
  promptSeed: string;
}

export interface CustomStoryEvent {
  title: string;
  promptSeed: string;
  keywords: string[];
  tone: string;
  ageRange: string;
  category: string;
}

export interface StoryGenerationRequest {
  hero: Hero;
  event: StoryEvent;
  targetDuration: number; // in seconds
  language: string;
}

export interface CustomStoryGenerationRequest {
  hero: Hero;
  customEvent: CustomStoryEvent;
  targetDuration: number;
  language: string;
}

export interface StoryGenerationResponse {
  title: string;
  content: string;
  estimatedDuration: number;
  scenes?: StoryScene[];
}

export interface StoryScene {
  sceneNumber: number;
  textSegment: string;
  illustrationPrompt: string;
  timestamp: number;
  emotion: 'joyful' | 'peaceful' | 'exciting' | 'mysterious' | 'heartwarming' | 'adventurous' | 'contemplative';
  importance: 'key' | 'major' | 'minor';
}

export interface SceneExtractionRequest {
  storyContent: string;
  storyDuration: number;
  hero: Hero;
  eventContext: string;
}

export interface AudioGenerationRequest {
  text: string;
  voice: string;
  language: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  size?: string; // "1024x1024", "1024x1536", or "1536x1024"
  quality?: string; // "low", "medium", "high"
  previousGenerationId?: string;
}

export interface ImageGenerationResponse {
  imageData: string; // base64 encoded
  revisedPrompt?: string;
  generationId?: string;
}

export interface AvatarGenerationRequest extends ImageGenerationRequest {
  hero: Hero;
}

export interface PromptSanitizationRequest {
  prompt: string;
}

export interface AIAssistantRequest {
  description: string;
  title?: string;
  category?: string;
  ageRange?: string;
  tone?: string;
}

export interface OpenAIError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}
