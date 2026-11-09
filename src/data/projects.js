// Single source of truth for the projects. The Projects section lists them, and the 3D scene shows each
// one's name (and, in some layouts, its images).
//
// images: files under /public (shown as a slideshow). A project with no images gets a generated card.
// live / repo: optional links (repo only when it is public: private repos would 404 for visitors).
// Descriptions are first drafts written from the live sites and the code: edit freely.
export const PROJECTS = [
  {
    title: 'Meridian Estates',
    tag: 'Next.js · Luxury real estate',
    desc: 'A showcase site for a luxury villa brand: premium residences and bespoke interior furnishing, presented as works of architecture.',
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
    live: 'https://tree-design.vercel.app',
    repo: null, // private repository
    images: [
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
    tag: 'React · Full-stack · Hair atelier',
    desc: 'Website and booking for a hair atelier in Ahmedabad: services, festive offers, a product shelf, a gallery and appointment requests, with a backend behind it.',
    live: 'https://expert-hair-arts.vercel.app',
    repo: null, // private repository
    images: ['/projects/expert-hairarts/home.jpg', '/projects/expert-hairarts/combos.jpg'],
  },
  {
    title: 'VehicleInsure',
    tag: 'TypeScript · 7th-sem group project',
    desc: 'Vehicle insurance web app: apply, manage and claim from one dashboard, with real-time policy tracking.',
    live: 'https://vehicle-insurance-application.vercel.app',
    repo: 'https://github.com/meetlimbani87/vehicle-insurance-application',
    images: ['/projects/vehicle-insurance/home.jpg'],
  },
  {
    title: 'InstaSales AI',
    tag: 'AI · Instagram sales assistant',
    desc: 'An AI sales assistant for Instagram businesses: it handles customer conversations, tracks leads and runs reel automations from one dashboard.',
    live: 'https://ig-sales-assistant.vercel.app',
    repo: null, // private repository
    images: [], // needs a screenshot that does not show real account data
  },
  {
    title: 'Spring Auth App',
    tag: 'Java · Spring Boot · Security',
    desc: 'A Spring Boot authentication app: registration, login and logout with Spring Security, BCrypt password hashing, Thymeleaf pages and an H2 database.',
    live: null,
    repo: 'https://github.com/meetlimbani87/springboot-app',
    images: [], // backend project: no screenshot yet
  },
]
