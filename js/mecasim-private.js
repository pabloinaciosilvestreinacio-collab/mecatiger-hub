import { supabase } from "./rede-client.js?v=20261025d";
import { isVerifiedMember } from "./rede-identity.mjs?v=20261025d";

// Saved trajectories are enabled for verified accounts; RLS and the Edge Function enforce ownership.
const $ = id => document.getElementById(id);
const status = (text, problem=false) => {
  $("route-private-status").textContent = text;
  $("route-private-status").style.color = problem ? "#ffb7a8" : "#ffd08b";
};
let working = false;
let enabled = false;
const setEnabled = state => {
  enabled = state;
  for (const id of ["route-save","route-refresh"]) $(id).disabled = !state || working;
  const selected = $("saved-route-select").value !== "";
  $("saved-route-select").disabled = !state || working || !selected;
  for (const id of ["route-load","route-delete"]) $(id).disabled = !state || working || !selected;
};
async function operation(action, payload = {}) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !isVerifiedMember(userData.user)) {
    enabled = false; setEnabled(false);
    throw new Error("Sua sessão expirou. Entre novamente pelo Hub.");
  }
  // The Edge Function validates the JWT independently and database RLS checks ownership.
  const { data, error } = await supabase.functions.invoke("mecasim-trajectories", {
    body: { action, ...payload }
  });
  if (error) {
    let detail;
    try { detail = (await error.context?.json?.())?.error; } catch (_) {}
    const known = new Set(["Route quota exceeded","Invalid trajectory data","Route not found","Confirmed email required"]);
    if (known.has(detail)) throw new Error({
      "Route quota exceeded":"Limite de trajetórias atingido. Exclua rotas antigas ou tente mais tarde.",
      "Invalid trajectory data":"A trajetória tem nome ou pontos inválidos.",
      "Route not found":"Esta trajetória não pertence à sua conta ou foi excluída.",
      "Confirmed email required":"Confirme seu e-mail para continuar."
    }[detail]);
    throw new Error("Serviço de trajetórias indisponível. Tente novamente mais tarde.");
  }
  return data;
}
async function run(job, text) {
  if (working || !enabled) return;
  working = true;setEnabled(true);status(text);
  try { await job(); }
  catch (error) { status(error.message || "Operação indisponível", true); }
  finally { working = false;setEnabled(enabled); }
}
async function refreshList() {
  const response = await operation("list");
  const select = $("saved-route-select");
  const before = select.value;
  select.replaceChildren();
  const routes = response.trajectories || [];
  if (!routes.length) {
    select.append(new Option("Nenhuma rota salva", ""));
    status("Biblioteca vazia. Desenhe uma trajetória para salvar.");
  } else {
    for (const route of routes) {
      select.append(new Option(route.name, String(route.id)));
    }
    if ([...select.options].some(opt => opt.value === before)) select.value = before;
    status(routes.length + " trajetória(s) na sua biblioteca privada.");
  }
  setEnabled(enabled);
}
$("saved-route-select").addEventListener("change",()=>setEnabled(enabled));
$("route-save").addEventListener("click",()=>run(async()=>{
  const points=window.mecaSimDemo?.getPoints();
  const name=$("route-name").value.trim();
  if (!name || name.length<3 || name.length>70) throw new Error("Digite um nome de 3 a 70 caracteres.");
  if (!Array.isArray(points) || !points.length) throw new Error("Adicione pelo menos um ponto na arena.");
  await operation("save",{name,points});
  await refreshList();
  status("Rota salva com segurança na sua conta.");
},"Salvando trajetória..."));
$("route-refresh").addEventListener("click",()=>run(refreshList,"Consultando suas rotas..."));
$("route-load").addEventListener("click",()=>run(async()=>{
  const id=Number($("saved-route-select").value);
  if (!Number.isSafeInteger(id)||id<=0) throw new Error("Selecione uma trajetória.");
  const {trajectory}=await operation("load",{id});
  if (!window.mecaSimDemo?.setPoints(trajectory.points)) throw new Error("Trajetória inválida. Não foi carregada.");
  $("route-name").value=trajectory.name;
  status("Rota recuperada da biblioteca privada.");
},"Carregando trajetória..."));
$("route-delete").addEventListener("click",()=>{
  const id=Number($("saved-route-select").value);
  if (!Number.isSafeInteger(id)||id<=0) return;
  if (!window.confirm("Excluir permanentemente esta trajetória salva?")) return;
  run(async()=>{
    await operation("remove",{id});
    await refreshList();
    status("Trajetória excluída da sua conta.");
  },"Excluindo trajetória...");
});

(async()=>{
  const { data, error } = await supabase.auth.getUser();
  if (error || !isVerifiedMember(data.user)) {
    status("Faça login com e-mail confirmado para usar a biblioteca privada.",true);
    return;
  }
  setEnabled(true);
  await refreshList();
})().catch(error => status(error.message || "Não foi possível conectar à biblioteca.", true));
