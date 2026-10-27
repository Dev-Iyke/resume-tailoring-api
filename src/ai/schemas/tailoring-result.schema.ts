import { z } from 'zod';

const RequirementMatchSchema = z.strictObject({
  requirement: z.string(),
  evidence: z.array(z.string()),
});

const GapSchema = z.strictObject({
  requirement: z.string(),
  explanation: z.string(),
});

const ExperienceItemSchema = z.strictObject({
  role: z.string(),
  organization: z.string(),
  dates: z.string(),
  details: z.array(z.string()),
});

const ProjectItemSchema = z.strictObject({
  name: z.string(),
  dates: z.string(),
  tools: z.array(z.string()),
  highlights: z.array(z.string())
});

const EducationItemSchema = z.strictObject({
  qualification: z.string(),
  institution: z.string(),
  dates: z.string(),
  details: z.array(z.string()),
});

const OtherSectionSchema = z.strictObject({
  heading: z.string(),
  content: z.string(),
});

const CoverLetterSchema = z.strictObject({
  greeting: z.string(),
  opening: z.string(),
  body: z.array(z.string()),
  closing: z.string(),
  signOff: z.string(),
});

export const TailoringResultSchema = z.strictObject({
  fitAnalysis: z.strictObject({
    summary: z.string(),
    matchedRequirements: z.array(RequirementMatchSchema),
    gaps: z.array(GapSchema),
  }),
  resumeDraft: z.strictObject({
    professionalSummary: z.string(),
    skills: z.array(z.string()),
    experience: z.array(ExperienceItemSchema),
    projects: z.array(ProjectItemSchema),
    education: z.array(EducationItemSchema),
    other: z.array(OtherSectionSchema),
  }),
  coverLetter: CoverLetterSchema,
});

export type TailoringResult = z.infer<typeof TailoringResultSchema>;

export const tailoringResultJsonSchema =
  z.toJSONSchema(TailoringResultSchema);