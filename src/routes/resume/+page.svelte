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
        "Lead developer on a React internal portal (a project within a larger team) used daily by 3,000+ employees for running SQL queries, connecting with support, and AI-assisted query tuning; direct a two-person project team and own the work end-to-end — from solution design and estimation through production rollout — setting code-quality and delivery standards via code review and hands-on guidance.",
        "Mentored an intern over the past year through onboarding and hands-on technical coaching, guiding them to a full-time conversion and continuing to mentor them as the second engineer on my project.",
        "Built the frontend/UX for an AI-assisted SQL query-tuning feature, surfacing model-generated tuning suggestions to users within the portal.",
        "Built a GitHub Actions CI/CD suite with Terraform and the AWS CLI to provision and auto-scale EC2 instances across multiple availability zones, cutting deployments to ~10 minutes with zero-downtime rolling upgrades.",
      ],
    },
    {
      role: "Software Engineer 1",
      company: "Meter Group Inc.",
      period: "Dec 2022 – Apr 2025",
      bullets: [
        "Designed and built, end-to-end, a backend consolidation unifying 6 API services behind a single gateway for a data/analytics platform processing large-scale environmental sensor (IoT) data — reducing average endpoint response time from 900ms to 350ms (~61%) and lowering client load times across platforms.",
        "Implemented server-side pagination and query optimization over a million-row sensor dataset, reducing initial page load from ~8s to under 500ms and delivering scalable, performant data access.",
        "Converted Figma designs into responsive, mobile-optimized interfaces with React and MUI, improving mobile UX and contributing to a 60% year-over-year increase in mobile traffic.",
      ],
    },
    {
      role: "Software Engineering Intern",
      company: "Meter Group Inc.",
      period: "Apr 2021 – Dec 2022",
      bullets: [
        "Built an automated end-to-end test suite with Robot Framework simulating frontend user flows, surfacing and resolving 40+ bugs before release and establishing regression coverage for critical paths.",
        "Resolved 80+ frontend bugs across usability and functionality defects, contributing to a measurable drop in inbound user-reported issues over the following release cycles.",
        "Improved web app responsiveness and cross-browser compatibility through adaptive/responsive design, validated with cross-device testing to ensure consistent rendering across major browsers and screen sizes.",
      ],
    },
  ];

  const projects = [
    {
      name: "Personal Portfolio",
      href: "/",
      bullets: [
        "Crafted a portfolio website leveraging Svelte and shadcn UI, with a focus on contemporary, mobile-responsive design — showcasing software engineering abilities to industry professionals.",
        "Designed an intuitive interface incorporating backend features such as direct-email functionality, letting potential employers and clients connect effortlessly.",
      ],
    },
    {
      name: "Sabermetric Seer",
      href: "/sabermetric-seer",
      bullets: [
        "Programmed a full-stack application using Python and React to interactively explore sabermetric data across seasons and teams, predicting what future player seasons could look like.",
        "Used TensorFlow's linear regression to analyze how variables like hits, strikeouts, and home runs correlated with wins, and built a visualizer comparing production to earned wages.",
      ],
    },
    {
      name: "Music Video Generator",
      bullets: [
        "Created an engaging UI using Vue and Material UI letting users generate music videos by dragging their clips, with customization via predefined themes and templates.",
        "Integrated Google Cloud speech-to-text APIs to extract lyrics/narration from audio for theme alignment, and optimized the rendering pipeline to cut render times by ~30%.",
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
    "Node.js",
    "AWS",
    "Terraform",
    "CI/CD",
    "TensorFlow",
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
