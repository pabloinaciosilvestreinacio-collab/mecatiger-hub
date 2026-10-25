import { supabase } from "./rede-client.js";
import { CMS_SLOTS, CMS_BUCKET, validAssetPath, CMS_SLUG } from "./cms-model.mjs";

async function loadPublicCopy() {
  const slots=[...document.querySelectorAll("[data-cms-text]")]
    .map(node=>node.getAttribute("data-cms-text"))
    .filter(key=>Object.hasOwn(CMS_SLOTS,key));
  if(!slots.length) return;
  const {data,error}=await supabase.from("meca_site_copy").select("slot,body").in("slot",slots);
  if(error) return;
  for(const record of data||[]) {
    if(!Object.hasOwn(CMS_SLOTS,record.slot) || typeof record.body!=="string") continue;
    for(const node of document.querySelectorAll('[data-cms-text="'+record.slot+'"]')) {
      node.textContent=record.body;
    }
  }
}

async function publicPages() {
  const {data,error}=await supabase.from("meca_site_pages")
    .select("slug,title,nav_label,summary,cover_path,cover_alt,nav_order,show_in_nav")
    .eq("published",true).order("nav_order",{ascending:true}).order("nav_label",{ascending:true}).limit(100);
  if(error) return [];
  return (data||[]).filter(page=>typeof page.slug==="string" && CMS_SLUG.test(page.slug));
}
function pageLink(page) {
  const link=document.createElement("a");
  link.href="pagina.html?slug="+encodeURIComponent(page.slug);
  link.textContent=page.nav_label;
  link.setAttribute("data-cms-page-link",page.slug);
  return link;
}
async function loadPageTabs(pages) {
  const visible=pages.filter(item=>item.show_in_nav!==false);
  for(const nav of document.querySelectorAll(".cms-page-nav")) {
    nav.replaceChildren();
    for(const page of visible) nav.append(pageLink(page));
    if(!nav.childNodes.length) {
      const hint=document.createElement("span");
      hint.textContent="Novas abas serão exibidas aqui quando publicadas.";
      nav.append(hint);
    }
  }
  for(const nav of document.querySelectorAll(".desktop-nav,.mobile-menu,.footer-nav")) {
    for(const page of visible) {
      if(nav.querySelector('[data-cms-page-link="'+CSS.escape(page.slug)+'"]')) continue;
      const link=pageLink(page);
      if(nav.classList.contains("desktop-nav")) link.className="nav-link";
      nav.append(link);
    }
  }
}
async function loadPublicGallery() {
  const root=document.getElementById("meca-photo-gallery");
  const section=document.getElementById("meca-gallery");
  if(!root || !section) return;
  const {data,error}=await supabase.from("meca_site_gallery")
    .select("id,caption,asset_path").order("id",{ascending:false}).limit(30);
  if(error || !data?.length) return;
  const cards=[];
  for(const item of data) {
    if(!validAssetPath(item.asset_path)) continue;
    const figure=document.createElement("figure");
    figure.className="meca-gallery-card";
    const img=document.createElement("img");
    img.loading="lazy";img.alt=item.caption;img.referrerPolicy="no-referrer";
    img.src=supabase.storage.from(CMS_BUCKET).getPublicUrl(item.asset_path).data.publicUrl;
    const caption=document.createElement("figcaption");caption.textContent=item.caption;
    figure.append(img,caption);cards.push(figure);
  }
  if(cards.length) {root.replaceChildren(...cards);section.hidden=false;}
}
async function renderPageDirectory(pages) {
  const root=document.getElementById("cms-page-list");
  const status=document.getElementById("cms-page-status");
  if(!root || !status) return;
  root.replaceChildren();
  if(!pages.length) {status.textContent="Ainda não há páginas publicadas pela equipe.";return;}
  for(const page of pages) {
    const card=document.createElement("article");card.className="cms-page-card";
    const title=document.createElement("h2");title.textContent=page.title;
    const summary=document.createElement("p");summary.textContent=page.summary||"";
    const link=pageLink(page);link.className="button outline";link.textContent="Abrir página";
    card.append(title,summary,link);root.append(card);
  }
  status.textContent=pages.length+" página(s) publicada(s).";
}
async function renderCurrentPage() {
  const root=document.getElementById("cms-page-view");
  const status=document.getElementById("cms-page-status");
  if(!root || !status) return;
  const slug=new URLSearchParams(location.search).get("slug")||"";
  if(!CMS_SLUG.test(slug) || slug.length>64) {status.textContent="Endereço de página inválido.";return;}
  const {data,error}=await supabase.from("meca_site_pages")
    .select("slug,title,summary,body,cover_path,cover_alt")
    .eq("slug",slug).eq("published",true).maybeSingle();
  if(error || !data) {status.textContent="Página não encontrada ou ainda não publicada.";return;}
  document.title=data.title+" · MECATIGER FTC #32578";
  document.getElementById("cms-page-title").textContent=data.title;
  document.getElementById("cms-page-summary").textContent=data.summary||"";
  document.getElementById("cms-page-body").textContent=data.body;
  const figure=document.getElementById("cms-page-cover");
  if(data.cover_path && validAssetPath(data.cover_path)) {
    const image=document.getElementById("cms-page-cover-image");
    image.src=supabase.storage.from(CMS_BUCKET).getPublicUrl(data.cover_path).data.publicUrl;
    image.alt=data.cover_alt||"";
    figure.hidden=false;
  } else figure.hidden=true;
  status.textContent="";
  root.hidden=false;
}
async function bootCms() {
  const [,pages]=await Promise.all([loadPublicCopy(),publicPages(),loadPublicGallery()]);
  await loadPageTabs(pages);
  await Promise.all([renderPageDirectory(pages),renderCurrentPage()]);
}
Promise.allSettled([bootCms()]);
