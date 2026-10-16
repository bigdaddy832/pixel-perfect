import { it } from "vitest";
import { renderToString } from "react-dom/server";
import { makeRoster, newGame, step, pendingDecision, TRIBE_NAMES, TRIBE_COLORS } from "./engine";
import { Game } from "@/components/survivor/Game";
it("stress", () => {
  for (let k = 0; k < 60; k++) {
    const tc = 2 + (k % 2); const n = [12,16,18,20][k%4];
    let g = newGame({ playerCount: n, tribeCount: tc, jurySize: 7, finalSize: k%3?3:2, fireAtF4: true, swapEnabled: true, swapAt: n-3, mergeAt: 10, mergedName: "M", mergedColor: "#123456", controlledId: k%2? "c0": null, swapTribe: tc===2?{id:"sw",name:"S",color:"#abcdef"}:undefined }, Array.from({length:tc},(_,i)=>({id:`t${i}`,name:TRIBE_NAMES[i],color:TRIBE_COLORS[i]})), makeRoster(n, tc));
    let i = 0;
    while (g.phase !== "done" && i++ < 500) {
      const p = pendingDecision(g);
      const d: any = p?.kind === "camp" ? { allyWith: "__random__", searchIdol: true } : p?.kind === "tribal" ? { vote: p.options[0]?.id, idol: p.hasIdol ? "c0" : undefined, advantage: p.advantages[0], advantageTarget: p.options[0]?.id } : {};
      try { g = step(g, d); renderToString(<Game game={g} setGame={() => {}} onReset={() => {}} />); }
      catch (e) { console.log("FAIL", k, g.phase, (e as Error).stack?.slice(0, 600)); throw e; }
    }
  }
}, 600000);
