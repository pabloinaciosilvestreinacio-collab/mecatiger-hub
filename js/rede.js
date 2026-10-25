import { supabase } from "./rede-client.js";
import { isVerifiedMember } from "./rede-identity.mjs";

// Public GitHub Pages launch: informational Rede only until hosted Auth/DB approval.
if (location.hostname === "pabloinaciosilvestreinacio-collab.github.io") {
  const byId = id => document.getElementById(id);
  byId("rede-identity").textContent = "Prévia pública: leitura disponível. Login e publicações ainda não estão liberados.";
  byId("feed-status").textContent = "A Rede ainda não possui um feed público habilitado. As publicações serão liberadas após homologação.";
  byId("rede-signin").hidden = true;
  byId("rede-signout").hidden = true;
  for (const btn of document.querySelectorAll("[data-request-kind]")) {
    btn.disabled = true;
    btn.title = "Solicitações em preparação";
  }
  byId("post-status").textContent = "Envio de publicações em preparação.";
  const banner = document.createElement("p");
  banner.className = "rede-banner";
  banner.setAttribute("role", "status");
  banner.textContent = "Versão pública de apresentação: a autenticação, os pedidos privados e a moderação não estão ativos. Não envie dados pessoais.";
  document.querySelector(".rede-page").insertBefore(banner, document.querySelector(".rede-toolbar"));
} else {
const $ = id => document.getElementById(id);
const CATEGORIES = {
  programacao:"Programação", mecanica:"Mecânica e CAD", eletronica:"Eletrônica",
  ftc:"FTC e competições", projetos:"Projetos STEM",
  ajuda:"Dúvidas e ajuda", conhecimento:"Conhecimento compartilhado"
};
const PAGE_SIZE = 8;
let currentUser = null, profileReady = false, isModerator = false;
// Increment on every identity change; stale asynchronous reads must never restore access.
let identityEpoch = 0, identityLoading = true, identityResolved = false;
let page = 0, requestKind = "ajuda";
const el = (tag, text, cls) => {
  const node = document.createElement(tag);
  if (text !== undefined && text !== null) node.textContent = String(text);
  if (cls) node.className = cls;
  return node;
};
const message = (id, value, error=false) => {
  const node = $(id); if (!node) return;
  node.textContent = value; node.dataset.error = String(error);
};
// UI gating is not authorization: the Supabase RLS policies remain authoritative.
function syncIdentityControls() {
  const authed = !identityLoading && Boolean(currentUser);
  const usable = authed && identityResolved;
  $("rede-signin").hidden = identityLoading || authed;
  $("rede-signout").hidden = !authed;
  $("perfil").hidden = !authed;
  $("meus-conteudos").hidden = !authed;
  $("moderacao").hidden = !usable || !isModerator;
  $("post-form").hidden = !usable || !profileReady;
  $("display-name").disabled = !usable;
  $("profile-form").querySelector('button[type="submit"]').disabled = !usable;
  for (const button of document.querySelectorAll("[data-request-kind]")) button.disabled = !usable;
}

const date = value => new Date(value).toLocaleDateString("pt-BR", {day:"2-digit", month:"short", year:"numeric"});
const readableError = error => error?.code === "P0001"
  ? "Limite de envios atingido. Tente mais tarde."
  : "Não foi possível concluir. Verifique sua conexão ou tente novamente.";

function fillCategories() {
  for (const select of document.querySelectorAll(".rede-category-input")) {
    for (const [value,label] of Object.entries(CATEGORIES)) {
      const item = el("option",label); item.value=value; select.append(item);
    }
  }
}
function control(label, click) {
  const button=el("button",label); button.type="button";
  button.addEventListener("click",click); return button;
}
function loginLink() {
  const link=el("a","Entrar para interagir →");
  link.href="entrar.html?next=rede.html"; return link;
}
async function profileNames(ids) {
  const unique=[...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map();
  const {data}=await supabase.from("rede_profiles").select("id,display_name").in("id",unique);
  return new Map((data||[]).map(p=>[p.id,p.display_name]));
}
async function loadFeed() {
  const epoch = identityEpoch;
  message("feed-status","Carregando publicações aprovadas...");
  const {data,error}=await supabase.from("rede_posts")
    .select("id,author_id,kind,category,title,content,created_at")
    .eq("status","approved").order("created_at",{ascending:false}).order("id",{ascending:false})
    .range(page*PAGE_SIZE,page*PAGE_SIZE+PAGE_SIZE);
  if (epoch !== identityEpoch) return;
  if (error) {
    message("feed-status","Não foi possível carregar o feed.",true); $("feed-items").replaceChildren(); return;
  }
  const hasMore=(data||[]).length>PAGE_SIZE;
  const posts=(data||[]).slice(0,PAGE_SIZE);
  const names=await profileNames(posts.map(p=>p.author_id));
  if (epoch !== identityEpoch) return;
  $("feed-items").replaceChildren();
  for (const post of posts) $("feed-items").append(renderPost(post,names.get(post.author_id)||"Participante"));
  message("feed-status",posts.length ? "Publicações revisadas pela equipe." : "Ainda não há publicações aprovadas nesta página.");
  $("feed-prev").disabled=page===0;
  $("feed-next").disabled=!hasMore;
  $("feed-page").textContent="Página "+(page+1);
}
function renderPost(post, author) {
  const card=el("article",null,"rede-post");
  const meta=el("div",null,"rede-meta");
  meta.append(el("span",CATEGORIES[post.category]||"STEM"),
    el("span",date(post.created_at)),el("span","Por "+author));
  card.append(meta,el("h3",post.title),el("p",post.content));
  const buttons=el("div",null,"rede-controls");
  const comments=el("div");
  buttons.append(control("Comentários",()=>toggleComments(post.id,comments)));
  if (currentUser) buttons.append(control("Denunciar",()=>reportContent({post_id:post.id})));
  if (isModerator) buttons.append(control("Ocultar publicação",async()=>{
    if(!window.confirm("Ocultar esta publicação aprovada?"))return;
    const {error}=await supabase.from("rede_posts").update({status:"rejected"}).eq("id",post.id);
    if(error) alert(readableError(error)); else {await loadFeed();await loadModeration();}
  }));
  else buttons.append(loginLink());
  card.append(buttons,comments);
  return card;
}
async function toggleComments(postId,container) {
  if (container.childNodes.length) {container.replaceChildren();return;}
  const heading=el("h4","Comentários");
  const label=el("p","Carregando...");
  container.append(heading,label);
  const {data,error}=await supabase.from("rede_comments")
    .select("id,author_id,content,status,created_at").eq("post_id",postId)
    .order("created_at",{ascending:true}).limit(100);
  if (error) {label.textContent="Comentários indisponíveis.";return;}
  const names=await profileNames((data||[]).map(x=>x.author_id));
  label.remove();
  if (!(data||[]).length) container.append(el("p","Nenhum comentário aprovado ainda."));
  for (const item of data||[]) {
    const c=el("div",null,"rede-comment");
    c.append(el("div",(names.get(item.author_id)||"Participante")+" · "+date(item.created_at)
      +(item.status!=="approved"?" · Aguardando aprovação":""),"rede-meta"),el("p",item.content));
    if(currentUser && profileReady) {
      const actions=el("div",null,"rede-controls");
      actions.append(control("Denunciar comentário",()=>reportContent({comment_id:item.id})));
      if(item.author_id===currentUser.id) actions.append(control("Excluir comentário",async()=>{
        if(!window.confirm("Excluir seu comentário?"))return;
        const {error}=await supabase.from("rede_comments").delete().eq("id",item.id);
        if(error) alert(readableError(error)); else {container.replaceChildren();await toggleComments(postId,container);}
      }));
      if(isModerator && item.status==="approved") actions.append(control("Ocultar comentário",async()=>{
        if(!window.confirm("Ocultar comentário aprovado?"))return;
        const {error}=await supabase.from("rede_comments").update({status:"rejected"}).eq("id",item.id);
        if(error) alert(readableError(error)); else {container.replaceChildren();await toggleComments(postId,container);}
      }));
      c.append(actions);
    }
    container.append(c);
  }
  if (!currentUser || !profileReady) {container.append(loginLink());return;}
  const form=el("form",null,"rede-form");
  const input=el("textarea"); input.required=true;input.minLength=3;input.maxLength=1500;
  input.placeholder="Compartilhe uma resposta respeitosa (3 a 1500 caracteres)";
  const send=el("button","Enviar comentário para aprovação","button");send.type="submit";
  const info=el("p",null,"rede-status");info.setAttribute("role","status");
  form.append(input,send,info);
  form.addEventListener("submit",async event=>{
    event.preventDefault();send.disabled=true;
    const {error}=await supabase.from("rede_comments").insert({
      author_id:currentUser.id,post_id:postId,content:input.value.trim()
    });
    send.disabled=false;
    if (error) info.textContent=readableError(error);
    else {input.value="";info.textContent="Comentário recebido. Aguardando aprovação.";}
  });
  container.append(form);
}
async function reportContent(target) {
  if (!currentUser || identityLoading || !identityResolved || !profileReady) {location.href="entrar.html?next=rede.html";return;}
  const reason=window.prompt("Por que esta publicação deve ser revisada? Não inclua dados pessoais (10 a 500 caracteres).");
  if (reason===null) return;
  if (reason.trim().length<10||reason.trim().length>500) {alert("Escreva entre 10 e 500 caracteres.");return;}
  const {error}=await supabase.from("rede_reports").insert({
    reporter_id:currentUser.id,...target,reason:reason.trim()
  });
  alert(error?readableError(error):"Denúncia enviada para análise.");
}
async function loadOwn() {
  if (!currentUser || !identityResolved) return;
  const epoch = identityEpoch, ownerId = currentUser.id;
  const [posts,requests]=await Promise.all([
    supabase.from("rede_posts").select("id,title,content,category,status,created_at").eq("author_id",currentUser.id).order("created_at",{ascending:false}).limit(20),
    supabase.from("rede_requests").select("id,kind,title,status,created_at").eq("author_id",currentUser.id).order("created_at",{ascending:false}).limit(20)
  ]);
  if (epoch !== identityEpoch || currentUser?.id !== ownerId) return;
  const items=$("own-items");items.replaceChildren();
  if (posts.error||requests.error) {items.append(el("p","Não foi possível carregar os envios."));return;}
  const entries=[...(posts.data||[]).map(x=>({...x,table:"rede_posts",label:"Publicação"})),
    ...(requests.data||[]).map(x=>({...x,table:"rede_requests",label:"Solicitação"}))];
  entries.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  if (!entries.length) items.append(el("p","Você ainda não enviou conteúdo."));
  for (const item of entries) {
    const box=el("div",null,"rede-comment");
    box.append(el("strong",item.title),el("p",item.label+" · "+item.status+" · "+date(item.created_at)));
    if (item.table==="rede_posts" && item.status==="pending") box.append(control("Editar publicação pendente",()=>{
      const form=el("form",null,"rede-form");
      const labelTitle=el("label","Título");const title=el("input");title.value=item.title;
      title.minLength=6;title.maxLength=120;title.required=true;
      const labelBody=el("label","Conteúdo");const body=el("textarea");body.value=item.content;
      body.minLength=15;body.maxLength=5000;body.required=true;
      const save=el("button","Salvar alterações","button");save.type="submit";
      const info=el("p",null,"rede-status");info.setAttribute("role","status");
      form.append(labelTitle,title,labelBody,body,save,info);
      form.addEventListener("submit",async event=>{
        event.preventDefault();save.disabled=true;
        const {error}=await supabase.from("rede_posts")
          .update({title:title.value.trim(),content:body.value.trim()})
          .eq("id",item.id).eq("author_id",currentUser.id);
        save.disabled=false;
        if(error) info.textContent=readableError(error);
        else {info.textContent="Edição salva. Publicação continua pendente.";await loadOwn();}
      });
      box.append(form);
    }));
    if (item.table==="rede_posts") box.append(control("Excluir publicação",async()=>{
      if (!window.confirm("Excluir definitivamente esta publicação?"))return;
      const {error}=await supabase.from("rede_posts").delete().eq("id",item.id);
      if (error) alert(readableError(error)); else {await loadOwn();await loadFeed();}
    }));
    items.append(box);
  }
}
async function loadModeration() {
  if (!isModerator || !identityResolved) return;
  const epoch = identityEpoch;
  const root=$("mod-items");root.replaceChildren(el("p","Carregando fila..."));
  const tables=[
    {name:"rede_posts",label:"Publicação",states:["approved","rejected"]},
    {name:"rede_comments",label:"Comentário",states:["approved","rejected"]},
    {name:"rede_requests",label:"Solicitação",states:["em_analise","concluido","rejeitado"]},
    {name:"rede_reports",label:"Denúncia",states:["reviewed","dismissed"]}
  ];
  const results=await Promise.all(tables.map(t=>supabase.from(t.name).select("*").eq("status","pending").order("created_at").limit(25)));
  if (epoch !== identityEpoch || !isModerator) return;
  root.replaceChildren();
  tables.forEach((t,index)=>{
    const result=results[index];
    root.append(el("h3",t.label+"s"));
    if (result.error) {root.append(el("p","Erro ao consultar fila de "+t.label.toLowerCase()+"s."));return;}
    if (!result.data.length) {root.append(el("p","Sem pendências.","rede-muted"));return;}
    for (const item of result.data) {
      const card=el("div",null,"rede-mod-item");
      card.append(el("strong",(item.title||item.content||item.reason||"Solicitação")+" · #"+item.id));
      if (item.details) card.append(el("p",item.details));
      if (item.post_id) card.append(el("p","Referente à publicação #"+item.post_id));
      const buttons=el("div",null,"rede-controls");
      for (const state of t.states) buttons.append(control(state,async()=>{
        if (!window.confirm("Confirmar estado "+state+" para "+t.label.toLowerCase()+" #"+item.id+"?"))return;
        const {error}=await supabase.from(t.name).update({status:state}).eq("id",item.id);
        if (error) alert(readableError(error)); else {await loadModeration();await loadFeed();}
      }));
      card.append(buttons);root.append(card);
    }
  });
}
async function refreshIdentity() {
  const epoch = ++identityEpoch;
  identityLoading = true;
  identityResolved = false;
  currentUser = null;
  profileReady = false;
  isModerator = false;
  syncIdentityControls();
  $("own-items").replaceChildren();
  $("mod-items").replaceChildren();
  $("rede-identity").textContent = "Verificando sessão e permissões...";
  message("profile-status", "Verificando perfil...");
  message("post-status", "Aguarde a verificação da sua conta.");
  try {
    const {data,error} = await supabase.auth.getUser();
    if (epoch !== identityEpoch) return;
    const verified = !error && isVerifiedMember(data?.user) ? data.user : null;
    if (!verified) {
      identityLoading = false;
      identityResolved = true;
      syncIdentityControls();
      $("rede-identity").textContent = "Modo visitante — leitura pública.";
      message("post-status", "Entre na conta para publicar.");
      await loadFeed();
      return;
    }
    const [profile,mod] = await Promise.all([
      supabase.from("rede_profiles").select("display_name").eq("id",verified.id).maybeSingle(),
      supabase.from("rede_moderators").select("user_id").eq("user_id",verified.id).maybeSingle()
    ]);
    if (epoch !== identityEpoch) return;
    currentUser = verified;
    identityLoading = false;
    identityResolved = !profile.error && !mod.error;
    if (identityResolved) {
      profileReady = Boolean(profile.data);
      isModerator = Boolean(mod.data);
      if (profileReady) $("display-name").value = profile.data.display_name;
      message("profile-status", profileReady ? "Perfil público ativo." : "Escolha um apelido público para participar.");
      message("post-status", profileReady ? "As publicações precisam ser aprovadas." : "Salve seu perfil público antes de publicar.");
    } else {
      message("profile-status", "Não foi possível verificar seu perfil e permissões. Atualize a página.", true);
      message("post-status", "Interações indisponíveis até verificar as permissões.", true);
    }
    syncIdentityControls();
    $("rede-identity").textContent = identityResolved
      ? "Sessão autenticada. Suas ações serão vinculadas à sua conta."
      : "Sessão identificada, mas permissões indisponíveis.";
    if (identityResolved) {
      if (isModerator) await loadModeration();
      if (epoch !== identityEpoch) return;
      await loadOwn();
    }
    if (epoch !== identityEpoch) return;
    await loadFeed();
  } catch {
    if (epoch !== identityEpoch) return;
    identityLoading = false;
    identityResolved = false;
    currentUser = null;
    profileReady = false;
    isModerator = false;
    syncIdentityControls();
    $("rede-identity").textContent = "Não foi possível verificar sua conta.";
    message("profile-status", "A verificação falhou. Atualize a página.", true);
    message("post-status", "Interações indisponíveis até verificar a conta.", true);
    await loadFeed().catch(() => message("feed-status", "Não foi possível carregar o feed.", true));
  }
}
$("profile-form").addEventListener("submit",async event=>{
  event.preventDefault();
  if (!currentUser || identityLoading || !identityResolved) return;
  const userId = currentUser.id, epoch = identityEpoch;
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  const display_name=$("display-name").value.trim();
  if (display_name.length<2||display_name.length>60) {syncIdentityControls();return;}
  const {error}=await supabase.from("rede_profiles").upsert({id:userId,display_name},{onConflict:"id"});
  if (epoch !== identityEpoch || currentUser?.id !== userId) return;
  syncIdentityControls();
  message("profile-status",error?readableError(error):"Perfil salvo.",!!error);
  if (!error) {profileReady=true;syncIdentityControls();message("post-status","As publicações precisam ser aprovadas.");await loadOwn();}
});
$("post-form").addEventListener("submit",async event=>{
  event.preventDefault();
  const form=event.currentTarget; // Preserve the target before awaiting network I/O.
  if (!currentUser || identityLoading || !identityResolved || !profileReady) return;
  const button=form.querySelector("button[type=submit]");button.disabled=true;
  const payload={author_id:currentUser.id,kind:$("post-kind").value,category:$("post-category").value,
    title:$("post-title").value.trim(),content:$("post-content").value.trim()};
  const {error}=await supabase.from("rede_posts").insert(payload);
  button.disabled=false;
  if (error)message("post-status",readableError(error),true);
  else {form.reset();message("post-status","Publicação recebida! Aguarde a moderação.");await loadOwn();}
});
for (const button of document.querySelectorAll("[data-request-kind]")) button.addEventListener("click",()=>{
  if (!currentUser||!profileReady) {location.href="entrar.html?next=rede.html";return;}
  requestKind=button.dataset.requestKind;
  $("pedido").hidden=false;
  $("request-heading").textContent=requestKind==="ajuda"?"Pedir ajuda":"Solicitar conexão STEM";
  $("pedido").scrollIntoView({behavior:"smooth",block:"center"});
});
$("request-form").addEventListener("submit",async event=>{
  event.preventDefault();
  const form=event.currentTarget; // currentTarget is null after async event dispatch.
  if (!currentUser || identityLoading || !identityResolved || !profileReady) return;
  const button=form.querySelector("button[type=submit]");button.disabled=true;
  const {error}=await supabase.from("rede_requests").insert({
    author_id:currentUser.id,kind:requestKind,category:$("request-category").value,
    title:$("request-title").value.trim(),details:$("request-details").value.trim()
  });
  button.disabled=false;
  message("request-status",error?readableError(error):"Solicitação privada registrada para análise.",!!error);
  if (!error) {form.reset();await loadOwn();}
});
$("rede-signout").addEventListener("click",async()=>{
  // Invalidate in-flight profile/moderator queries BEFORE revoking the session.
  ++identityEpoch;
  identityLoading = true;
  identityResolved = false;
  currentUser = null;
  profileReady = false;
  isModerator = false;
  syncIdentityControls();
  const {error}=await supabase.auth.signOut();
  if (error) alert("Não foi possível encerrar a sessão.");
  await refreshIdentity();
});
$("feed-prev").addEventListener("click",()=>{if(page>0){page--;loadFeed();}});
$("feed-next").addEventListener("click",()=>{page++;loadFeed();});
$("mod-reload").addEventListener("click",loadModeration);
fillCategories();
refreshIdentity().catch(()=>message("feed-status","Não foi possível iniciar a comunidade.",true));

}
