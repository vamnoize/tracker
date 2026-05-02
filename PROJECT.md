# HealthTrack

A personal health tracking web application.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Database & Auth | Supabase |
| Image Storage | Cloudinary |
| AI Food Analysis | Google Gemini (`gemini-3-flash-preview`) |
| Deployment | Vercel |
| Styling | Plain CSS files in `styles/` |

---

## Features

### Authentication
- Register with Email + Password (`/register`)
- Login (`/login`)
- Email confirmation via Supabase (click link in email)
- If email confirmation is disabled in Supabase, users are signed in immediately after registration

### Dashboard (`/`)
- Shows today's calorie and protein intake vs. daily limits
- Progress bars indicating usage percentage (turns red when limit is exceeded)
- Displays carbs, fat, and remaining calories
- Placeholder cards for **Body Composition** and **Weight & Measurements** (coming soon)

### Food Tracking (`/food`)
- Upload a food photo → Gemini automatically analyzes nutrition content
- Shows each food item with estimated portion, calories, protein, carbs, and fat
- Save meal → image stored in Cloudinary, data stored in Supabase
- View all meals logged today
- Delete a meal
- Daily nutrition summary bar at the top

### Profile (`/profile`)
- Set daily calorie limit (default: 2,000 kcal)
- Set daily protein limit (default: 50g)
- Sign out

---

## File Structure

```
health-tracker/
├── app/
│   ├── page.tsx                  # Dashboard
│   ├── login/                    # Login page
│   ├── register/                 # Register page
│   ├── food/                     # Food tracking page
│   ├── profile/                  # Profile & settings page
│   ├── auth/callback/            # Handles email confirmation redirect
│   └── api/
│       ├── analyze-food/         # Calls Gemini to analyze food image
│       └── upload-image/         # Uploads image to Cloudinary
├── components/
│   ├── Navbar.tsx
│   └── AddMealModal.tsx          # Modal for uploading and analyzing food
├── lib/
│   ├── supabase/                 # client / server / middleware
│   ├── gemini.ts                 # Google Gemini integration
│   └── cloudinary.ts             # Cloudinary upload
├── styles/                       # CSS files per section
│   ├── globals.css
│   ├── navbar.css
│   ├── dashboard.css
│   ├── food.css
│   ├── profile.css
│   └── login.css
├── types/index.ts                # Shared TypeScript types
├── middleware.ts                 # Auth guard
├── supabase-schema.sql           # SQL to create tables and RLS policies
└── .env.local.example            # Environment variable template
```

---

## Database Schema (Supabase)

### `profiles`
| Column | Type | Default |
|---|---|---|
| id | uuid (FK → auth.users) | — |
| email | text | — |
| name | text | — |
| avatar_url | text | — |
| daily_calorie_limit | integer | 2000 |
| daily_protein_limit | integer | 50 |

### `meal_logs`
| Column | Type |
|---|---|
| id | uuid |
| user_id | uuid (FK → profiles) |
| image_url | text |
| food_items | jsonb (array of FoodItem) |
| total_calories | integer |
| total_protein | numeric |
| total_carbs | numeric |
| total_fat | numeric |
| analysis_text | text |
| logged_at | timestamptz |

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GOOGLE_API_KEY=
```

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local
cp .env.local.example .env.local
# Fill in all keys

# 3. Run SQL in Supabase SQL Editor
# (copy from supabase-schema.sql)

# 4. Run locally
npm run dev

# 5. Deploy
npx vercel --prod
# Remember to add environment variables in the Vercel dashboard
```

---

## Roadmap

- [ ] Body Composition Analysis — log values from InBody / Tanita machines
- [ ] Weight & Body Measurements — track weight, waist, hip circumference
- [ ] Progress charts over time
