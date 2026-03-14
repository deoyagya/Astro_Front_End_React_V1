import { useEffect } from 'react';
import DOMPurify from 'dompurify';

const reports = [
  {
    id: 'career',
    title: 'Career & Finance',
    icon: 'fa-briefcase',
    desc: 'In-depth analysis of your professional path, growth periods, and financial potential based on 10th house, 2nd house, and planetary periods.',
    pages: '25+',
    price: '1,499',
    badge: 'Best Seller',
    warning: [
      'Saturn in 10th house indicates major career blockage until June 2025',
      'Financial loss period: March - August 2024 due to debilitated Jupiter',
      'Workplace enemies: Colleague with Sun-Mars combination plotting against you',
      'Promotion denied - next opportunity only in 2026'
    ],
    planets: [
      { name: 'Sun', house: '10th', status: 'afflicted', effect: 'Ego clashes with superiors' },
      { name: 'Saturn', house: '10th', status: 'afflicted', effect: 'Delayed promotions' },
      { name: 'Jupiter', house: '2nd', status: 'afflicted', effect: 'Financial instability' }
    ],
    remedies: [
      'Wear Blue Sapphire (Neelam) on Saturday - activates Saturn protection',
      'Donate black sesame seeds on 16 Saturdays - reduces Saturn affliction',
      'Recite Hanuman Chalisa every Tuesday - removes workplace obstacles'
    ]
  },
  {
    id: 'love',
    title: 'Love & Marriage',
    icon: 'fa-heart',
    desc: 'Detailed compatibility analysis, marriage timing, relationship strengths, and challenges based on 7th house, Venus, and Jupiter.',
    pages: '30+',
    price: '1,799',
    badge: '',
    warning: [
      '7th house affliction by Mars - delays marriage until age 32',
      'Current partner has hidden tendencies - Venus-Ketu conjunction indicates deception',
      'Breakup window: Oct-Dec 2024 - Rahu transiting 7th house',
      'Only 18/36 gunas matching with current partner'
    ],
    planets: [
      { name: 'Venus', house: '7th', status: 'afflicted', effect: 'Relationship instability' },
      { name: 'Mars', house: '1st', status: 'afflicted', effect: 'Manglik dosha - causes conflicts' },
      { name: 'Ketu', house: '7th', status: 'afflicted', effect: 'Deception, hidden secrets' }
    ],
    remedies: [
      'Wear Diamond or White Sapphire - strengthens Venus',
      'Recite Durga Saptashati on Fridays - removes relationship obstacles',
      'Perform Kumbh Vivah if Manglik - neutralizes marriage delays'
    ]
  },
  {
    id: 'education',
    title: 'Education & Intelligence',
    icon: 'fa-brain',
    desc: 'Analysis of learning abilities, academic success periods, and intellectual strengths through 5th house, Mercury, and Jupiter influences.',
    pages: '20+',
    price: '1,299',
    badge: '',
    warning: [
      '5th house afflicted by Saturn - exam failure probability: 78%',
      'Memory issues due to weak Mercury - affecting retention',
      'Avoid competitive exams Nov 2024 - Feb 2025 - debilitated Jupiter',
      'Current career field not aligned with your chart'
    ],
    planets: [
      { name: 'Mercury', house: '5th', status: 'afflicted', effect: 'Poor concentration' },
      { name: 'Jupiter', house: '9th', status: 'afflicted', effect: 'Higher education blocked' },
      { name: 'Saturn', house: '5th', status: 'afflicted', effect: 'Delay in completing degree' }
    ],
    remedies: [
      'Wear Emerald (Panna) - strengthens Mercury',
      'Recite Saraswati Vandana daily - improves memory',
      'Study during Mercury hours (6-8 AM) - maximum retention'
    ]
  },
  {
    id: 'health',
    title: 'Health & Wellness',
    icon: 'fa-spa',
    desc: 'Understand health predispositions, vitality periods, and preventive measures through 6th house, lagna, and planetary afflictions.',
    pages: '22+',
    price: '1,399',
    badge: 'New',
    warning: [
      '6th house affliction: Chronic illness risk - digestive system vulnerable',
      'Weak Sun indicates low immunity - frequent infections',
      'Mental health alert: Anxiety attacks - Moon-Rahu conjunction',
      'Joint/bone issues after age 35 - Saturn in 8th house'
    ],
    planets: [
      { name: 'Sun', house: '1st', status: 'afflicted', effect: 'Weak immunity' },
      { name: 'Moon', house: '12th', status: 'afflicted', effect: 'Mental stress' },
      { name: 'Saturn', house: '6th', status: 'afflicted', effect: 'Chronic illness' }
    ],
    remedies: [
      'Wear Ruby (Manik) - strengthens Sun, boosts immunity',
      'Recite Aditya Hridayam at sunrise - removes health obstacles',
      'Practice Pranayama daily - balances Moon, reduces anxiety'
    ]
  },
  {
    id: 'spiritual',
    title: 'Spiritual Growth',
    icon: 'fa-om',
    desc: 'Explore your spiritual path, past life karmas, and evolution through 12th house, Ketu, and spiritual planetary influences.',
    pages: '28+',
    price: '1,599',
    badge: '',
    warning: [
      '12th house Ketu: Past life karma blocking progress',
      'Spiritual emergency by 2025 - third eye activation delayed',
      'Confusion in life purpose - Neptune afflicting 12th house',
      'Ancestral karma: Pitru dosha affecting spiritual growth'
    ],
    planets: [
      { name: 'Ketu', house: '12th', status: 'afflicted', effect: 'Spiritual block' },
      { name: 'Jupiter', house: '9th', status: 'neutral', effect: 'Guru grace delayed' },
      { name: 'Saturn', house: '8th', status: 'afflicted', effect: 'Fear of death' }
    ],
    remedies: [
      "Wear Cat's Eye (Lehsunia) - protects from negative energies",
      'Perform Pitru Tarpan - removes ancestral blocks',
      'Chant Gayatri Mantra 108 times daily - activates third eye'
    ]
  },
  {
    id: 'family',
    title: 'Family & Children',
    icon: 'fa-home',
    desc: 'Analysis of family harmony, child birth timing, and relationships with parents through 4th house, 5th house, and benefic planets.',
    pages: '26+',
    price: '1,499',
    badge: '',
    warning: [
      '4th house affliction: Property dispute with siblings - legal battle ahead',
      'Childbirth delay - 5th house Saturn blocking progeny',
      "Parental health emergency: Mother's health critical in 2024",
      'Moving house: Wrong timing - financial loss'
    ],
    planets: [
      { name: 'Moon', house: '4th', status: 'afflicted', effect: "Mother's health issues" },
      { name: 'Saturn', house: '5th', status: 'afflicted', effect: 'Childbirth delay' },
      { name: 'Mars', house: '4th', status: 'afflicted', effect: 'Property disputes' }
    ],
    remedies: [
      'Wear Pearl (Moti) - strengthens Moon, protects mother',
      'Recite Durga Chalisa on Ashtami - family protection',
      'Feed cows on Amavasya - removes progeny obstacles'
    ]
  }
];

export function useReportsEffects() {
  useEffect(() => {
    const reportsGrid = document.getElementById('reportsGrid');
    const sampleModal = document.getElementById('sampleModal');
    const modalContent = document.getElementById('modalContent');
    const bundleBtn = document.getElementById('bundleOrderBtn');
    if (!reportsGrid || !sampleModal || !modalContent) return undefined;

    const getCart = () => {
      const parsed = JSON.parse(localStorage.getItem('cart') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    };

    const normalizePrice = (price) => Number(String(price).replace(/,/g, ''));

    const addToCart = (id) => {
      const report = reports.find((item) => item.id === id);
      if (!report) return;

      const cart = getCart();
      if (!cart.some((item) => item.id === report.id)) {
        cart.push({
          id: report.id,
          name: report.title,
          price: normalizePrice(report.price)
        });
        localStorage.setItem('cart', JSON.stringify(cart));
      }
    };

    const orderReport = (id) => {
      if (id) addToCart(id);
      sampleModal.classList.remove('show');
      window.location.href = '/order';
    };

    const showSample = (id) => {
      const report = reports.find((item) => item.id === id);
      if (!report) return;

      modalContent.innerHTML = DOMPurify.sanitize(`
        <button class="modal-close" data-close="sample"><i class="fas fa-times"></i></button>
        <div class="sample-header">
          <i class="fas ${report.icon}"></i>
          <h2>${report.title} - Sample Report</h2>
        </div>
        <div class="sample-warning">
          <h3><i class="fas fa-exclamation-triangle"></i> Critical Alerts</h3>
          <ul>
            ${report.warning.map((w) => `<li><i class="fas fa-exclamation-circle"></i> ${w}</li>`).join('')}
          </ul>
        </div>
        <div class="sample-planets">
          <h3>Planetary Afflictions</h3>
          <div class="planet-grid">
            ${report.planets
              .map(
                (p) => `
                <div class="planet-item ${p.status || 'afflicted'}">
                  <strong>${p.name}</strong> in ${p.house}
                  <p style="font-size: 0.9rem; margin-top: 5px;">${p.effect}</p>
                </div>`
              )
              .join('')}
          </div>
        </div>
        <div class="sample-remedies">
          <h3><i class="fas fa-shield-heart"></i> Emergency Remedies</h3>
          <ul>
            ${report.remedies.map((r) => `<li><i class="fas fa-check-circle"></i> ${r}</li>`).join('')}
          </ul>
          <p style="color: #ffa502; margin-top: 15px;"><i class="fas fa-lock"></i> 12+ more remedies in full report</p>
        </div>
        <div class="sample-footer">
          <p>This is a SAMPLE preview. Full report includes personalized analysis with exact planetary positions and complete remedies.</p>
          <button class="btn-order" data-order="${report.id}">Order Full Report</button>
        </div>
      `);

      sampleModal.classList.add('show');
    };

    reportsGrid.innerHTML = reports
      .map(
        (report) => `
      <div class="report-card" id="${report.id}">
        ${report.badge ? `<div class="card-badge">${report.badge}</div>` : ''}
        <div class="report-icon"><i class="fas ${report.icon}"></i></div>
        <h3>${report.title}</h3>
        <p class="report-desc">${report.desc}</p>
        <div class="report-meta">
          <span><i class="fas fa-calendar-alt"></i> ${report.pages} pages</span>
          <span><i class="fas fa-clock"></i> 24hrs delivery</span>
        </div>
        <div class="report-price">$${report.price} USD</div>
        <div class="report-actions">
          <button class="btn-sample" data-sample="${report.id}">
            <i class="fas fa-eye"></i> View Sample
          </button>
          <button class="btn-order" data-order="${report.id}">
            <i class="fas fa-file-invoice"></i> Order
          </button>
        </div>
      </div>`
      )
      .join('');

    const clickHandler = (e) => {
      const sampleId = e.target.closest('[data-sample]')?.getAttribute('data-sample');
      const orderId = e.target.closest('[data-order]')?.getAttribute('data-order');
      const closeSample = e.target.closest('[data-close="sample"]');

      if (sampleId) showSample(sampleId);
      if (orderId) orderReport(orderId);
      if (closeSample) sampleModal.classList.remove('show');
    };

    const outsideHandler = (e) => {
      if (e.target === sampleModal) {
        sampleModal.classList.remove('show');
      }
    };

    const onBundleClick = () => {
      reports.forEach((report) => addToCart(report.id));
      window.location.href = '/order';
    };

    reportsGrid.addEventListener('click', clickHandler);
    modalContent.addEventListener('click', clickHandler);
    window.addEventListener('click', outsideHandler);
    bundleBtn?.addEventListener('click', onBundleClick);

    return () => {
      reportsGrid.removeEventListener('click', clickHandler);
      modalContent.removeEventListener('click', clickHandler);
      window.removeEventListener('click', outsideHandler);
      bundleBtn?.removeEventListener('click', onBundleClick);
    };
  }, []);
}
