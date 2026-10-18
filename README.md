A modern, interactive indoor and outdoor navigation web application built with **React**, **Leaflet**, and **Supabase**. Locus Map helps users discover hospitals/venues, view facility details, navigate complex indoor floor plans using shortest-path graph algorithms (Dijkstra), and provides administrators with an interactive SVG-based floor plan editor.

---

Key Feature
**Interactive Map & Search**
  - Explore venues and hospitals across regions using **Leaflet** with custom markers and smooth `flyTo` transitions.
  - Real-time search and filter by venue name or city.

**Indoor Navigation & Pathfinding**
  - Visual floor plan routing powered by **Dijkstra's Algorithm** (`geometry.js`).
  - Searchable starting points and destinations with turn-by-turn step guidance.

**Admin SVG Floor Plan Editor (`/editor`)**
  - Interactive canvas for building venue navigation graphs directly over floor plan blueprints.
  - Create and position nodes, connect bidirectional edges, update room labels, and export graph data to JSON format.
  - Duplicate edge prevention and SVG coordinate matrix transformations.

**Authentication & Role-Based Access Control (RBAC)**
  - Powered by **Supabase Auth** and PostgreSQL **Row Level Security (RLS)**.
  - Automatic profile initialization via PostgreSQL triggers (`handle_new_user`).
  - Route guarding via `AdminRoute` protecting sensitive management pages (e.g., `/editor`).

**Responsive & Fluid UI**
  - Smooth page transitions and animations.
  - Adaptive layout for mobile and desktop screens.

---

Tech Stack

- **Frontend:** React 19, Vite, React Router v7
- **Mapping & GIS:** Leaflet, React-Leaflet
- **Backend & Database:** Supabase (Auth, PostgreSQL, Row-Level Security)
- **Styling & Assets:** Vanilla CSS (Modern CSS variables, animations)
- **Linter & Tooling:** Oxlint, Vite Plugin React Inspector

---

Project Structure

```text
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images and SVG icons
│   ├── data/
│   │   └── hospitals.json  # Venue, floor plan, and navigation graph dataset
│   ├── lib/
│   │   └── supabase.js     # Supabase client configuration
│   ├── pages/
│   │   ├── Splash.jsx      # Onboarding / landing screen
│   │   ├── Login.jsx       # User authentication screen
│   │   ├── Places.jsx      # Hospital listing & search directory
│   │   ├── VenueDetail.jsx # Venue overview & information
│   │   ├── VenueMap.jsx    # Indoor pathfinding & floor navigation
│   │   ├── SearchMap.jsx   # Interactive Leaflet map view
│   │   ├── Profile.jsx     # User profile & session management
│   │   └── Editor.jsx      # Admin SVG floor plan graph editor
│   ├── utils/
│   │   └── geometry.js     # Graph data structures & Dijkstra pathfinding
│   ├── App.jsx             # Route definitions & AdminRoute protection
│   └── main.jsx            # Application entry point
├── supabase-schema.sql     # Database schema, RLS policies, and triggers
├── vite.config.js          # Vite configuration
└── package.json            # Dependencies and npm scripts
```

---

Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Supabase](https://supabase.com/) project

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd "Locus Map"
npm install
```

### 2. Environment Variables Setup

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Configure your Supabase credentials in `.env`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup (Supabase)

1. Open your Supabase Dashboard and navigate to the **SQL Editor**.
2. Run the queries from `supabase-schema.sql` to initialize the `profiles` table, trigger, and Row Level Security (RLS) policies.
3. *(Optional)* To grant an admin role to a user for accessing `/editor`, run:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE username = 'your-username';
   ```

### 4. Run the Development Server

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

License
This project was developed for academic / portfolio purposes.
