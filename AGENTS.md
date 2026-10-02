<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep institutional copy and route metadata in `src/content/site-content.ts`; this prevents provisional text from being mistaken for verified team facts.
- Use `src/components/site-shell.tsx` for shared navigation and footer; all public pages need one consistent mobile-first shell.
- Use generated photography only as explicitly labeled provisional media; official MECATIGER photos and crest replace it later.
