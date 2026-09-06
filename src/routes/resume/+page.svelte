<script lang="ts">
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
        "Developed and maintained a production-ready internal portal using React that is used every day by over 3,000 employees — letting them run SQL queries, connect with support, and use AI tools to tune their queries.",
        "Established a GitHub Actions suite using Terraform and the AWS CLI to create and scale AWS EC2 instances across multiple availability zones, leading to 10-minute deployments and 99% uptime during upgrades.",
        "Participated in an employee leadership and mentoring program, spending nine months building and pitching a production application to senior leadership.",
      ],
    },
    {
      role: "Software Engineer 1",
      company: "Meter Group Inc.",
      period: "Dec 2022 – Apr 2025",
      bullets: [
        "Spearheaded a backend project to integrate API services, ensuring smooth data flow across platforms, which led to a ~40% reduction in load times and a 30% improvement in the application's performance metrics.",
        "Orchestrated the transition of design files to interactive, mobile-optimized websites using React and MUI — leading to a 60% increase in mobile traffic, amplifying brand exposure and boosting user engagement.",
        "Revamped front-end and back-end systems by implementing pagination, cutting page load times by over 2,000% and improving data retrieval speeds for faster loading, searching, and filtering.",
      ],
    },
    {
      role: "Software Engineering Intern",
      company: "Meter Group Inc.",
      period: "Apr 2021 – Dec 2022",
      bullets: [
        "Built a comprehensive test suite using Robot Framework to simulate frontend user interactions, leading to the identification and resolution of 40+ bugs and enhancing application stability and user satisfaction by 35%.",
        "Managed the resolution of 80+ frontend bugs, significantly enhancing the app's usability and functionality — a 25% decrease in user-reported issues and a 20% increase in positive feedback.",
        "Refined web app responsiveness and cross-browser compatibility, resulting in a 25% increase in user engagement and a 20% decrease in bounce rates through adaptive design and rigorous testing across devices.",
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
        "Pioneered backend integration with Google Cloud APIs for text extraction from audio, improving narrative and thematic alignment while cutting rendering times by 30%.",
      ],
    },
    {
      name: "Virtual Classroom Simulator · Second Place, WSU Hackathon",
      bullets: [
        "Built a Unity-based multiplayer application using C++ for character movement and networking, transforming virtual school interactions into an engaging RPG-like environment during the COVID-19 pandemic.",
        "Incorporated proximity-based voice and video chat enabling real-time communication among students in an interactive map, fostering community in a virtual learning space.",
      ],
    },
  ];

  const skills = [
    "React",
    "TypeScript",
    "HTML",
    "CSS",
    "Terraform",
    "SQL",
  ];
</script>

<svelte:head>
  <title>Résumé · Michael Larson</title>
  <meta
    name="description"
    content="Résumé of Michael Larson — Software Engineer at Comcast, previously Meter Group. Experience, projects, education, and skills."
  />
</svelte:head>

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
              <span
                class="text-muted-foreground ml-2 text-base font-normal"
              >
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
      <Card.Root>
        <Card.Header>
          <Card.Title class="text-base">
            Washington State University
          </Card.Title>
          <Card.Description>
            B.S. in Software Engineering · Minor in Statistics
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
      <Card.Root>
        <Card.Header>
          <div class="flex flex-wrap gap-2">
            {#each skills as skill (skill)}
              <Badge variant="secondary">{skill}</Badge>
            {/each}
          </div>
        </Card.Header>
      </Card.Root>
    </section>
  </div>

  <p class="text-muted-foreground text-center text-xs">
    Same content as the PDF — this page is just the living version. 📄
  </p>
</div>
