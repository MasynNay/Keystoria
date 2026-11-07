/** Distinct, locally rendered marks for all twelve stories.
 *
 * Each mark is drawn to represent its own plot. Keeping the artwork as a small
 * independent component lets the home cards and lobby reuse exactly the same
 * identity without loading external icon fonts or image services.
 */
const MARKS = {
  station: `<ellipse cx="32" cy="32" rx="27" ry="12" transform="rotate(-34 32 32)"/><path d="m19 37 13-17 13 17-13 10Z"/><path d="M32 20v-8m0 35v7M19 37l-8 5M45 37l8 5"/>`,
  hollow: `<path d="M12 50V28L32 10l20 18v22H12Z"/><path d="M26 50V34a6 6 0 0 1 12 0v16M20 29h4m16 0h4"/><path d="M23 18c4 6 13 6 18 0"/>`,
  outbreak: `<circle cx="32" cy="32" r="6"/><circle cx="32" cy="32" r="17" stroke-dasharray="15 20" stroke-width="7"/><path d="M32 8v9M11 44l8-5m34 5-8-5"/>`,
  casefile: `<circle cx="27" cy="27" r="15"/><path d="m38 39 15 15M20 25c1-8 14-12 19-2M20 32c6-4 14-1 15 6M26 22c-3 8 2 13 8 13"/>`,
  dead_air: `<path d="M32 13 18 53h28L32 13ZM24 38h16m-19 8h22M32 23v30"/><path d="M16 20Q3 32 16 44m32-24q13 12 0 24M11 13Q-4 32 11 51m42-38q15 19 0 38"/>`,
  last_stop: `<rect x="12" y="13" width="40" height="35" rx="9"/><path d="M19 20h26v14H19ZM22 48l-7 8m27-8 7 8M15 56h34"/><circle cx="22" cy="41" r="3"/><circle cx="42" cy="41" r="3"/>`,
  abyss: `<path d="M9 34q5-16 23-16h12q13 0 13 17-7 14-26 14H17Q9 43 9 34Z"/><circle cx="26" cy="33" r="6"/><circle cx="42" cy="33" r="6"/><path d="M15 22v-8h17m14 11 9-9M8 54q11-6 22 0t22 0"/>`,
  neon: `<path d="M32 6 10 32l22 26 22-26L32 6Z"/><path d="m27 19-8 13 8 13M38 19l8 13-8 13M35 17l-6 30"/><path d="M7 10h10m30 44h10"/>`,
  red_horizon: `<circle cx="35" cy="27" r="20"/><path d="M11 48h42M16 48l8-17h20l8 17M21 31h27M32 31v17M9 55h46"/><path d="M14 15q15-11 32-5"/>`,
  whiteout: `<path d="M32 7v50M10 20l44 24M10 44l44-24M26 13l6-6 6 6m-12 38 6 6 6-6M12 24l-2-4 7 1m36 22 1 1-7-1M12 40l-2 4 7-1m36-23 1 0-7 1"/>`,
  ashfall: `<path d="M34 7c7 13-1 17 6 23 6-5 7-9 7-9 8 19 1 33-15 35C13 56 7 41 19 28c0 9 5 12 8 11-6-10 2-19 7-32Z"/><path d="M29 45c0-5 5-8 7-11 4 7 5 17-4 19"/>`,
  carnival: `<circle cx="32" cy="29" r="21"/><circle cx="32" cy="29" r="4"/><path d="M32 8v42M11 29h42M17 14l30 30M47 14 17 44M32 32 18 57m14-25 14 25M13 58h38"/><circle cx="32" cy="8" r="3"/><circle cx="53" cy="29" r="3"/>`,
  mirrorfall: `<path d="M12 11h40v42H12Z"/><path d="M12 32h40M18 16h11l-4 9h-7M46 48H35l4-9h7M32 11v42"/><path d="m25 27 7 5-7 5m14-10-7 5 7 5"/>`,
  four_winds: `<path d="M32 5v54M5 32h54"/><path d="M31 10q-14 16-3 23-21 6-12 19 13-7 16-18 9 18 23 17 5-17-19-21 17-8 11-21-13-2-16 15"/><circle cx="32" cy="32" r="6"/>`,
  dawnforge: `<circle cx="32" cy="25" r="14"/><path d="M32 5v-3m-20 23H6m52 0h-6M12 12 8 8m44 4 4-4M19 38l-9 13h44L45 38M12 51h40M26 44h12"/>`,
  glass_trials: `<path d="M11 51 19 14h26l8 37-21 9Z"/><path d="M19 14 32 31l13-17M11 51l21-20 21 20M32 31v29"/><circle cx="32" cy="31" r="5"/>`,
  wildbond: `<path d="M11 34Q9 14 26 19L32 7l6 12Q56 12 54 34q0 18-22 24Q10 52 11 34Z"/><path d="M22 34q4-6 9 0m3 0q5-6 9 0M28 43q4 4 8 0"/><path d="M17 21q-9-1-9-10m39 10q9-1 9-10"/>`,
  stardoor: `<path d="M15 57V21q0-17 17-17t17 17v36H15Z"/><path d="M23 57V23q0-9 9-9t9 9v34M32 20v27m-8-13h16"/><path d="m32 3 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/>`,
  clockfall: `<circle cx="32" cy="32" r="22"/><path d="M32 14v20l13 8M15 7l-5 8m39-8 5 8"/><path d="M14 47q19 24 37 0M17 26q17-20 30-2"/>`,
  nightmarket: `<path d="M9 49V28h46v21H9ZM14 28l6-11 12 11 12-11 6 11"/><path d="M15 49V32h12v17m10 0V32h12v17"/><path d="M32 8v15m-9-8h18M23 55q9 8 18 0"/>`,
  emberwing: `<path d="M7 40 26 20 33 33 45 9 57 41 39 35 31 51 23 35Z"/><path d="M22 34Q3 21 8 11 25 13 31 30M35 29Q45 11 55 14q0 19-14 22"/><path d="M28 45q7 8 15 2"/>`,
  deepvault: `<path d="M11 14h42v37H11Z"/><path d="M17 19h11v24H17m15-24h11v24H32m15-24v24"/><path d="M7 56q7-6 14 0t14 0t14 0t14 0"/><circle cx="32" cy="33" r="8"/>`,
  aurora_arc: `<circle cx="32" cy="32" r="12"/><ellipse cx="32" cy="32" rx="29" ry="12" transform="rotate(-27 32 32)"/><path d="M9 13q15-10 21 0t27-2M12 51q15-10 23-1t18-1"/><circle cx="43" cy="23" r="4"/>`,
  inkbound: `<path d="M32 15Q19 5 8 15v39q15-11 24 0 11-11 24 0V15Q45 5 32 15v39"/><path d="M32 15v39M14 24h11M14 33h11m14-9h11m-11 9h11"/><path d="M49 8l7 8-10 10"/>`,

};

export const MISSION_ICON_IDS = Object.freeze(Object.keys(MARKS));

/** Shared icon grammar: circular badge, inset pictogram, identical stroke/optical size.
 * Stories keep their distinctive artwork; no mission reuses another mark.
 */
export function missionIcon(id, className='') {
  if (!Object.hasOwn(MARKS,id)) throw new Error(`Unknown mission icon: ${id}`);
  return `<svg class="mission-mark ${className}" viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" data-mission-mark="${id}">
    <circle cx="40" cy="40" r="36" stroke-width="1.8" opacity=".45"/>
    <circle cx="40" cy="40" r="31.5" stroke-width="1" opacity=".17" stroke-dasharray="2 7"/>
    <g class="mission-mark-art" transform="translate(14 14) scale(.8125)" stroke-width="3.5">${MARKS[id]}</g>
    <path d="M34 4h12M34 76h12" stroke-width="2.7" opacity=".78"/>
    <circle cx="68.7" cy="20" r="2.3" fill="currentColor" stroke="none"/>
  </svg>`;
}
