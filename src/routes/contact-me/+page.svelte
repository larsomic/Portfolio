<script lang="ts">
  import {
    IconArrowUpRight,
    IconBrandGithub,
    IconBrandLinkedin,
    IconCheck,
    IconMail,
    IconSend2,
  } from "@tabler/icons-svelte";
  import emailjs from "@emailjs/browser";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { EMAILJS, contactFormReady } from "$lib/config/contact.js";
  import { cn } from "$lib/utils.js";

  const LINKS = [
    {
      icon: IconBrandGithub,
      label: "GitHub",
      handle: "@larsomic",
      href: "https://github.com/larsomic",
    },
    {
      icon: IconBrandLinkedin,
      label: "LinkedIn",
      handle: "Michael Larson",
      href: "https://www.linkedin.com/in/larson2/",
    },
  ];

  let name = $state("");
  let email = $state("");
  let message = $state("");
  /** Honeypot — bots fill it, humans never see it. */
  let website = $state("");

  let sending = $state(false);
  /** null | "sent" | "error" */
  let status = $state<string | null>(null);
  let errorMessage = $state("");

  const problems = $derived({
    name: !name.trim() ? "Your name helps me know who I'm talking to." : "",
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? "A real email, so I can actually write back."
      : "",
    message:
      message.trim().length < 10
        ? "A few more words? Ten characters minimum."
        : "",
  });

  /** Errors only surface once a field has been visited or submit attempted. */
  const touched = $state({ name: false, email: false, message: false });
  let attempted = $state(false);

  function showErrors(field: "name" | "email" | "message"): string {
    return touched[field] || attempted ? problems[field] : "";
  }

  const valid = $derived(
    !problems.name && !problems.email && !problems.message,
  );

  async function submit() {
    if (sending) return;
    if (!valid) {
      attempted = true;
      return;
    }

    // Bots fill the hidden field — pretend we sent it and go away.
    if (website) {
      status = "sent";
      return;
    }

    if (!contactFormReady) {
      status = "error";
      errorMessage =
        "The contact form isn't configured on this deployment yet. Email me directly through GitHub or LinkedIn instead.";
      return;
    }

    sending = true;
    status = null;
    try {
      await emailjs.send(
        EMAILJS.serviceId,
        EMAILJS.templateId,
        {
          from_name: name.trim(),
          reply_to: email.trim(),
          message: message.trim(),
        },
        { publicKey: EMAILJS.publicKey },
      );
      status = "sent";
      name = "";
      email = "";
      message = "";
      touched.name = touched.email = touched.message = false;
      attempted = false;
    } catch (err) {
      status = "error";
      const text =
        err && typeof err === "object" && "text" in err ? String(err.text) : "";
      errorMessage =
        text ||
        "That didn't go through. Try again in a moment, or reach out via GitHub/LinkedIn.";
    } finally {
      sending = false;
    }
  }
</script>

<svelte:head>
  <title>Contact · Michael Larson</title>
  <meta
    name="description"
    content="Say hello to Michael Larson — questions about the projects on this portfolio, collaborations, or just talking sports stats."
  />
</svelte:head>

<div class="mx-auto flex w-full max-w-5xl flex-col gap-8 py-6 lg:py-12">
  <!-- Intro -->
  <section class="flex flex-col items-start gap-4">
    <Badge variant="outline" class="gap-1.5 rounded-full px-3">
      <IconMail class="size-3.5" />
      Let's talk
    </Badge>
    <h1
      class="max-w-2xl font-serif text-4xl font-bold leading-tight sm:text-5xl"
    >
      Contact Me!
    </h1>
    <p
      class="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
    >
      If you have questions about one of these projects or an idea you think
      would be fun to build please reach out.
    </p>
  </section>

  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
    <!-- The form -->
    <Card.Root class="overflow-hidden">
      {#if status === "sent"}
        <Card.Header class="flex flex-col items-center gap-3 py-12 text-center">
          <div
            class="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full"
          >
            <IconCheck class="size-7" />
          </div>
          <Card.Title class="text-2xl">Message sent!</Card.Title>
          <Card.Description class="max-w-sm">
            Thanks for reaching out — I'll get back to you as soon as I can.
          </Card.Description>
          <Button variant="outline" class="mt-2" onclick={() => (status = null)}
            >Send another one</Button
          >
        </Card.Header>
      {:else}
        <Card.Header>
          <Card.Title class="text-lg">Send a message</Card.Title>
          <Card.Description>
            Just three fields. No account, no captcha, no nonsense.
          </Card.Description>
        </Card.Header>
        <Card.Content class="flex flex-col gap-5 pb-6">
          {#if status === "error"}
            <p
              class="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
              role="alert"
            >
              {errorMessage}
            </p>
          {/if}

          <form
            class="flex flex-col gap-5"
            enctype="text/plain"
            onsubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div class="grid gap-5 sm:grid-cols-2">
              <div class="flex flex-col gap-1.5">
                <Label for="contact-name">Your name</Label>
                <Input
                  id="contact-name"
                  type="text"
                  autocomplete="name"
                  placeholder="Alex Rodriguez"
                  aria-required="true"
                  aria-invalid={!!showErrors("name")}
                  class={cn(
                    "rounded-md px-3",
                    showErrors("name") && "border-destructive",
                  )}
                  bind:value={name}
                  onblur={() => (touched.name = true)}
                />
                {#if showErrors("name")}
                  <span class="text-destructive text-xs"
                    >{showErrors("name")}</span
                  >
                {/if}
              </div>

              <div class="flex flex-col gap-1.5">
                <Label for="contact-email">Your email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  autocomplete="email"
                  placeholder="alex@example.com"
                  aria-required="true"
                  aria-invalid={!!showErrors("email")}
                  class={cn(
                    "rounded-md px-3",
                    showErrors("email") && "border-destructive",
                  )}
                  bind:value={email}
                  onblur={() => (touched.email = true)}
                />
                {#if showErrors("email")}
                  <span class="text-destructive text-xs"
                    >{showErrors("email")}</span
                  >
                {/if}
              </div>
            </div>

            <!-- Honeypot: hidden from humans, irresistible to bots -->
            <div
              class="absolute -left-[9999px] h-0 w-px overflow-hidden"
              aria-hidden="true"
            >
              <Label for="contact-website">Website (leave empty)</Label>
              <Input
                id="contact-website"
                type="text"
                tabindex={-1}
                autocomplete="off"
                bind:value={website}
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <Label for="contact-message">Message</Label>
              <textarea
                id="contact-message"
                class={cn(
                  "flex min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-[color,border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm aria-invalid:border-destructive",
                  showErrors("message") && "border-destructive",
                )}
                placeholder="What's on your mind?"
                rows="5"
                maxlength="2000"
                aria-required="true"
                aria-invalid={!!showErrors("message")}
                bind:value={message}
                onblur={() => (touched.message = true)}
              ></textarea>
              {#if showErrors("message")}
                <span class="text-destructive text-xs"
                  >{showErrors("message")}</span
                >
              {/if}
            </div>

            <Button
              type="submit"
              class="w-fit"
              disabled={sending || !contactFormReady}
            >
              <IconSend2 />
              {sending ? "Sending…" : "Send message"}
            </Button>
            {#if !contactFormReady}
              <p class="text-muted-foreground text-xs">
                Heads up: the form backend isn't configured on this deployment
                yet — use one of the links on the right instead.
              </p>
            {/if}
          </form>
        </Card.Content>
      {/if}
    </Card.Root>

    <!-- Direct links -->
    <aside class="flex flex-col gap-4">
      <h2 class="sr-only">Other ways to reach me</h2>
      {#each LINKS as link (link.href)}
        <a
          href={link.href}
          target="_blank"
          rel="noreferrer"
          class="group block"
        >
          <Card.Root
            class="transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg"
          >
            <Card.Content class="flex items-center gap-3 py-4">
              <div
                class="bg-muted group-hover:bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full transition-colors"
              >
                <link.icon class="size-5" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold">{link.label}</p>
                <p class="text-muted-foreground truncate text-xs">
                  {link.handle}
                </p>
              </div>
              <IconArrowUpRight
                class="text-muted-foreground group-hover:text-primary size-4 shrink-0 transition-colors"
              />
            </Card.Content>
          </Card.Root>
        </a>
      {/each}
    </aside>
  </div>
</div>
