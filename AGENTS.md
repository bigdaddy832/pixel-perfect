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

- Keep season mechanics in the pure Survivor state machine and controls in the Survivor components so season behavior stays independently testable.
- Prepare finalist statements before the jury-vote step and derive résumé claims from season evidence so controlled jurors can review the finalists before voting.
- Configure a future third swap tribe separately from active starting tribes and only activate it during the swap so cast assignment and hidden idols stay consistent.
- Reuse the shared tribe editor for starting, merge, swap, and in-season editing so name and color controls behave consistently.
- Finished seasons are saved to the signed-in user's history from the season page; history pages live under the signed-in-only area and reuse the Game view in read-only mode, so past seasons look identical to live ones.
