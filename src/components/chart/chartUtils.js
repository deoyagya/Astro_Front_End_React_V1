/**
 * Shared chart utilities — planet label builder, D1 enrichment,
 * dynamic font scaling. Used by NorthIndianChart, SouthIndianChart,
 * ChartModal, BirthChartPage, HouseExplorePage.
 */

import {
  MALEFICS, PLANET_ABBR,
  toDegreeStr, getPlanetStatusSuffix, getDignity, isVargottama,
  vargaToChartData,
} from '../../utils/jyotish';
import { PLANET_FONT, PLANET_LH, MIN_PLANET_FONT, CHART_OPTIONS } from './chartConstants';

/**
 * Build display label for a single planet.
 * Returns { label: "Su²⁰*↑", isMalefic: boolean }
 */
export function buildLabel(pName, chartData, d9Vargas) {
  const placements = chartData.placements || {};
  let pInfo = null, signNum = null;
  for (const [, hData] of Object.entries(placements)) {
    if ((hData.planets || []).includes(pName)) {
      signNum = hData.sign;
      pInfo = hData.planetData?.[pName] || null;
      break;
    }
  }

  const degree    = pInfo?.degree ?? null;
  const isRetro   = pInfo?.isRetro || false;
  const isCombust = pInfo?.isCombust || false;
  const dignity   = signNum ? getDignity(pName, signNum) : 'neutral';

  let isVarg = false;
  if (d9Vargas && signNum) {
    const d9 = d9Vargas[pName];
    if (d9?.sign) isVarg = isVargottama(signNum, d9.sign);
  }

  const abbr   = PLANET_ABBR[pName] || pName.slice(0, 2);
  const degStr = degree != null ? toDegreeStr(degree) : '';
  const suffix = getPlanetStatusSuffix({ isRetro, isCombust, isVargottama: isVarg, dignity });

  return {
    label: `${abbr}${degStr}${suffix}`,
    isMalefic: MALEFICS.has(pName),
  };
}

/**
 * Enrich D1 chart placements with per-planet metadata (degree, retro, combust).
 * Works with the raw natal.planets object from the API response.
 */
export function enrichD1(d1Chart, natalPlanets) {
  if (!d1Chart?.placements || !natalPlanets) return d1Chart;
  const enriched = JSON.parse(JSON.stringify(d1Chart));
  for (const [, hData] of Object.entries(enriched.placements)) {
    hData.planetData = hData.planetData || {};
    for (const pName of hData.planets || []) {
      if (pName === 'Lagna') continue;
      const pNatal = natalPlanets[pName];
      if (!pNatal) continue;
      const lon = pNatal.longitude ?? pNatal.lon;
      const degInSign = lon != null ? lon % 30 : pNatal.degree ?? null;
      hData.planetData[pName] = {
        degree: degInSign,
        longitude: lon,
        isRetro: pNatal.is_retrograde || pNatal.retrograde || pNatal.is_retro || false,
        isCombust: pNatal.derived?.combustion?.is_combust || false,
        sign: parseInt(pNatal.sign, 10),
      };
    }
  }
  return enriched;
}

/* ===== DYNAMIC FONT SCALING ===== */

/**
 * Dynamic font metrics — shrinks font + line-height when a house is crowded.
 * Guarantees (count-1)*lineHeight <= budget so text never overflows.
 *
 * @param {number} planetCount  — number of planets in the house
 * @param {number} budget       — max vertical px available for stacking
 */
export function getHouseFontMetrics(planetCount, budget) {
  if (planetCount <= 1) return { fontSize: PLANET_FONT, lineHeight: PLANET_LH };

  const needed = (planetCount - 1) * PLANET_LH;
  if (needed <= budget) return { fontSize: PLANET_FONT, lineHeight: PLANET_LH };

  const lineHeight = Math.floor(budget / (planetCount - 1));
  const fontSize = Math.max(MIN_PLANET_FONT, Math.min(PLANET_FONT, lineHeight - 6));

  return { fontSize, lineHeight };
}

/**
 * Build active chart data from a chartBundle for a given chart key (D1, D9, etc.).
 * Handles D1 enrichment and varga conversion automatically.
 */
export function resolveChartData(chartBundle, chartKey, natalPlanets) {
  if (!chartBundle) return null;
  const bundle = chartBundle.bundle || chartBundle;

  if (chartKey === 'D1' && bundle.charts?.D1?.placements) {
    return enrichD1(bundle.charts.D1, natalPlanets || bundle.natal?.planets);
  }

  const vargaData = bundle.vargas?.[chartKey];
  if (vargaData) {
    const option = CHART_OPTIONS.find(o => o.value === chartKey);
    return vargaToChartData(vargaData, option?.label || chartKey);
  }

  // Fallback to D1
  if (bundle.charts?.D1?.placements) {
    return enrichD1(bundle.charts.D1, natalPlanets || bundle.natal?.planets);
  }
  return null;
}

/**
 * Filter CHART_OPTIONS to only those with data in the bundle.
 */
export function getAvailableCharts(chartBundle) {
  if (!chartBundle) return [];
  const bundle = chartBundle.bundle || chartBundle;
  return CHART_OPTIONS.filter(opt => {
    if (opt.value === 'D1') return !!bundle.charts?.D1;
    return !!bundle.vargas?.[opt.value];
  });
}
