/**
 * Module-level store for Dasha drill-down navigation.
 * Caches the full dasha tree (fetched once) and provides
 * path-based traversal for sub-level screens.
 */

let _tree: any[] = [];

export const dashaNavStore = {
  setTree: (tree: any[]) => {
    _tree = tree;
  },

  getTree: () => _tree,

  /**
   * Traverse tree by dot-separated index path.
   *   path="3"     → tree[3].sub_periods
   *   path="3.5"   → tree[3].sub_periods[5].sub_periods
   *   path="3.5.2" → tree[3].sub_periods[5].sub_periods[2].sub_periods
   *
   * Returns { periods, breadcrumbs, level }
   */
  getAtPath: (path: string): { periods: any[]; breadcrumbs: string[]; level: number } => {
    const indices = path.split('.').map(Number);
    let current = _tree;
    const breadcrumbs: string[] = [];

    for (const idx of indices) {
      const node = current[idx];
      if (!node) return { periods: [], breadcrumbs, level: indices.length };
      breadcrumbs.push(node.planet || node.lord);
      current = node.sub_periods || node.children || [];
    }

    return { periods: current, breadcrumbs, level: indices.length };
  },
};
