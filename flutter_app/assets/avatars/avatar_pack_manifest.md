# Friendoo Avatar Pack Specification

This pack replaces the prior repeated-image profile avatar assets with **20 original, role-specific 3D social-avatar portraits**. It uses an original, friendly metaverse-avatar aesthetic: expressive but realistic proportions, centred head-and-shoulders framing, soft studio lighting, no text, and plain pastel backdrops. It does not use third-party character assets or branded likenesses.

Every item must be a unique 1:1 JPEG portrait, suitable for circular crops using `BoxFit.cover` and `Alignment.topCenter`. Each character has a distinct face shape, complexion, hairstyle, outfit, and background colour. All visible people are adult characters.

## User Pack

| ID | File | Character anchors | Outfit colour | Background |
| --- | --- | --- | --- | --- |
| `user_01` | `avatar_user_01.jpg` | Adult South Asian man, oval face, short textured black hair, clean-shaven | Cobalt blue overshirt | Mist blue |
| `user_02` | `avatar_user_02.jpg` | Adult South Asian man, round face, tapered curly hair, neat stubble | Forest-green sweatshirt | Pale mint |
| `user_03` | `avatar_user_03.jpg` | Adult South Asian man, angular face, wavy side part, light beard | Burgundy bomber jacket | Warm blush |
| `user_04` | `avatar_user_04.jpg` | Adult South Asian man, heart-shaped face, cropped curls, glasses | Mustard crewneck | Soft cream |
| `user_05` | `avatar_user_05.jpg` | Adult South Asian man, square face, close fade, full short beard | Terracotta polo | Sand |
| `user_06` | `avatar_user_06.jpg` | Adult South Asian man, long rectangular face, quiff, moustache and beard | Indigo hoodie | Lavender |
| `user_07` | `avatar_user_07.jpg` | Adult South Asian man, broad oval face, swept-back hair, clean-shaven | Coral casual shirt | Peach |
| `user_08` | `avatar_user_08.jpg` | Adult South Asian man, diamond face, curly medium crop, rimless glasses | Teal knit top | Aqua |
| `user_09` | `avatar_user_09.jpg` | Adult South Asian man, soft round face, buzz cut, trimmed beard | Charcoal denim jacket | Cool grey |
| `user_10` | `avatar_user_10.jpg` | Adult South Asian man, oval face, shoulder-length tied hair, moustache | Plum jacket | Lilac |

## Host Pack

| ID | File | Character anchors | Outfit colour | Background |
| --- | --- | --- | --- | --- |
| `host_01` | `avatar_host_01.jpg` | Adult South Asian woman, oval face, long loose waves, subtle bindi | Rose-pink kurti | Powder pink |
| `host_02` | `avatar_host_02.jpg` | Adult South Asian woman, round face, chin-length layered bob, earrings | Turquoise blouse | Sky blue |
| `host_03` | `avatar_host_03.jpg` | Adult South Asian woman, heart-shaped face, high curly ponytail, glasses | Violet blazer | Lavender |
| `host_04` | `avatar_host_04.jpg` | Adult South Asian woman, square face, braided crown, hoops | Orange wrap top | Apricot |
| `host_05` | `avatar_host_05.jpg` | Adult South Asian woman, diamond face, sleek low bun, fine necklace | Emerald-green kurti | Mint |
| `host_06` | `avatar_host_06.jpg` | Adult South Asian woman, broad oval face, shoulder-length curls, small nose stud | Cobalt top | Periwinkle |
| `host_07` | `avatar_host_07.jpg` | Adult South Asian woman, long face, side-swept straight hair, geometric earrings | Coral-red blouse | Peach |
| `host_08` | `avatar_host_08.jpg` | Adult South Asian woman, round face, short pixie cut, glasses | Mustard cardigan | Butter yellow |
| `host_09` | `avatar_host_09.jpg` | Adult South Asian woman, oval face, thick braid over shoulder, jhumka earrings | Deep plum kurti | Mauve |
| `host_10` | `avatar_host_10.jpg` | Adult South Asian woman, heart-shaped face, soft grey-streaked bun, pendant | Teal sari blouse | Pale aqua |

## Rendering and Integration Requirements

The mobile UI should use `FriendooAvatar` to render the persisted selection. New pack identifiers follow `user_01`–`user_10` and `host_01`–`host_10`. Legacy identifiers (`m_19` through `m_45`, `f_18` through `f_42`) will be supported as aliases during transition, but new selections and defaults use role-oriented IDs.
