# Friendoo Desi-Inspired Avatar Art Direction

## Creative direction

Friendoo avatars should feel recognizably **Desi in a contemporary, inclusive way** rather than resembling generic AI portraits. The visual language is a polished editorial illustration style informed by South Asian color stories, textile-inspired geometry, modern streetwear, and warm social expression. Each identity remains fictional, non-photorealistic, and intentionally non-recognizable.

> The goal is cultural warmth and familiarity, not costume, caricature, celebrity likeness, or a narrow definition of South Asian identity.

## Visual ingredients

| Layer | Direction |
|---|---|
| Palette | Gulabi pink, marigold, indigo, peacock teal, henna brown, turmeric, and Friendoo electric purple. |
| Backgrounds | Soft radial halos with subtle block-print, wave, or rangoli-inspired geometric rhythm; no text. |
| Clothing | Contemporary kurta-inspired collars, patterned overshirts, soft dupatta-inspired wraps, hoodies with woven border accents, simple bandh collars, and modern casual silhouettes. |
| Details | Small jhumka-inspired geometric studs, hair clips, bangles, headphones, a tiny microphone pin, or glasses. Accessories remain optional and understated. |
| Expression | Friendly, relaxed, conversational; never a recognizable real individual. |
| Composition | Centered head-and-shoulders crop that works cleanly in a circular mobile-avatar frame. |

## Representation rules

The starter pack should deliberately vary skin-tone palettes, hair texture/length, face-shape abstraction, clothing, and accessory choices. It must not label identities by ethnicity, religion, caste, nationality, gender, or age. It must not use sacred symbols, flags, scripts, celebrity styling, wedding costume, or exaggerated facial features.

## Asset roles

| Asset | Intended use |
|---|---|
| Desi reference | Visual anchor for consistent generation and design review. |
| Host display avatar | Premium-but-friendly illustrated host identity, suitable when a host does not use an approved photo. |
| User avatars | Default generated selections for user onboarding and contact lists. |
| Night-call avatar | Dark-mode identity for active call screens; may transition to the abstract audio orb for higher anonymity. |

## Implementation note

These images are optional visual seed assets. Flutter’s `FriendooAvatar` renderer remains deterministic and privacy-safe. The future enhancement is to translate this art direction into matching seed-driven shapes, colors, and accessories; unapproved uploads never replace the generated fallback.
