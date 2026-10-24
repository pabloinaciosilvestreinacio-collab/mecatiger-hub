import { supabase } from "./rede-client.js";
import { CMS_SLOTS, CMS_BUCKET, validAssetPath } from "./cms-model.mjs";

async function loadPublicCopy() {
  const slots=[...document.querySelectorAll("[data-cms-text]")]
    .map(node=>node.getAttribute("data-cms-text"))
    .filter(key=>Object.hasOwn(CMS_SLOTS,key));
  if(!slots.length) return;
  const {data,error}=await supabase.from("meca_site_copy").select("slot,body").in("slot",slots);
  if(error) return; // Database is not deployed yet: keep the current static site working.
  for(const record of data||[]) {
    if(!Object.hasOwn(CMS_SLOTS,record.slot) || typeof record.body!=="string") continue;
    for(const node of document.querySelectorAll('[data-cms-text="'+record.slot+'"]')) {
      node.textContent=record.body; // Never insert HTML from a CMS value.
    }
  }
}

async function loadPublicGallery() {
  const root=document.getElementById("meca-photo-gallery");
  const section=document.getElementById("meca-gallery");
  if(!root || !section) return;
  const {data,error}=await supabase.from("meca_site_gallery")
    .select("id,caption,asset_path").order("id",{ascending:false}).limit(30);
  if(error || !data?.length) return; // No photos yet: keep gallery hidden.
  const cards=[];
  for(const item of data) {
    if(!validAssetPath(item.asset_path)) continue;
    const figure=document.createElement("figure");
    figure.className="meca-gallery-card";
    const img=document.createElement("img");
    img.loading="lazy";
    img.alt=item.caption; img.referrerPolicy="no-referrer";
    img.src=supabase.storage.from(CMS_BUCKET).getPublicUrl(item.asset_path).data.publicUrl;
    const caption=document.createElement("figcaption");
    caption.textContent=item.caption;
    figure.append(img,caption);cards.push(figure);
  }
  if(cards.length) {root.replaceChildren(...cards);section.hidden=false;}
}
Promise.allSettled([loadPublicCopy(),loadPublicGallery()]);
