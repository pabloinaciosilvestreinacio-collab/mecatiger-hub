import { supabase } from "./rede-client.js";
import { isVerifiedMember } from "./rede-identity.mjs";
// UX gate only. Static GitHub Pages content is publicly retrievable by URL.
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
