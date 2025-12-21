/**
 * Scene Extraction Prompt Template
 *
 * Template for extracting visual scenes from story content.
 */

import { PromptBuilder } from '../builder';
import {
  SCENE_EXTRACTION_SYSTEM_PROMPT,
  buildSceneExtractionPrompt,
} from '../system';

/**
 * Scene extraction prompt template configuration
 */
export const SceneExtractionPromptTemplate = {
  id: 'scene-extraction-v1',
  version: '1.0.0',

  /**
   * Get system prompt for scene extraction
   */
  getSystemPrompt(): string {
    return SCENE_EXTRACTION_SYSTEM_PROMPT;
  },

  /**
   * Build user prompt for scene extraction
   */
  buildUserPrompt(storyContent: string): string {
    return buildSceneExtractionPrompt(storyContent);
  },

  /**
   * Build complete scene extraction prompt
   */
  build(storyContent: string) {
    return {
      system: this.getSystemPrompt(),
      user: this.buildUserPrompt(storyContent),
    };
  },
};
