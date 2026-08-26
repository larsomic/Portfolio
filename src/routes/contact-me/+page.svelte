<script>
  function openEmailClient() {
    const emailTo = "recipient@example.com";
    const subject = encodeURIComponent("Hello from my website!");
    const body = encodeURIComponent("This is a pre-filled message body.");

    const mailToUrl = `mailto:${emailTo}?subject=${subject}&body=${body}`;
    window.location.href = mailToUrl;
  }
</script>

<h1>Contact Me!</h1>
