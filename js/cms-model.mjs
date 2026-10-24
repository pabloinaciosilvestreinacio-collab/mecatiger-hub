// Fixed edit surface: text is always written with textContent, never interpreted as HTML.
export const CMS_SLOTS = Object.freeze({
  "home-intro": "Uma equipe de robótica que compete, aprende e compartilha. De Maracanaú para o mundo, criamos projetos e conexões para construir juntos.",
  "projects-intro": "A robótica é o nosso ponto de partida — e também uma ferramenta para ensinar, aproximar pessoas e transformar conhecimento em impacto.",
  "community-intro": "Não precisamos estar fisicamente juntos para construir juntos. A comunidade conecta estudantes, equipes, professores e mentores para trocar experiências e resolver problemas em conjunto.",
  "rede-intro": "Compartilhe conhecimento, tire dúvidas e conecte projetos e equipes. Todas as publicações passam por moderação antes de aparecer no feed."
});
export const CMS_BUCKET = "meca-site-gallery";
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const MAX_INPUT_BYTES = 10 * 1024 * 1024;
// Stored objects are generated paths, never arbitrary HTTP URLs or user-supplied HTML.
export const CMS_ASSET_PATH = /^[0-9a-f-]{36}\\/[0-9a-f-]{36}\\.webp$/;

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
