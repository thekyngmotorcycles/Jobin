/** Jobin publication policy v1. Applies equally to all creators and professions. */
export const JOBIN_CONTENT_CATEGORIES = ["work_demonstration","education","professional_services","work_experience","professional_entertainment"] as const;
export type JobinContentCategory=typeof JOBIN_CONTENT_CATEGORIES[number];
export type RelevanceDecision="approve"|"review"|"reject";
export interface ProfessionalEvidence {
  category:JobinContentCategory|null;
  visualEvidence:boolean;
  audioEvidence:boolean;
  onScreenTextEvidence:boolean;
  meaningfulWorkConnection:boolean;
  confidence:number;
  explanation:string;
}
/** A profession, title, hashtags, or caption alone never establish relevance. */
export function decideProfessionalRelevance(e:ProfessionalEvidence):RelevanceDecision {
 if(!Number.isFinite(e.confidence)||e.confidence<0||e.confidence>1)throw new Error("Invalid relevance confidence");
 if(!e.explanation.trim())throw new Error("Relevance evidence requires an explanation");
 if(e.category!==null&&!JOBIN_CONTENT_CATEGORIES.includes(e.category))throw new Error("Unknown professional category");
 if(!e.meaningfulWorkConnection||e.category===null)return e.confidence>=0.90?"reject":"review";
 if(!e.visualEvidence&&!e.audioEvidence&&!e.onScreenTextEvidence)return "review";
 return e.confidence>=0.90?"approve":"review";
}
export const JOBIN_RELEVANCE_POLICY = {
 version:"2026-11-06",
 principles:[
  "Judge the video itself, not the creator's profession, identity or gender.",
  "Allow real work, teaching, business services, workplace experiences and professional humor.",
  "Speech is optional: work shown visually or explained by on-screen subtitles can qualify.",
  "A job-related caption, hashtag or profile profession alone is insufficient.",
  "General entertainment, personal gym routines and lifestyle posts without a substantive work connection do not qualify.",
  "Professional humor must center on an actual work situation, not merely use work-related hashtags.",
  "Ambiguous or low-confidence content goes to human review; provide reasons and an appeal route.",
  "Review footage across the entire clip, including scene changes and on-screen text; do not trust only the thumbnail."
 ] as const
} as const;
