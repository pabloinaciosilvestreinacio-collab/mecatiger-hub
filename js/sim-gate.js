import { supabase } from "./rede-client.js?v=20261025d";
import { isVerifiedMember } from "./rede-identity.mjs?v=20261025d";

// Both the preview and saved simulator tools require an individual, verified account.
// Backend access is independently protected by the function JWT check and database RLS.
try {
  const { data, error } = await supabase.auth.getUser();
  if (error || !isVerifiedMember(data?.user)) {
    location.replace("entrar.html?next=mecasim-demo.html");
  } else {
    document.body.style.visibility = "visible";
  }
} catch {
  location.replace("entrar.html?next=mecasim-demo.html");
}
