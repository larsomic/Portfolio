<script lang="ts">
  import SEO from "$lib/components/seo.svelte";
  import {
    IconBrandGithub,
    IconBrandLinkedin,
    IconExternalLink,
    IconFileDownload,
    IconMail,
  } from "@tabler/icons-svelte";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";

  const PDF_HREF = "/Michael-Larson-Resume.pdf";

  const contacts = [
    {
      icon: IconMail,
      label: "mike28larson@gmail.com",
      href: "mailto:mike28larson@gmail.com",
    },
    {
      icon: IconBrandGithub,
      label: "@larsomic",
      href: "https://github.com/larsomic",
    },
    {
      icon: IconBrandLinkedin,
      label: "/in/larson2",
      href: "https://www.linkedin.com/in/larson2/",
    },
    {
      icon: IconExternalLink,
      label: "mike-larson.me",
      href: "https://mike-larson.me",
    },
  ];

  const experience = [
    {
      role: "Software Engineer 2",
      company: "Comcast",
      period: "Apr 2025 – Present",
      bullets: [
        "Built and launched the Fabric Portal from scratch in React and TypeScript, a self-service web front end for Comcast's Trino data platform (3,000 internal users) that replaced per-user driver setup, became new users' starting point for platform docs, and grew to ~300 users since its mid-2025 launch.",
        "Lead the Fabric Portal end to end, running planning and estimation, demoing weekly releases to a ~15-person team and to the CTO and Chief Data and AI Officer, and directing an offshore contract engineer by writing their tickets and reviewing every one of their 50+ frontend pull requests.",
        "Built a query tracker that finds each user's queries across every Trino coordinator, largely ending \"where did my query go?\" support questions.",
        "Integrated three internally built AI tools into the portal (docs Q&A, SQL query enhancement, and natural-language-to-SQL), now used by ~30% of portal users, passing each user's Azure SSO token through to the AI services and letting generated queries run in the query editor in one click.",
        "Cut Trino fleet provisioning and scaling from ~2 hours to ~10 minutes by replacing a manual, error-prone process with GitHub Actions workflows that run Terraform and the AWS CLI across 4 EC2 clusters of 10-20 nodes each.",
        "Created the portal's deployment pipeline from nothing with GitHub Actions, shipping weekly releases to 12 on-premises servers across two environments in ~10 minutes with zero-downtime rolling upgrades.",
        "Resolved 50+ support tickets and several production incidents on call for a 3,000-user internal Trino data platform, including tracing a missing-data report through Elasticsearch query logs to a stale upstream catalog owned by another team and resolving it with my tech lead the same day.",
        "Mentored an intern for a year through onboarding and technical coaching to a full-time conversion, then ramped him up on Query Fabric until he joined the on-call rotation.",
      ],
    },
    {
      role: "Software Engineer 1",
      company: "Meter Group Inc.",
      period: "Dec 2022 – Apr 2025",
      bullets: [
        "Cut initial page load from ~8s to under 500ms by adding server-side pagination across the backend and the React frontend, so sensor data is no longer fetched and sent in full on every request.",
        "Migrated 15+ pages of ZENTRA Cloud from server-rendered Django templates to React in a three-month rewrite led by my tech lead, giving customers faster, mobile-friendly pages with a refreshed design and refining the new UI with their feedback.",
        "Replaced static matplotlib charts with interactive React and Chart.js graphs for thousands of field sensors, downsampling large date ranges and handling gaps and out-of-range readings.",
        "Resolved 30+ customer-reported issues by email and support ticket, including tracing a missing-sensor-data report from the React UI to a backend time-zone bug and fixing it while pair programming with the backend engineer.",
        "Made the new React frontend responsive so the product works well on phones, converting Figma designs with React and MUI.",
      ],
    },
    {
      role: "Software Engineering Intern",
      company: "Meter Group Inc.",
      period: "Apr 2021 – Dec 2022",
      bullets: [
        "Built an automated Robot Framework end-to-end test suite covering critical frontend user flows and wrote the GitHub Actions pipeline that runs it on every deployment, catching 40+ bugs before release.",
        "Resolved 80+ frontend usability and functionality bugs found through the test suite and reported by users.",
      ],
    },
  ];

  const projects = [
    {
      name: "Personal Portfolio",
      href: "/",
      bullets: [
        "Built a SvelteKit and TypeScript portfolio of 6 live data explorers over public APIs, most with their own typed server endpoints, caching, and tests.",
      ],
    },
    {
      name: "Market Pulse",
      href: "/market-pulse",
      bullets: [
        "Built an end-of-day equities explorer with seven server endpoints proxying the Alpaca API using server-held credentials, routing failures through a typed error taxonomy so each card degrades independently.",
      ],
    },
    {
      name: "Sabermetric Seer",
      href: "/sabermetric-seer",
      bullets: [
        "Built a live MLB explorer that normalizes the MLB Stats API through typed parsers and stitches five stat endpoints into one game view with per-endpoint fallbacks.",
      ],
    },
    {
      name: "CrimsonCode 2021 Hackathon",
      href: "https://github.com/larsomic/CrimsonCode2021",
      bullets: [
        "Placed 2nd at Washington State University's CrimsonCode 2021 hackathon on a team of four with a virtual classroom built to keep students connected during COVID, building the feature that switches cameras and microphones on as students' avatars approach each other.",
      ],
    },
  ];

  const skills = [
    "React",
    "TypeScript",
    "JavaScript",
    "Svelte",
    "Python",
    "SQL",
    "C#",
    "Java",
    "Spring Boot",
    "Node.js",
    "Trino",
    "AWS",
    "Terraform",
    "GitHub Actions",
    "CI/CD",
    "HTML/CSS",
  ];
</script>

<SEO
  title="Résumé · Michael Larson"
  description="Résumé of Michael Larson — Software Engineer at Comcast, previously Meter Group. Experience, projects, education, and skills."
/>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-8 py-6 lg:py-10">
  <!-- Header -->
  <section class="flex flex-col gap-5">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <Badge variant="outline" class="rounded-full px-3">
          Software Engineer
        </Badge>
        <h1
          class="font-serif mt-3 text-4xl font-bold leading-tight sm:text-5xl"
        >
          Michael Larson
        </h1>
      </div>
      <a href={PDF_HREF} download>
        <Button>
          <IconFileDownload />
          Download PDF
        </Button>
      </a>
    </div>
    <ul class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
      {#each contacts as c (c.href)}
        <li>
          <a
            href={c.href}
            target={c.href.startsWith("http") ? "_blank" : undefined}
            rel={c.href.startsWith("http") ? "noreferrer" : undefined}
            class="hover:text-primary flex items-center gap-1.5 font-medium underline-offset-4 transition-colors hover:underline"
          >
            <c.icon class="size-3.5" />
            {c.label}
          </a>
        </li>
      {/each}
    </ul>
  </section>

  <!-- Experience -->
  <section class="flex flex-col gap-6">
    <h2
      class="border-border font-serif border-b pb-2 text-2xl font-bold tracking-tight"
    >
      Experience
    </h2>
    {#each experience as job (job.company + job.role)}
      <Card.Root>
        <Card.Header>
          <div
            class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"
          >
            <Card.Title class="text-lg">
              {job.role}
              <span class="text-muted-foreground ml-2 text-base font-normal">
                · {job.company}
              </span>
            </Card.Title>
            <span
              class="text-muted-foreground text-xs whitespace-nowrap tabular-nums"
            >
              {job.period}
            </span>
          </div>
          <ul
            class="text-muted-foreground mt-2 flex max-w-prose flex-col gap-1.5 text-sm leading-relaxed"
          >
            {#each job.bullets as bullet (bullet)}
              <li class="flex gap-2">
                <span
                  class="bg-primary/60 mt-[7px] size-1.5 shrink-0 rounded-full"
                ></span>
                {bullet}
              </li>
            {/each}
          </ul>
        </Card.Header>
      </Card.Root>
    {/each}
  </section>

  <!-- Projects -->
  <section class="flex flex-col gap-6">
    <h2
      class="border-border font-serif border-b pb-2 text-2xl font-bold tracking-tight"
    >
      Projects
    </h2>
    {#each projects as project (project.name)}
      <Card.Root>
        <Card.Header>
          <Card.Title class="text-base">
            {#if project.href}
              <a
                href={project.href}
                class="hover:text-primary underline-offset-4 transition-colors hover:underline"
                >{project.name}</a
              >
            {:else}
              {project.name}
            {/if}
          </Card.Title>
          <ul
            class="text-muted-foreground mt-1.5 flex max-w-prose flex-col gap-1.5 text-sm leading-relaxed"
          >
            {#each project.bullets as bullet (bullet)}
              <li class="flex gap-2">
                <span
                  class="bg-primary/60 mt-[7px] size-1.5 shrink-0 rounded-full"
                ></span>
                {bullet}
              </li>
            {/each}
          </ul>
        </Card.Header>
      </Card.Root>
    {/each}
  </section>

  <!-- Education + Skills -->
  <div class="grid gap-4 sm:grid-cols-2">
    <section class="flex flex-col gap-4">
      <h2
        class="border-border font-serif border-b pb-2 text-2xl font-bold tracking-tight"
      >
        Education
      </h2>
      <Card.Root class="min-h-[110px]">
        <Card.Header>
          <Card.Title class="text-base">Washington State University</Card.Title>
          <Card.Description>
            B.S. in Software Engineering · Minor in Statistics
            <br />
            Graduated December 2022
          </Card.Description>
        </Card.Header>
      </Card.Root>
    </section>

    <section class="flex flex-col gap-4">
      <h2
        class="border-border font-serif border-b pb-2 text-2xl font-bold tracking-tight"
      >
        Languages &amp; Skills
      </h2>
      <Card.Root class="min-h-[110px]">
        <Card.Header>
          <Card.Title class="text-base">Full-Stack Software Engineer</Card.Title>
          <div class="flex flex-wrap gap-2">
            {#each skills as skill (skill)}
              <Badge variant="secondary">{skill}</Badge>
            {/each}
          </div>
        </Card.Header>
      </Card.Root>
    </section>
  </div>
</div>
