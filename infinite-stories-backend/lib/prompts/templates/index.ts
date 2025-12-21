export {
  AvatarPromptTemplate,
  buildAvatarPrompt,
  type AvatarContext,
} from './avatar.template';

export {
  StoryPromptTemplate,
  getSystemPrompt,
  getUserPrompt,
  type StoryContext,
} from './story.template';

export {
  IllustrationPromptTemplate,
  buildIllustrationPrompt,
  type IllustrationContext,
  type HeroReference,
} from './illustration.template';

export { SceneExtractionPromptTemplate } from './scene-extraction.template';
