import { z } from 'zod';

export const genderSchema = z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say']);

export const onboardingProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, and underscores only'),
  city: z.string().min(1, 'City is required').max(100),
  bio: z.string().max(500).optional().default(''),
  interests: z.array(z.string()).max(20).default([]),
  languages: z.array(z.string()).min(1).max(10),
  gender: genderSchema,
  age: z.coerce.number().int().min(13, 'You must be at least 13').max(120),
  friendshipIntent: z.string().max(200).optional().default(''),
  preferredChatModes: z.array(z.enum(['text', 'voice'])).max(2).default(['text']),
  guidelinesAccepted: z
    .boolean()
    .refine((v) => v === true, { message: 'You must accept the community guidelines' }),
});

export type OnboardingProfileInput = z.infer<typeof onboardingProfileSchema>;

export const buildUserDocument = (input: OnboardingProfileInput, ctx: { uid: string; displayName: string; photoURL: string }) => {
  const now = new Date().toISOString();
  return {
    uid: ctx.uid,
    displayName: ctx.displayName,
    username: input.username,
    city: input.city,
    bio: input.bio ?? '',
    interests: input.interests,
    languages: input.languages,
    gender: input.gender,
    age: input.age,
    friendshipIntent: input.friendshipIntent ?? '',
    preferredChatModes: input.preferredChatModes,
    guidelinesAccepted: input.guidelinesAccepted,
    onboarded: true,
    photoURL: ctx.photoURL,
    createdAt: now,
    lastActive: now,
    trustScore: 50,
    profileCompleteness: 0.85,
  };
};
