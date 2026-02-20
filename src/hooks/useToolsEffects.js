import { useEffect } from 'react';

function initializeDasha() {
  const dashaData = [
    { planet: 'Mars', period: 'Mahadasha', years: '2020-2027', current: true, desc: 'Career growth and aggressive energy' },
    { planet: 'Rahu', period: 'Mahadasha', years: '2027-2045', current: false, desc: 'Unexpected changes and material gains' },
    { planet: 'Jupiter', period: 'Mahadasha', years: '2045-2061', current: false, desc: 'Wisdom and spiritual growth' }
  ];

  const container = document.getElementById('dashaTimeline');
  if (!container) return;
  container.innerHTML = dashaData
    .map(
      (d) => `
      <div class="dasha-item ${d.current ? 'current' : ''}">
        <div class="period">${d.planet} ${d.period}</div>
        <div class="dates">${d.years}</div>
        <p style="color: #b0b7c3; margin-top: 5px;">${d.desc}</p>
        ${d.current ? '<span style="color: #2ed573; font-size: 0.85rem;"><i class="fas fa-clock"></i> Current Period</span>' : ''}
      </div>`
    )
    .join('');
}

function initializeCompatibility() {
  const gunas = [
    { name: 'Varna', score: 1, total: 1 },
    { name: 'Vashya', score: 2, total: 2 },
    { name: 'Tara', score: 2, total: 3 },
    { name: 'Yoni', score: 3, total: 4 },
    { name: 'Graha Maitri', score: 4, total: 5 },
    { name: 'Gana', score: 3, total: 3 },
    { name: 'Bhakoot', score: 5, total: 7 },
    { name: 'Nadi', score: 6, total: 8 }
  ];

  const totalScore = gunas.reduce((sum, g) => sum + g.score, 0);
  const totalMax = gunas.reduce((sum, g) => sum + g.total, 0);

  const scoreCircle = document.querySelector('.score-circle span');
  if (scoreCircle) scoreCircle.textContent = `${totalScore}/${totalMax}`;

  const gunaGrid = document.getElementById('gunaGrid');
  if (gunaGrid) {
    gunaGrid.innerHTML = gunas
      .map(
        (g) => `
        <div class="guna-item">
          <div class="guna-name">${g.name}</div>
          <div class="guna-score">${g.score}/${g.total}</div>
        </div>`
      )
      .join('');
  }

  const manglikDiv = document.getElementById('manglikAnalysis');
  if (manglikDiv) {
    manglikDiv.innerHTML = `
      <div style="background: rgba(255, 71, 87, 0.1); padding: 15px; border-radius: 8px; margin-top: 20px;">
        <h4 style="color: #ff4757; margin-bottom: 10px;"><i class="fas fa-exclamation-triangle"></i> Manglik Dosha Detected</h4>
        <p style="color: #e0e0e0;">Person A has Manglik dosha (Mars in 1st house). Special remedies required for marriage compatibility.</p>
      </div>
    `;
  }
}

function initializeHoroscope() {
  const selector = document.getElementById('horoscopeSelector');
  const horoscopeContent = document.getElementById('horoscopeContent');
  if (!selector || !horoscopeContent) return;

  const updateHoroscope = () => {
    const predictions = {
      career: "Mars in 10th house indicates sudden career opportunities. Avoid major decisions during Mercury retrograde.",
      love: 'Venus-Jupiter conjunction brings relationship harmony. Singles may meet someone through work.',
      finance: "Saturn's transit suggests cautious investments. Good time for long-term planning.",
      health: 'Watch for stress-related issues. Regular exercise recommended.'
    };

    const transits = [
      { planet: 'Mars', effect: 'Career opportunities' },
      { planet: 'Venus', effect: 'Relationship focus' },
      { planet: 'Saturn', effect: 'Financial discipline' }
    ];

    horoscopeContent.innerHTML = `
      <div class="horoscope-card"><h3><i class="fas fa-briefcase"></i> Career</h3><p>${predictions.career}</p></div>
      <div class="horoscope-card"><h3><i class="fas fa-heart"></i> Love & Relationships</h3><p>${predictions.love}</p></div>
      <div class="horoscope-card"><h3><i class="fas fa-coins"></i> Finance</h3><p>${predictions.finance}</p></div>
      <div class="horoscope-card"><h3><i class="fas fa-heartbeat"></i> Health</h3><p>${predictions.health}</p></div>
      <div class="horoscope-card">
        <h3><i class="fas fa-planet-ringed"></i> Today's Transits</h3>
        ${transits.map((t) => `<div class="transit-item"><span class="planet">${t.planet}</span><span class="effect">${t.effect}</span></div>`).join('')}
      </div>
    `;
  };

  selector.addEventListener('change', updateHoroscope);
  updateHoroscope();

  return () => selector.removeEventListener('change', updateHoroscope);
}

export function useToolsEffects() {
  useEffect(() => {
    if (document.getElementById('dashaTimeline')) initializeDasha();
    if (document.getElementById('compatibilityForm')) initializeCompatibility();
    return initializeHoroscope();
  }, []);
}
