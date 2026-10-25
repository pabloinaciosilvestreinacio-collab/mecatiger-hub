import { supabase } from "./rede-client.js";
import { isVerifiedMember } from "./rede-identity.mjs";
// UX gate only. Static GitHub Pages content is publicly retrievable by URL.
// The visual-only demo is public on GitHub Pages; local E2E retains Auth gating.
if (location.hostname === "pabloinaciosilvestreinacio-collab.github.io") {
  document.body.style.visibility = "visible";
} else {
try {
  const { data, error } = await supabase.auth.getUser();
  if (error || !isVerifiedMember(data.user)) {
    location.replace("entrar.html?next=mecasim-demo.html");
  } else {
    document.body.style.visibility = "visible";
  }
} catch (error) {
  // Fail closed for the user interface (but NOT a security boundary for files).
  location.replace("entrar.html?next=mecasim-demo.html");
}

}
