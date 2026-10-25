// CMS keeps rendered content as text, never interpreted as HTML.
export const CMS_SLOTS = Object.freeze({
  "home-intro": "Uma equipe de robótica que compete, aprende e compartilha. De Maracanaú para o mundo, criamos projetos e conexões para construir juntos.",
  "projects-intro": "A robótica é o nosso ponto de partida — e também uma ferramenta para ensinar, aproximar pessoas e transformar conhecimento em impacto.",
  "community-intro": "Não precisamos estar fisicamente juntos para construir juntos. A comunidade conecta estudantes, equipes, professores e mentores para trocar experiências e resolver problemas em conjunto.",
  "rede-intro": "Compartilhe conhecimento, tire dúvidas e conecte projetos e equipes. Todas as publicações passam por moderação antes de aparecer no feed."
});
export const CMS_BUCKET = "meca-site-gallery";
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const MAX_INPUT_BYTES = 10 * 1024 * 1024;
export const CMS_ASSET_PATH = new RegExp("^[0-9a-f-]{36}/[0-9a-f-]{36}[.]webp$");
export const CMS_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validCopy(slot, body) {
  return Object.hasOwn(CMS_SLOTS, slot) && typeof body === "string" &&
    body.trim().length >= 8 && body.trim().length <= 700;
}
export function validCaption(value) {
  return typeof value === "string" && value.trim().length >= 3 && value.trim().length <= 160;
}
export function validAssetPath(value) {
  return typeof value === "string" && CMS_ASSET_PATH.test(value);
}
export function validPage(page) {
  if (!page || typeof page !== "object") return false;
  const {slug,title,nav_label,summary,body,cover_path,cover_alt,show_in_nav,nav_order,published}=page;
  return typeof slug==="string" && slug.length>=2 && slug.length<=64 && CMS_SLUG.test(slug)
    && typeof title==="string" && title.trim().length>=2 && title.trim().length<=100
    && typeof nav_label==="string" && nav_label.trim().length>=2 && nav_label.trim().length<=28
    && typeof summary==="string" && summary.trim().length<=180
    && typeof body==="string" && body.trim().length>=8 && body.trim().length<=20000
    && (cover_path===null || cover_path==="" || validAssetPath(cover_path))
    && typeof cover_alt==="string" && cover_alt.trim().length<=160
    && ((!cover_path && cover_alt.trim().length===0)
      || (Boolean(cover_path) && cover_alt.trim().length>=3))
    && typeof show_in_nav==="boolean" && Number.isInteger(nav_order)
    && nav_order>=0 && nav_order<=9999 && typeof published==="boolean";
}
