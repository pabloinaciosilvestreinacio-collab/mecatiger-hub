import { supabase } from "./rede-client.js";
import { isVerifiedMember } from "./rede-identity.mjs";
import { CMS_SLOTS, CMS_BUCKET, MAX_INPUT_BYTES, MAX_PHOTO_BYTES,
         validCopy, validCaption, validAssetPath } from "./cms-model.mjs";

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
let editorUser=null;
let storedCopy = new Map();

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
})().catch(()=>{
  contentSection.hidden=true;
  locked.hidden=false;
  status("admin-status","Painel indisponível. Verifique sua conexão e autorização.",true);
});

}
