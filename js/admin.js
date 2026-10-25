import { supabase } from "./rede-client.js?v=20261025d";
import { isVerifiedMember } from "./rede-identity.mjs?v=20261025d";
import { CMS_SLOTS, CMS_BUCKET, MAX_INPUT_BYTES, MAX_PHOTO_BYTES,
         validCopy, validCaption, validAssetPath, validPage } from "./cms-model.mjs?v=20261025d";

// Admin UI is not provisioned on GitHub Pages. Do not query/write hosted CMS.
if (location.hostname === "pabloinaciosilvestreinacio-collab.github.io") {
  document.getElementById("admin-content").hidden = true;
  document.getElementById("admin-locked").hidden = false;
  document.getElementById("admin-status").textContent =
    "Painel em preparação: nenhuma conta editora foi habilitada. Não há login público nesta fase.";
} else {
const byId = id => document.getElementById(id);
const status = (id, text, error=false) => {
  const el=byId(id); el.textContent=text; el.dataset.error=String(error);
};
const contentSection=byId("admin-content");
const locked=byId("admin-locked");
const copyForm=byId("cms-copy-form");
const photoForm=byId("cms-photo-form");
const pageForm=byId("cms-page-form");
let editorUser=null;
let storedCopy = new Map();
let storedPages = new Map();
let editingPageSlug = null;

async function closeSession() {
  editorUser = null;
  contentSection.hidden = true;
  await supabase.auth.signOut();
  location.replace("entrar.html?next=admin.html");
}
byId("admin-exit").addEventListener("click",closeSession);
byId("admin-exit-locked").addEventListener("click",closeSession);

async function loadTexts() {
  const {data,error}=await supabase.from("meca_site_copy").select("slot,body");
  if (error) {
    status("cms-copy-status","Não foi possível carregar os textos. Verifique a configuração da área administrativa.",true);
    return false;
  }
  storedCopy = new Map((data||[]).map(row=>[row.slot,row.body]));
  showCurrentText();
  return true;
}
function showCurrentText() {
  const slot=byId("cms-slot").value;
  byId("cms-body").value=storedCopy.get(slot) || CMS_SLOTS[slot] || "";
  status("cms-copy-status",storedCopy.has(slot)
    ? "Este texto já foi personalizado. Você pode atualizá-lo."
    : "Este é o texto padrão. Salve para publicar sua alteração.");
}
byId("cms-slot").addEventListener("change",showCurrentText);

function selectAdminTab(name,focus=false) {
  for(const tab of document.querySelectorAll("[data-admin-tab]")) {
    const selected=tab.dataset.adminTab===name;
    tab.setAttribute("aria-selected",String(selected));
    tab.tabIndex=selected?0:-1;
    const panel=byId(tab.getAttribute("aria-controls"));
    if(panel) panel.hidden=!selected;
    if(selected && focus) tab.focus();
  }
}
const adminTabs=[...document.querySelectorAll("[data-admin-tab]")];
for(const tab of adminTabs) {
  tab.addEventListener("click",()=>selectAdminTab(tab.dataset.adminTab));
  tab.addEventListener("keydown",event=>{
    const direction=event.key==="ArrowRight"?1:event.key==="ArrowLeft"?-1:0;
    if(!direction)return;
    event.preventDefault();
    const index=adminTabs.indexOf(tab);
    const next=adminTabs[(index+direction+adminTabs.length)%adminTabs.length];
    selectAdminTab(next.dataset.adminTab,true);
  });
}

const REQUEST_STATUS_LABELS={pending:"Pendente",em_analise:"Em análise",concluido:"Concluído",rejeitado:"Rejeitado"};
const REQUEST_KIND_LABELS={ajuda:"Pedido de ajuda",conexao:"Conexão STEM"};
const REQUEST_CATEGORY_LABELS={programacao:"Programação",mecanica:"Mecânica e CAD",eletronica:"Eletrônica",ftc:"FTC e competições",projetos:"Projetos STEM",ajuda:"Dúvidas e ajuda",conhecimento:"Conhecimento compartilhado"};
const requestList=byId("admin-requests-list");
let requestsLoaded=false;
function localDate(value) {
  const date=new Date(value);
  return Number.isNaN(date.getTime())?"Data indisponível":date.toLocaleString("pt-BR");
}
function requestField(label,value) {
  const p=document.createElement("p");
  const strong=document.createElement("strong");strong.textContent=label+": ";
  p.append(strong,document.createTextNode(value||"—"));
  return p;
}
function renderRequestCards(rows,names) {
  requestList.replaceChildren();
  if(!rows.length) {
    const empty=document.createElement("p");empty.textContent="Nenhuma solicitação corresponde aos filtros.";
    requestList.append(empty);return;
  }
  for(const request of rows) {
    const card=document.createElement("article");card.className="admin-request-card";
    const heading=document.createElement("h3");heading.textContent=request.title;
    const meta=document.createElement("div");meta.className="admin-request-meta";
    for(const text of [REQUEST_KIND_LABELS[request.kind]||"Solicitação",REQUEST_STATUS_LABELS[request.status]||request.status,
      names.get(request.author_id)||"Participante sem apelido",localDate(request.created_at)]) {
      const item=document.createElement("span");item.textContent=text;meta.append(item);
    }
    const detail=document.createElement("p");detail.className="admin-request-detail";
    detail.textContent=request.details;
    const category=document.createElement("p");category.className="rede-muted";
    category.textContent="Categoria: "+(REQUEST_CATEGORY_LABELS[request.category]||request.category);
    const actions=document.createElement("div");actions.className="admin-request-actions";
    const statusLabel=document.createElement("label");statusLabel.textContent="Atualizar status";
    const statusSelect=document.createElement("select");
    for(const [value,label] of Object.entries(REQUEST_STATUS_LABELS)) {
      const option=document.createElement("option");option.value=value;option.textContent=label;statusSelect.append(option);
    }
    statusSelect.value=request.status;statusLabel.append(statusSelect);
    const save=document.createElement("button");save.type="button";save.className="button";save.textContent="Salvar status";save.disabled=true;
    statusSelect.addEventListener("change",()=>{save.disabled=statusSelect.value===request.status;});
    save.addEventListener("click",()=>updateRequestStatus(request, statusSelect.value, save));
    const details=document.createElement("button");details.type="button";details.className="button outline";details.textContent="Abrir detalhes e histórico";
    details.addEventListener("click",()=>openRequestDetails(request,names.get(request.author_id)||"Participante sem apelido"));
    actions.append(statusLabel,save,details);
    card.append(heading,meta,category,detail,actions);requestList.append(card);
  }
}
async function loadRequests() {
  if(!editorUser) return;
  const message=byId("admin-requests-status");
  message.textContent="Verificando autorização e carregando solicitações...";message.dataset.error="false";
  requestList.replaceChildren();
  try {
    const {data:moderator,error:roleError}=await supabase.from("rede_moderators")
      .select("user_id").eq("user_id",editorUser.id).maybeSingle();
    if(roleError) throw roleError;
    if(!moderator) {
      requestsLoaded=false;
      message.textContent="Acesso negado: esta conta editora não tem papel de moderador.";message.dataset.error="true";
      return;
    }
    const {data,error}=await supabase.from("rede_requests")
      .select("id,author_id,kind,category,title,details,status,created_at")
      .order("created_at",{ascending:false}).limit(200);
    if(error) throw error;
    const rows=data||[];
    const ids=[...new Set(rows.map(row=>row.author_id))];
    let names=new Map();
    if(ids.length) {
      const {data:profiles,error:profileError}=await supabase.from("rede_profiles")
        .select("id,display_name").in("id",ids);
      if(profileError) throw profileError;
      names=new Map((profiles||[]).map(profile=>[profile.id,profile.display_name]));
    }
    const statusFilter=byId("admin-request-status-filter").value;
    const kindFilter=byId("admin-request-kind-filter").value;
    const filtered=rows.filter(row=>(statusFilter==="all"||row.status===statusFilter)
      &&(kindFilter==="all"||row.kind===kindFilter));
    renderRequestCards(filtered,names);
    requestsLoaded=true;
    message.textContent=`${filtered.length} solicitação(ões) exibida(s), de ${rows.length} carregada(s).`;
    message.dataset.error="false";
  } catch {
    requestsLoaded=false;
    message.textContent="Não foi possível carregar as solicitações. Confirme a sessão, o papel de moderador e as políticas RLS.";
    message.dataset.error="true";
  }
}
async function updateRequestStatus(request,nextStatus,button) {
  if(!editorUser||!Object.hasOwn(REQUEST_STATUS_LABELS,nextStatus)) return;
  button.disabled=true;
  const message=byId("admin-requests-status");message.textContent="Salvando status...";message.dataset.error="false";
  try {
    const {data,error}=await supabase.from("rede_requests").update({status:nextStatus})
      .eq("id",request.id).select("id,status").maybeSingle();
    if(error) throw error;
    if(!data) throw new Error("No request was updated; check moderator policy.");
    message.textContent="Status atualizado no Supabase. Atualizando histórico...";
    await loadRequests();
  } catch {
    message.textContent="Falha ao gravar o status. Nenhuma confirmação foi registrada; confira a autorização e tente novamente.";
    message.dataset.error="true";
  } finally {button.disabled=false;}
}
async function openRequestDetails(request,displayName) {
  const dialog=byId("admin-request-dialog");
  const body=byId("admin-request-dialog-body");
  const history=byId("admin-request-history");
  body.replaceChildren(
    requestField("Tipo",REQUEST_KIND_LABELS[request.kind]||request.kind),
    requestField("Status",REQUEST_STATUS_LABELS[request.status]||request.status),
    requestField("Assunto",request.title),
    requestField("Categoria",REQUEST_CATEGORY_LABELS[request.category]||request.category),
    requestField("Remetente",displayName),
    requestField("Recebida em",localDate(request.created_at)),
    requestField("Conteúdo",request.details)
  );
  history.replaceChildren();
  const loading=document.createElement("p");loading.textContent="Carregando histórico...";history.append(loading);
  if(!dialog.open) dialog.showModal();
  const {data,error}=await supabase.from("rede_moderation_log")
    .select("previous_status,new_status,logged_at").eq("entity","request").eq("entity_id",request.id)
    .order("logged_at",{ascending:false}).limit(50);
  history.replaceChildren();
  if(error) {
    const failure=document.createElement("p");failure.textContent="Não foi possível carregar o histórico.";history.append(failure);return;
  }
  if(!data?.length) {
    const empty=document.createElement("p");empty.textContent="Ainda não há alterações de status registradas.";history.append(empty);return;
  }
  for(const row of data) {
    const item=document.createElement("p");
    item.textContent=`${REQUEST_STATUS_LABELS[row.previous_status]||row.previous_status||"Criado"} → ${REQUEST_STATUS_LABELS[row.new_status]||row.new_status} · ${localDate(row.logged_at)}`;
    history.append(item);
  }
}
byId("admin-request-dialog-close").addEventListener("click",()=>byId("admin-request-dialog").close());
byId("admin-requests-reload").addEventListener("click",loadRequests);
byId("admin-request-status-filter").addEventListener("change",()=>{if(requestsLoaded)loadRequests();});
byId("admin-request-kind-filter").addEventListener("change",()=>{if(requestsLoaded)loadRequests();});
byId("admin-tab-requests").addEventListener("click",loadRequests);

function resetPageForm() {
  pageForm.reset();
  editingPageSlug=null;
  byId("cms-page-slug").readOnly=false;
  byId("cms-page-order").value="100";
  byId("cms-page-nav-visible").checked=true;
  status("cms-page-status","Preencha os campos para criar uma página em rascunho.");
}
byId("cms-page-new").addEventListener("click",resetPageForm);
byId("cms-page-cover").addEventListener("change",()=>{
  if(!byId("cms-page-cover").value) byId("cms-page-cover-alt").value="";
});
function setPageForm(page) {
  editingPageSlug=page.slug;
  byId("cms-page-slug").value=page.slug;
  byId("cms-page-slug").readOnly=true;
  byId("cms-page-title").value=page.title;
  byId("cms-page-nav-label").value=page.nav_label;
  byId("cms-page-summary").value=page.summary||"";
  byId("cms-page-body").value=page.body;
  byId("cms-page-cover").value=page.cover_path||"";
  byId("cms-page-cover-alt").value=page.cover_alt||"";
  byId("cms-page-order").value=String(page.nav_order);
  byId("cms-page-nav-visible").checked=page.show_in_nav;
  byId("cms-page-published").checked=page.published;
  status("cms-page-status","Editando “"+page.title+"”. O endereço fica fixo para não quebrar links.");
  selectAdminTab("pages");
  byId("cms-page-title").focus();
}
function renderPageList() {
  const root=byId("cms-pages-list");
  root.replaceChildren();
  for(const page of storedPages.values()) {
    const card=document.createElement("article");card.className="admin-page-card";
    const title=document.createElement("h4");title.textContent=page.title;
    const state=document.createElement("p");
    state.textContent=(page.published?"Publicada":"Rascunho")+" · "+(page.show_in_nav?"visível nos menus":"fora dos menus");
    const actions=document.createElement("div");actions.className="admin-page-actions";
    const edit=document.createElement("button");edit.type="button";edit.className="button outline";edit.textContent="Editar";
    edit.addEventListener("click",()=>setPageForm(page));
    actions.append(edit);
    if(page.published) {
      const preview=document.createElement("a");preview.className="button outline";
      preview.href="pagina.html?slug="+encodeURIComponent(page.slug);
      preview.target="_blank";preview.rel="noopener noreferrer";preview.textContent="Pré-visualizar";
      actions.append(preview);
    }
    card.append(title,state,actions);root.append(card);
  }
  if(!storedPages.size) {
    const empty=document.createElement("p");empty.textContent="Nenhuma página criada ainda.";
    root.append(empty);
  }
}
async function refreshPages() {
  const {data,error}=await supabase.from("meca_site_pages")
    .select("slug,title,nav_label,summary,body,cover_path,cover_alt,show_in_nav,nav_order,published")
    .order("nav_order",{ascending:true}).order("title",{ascending:true}).limit(100);
  if(error) {
    status("cms-page-status","Não foi possível carregar páginas. Verifique a instalação do CMS.",true);
    return false;
  }
  storedPages=new Map((data||[]).map(page=>[page.slug,page]));
  renderPageList();
  return true;
}
pageForm.addEventListener("submit",async event=>{
  event.preventDefault();
  const page={
    slug:byId("cms-page-slug").value.trim(),
    title:byId("cms-page-title").value.trim(),
    nav_label:byId("cms-page-nav-label").value.trim(),
    summary:byId("cms-page-summary").value.trim(),
    body:byId("cms-page-body").value.trim(),
    cover_path:byId("cms-page-cover").value||null,
    cover_alt:byId("cms-page-cover-alt").value.trim(),
    show_in_nav:byId("cms-page-nav-visible").checked,
    nav_order:Number(byId("cms-page-order").value),
    published:byId("cms-page-published").checked,
    updated_by:editorUser?.id,
    updated_at:new Date().toISOString()
  };
  if(!editorUser || !validPage(page)) {
    status("cms-page-status","Página inválida. Confira endereço, texto, legenda da foto e ordem.",true);return;
  }
  if(storedPages.has(page.slug) && editingPageSlug!==page.slug) {
    status("cms-page-status","Este endereço já existe. Use Editar na página correspondente.",true);return;
  }
  const button=pageForm.querySelector("button[type=submit]");
  button.disabled=true;
  status("cms-page-status","Salvando página...");
  try {
    const {error}=await supabase.from("meca_site_pages").upsert(page,{onConflict:"slug"});
    if(error) throw error;
    editingPageSlug=page.slug;
    byId("cms-page-slug").readOnly=true;
    status("cms-page-status",page.published?"Página publicada no site.":"Rascunho salvo; somente editores podem vê-lo.");
    await refreshPages();
  } catch {
    status("cms-page-status","Não foi possível salvar. Confira a autorização do editor e tente novamente.",true);
  } finally {button.disabled=false;}
});

copyForm.addEventListener("submit",async event=>{
  event.preventDefault();
  const slot=byId("cms-slot").value;
  const body=byId("cms-body").value.trim();
  if (!editorUser || !validCopy(slot,body)) {
    status("cms-copy-status","Texto inválido. Confira a área e o limite de caracteres.",true); return;
  }
  const button=copyForm.querySelector("button[type=submit]");
  button.disabled=true;
  status("cms-copy-status","Salvando alteração...");
  try {
    const {error}=await supabase.from("meca_site_copy").upsert({
      slot,body,updated_by:editorUser.id,updated_at:new Date().toISOString()
    },{onConflict:"slot"});
    if(error) throw error;
    storedCopy.set(slot,body);
    status("cms-copy-status","Texto salvo. Abra a página correspondente para conferir.");
  } catch {
    status("cms-copy-status","Não foi possível salvar. Confira as permissões e tente novamente.",true);
  } finally {
    button.disabled=false;
  }
});

async function prepareWebp(file) {
  if (!file || !["image/jpeg","image/png","image/webp"].includes(file.type)
      || file.size < 1 || file.size > MAX_INPUT_BYTES) {
    throw new Error("Formato ou tamanho inválido.");
  }
  const bitmap=await createImageBitmap(file);
  try {
    if(bitmap.width < 1 || bitmap.height < 1 || bitmap.width > 10000 || bitmap.height > 10000)
      throw new Error("Dimensões inválidas.");
    const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));
    canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const context=canvas.getContext("2d");
    if(!context) throw new Error("Conversão de imagem indisponível.");
    context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",0.78));
    if(!blob || blob.type!=="image/webp" || blob.size>MAX_PHOTO_BYTES)
      throw new Error("Imagem convertida maior que 2 MB ou não suportada.");
    return blob;
  } finally {
    bitmap.close();
  }
}
async function refreshGallery() {
  const {data,error}=await supabase.from("meca_site_gallery")
    .select("id,caption,asset_path").order("id",{ascending:false}).limit(50);
  if(error) {status("cms-photo-status","Não foi possível consultar as fotos.",true);return;}
  const coverSelect=byId("cms-page-cover");
  const selectedCover=coverSelect.value;
  coverSelect.replaceChildren();
  const noCover=document.createElement("option");
  noCover.value="";noCover.textContent="Sem foto de capa";
  coverSelect.append(noCover);
  for(const row of data||[]) {
    if(!validAssetPath(row.asset_path)) continue;
    const option=document.createElement("option");
    option.value=row.asset_path;option.textContent=row.caption;
    coverSelect.append(option);
  }
  coverSelect.value=selectedCover;
  const list=byId("cms-gallery-list");
  list.replaceChildren();
  for(const row of data||[]) {
    if(!validAssetPath(row.asset_path)) continue;
    const card=document.createElement("article");card.className="admin-photo";
    const img=document.createElement("img");
    img.loading="lazy";img.alt=row.caption;img.referrerPolicy="no-referrer";
    img.src=supabase.storage.from(CMS_BUCKET).getPublicUrl(row.asset_path).data.publicUrl;
    const caption=document.createElement("p");caption.textContent=row.caption;
    card.append(img,caption);list.append(card);
  }
}

photoForm.addEventListener("submit",async event=>{
  event.preventDefault();
  const caption=byId("cms-caption").value.trim();
  const file=byId("cms-photo").files?.[0];
  if(!editorUser || !validCaption(caption)) {
    status("cms-photo-status","Informe uma legenda válida e tente novamente.",true);return;
  }
  const button=photoForm.querySelector("button[type=submit]");
  button.disabled=true;
  status("cms-photo-status","Preparando foto para publicação...");
  try {
    const blob=await prepareWebp(file);
    const path=editorUser.id+"/"+crypto.randomUUID()+".webp";
    if(!validAssetPath(path)) throw new Error("Identificador de arquivo inválido.");
    status("cms-photo-status","Enviando foto...");
    const {error:uploadError}=await supabase.storage.from(CMS_BUCKET)
      .upload(path,blob,{contentType:"image/webp",upsert:false,cacheControl:"3600"});
    if(uploadError) throw uploadError;
    const {error:recordError}=await supabase.from("meca_site_gallery")
      .insert({asset_path:path,caption,created_by:editorUser.id});
    if(recordError) throw recordError;
    photoForm.reset();
    status("cms-photo-status","Foto publicada na galeria do site.");
    await refreshGallery();
  } catch {
    status("cms-photo-status","Não foi possível publicar a foto. Confira formato, permissão e limite de 2 MB.",true);
  } finally {
    button.disabled=false;
  }
});

(async()=>{
  const {data,error}=await supabase.auth.getUser();
  if(error || !isVerifiedMember(data?.user)) {
    locked.hidden=false;
    status("admin-status","Entre com um e-mail confirmado para solicitar acesso ao painel.");
    return;
  }
  const {data:grant,error:grantError}=await supabase.from("meca_site_editors")
    .select("user_id").eq("user_id",data.user.id).maybeSingle();
  if(grantError || !grant) {
    locked.hidden=false;
    status("admin-status","Esta conta não possui autorização de edição. Peça ao responsável da equipe para liberar seu usuário.",true);
    return;
  }
  editorUser=data.user;
  status("admin-status","Acesso de edição confirmado.");
  contentSection.hidden=false;
  await Promise.all([loadTexts(),refreshGallery()]);
  await refreshPages();
})().catch(()=>{
  contentSection.hidden=true;
  locked.hidden=false;
  status("admin-status","Painel indisponível. Verifique sua conexão e autorização.",true);
});

}
