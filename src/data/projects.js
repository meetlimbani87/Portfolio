// Single source of truth for the projects. The Projects section lists them, the 3D rings carry their names, and
// double-clicking a ring opens the write-up (summary, highlights, stack, gallery) from this file.
//
// desc:       one or two lines, shown beside the rings
// summary:    the write-up: keep it to ONE short paragraph so the panel fits on screen without scrolling
// highlights: three short points about what is worth knowing (keep each to about one line)
// stack:      the main technologies (up to six or so)
// images:     files under /public (a gallery; each one is shown at full size, so keep them sharp, 1280px wide or more)
// badges:     short labels shown above the title (e.g. Shipped, live user numbers)
// live / repo: optional links (repo only when it is public: private repos would 404 for visitors)
// The write-ups come from the live sites and from reading each project's code.
export const PROJECTS = [
  {
    title: 'Meridian Estates',
    tag: 'Next.js · Luxury real estate',
    desc: 'A showcase site for a luxury villa brand: premium residences and bespoke interior furnishing, presented as works of architecture.',
    summary: [
      'A single-page site for a luxury architecture and real-estate brand, presenting each villa as a piece of architecture rather than a listing: big imagery, slow motion, lots of space.',
    ],
    highlights: [
      'Scroll-scrubbed video hero: one 11 MB video replaced 600 frames (143 MB)',
      'GSAP ScrollTrigger and Lenis smooth scrolling, with a loading screen',
      'Custom cursor that changes colour with each section',
    ],
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'GSAP', 'Lenis'],
    live: 'https://meridian-project-ruby.vercel.app',
    repo: 'https://github.com/meetlimbani87/Meridian-Project',
    images: [
      '/projects/meridian/villa-aurea.jpg',
      '/projects/meridian/casa-marbella.jpg',
      '/projects/meridian/the-olive-estate.jpg',
      '/projects/meridian/smart-sanctuary.jpg',
      '/projects/meridian/villa-solstice.jpg',
      '/projects/meridian/botanical-pavilion.jpg',
    ],
  },
  {
    title: 'Tree Design Studio',
    tag: 'React · Full-stack · Printing & packaging',
    desc: 'Website for a premium printing and packaging studio in Ahmedabad: visiting cards, coin boxes, gift packaging and wedding invitations, with services, a portfolio and customer login.',
    summary: [
      'A full-stack site for a premium printing and packaging studio in Ahmedabad. Visitors browse services and the portfolio, ask for a quote and follow their orders; the owner manages everything from an admin area.',
    ],
    highlights: [
      'Customer accounts with email and Google sign-in, and order history',
      'Quote requests saved to a database; admin catalogue and image manager',
      'Express API with JWT auth and rate limiting, Prisma migrations',
    ],
    stack: ['React', 'TypeScript', 'Vite', 'Node.js', 'Prisma', 'PostgreSQL'],
    badges: ['Shipped', 'AI-augmented delivery'],
    live: 'https://tree-design.vercel.app',
    repo: null, // private repository
    images: [
      '/projects/tree-design/home.jpg',
      '/projects/tree-design/product-1.jpg',
      '/projects/tree-design/product-2.jpg',
      '/projects/tree-design/product-3.jpg',
      '/projects/tree-design/product-4.jpg',
      '/projects/tree-design/product-5.jpg',
      '/projects/tree-design/product-6.jpg',
    ],
  },
  {
    title: 'Expert HairArts',
    tag: 'Next.js · Full-stack · Hair atelier',
    desc: 'Live with 300+ users: website and booking for a hair atelier in Ahmedabad: services, festive offers, a product shelf, a gallery and appointment requests, with a full backend and admin panel.',
    summary: [
      'Website and booking system for an established hair atelier in Ahmedabad, live with 300+ users: an honest price menu, offers, a gallery, and a six-step booking flow, backed by its own API and an admin panel for the salon.',
    ],
    highlights: [
      'Booking wizard with per-stylist schedules and a server-side conflict check',
      'Admin panel: appointments, customers, staff, services, gallery',
      'Reminder and review-request emails sent by a background scheduler',
    ],
    stack: ['Next.js', 'TypeScript', 'Express', 'Drizzle ORM', 'PostgreSQL', 'Cloudinary'],
    badges: ['Shipped', '300+ live users', 'AI-augmented delivery'],
    live: 'https://expert-hair-arts.vercel.app',
    repo: null, // private repository
    images: [
      '/projects/expert-hairarts/home.jpg',
      '/projects/expert-hairarts/services.jpg',
      '/projects/expert-hairarts/booking.jpg',
      '/projects/expert-hairarts/combos.jpg',
    ],
  },
  {
    title: 'VehicleInsure',
    tag: 'React · TypeScript · 7th-sem group project',
    desc: 'Vehicle insurance web app: apply, manage and claim from one dashboard, with real-time policy tracking.',
    summary: [
      'A vehicle insurance web app built as a seventh-semester group project: apply for a policy, pay, file and track claims from one dashboard, with an admin side that reviews claims and keeps an audit trail.',
    ],
    highlights: [
      'Landing page, sign-in and registration with a password strength meter',
      'Policies, claims and payments flows, plus admin claims and audit logs',
      'React Query hooks, Zod validation, and a mock data layer so it runs without a backend',
    ],
    stack: ['React 19', 'TypeScript', 'Vite', 'Tailwind CSS 4', 'React Router 7', 'TanStack Query'],
    live: 'https://vehicle-insurance-application.vercel.app',
    repo: 'https://github.com/meetlimbani87/vehicle-insurance-application',
    images: [
      '/projects/vehicle-insurance/home.jpg',
      '/projects/vehicle-insurance/features.jpg',
      '/projects/vehicle-insurance/register.jpg',
    ],
  },
  {
    title: 'InstaSales AI',
    tag: 'AI · Instagram sales assistant',
    desc: 'An AI sales assistant for Instagram DMs: it answers routine questions from your real catalogue, hands important chats to a person, and keeps every lead in one pipeline.',
    summary: [
      'An AI sales assistant for businesses that sell over Instagram DMs. It answers routine questions from the shop’s real product catalogue, spots the customers ready to buy, and hands the important chats to the team with a summary, so every lead ends up in one organised pipeline.',
    ],
    highlights: [
      'Quotes only prices the owner approves; discounts, bulk orders and complaints go to a person',
      'Every AI reply is checked on the server, capped at 12 per chat per hour',
      'Tokens encrypted at rest (AES-256-GCM); webhooks verified with HMAC SHA-256',
    ],
    stack: ['AI assistant', 'Instagram', 'Web dashboard'],
    live: 'https://ig-sales-assistant.vercel.app',
    repo: null, // private repository
    images: [
      '/projects/instasales-ai/home.jpg',
      '/projects/instasales-ai/features.jpg',
      '/projects/instasales-ai/how-it-works.jpg',
      '/projects/instasales-ai/safety.jpg',
    ], // the public landing page (its chats are the site's own demo data), not the logged-in dashboard
  },
  {
    title: 'Spring Auth App',
    tag: 'Java · Spring Boot · Security',
    desc: 'A Spring Boot authentication app: registration, login and logout with Spring Security, BCrypt password hashing, Thymeleaf pages and an H2 database.',
    summary: [
      'A small, complete authentication app in Java: people register, sign in and out, and reach a dashboard only logged-in users can see. A study in doing the security basics properly.',
    ],
    highlights: [
      'Spring Security form login with custom login page and handlers',
      'BCrypt password hashing; only an explicit allow-list of routes is public',
      'Layered code (controller, service, repository) with Thymeleaf pages',
    ],
    stack: ['Java', 'Spring Boot', 'Spring Security', 'Spring JDBC', 'Thymeleaf', 'H2'],
    live: null,
    repo: 'https://github.com/meetlimbani87/springboot-app',
    images: [], // backend project: no screenshot yet
  },
]
