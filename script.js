/**
 * TUSHAR PANDEY — Personal Portfolio & AI Creative Studio
 * Architecture:
 * 1. High-Performance 60/120fps Face-Turning Scroll Animation
 * 2. Sticky Hero Tracking with Natural Document Flow
 * 3. Configurable Multi-Account Social Network System
 * 4. Interactive Project Case Study Modals
 * 5. Responsive Navigation with Active Scroll-Spy
 */

(() => {
  'use strict';

  /* ==========================================================================
     1. SCROLL-DRIVEN FACE-TURNING ANIMATION ENGINE
     ========================================================================== */
  const TOTAL_FRAMES = 240;
  const FRAME_DIR = './frames/';
  const FRAME_PREFIX = 'frame_';
  const FRAME_EXT = '.jpg';
  const CACHE_BUST = 'v=tushar_' + Date.now();
  const LERP_FACTOR = 0.09;

  const canvas = document.getElementById('frame-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const loadingIndicator = document.getElementById('loading-indicator');
  const loadingBar = document.getElementById('loading-bar');
  const heroTrack = document.getElementById('home');
  const heroFrame = document.querySelector('.hero-sticky-frame');
  const scrollPrompt = document.getElementById('scroll-prompt');

  const frames = new Array(TOTAL_FRAMES);
  const loadedStatus = new Uint8Array(TOTAL_FRAMES);
  let loadedCount = 0;

  let targetProgress = 0;
  let currentProgress = 0;
  let lastDrawnFrameIndex = -1;
  let isRunning = true;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  function getFrameSrc(index) {
    const frameNumber = String(index + 1).padStart(4, '0');
    return `${FRAME_DIR}${FRAME_PREFIX}${frameNumber}${FRAME_EXT}?${CACHE_BUST}`;
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetWidth = Math.round(window.innerWidth * dpr);
    const targetHeight = Math.round(window.innerHeight * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      lastDrawnFrameIndex = -1;
    }

    renderCurrentState();
  }

  function drawCover(img) {
    if (!img || !img.complete || img.naturalWidth === 0) return false;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const scale = Math.max(cw / iw, ch / ih);
    const sw = iw * scale;
    const sh = ih * scale;
    const sx = (cw - sw) * 0.5;
    const sy = (ch - sh) * 0.5;

    ctx.drawImage(img, sx, sy, sw, sh);
    return true;
  }

  function getBestAvailableFrame(preferredIndex) {
    if (loadedStatus[preferredIndex] === 1 && frames[preferredIndex] && frames[preferredIndex].naturalWidth > 0) {
      return frames[preferredIndex];
    }

    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prev = preferredIndex - offset;
      if (prev >= 0 && loadedStatus[prev] === 1 && frames[prev] && frames[prev].naturalWidth > 0) {
        return frames[prev];
      }
      const next = preferredIndex + offset;
      if (next < TOTAL_FRAMES && loadedStatus[next] === 1 && frames[next] && frames[next].naturalWidth > 0) {
        return frames[next];
      }
    }

    return frames[0] || null;
  }

  function renderFrame(index) {
    const clampedIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, index));
    const img = getBestAvailableFrame(clampedIndex);

    if (img && drawCover(img)) {
      lastDrawnFrameIndex = clampedIndex;
      return true;
    }
    return false;
  }

  function renderCurrentState() {
    const frameIndex = Math.round(currentProgress * (TOTAL_FRAMES - 1));
    renderFrame(frameIndex);
  }

  /**
   * Calculates scroll progress within the Hero Track
   * - At top (0px): Frame 0 (front-facing portrait)
   * - As user scrolls: advances through sequence to Frame 239 (side-turned portrait)
   * - Scrolling back up: smoothly reverses to Frame 0
   */
  function updateScrollProgress() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0;

    if (heroTrack) {
      const maxHeroScroll = heroTrack.offsetHeight - window.innerHeight;
      if (maxHeroScroll > 0) {
        targetProgress = Math.max(0, Math.min(1, scrollTop / maxHeroScroll));
      } else {
        targetProgress = 0;
      }

      // Smoothly fade hero text as visitor approaches transition into Selected Work
      if (heroFrame) {
        if (targetProgress > 0.85) {
          const fade = 1 - (targetProgress - 0.85) / 0.15;
          heroFrame.style.opacity = Math.max(0, fade).toFixed(2);
        } else {
          heroFrame.style.opacity = '1';
        }
      }
    }

    // Hide scroll prompt once user initiates scroll
    if (scrollPrompt) {
      if (scrollTop > 40) {
        scrollPrompt.style.opacity = '0';
        scrollPrompt.style.pointerEvents = 'none';
      } else {
        scrollPrompt.style.opacity = '0.7';
      }
    }

    // Top Navigation styling and active scroll-spy
    updateNavState(scrollTop);
  }

  function tick() {
    if (!isRunning) return;

    const delta = targetProgress - currentProgress;

    if (Math.abs(delta) > 0.00005) {
      currentProgress += delta * LERP_FACTOR;
    } else {
      currentProgress = targetProgress;
    }

    const frameIndex = Math.round(currentProgress * (TOTAL_FRAMES - 1));

    if (frameIndex !== lastDrawnFrameIndex) {
      renderFrame(frameIndex);
    }

    requestAnimationFrame(tick);
  }

  function preloadImages() {
    const firstImg = new Image();

    const onFirstLoad = () => {
      loadedStatus[0] = 1;
      loadedCount = 1;
      frames[0] = firstImg;
      resizeCanvas();
      renderFrame(0);
      loadRemainingFrames();
    };

    firstImg.onload = onFirstLoad;
    firstImg.onerror = () => {
      loadRemainingFrames();
    };

    firstImg.src = getFrameSrc(0);
    frames[0] = firstImg;

    if (firstImg.complete && firstImg.naturalWidth > 0) {
      onFirstLoad();
    }

    function loadRemainingFrames() {
      let currentIndex = 1;
      const CONCURRENCY = 10;

      function loadNext() {
        if (currentIndex >= TOTAL_FRAMES) return;
        const idx = currentIndex++;
        const img = new Image();

        const onLoaded = () => {
          loadedStatus[idx] = 1;
          loadedCount++;

          if (loadingBar) {
            loadingBar.style.width = `${Math.round((loadedCount / TOTAL_FRAMES) * 100)}%`;
          }

          const currentTarget = Math.round(currentProgress * (TOTAL_FRAMES - 1));
          if (currentTarget === idx) {
            renderFrame(idx);
          }

          if (loadedCount >= TOTAL_FRAMES && loadingIndicator) {
            setTimeout(() => {
              loadingIndicator.classList.add('loaded');
            }, 300);
          }

          loadNext();
        };

        img.onload = onLoaded;
        img.onerror = () => {
          loadedCount++;
          loadNext();
        };

        img.src = getFrameSrc(idx);
        frames[idx] = img;

        if (img.complete && img.naturalWidth > 0) {
          onLoaded();
        }
      }

      for (let c = 0; c < CONCURRENCY; c++) {
        loadNext();
      }
    }
  }

  /* ==========================================================================
     2. NAVIGATION & ACTIVE SCROLL-SPY
     ========================================================================== */
  function updateNavState(scrollTop) {
    const topNav = document.getElementById('top-nav');
    if (topNav) {
      topNav.classList.toggle('scrolled', scrollTop > 50);
    }

    // Scroll spy for active link
    const sections = ['home', 'work', 'certifications', 'about', 'connect', 'contact'];
    const navLinks = document.querySelectorAll('.nav-link');

    let currentSection = 'home';
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.4) {
          currentSection = id;
        }
      }
    });

    navLinks.forEach((link) => {
      const targetId = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', targetId === currentSection);
    });
  }

  /* ==========================================================================
     3. CONFIGURABLE MULTI-ACCOUNT SOCIAL PLATFORMS DATA STRUCTURE
     ========================================================================== */
  const SOCIAL_ACCOUNTS = [
    {
      platform: 'LinkedIn',
      badge: 'CAREER & NETWORK',
      displayName: 'Tushar Pandey',
      accountLabel: 'Professional Profile',
      url: 'https://www.linkedin.com/in/tushar-pandey-ads1expert/',
      ctaText: 'Visit Profile',
      description: 'Performance Marketing strategy, campaign analytics, growth updates, and industry insights.',
      icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.8v8.37H6.46v-8.37M7.86 6.54a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26z"/></svg>'
    },
    {
      platform: 'Instagram',
      badge: 'CHARACTER IP',
      displayName: 'Golu Kregana',
      accountLabel: '@golu_kregana',
      url: 'https://www.instagram.com/golu_kregana/',
      ctaText: 'Visit Instagram',
      description: 'Original Hindi episodic stories, character reels, short-form comedy, and narrative advertising concepts.',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>'
    },
    {
      platform: 'Instagram',
      badge: 'CREATIVE STUDIO',
      displayName: 'Aura',
      accountLabel: '@aura_music1',
      url: 'https://www.instagram.com/aura_music1/',
      ctaText: 'Visit Instagram',
      description: 'Creative photo editing, aesthetic visual transformations, AI image design, and cinematic studio art.',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>'
    },
    {
      platform: 'YouTube',
      badge: 'BHAKTI & DEVOTION',
      displayName: 'Maruti Mantra',
      accountLabel: '@maruti.mantra',
      url: 'https://youtube.com/@maruti.mantra',
      ctaText: 'Visit Channel',
      description: 'Devotional video productions, chants, sacred aura aesthetics, and culturally rooted spiritual visual storytelling.',
      icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>'
    },
    {
      platform: 'YouTube',
      badge: 'MUSIC & SOUND',
      displayName: 'Ze Wa Music',
      accountLabel: '@gwamusicup',
      url: 'https://youtube.com/@gwamusicup',
      ctaText: 'Visit Channel',
      description: 'Full-length generative tracks, ambient soundscapes, aesthetic visualizers, and music concepts.',
      icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>'
    },
    {
      platform: 'Email',
      badge: 'DIRECT INQUIRIES',
      displayName: 'tusharpandeyitsme@gmail.com',
      accountLabel: 'Job Opportunities & Inquiries',
      url: '#contact',
      mailto: 'mailto:tusharpandeyitsme@gmail.com',
      ctaText: 'Contact Me',
      isEmail: true,
      description: 'Direct channel for recruitment discussions, performance marketing roles, and creative client projects.',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'
    }
  ];

  function renderSocialAccounts() {
    const container = document.getElementById('social-accounts-container');
    if (!container) return;

    container.innerHTML = SOCIAL_ACCOUNTS.map((acc, index) => {
      let buttonHtml = '';

      if (acc.isEmail || acc.platform === 'Email') {
        buttonHtml = `
          <div class="account-actions-group">
            <a href="#contact" class="account-link-btn account-btn-primary" aria-label="Contact Me — Navigate to contact form">
              <span>Contact Me</span>
              <svg viewBox="0 0 16 16" fill="none" style="width:12px;height:12px" aria-hidden="true"><path d="M8 3v10M3 8l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
            <a href="${acc.mailto || 'mailto:tusharpandeyitsme@gmail.com'}" class="account-link-btn account-btn-secondary" aria-label="Send direct email to ${acc.displayName}">
              <span>Send Email</span>
              <svg viewBox="0 0 16 16" fill="none" style="width:12px;height:12px" aria-hidden="true"><path d="M2 4h12c.6 0 1 .4 1 1v6c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V5c0-.6.4-1 1-1z" stroke="currentColor" stroke-width="1.4"/><path d="M1 5l7 4 7-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
          </div>`;
      } else {
        buttonHtml = `
          <a href="${acc.url}" target="_blank" rel="noopener noreferrer" class="account-link-btn" aria-label="${acc.ctaText} — ${acc.displayName} (${acc.platform})">
            <span>${acc.ctaText}</span>
            <svg viewBox="0 0 16 16" fill="none" style="width:12px;height:12px" aria-hidden="true"><path d="M3 13L13 3M13 3H6M13 3V10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>`;
      }

      return `
        <div class="account-card" data-index="${index}">
          <div class="account-top">
            <div class="account-platform">
              ${acc.icon}
              <span>${acc.platform}</span>
            </div>
            <span class="account-badge">${acc.badge}</span>
          </div>
          <div class="account-name">${acc.displayName}</div>
          <p class="account-desc">${acc.description}</p>
          ${buttonHtml}
        </div>
      `;
    }).join('');
  }

  /* ==========================================================================
     4. CURATED PROJECT CASE STUDY DETAILS & MODAL
     ========================================================================== */
  const PROJECT_DETAILS = {
    '01': {
      category: 'PROJECT 01 — AI PERFORMANCE MARKETING & MARKETING ANALYTICS',
      title: 'AI Performance Marketing & Marketing Analytics',
      leadText: 'Combining paid media strategy, AI-assisted workflows, and marketing analytics to support campaign optimization and data-driven decisions.',
      platforms: [
        {
          name: 'Google Ads',
          desc: 'High-intent Search query bidding, Performance Max (PMax) setups, negative keyword hierarchies, smart bidding (tCPA/tROAS), and YouTube Video action campaigns.'
        },
        {
          name: 'Meta Ads',
          desc: 'Multi-stage conversion funnels (TOF Prospecting, MOF Consideration, BOF Dynamic Retargeting), custom Lookalike audiences, and creative hook A/B testing.'
        },
        {
          name: 'Flipkart Ads',
          desc: 'Marketplace catalog optimization, Product Listing Ads (PLA), brand store banner placements, keyword bid pacing, and search shelf-share visibility.'
        },
        {
          name: 'LinkedIn Ads',
          desc: 'B2B account-based marketing (ABM), decision-maker seniority targeting, Sponsored Content, and lead generation form optimization.'
        }
      ],
      workflow: [
        { step: '01', title: 'Business Objective', desc: 'Define target CPA, payback period, minimum ROAS threshold, and margin-adjusted budget allocation.' },
        { step: '02', title: 'Audience & Keyword Research', desc: 'Competitor intelligence, commercial search intent categorization, and CPC vs. volume modeling.' },
        { step: '03', title: 'Campaign Structure', desc: 'Granular single-theme ad groups, keyword match-type segmentation, and audience negative exclusions.' },
        { step: '04', title: 'Creative Testing & LP Alignment', desc: 'Iterating high-converting visual hooks, value proposition testing, and landing page message synchronization.' },
        { step: '05', title: 'Measurement & Analytics', desc: 'Server-side Google Tag Manager, Meta Conversions API (CAPI), UTM taxonomy, and attribution modeling.' },
        { step: '06', title: 'Optimization & Reporting', desc: 'Daily bid adjustments, search query sculpting, budget reallocation, and executive KPI reporting.' }
      ],
      aiWorkflows: [
        {
          title: 'Creative Ideation & Hook Structuring',
          desc: 'Generating high-converting ad copy, visual storyboard concepts, and audience-specific angle hooks across static, video, and audio formats using advanced prompt frameworks.'
        },
        {
          title: 'Analytical Assistance & Trend Modeling',
          desc: 'Leveraging AI-assisted data parsing to detect day-parting anomalies, creative fatigue, auction saturation trends, and cross-channel performance shifts.'
        },
        {
          title: 'Reporting Generation & KPI Summaries',
          desc: 'Automating multi-platform performance rollups, blended ROAS calculations, attribution tracking, and executive KPI summaries for cross-functional stakeholders.'
        },
        {
          title: 'Structured Campaign Experimentation',
          desc: 'Formulating rigorous hypothesis-driven A/B testing matrices to systematically isolate winning visual hooks, copy variations, and audience variables.'
        },
        {
          title: 'AI-Powered Creative Production',
          desc: 'Creating AI-assisted videos, music, visuals and advertising concepts, then adapting creative assets into short-form video ads, static ad variations and campaign storytelling.'
        }
      ],
      aiCreativeExamples: {
        heading: 'AI-POWERED AD CREATIVE EXAMPLES',
        description: 'Exploring how AI-generated videos, music and visuals can be adapted into advertising concepts and creative experiments.',
        items: [
          {
            type: 'video',
            id: 'creative-video-card',
            title: 'Character Narrative & Short-Form Video Hook',
            oneLiner: 'Adapting episodic character IP into short-form video concepts with high visual retention and narrative pacing.',
            adApplication: 'Demonstrates how character storytelling and visual hooks can inspire short-form video advertising concepts. (Personal spec ad concept; not a client campaign).',
            disclaimer: 'Not affiliated with, commissioned by, or endorsed by Complan or its parent company.',
            videoSrc: 'assets/golu_complan-compressed.mp4',
            fallbackSrc: 'assets/golu_complan.mp4',
            posterSrc: 'assets/golu_complan.png',
            tag: 'VIDEO AD CONCEPT',
            videos: [
              {
                id: 'complan-spec-ad',
                title: 'Complan — Morning Routine & Nutrition Hook',
                videoSrc: 'assets/golu_complan-compressed.mp4',
                fallbackSrc: 'assets/golu_complan.mp4',
                posterSrc: 'assets/golu_complan.png',
                tag: 'VIDEO AD CONCEPT',
                caption: 'Complan Spec Ad • 30s Narrative Hook'
              }
            ]
          },
          {
            type: 'audio',
            id: 'creative-audio-card',
            title: 'Generative Audio & Soundscape Concept',
            oneLiner: 'Developing original AI-assisted music compositions to complement audio-led creative ad experiments and soundtracks.',
            adApplication: 'Demonstrates how original AI-assisted music can support audio-led creative experiments and sonic branding. (Independent creative project).',
            tag: 'AUDIO-LED CREATIVE',
            tracks: [
              {
                id: 'stay-with-me-tonight',
                title: 'Stay With Me Tonight (Official Music Video)',
                channel: 'Ze-Wa Music',
                genre: 'AI Pop Fusion',
                videoId: 'JdY3cOjIFHg',
                embedUrl: 'https://www.youtube-nocookie.com/embed/JdY3cOjIFHg?rel=0',
                thumbnail: 'https://i.ytimg.com/vi/JdY3cOjIFHg/hqdefault.jpg',
                tag: 'ZE-WA MUSIC • TRACK 01'
              },
              {
                id: 'ze-wa-slow',
                title: 'Ze-Wa - SLOW',
                channel: 'Ze-Wa Music',
                genre: 'Downtempo Atmospheric Chill',
                videoId: 'O5fYJf4lv0U',
                embedUrl: 'https://www.youtube-nocookie.com/embed/O5fYJf4lv0U?rel=0',
                thumbnail: 'https://i.ytimg.com/vi/O5fYJf4lv0U/hqdefault.jpg',
                tag: 'ZE-WA MUSIC • TRACK 02'
              }
            ]
          },
          {
            type: 'visual',
            id: 'creative-visual-card',
            title: 'Computational Portraiture & Lighting Study',
            oneLiner: 'Engineering directional lighting and prompt frameworks for high-impact static ad variations and visual concepts.',
            adApplication: 'Demonstrates how generated or edited visuals can inspire static ad concepts and creative variations. (Independent creative experiment).',
            tag: 'STATIC AD VARIATION',
            images: [
              {
                src: 'assets/portrait_cinematic_after.png',
                alt: 'Cinematic Portrait After — Directional Chiaroscuro Lighting',
                caption: 'Cinematic Portrait (After • Directional Chiaroscuro)',
                tag: 'CHOPPED KEY LIGHT',
                desc: 'Editorial lighting recalculation casting hard diagonal geometric shadows across facial contours.'
              },
              {
                src: 'assets/portrait_cinematic_before.jpg',
                alt: 'Cinematic Portrait Before — Original Raw Casual Plate',
                caption: 'Cinematic Portrait (Before • Raw Selfie Plate)',
                tag: 'RAW SOURCE PLATE',
                desc: 'Unedited mobile capture under flat ambient lighting before neural lighting recalculation.'
              },
              {
                src: 'assets/fashion_portrait_after.jpg',
                alt: 'Mirrored Gallery Fashion Portrait After',
                caption: 'Fashion Editorial (After • Mirrored Gallery)',
                tag: 'FASHION EDITORIAL',
                desc: 'High-fashion double-breasted suit editorial with recursive mirror reflections and god rays.'
              },
              {
                src: 'assets/fashion_portrait_before.jpg',
                alt: 'Mirrored Gallery Fashion Portrait Before',
                caption: 'Fashion Editorial (Before • Casual Photo)',
                tag: 'RAW SOURCE PLATE',
                desc: 'Original casual street selfie before haute-couture styling and mirror gallery placement.'
              },
              {
                src: 'assets/ai_visual_lab_1.png',
                alt: 'AI Visual Lab Directional Lighting Portrait Experiment',
                caption: 'AI Studio (Directional Key Light Study)',
                tag: 'LIGHTING STUDY',
                desc: 'Controlled cinematic key-to-fill ratio exploration isolating facial planes with amber warmth.'
              },
              {
                src: 'assets/moonlit_hero_after.jpg',
                alt: 'Armored Hero After — Moonlit High Altitude Scene',
                caption: 'Armored Hero (After • Thruster Volumetrics)',
                tag: 'CHARACTER COMPOSITE',
                desc: 'Dual-source illumination pairing glowing ion thrusters with cold lunar edge highlights.'
              },
              {
                src: 'assets/batman_gotham_after.jpg',
                alt: 'Rainy Gotham Batman After',
                caption: 'Rainy Gotham (After • Wet Street Composite)',
                tag: 'NEO-NOIR LIGHTING',
                desc: 'Neo-noir rainy composite integrating Batman beside parked car with ground reflections.'
              },
              {
                src: 'assets/city_platform_after.jpg',
                alt: 'Golden Sunrise at Misty City Platform After',
                caption: 'Golden Sunrise (After • Volumetric Mist)',
                tag: 'ATMOSPHERIC HAZE',
                desc: 'Low-angle 2800K solar rays piercing morning valley mist across elevated city platform.'
              }
            ]
          }
        ]
      },
      notionCaseStudies: [
        {
          badge: 'D2C PERFORMANCE CASE STUDY',
          timeline: '12-Week Strategic Engagement',
          title: 'Cutting CAC by 22% and Rebuilding a Stagnant D2C Growth Engine',
          desc: 'Comprehensive turn-around of a high-burn D2C brand experiencing creative exhaustion and rising customer acquisition costs. Re-architected full-funnel paid media across Meta and Google, deploying rapid generative AI creative testing and cohort margin modeling.',
          url: 'https://iridescent-dormouse-1d0.notion.site/Case-Study-Cutting-CAC-by-22-and-Rebuilding-a-Stagnant-D2C-Growth-Engine-3c83d5260b408063b6eedca04d0ffc85',
          metrics: [
            { val: '-22%', lbl: 'CAC Reduction in 8 Weeks' },
            { val: '5X', lbl: 'Creative Testing Velocity via AI' },
            { val: '3.4X', lbl: 'Blended ROAS Achieved' },
            { val: '2.4%', lbl: 'Average Click-Through Rate' }
          ],
          phases: [
            { phase: 'Weeks 1—2', detail: 'Comprehensive Account Audit, CAPI Tracking Calibration, & Funnel Leak Diagnostics' },
            { phase: 'Weeks 3—5', detail: 'Rapid Creative Engine & Generative Hook Testing (15+ Angles Tested per Week)' },
            { phase: 'Weeks 6—8', detail: 'Full-Funnel Scaling, Dynamic Budget Allocation, & 22% CAC Drop' },
            { phase: 'Weeks 9—12', detail: 'Blended ROAS Stabilization, BOF Retargeting Moat, & Cohort Retention Modeling' }
          ]
        },
        {
          badge: 'MARKETPLACE MONETIZATION & E-COMMERCE',
          timeline: '8-Week Strategic Timeline',
          title: 'Scaling Flipkart Seller GMV: Fixing RTO Leakage and BBD Season Readiness',
          desc: 'Strategic marketplace advertising turn-around for enterprise Flipkart seller cohorts. Diagnosed acute RTO (Return to Origin) margin leakage, optimized PLA keyword bidding, and staged inventory for massive scale during The Big Billion Days festival.',
          url: 'https://iridescent-dormouse-1d0.notion.site/Scaling-Flipkart-Seller-GMV-Platform-Monetization-Fixing-RTO-Leakage-BBD-Season-Readiness-3c83d5260b40807794fdda35ad6d8efe',
          metrics: [
            { val: '32% → 20%', lbl: 'RTO Rate Reduction' },
            { val: '+18%', lbl: 'Net Operating Margin Growth' },
            { val: '2.5X', lbl: 'Seller GMV During BBD Season' },
            { val: '3.8X', lbl: 'ROAS on 40% Spend Scale' }
          ],
          phases: [
            { phase: 'Weeks 1—2', detail: 'Pin-Code & SKU Return Diagnostics, RTO Cost Breakdown, & Margin Leak Isolation' },
            { phase: 'Weeks 3—4', detail: 'Catalog Optimization, High-Intent PLA Keyword Sculpting, & Bid Floor Adjustments' },
            { phase: 'Weeks 5—6', detail: 'Big Billion Days (BBD) Inventory Staging, Hour-by-Hour Spend Pacing, & Ad Scale' },
            { phase: 'Weeks 7—8', detail: 'Post-BBD Retention Analysis, Seller P&L Audit, & Long-Term Margin Governance' }
          ]
        }
      ],
      experience: [
        {
          org: 'ACCENTURE',
          role: 'Advertising Specialist — Meta Ads',
          location: 'Navi Mumbai, Maharashtra',
          dates: 'Jul 2025 — Jul 2026',
          desc: 'Managed 30+ Meta Ads brand portfolios monthly, covering campaign setup, creative management, audience targeting, A/B testing and budget pacing to sustain up to 2X ROAS.',
          bullets: [
            '<strong>Campaign Management:</strong> Managed end-to-end Meta Ads campaign execution, including campaign setup, campaign objective selection, audience targeting, ad set configuration, creative deployment, budget pacing, and ongoing performance optimization to support campaign goals.',
            '<strong>Analytics & Reporting:</strong> Built Looker Studio dashboards using GA4, Google Tag Manager, SQL and Advanced Excel to monitor funnel drop-off and support optimization decisions.',
            '<strong>AI-Assisted Workflows:</strong> Used Claude for ad copy, creative variations, A/B testing ideas and client report drafts; used ChatGPT for AI-generated advertising creative concepts.',
            '<strong>Team Support:</strong> Mentored 3+ junior executives on campaign setup, reporting and client communication.'
          ]
        },
        {
          org: 'ACCENTURE',
          role: 'Advertising Account Manager — Flipkart Ads',
          location: 'Bengaluru, Karnataka',
          dates: 'Jul 2024 — Jun 2025',
          desc: 'Managed a retail media book of business exceeding ₹60L+ per month across 110+ Flipkart Ads seller accounts, with ₹7Cr+ cumulative ad spend over the tenure described in my resume.',
          bullets: [
            '<strong>Campaign Management:</strong> Technical campaign launches, sponsored product setup, keyword bidding and budget pacing, achieving up to 2X ROAS.',
            '<strong>Performance Optimization:</strong> Improved seller performance, with average ROI rising from a 30% baseline to a reported peak of 50% on key accounts.',
            '<strong>Advanced Excel Data Cleaning & Reporting:</strong> Cleaned and organized raw account data using VLOOKUP, XLOOKUP, and Pivot Tables to improve reporting efficiency, reducing reporting turnaround by 40%.',
            '<strong>Google Search Ads Expansion:</strong> Consulted with sellers on opportunities to invest in Google Search Ads alongside marketplace advertising, helping them explore an additional paid acquisition channel for lead generation.'
          ]
        },
        {
          org: 'MYCAPTAIN',
          role: 'Digital Marketing & Business Development Executive',
          location: 'Bengaluru, Karnataka',
          dates: 'Oct 2022 — Feb 2024',
          desc: 'Combined paid acquisition and consultative sales to generate qualified leads and convert prospects into customers for a B2B EdTech funnel.',
          bullets: [
            '<strong>Paid Acquisition:</strong> Managed ₹30L+ spend across Google Search, Display, Performance Max, Meta Ads and LinkedIn Ads.',
            '<strong>Lead Generation:</strong> Generated 100+ monthly leads and converted leads into 15+ customers, as stated in my resume.',
            '<strong>Revenue Achievement:</strong> Contributed to ₹70L+ revenue, with ₹50L+ personally closed.',
            '<strong>Sales Performance:</strong> Approximately ₹70K average deal size and 109% quota attainment.',
            '<strong>Analytics:</strong> Built Looker Studio dashboards using Advanced Excel to track lead-to-revenue performance and pipeline visibility.',
            '<strong>Additional Platforms:</strong> Explored The Trade Desk, DV360, Reddit Ads and Snapchat Ads at limited scale.'
          ]
        }
      ],
      caseStudy: {
        badge: 'Illustrative Strategy Blueprint',
        title: 'Full-Funnel E-Commerce Paid Acquisition Blueprint',
        desc: 'An illustrative campaign architecture blueprint demonstrating the strategic integration of high-intent Google Search with Meta dynamic catalog retargeting and marketplace listing optimization. This framework outlines auction bid pacing, audience exclusion rules to prevent internal cannibalization, and cross-channel ROAS monitoring.',
        image: 'assets/thumb_performance.svg',
        alt: 'Performance Marketing Campaign Funnel & Attribution Architecture',
        caption: 'Illustrative dashboard using demo data. Not actual client reporting. Multi-touch funnel framework modeling conversion touchpoints, bid pacing, and ROAS attribution.'
      },
      metrics: [
        { code: 'CTR', name: 'Click-Through Rate', desc: 'Ratio of users who click on an ad to total impressions; measures creative hook strength and audience relevance.' },
        { code: 'CPC', name: 'Cost Per Click', desc: 'Actual expense incurred per click; indicates keyword competitiveness and auction efficiency.' },
        { code: 'CPM', name: 'Cost Per Mille', desc: 'Cost per 1,000 ad impressions; benchmarks audience reach cost and media inventory pricing.' },
        { code: 'CPL', name: 'Cost Per Lead', desc: 'Spend required to acquire a qualified form lead, inquiry, or contact submission.' },
        { code: 'CPA', name: 'Cost Per Acquisition', desc: 'Total advertising spend divided by total completed transactions or target conversions.' },
        { code: 'CVR', name: 'Conversion Rate', desc: 'Percentage of landing page visitors who complete the primary conversion action.' },
        { code: 'ROAS', name: 'Return On Ad Spend', desc: 'Gross revenue generated for every unit of currency invested directly in paid advertising.' },
        { code: 'ACOS', name: 'Advertising Cost of Sales', desc: 'Ratio of ad spend to directly attributed marketplace sales revenue (Ad Spend / Revenue).' },
        { code: 'CAC', name: 'Customer Acquisition Cost', desc: 'Comprehensive blended acquisition cost to secure a new paying customer.' }
      ],
      ndaNotice: 'Confidential client data and campaign performance metrics cannot be shared due to confidentiality obligations.'
    },

    '02': {
      category: 'PROJECT 02 — GOLU UNIVERSE',
      title: 'Golu Universe',
      subtitle: 'AI Video Creation & Creative Storytelling',
      leadText: 'An exploration of AI-powered storytelling, animated characters, and brand-inspired video concepts — combining creative direction, visual experimentation, and narrative thinking to turn ideas into engaging video experiences.',
      isGoluUniverse: true,

      collections: {
        brandConcepts: {
          id: 'brand-concepts',
          title: 'AI Brand Concepts',
          subtitle: 'Speculative Advertising & Brand Storytelling',
          badge: 'COLLECTION A • SPECULATIVE ADVERTISING',
          desc: 'Self-initiated brand-inspired concepts exploring how AI-generated visuals, character-led narratives, and creative direction can bring product stories to life.',
          projects: [
            {
              id: 'complan-concept',
              title: 'Complan — AI Brand Concept',
              projectType: 'Self-Initiated Concept',
              category: 'AI Brand Concepts',
              coreDiscipline: 'Character-Led Brand Storytelling',
              brandReference: 'Complan (Nutritional Milk Drink Mix)',
              shortSummary: 'A character-led speculative advertisement exploring how everyday child effort, maternal care, and morning nutrition integrate naturally into a family-centered narrative.',
              thumbnail: 'assets/golu_complan.png',
              videoSrc: 'assets/golu_complan.mp4',
              posterSrc: 'assets/golu_complan.png',
              disclaimer: 'Self-Initiated Concept: Independent creative exploration. Not affiliated with, commissioned by, or endorsed by Complan or its parent company.',
              ctaText: 'Explore Brand Case Study',

              // A. Creative Insight & Premise
              creativeInsight: {
                title: 'The Creative Premise & Insight',
                content: 'The core creative idea was to build a relatable, human-centered story around a child character putting dedicated physical effort into his own growth. Golu is a young animated character who exercises diligently because he wants to grow taller. The concept explores the insight that physical exercise and personal determination are only one half of the growth journey — healthy daily habits, supportive parenting, and balanced nutrition form the vital foundation. This is framed strictly as a narrative creative premise rather than a medical or guaranteed growth claim.'
              },

              // E. Intended Audience & Objective
              audienceAndObjective: {
                intendedAudience: 'Parents, caregivers, and families seeking wholesome, relatable stories that celebrate childhood effort and balanced nutrition.',
                creativeObjective: 'Explore a relatable, character-led way to communicate a nutrition-related message through cinematic AI animation.',
                resultsNote: 'Creative concept study — no public ad spend, paid distribution, or measured marketing KPIs were generated.'
              },

              // B. Story Development & Narrative Sequence
              storyDevelopment: {
                title: 'Story Development & Narrative Sequence',
                steps: [
                  { step: '01', title: 'Goal & Intrinsic Effort', desc: 'Golu wants to grow taller and enthusiastically begins his morning workout regimen on the terrace, demonstrating genuine child determination.' },
                  { step: '02', title: 'Perseverance in Action', desc: 'He continues exercising day after day, establishing authentic character grit and relatable childhood aspirations without any immediate brand presence.' },
                  { step: '03', title: 'The Mother Observes', desc: 'From the kitchen balcony, his mother affectionately observes his dedication and sweat, recognizing her child\'s sincere effort to develop himself.' },
                  { step: '04', title: 'Nutritional Care in the Moment', desc: 'Moved by his effort, she prepares and brings him a glass of Complan, positioning the beverage as a mother\'s caring way to support his nutritional needs.' },
                  { step: '05', title: 'Natural Narrative Integration', desc: 'The product becomes an organic, everyday part of a supportive family moment rather than an artificial, magical shortcut to height.' }
                ]
              },

              // C. The Creative Thought Process
              thoughtProcess: {
                title: 'The Creative Thought Process',
                reasons: [
                  {
                    heading: 'Relatable Child Protagonist',
                    desc: 'A spirited child character provides an immediate, empathetic emotional entry point for parents and children alike.'
                  },
                  {
                    heading: 'Effort Precedes the Product',
                    desc: 'Beginning with physical effort and daily routine grounds the story in relatable life experiences before introducing any brand element.'
                  },
                  {
                    heading: 'Mother as Emotional Anchor',
                    desc: 'The mother provides an authentic caregiver perspective — noticing the effort, caring for the child\'s health, and choosing smart nutrition.'
                  },
                  {
                    heading: 'Story-Embedded Product Hand-Off',
                    desc: 'Introducing the beverage as an affectionate reward in the kitchen routine keeps the brand woven into the storyline rather than an isolated studio packshot.'
                  },
                  {
                    heading: 'Domestic Morning Continuity',
                    desc: 'The narrative flows smoothly from outdoor physical exertion to domestic breakfast warmth, bridging athletic aspiration with nutritional nourishment.'
                  },
                  {
                    heading: 'Character-Led Brand Memorability',
                    desc: 'Audiences connect with endearing characters and sincere motivations, making brand recall emotional and memorable compared to direct sales pitches.'
                  }
                ]
              },

              // H. Key Creative Decisions
              keyDecisions: [
                { decision: 'Child protagonist (Golu)', reason: 'Creates an immediate, relatable emotional entry point for family audiences.' },
                { decision: 'Exercise as opening action', reason: 'Establishes intrinsic child motivation, determination, and effort before any brand appearance.' },
                { decision: 'Mother observing from balcony', reason: 'Introduces authentic caregiver warmth, observation, and natural emotional connection.' },
                { decision: 'Product introduced via mother', reason: 'Positions Complan as affectionate nutritional support for effort rather than an unrealistic growth shortcut.' }
              ],

              // D. Brand Integration & Compliance Guardrails
              brandIntegration: {
                title: 'Brand Integration & Compliance Guardrails',
                guidelines: [
                  {
                    label: 'No Magical Claims',
                    detail: 'Does not suggest that drinking Complan automatically or miraculously increases height; frames it as nutritional support alongside exercise and healthy habits.'
                  },
                  {
                    label: 'Ethical Advertising Codes',
                    detail: 'Avoids exaggerated medical, nutritional, or performance guarantees, respecting ethical food advertising principles.'
                  },
                  {
                    label: 'Self-Initiated Concept Label',
                    detail: 'Clearly identifies the project as an independent creative exploration demonstrating how an AI-assisted narrative can answer a brand brief.'
                  }
                ]
              },

              // F. Creative Direction Pillars
              creativeDirectionPillars: [
                { title: 'Character-Led Storytelling', desc: 'Humanizing brand themes through expressive, culturally resonant animated personalities.' },
                { title: 'Relatable Domestic Reality', desc: 'Rooting the aesthetic in middle-class Indian mornings, rooftops, and kitchen breakfasts.' },
                { title: 'Family Emotional Connection', desc: 'Emphasizing the warm, unspoken bond between a striving child and an observant parent.' },
                { title: 'Narrative Continuity', desc: 'Ensuring character outfits, facial features, and warm sunlight remain consistent across scene cuts.' },
                { title: 'Subtle Product Placement', desc: 'Treating the pack and glass as genuine kitchen elements rather than disruptive commercial inserts.' },
                { title: 'AI-Assisted Exploration', desc: 'Rapidly prototyping visual moods, character keyframes, and video pacing through generative pipelines.' }
              ],

              // Visual Development Assets
              visualAssets: [
                {
                  src: 'assets/golu_complan.png',
                  alt: 'Complan Royale Chocolate Breakfast Scene',
                  title: 'Character Breakfast Scene & Keyframe Render',
                  desc: 'High-fidelity character render illustrating Golu enjoying his morning nutrition drink, focusing on warm morning ambient lighting and character consistency.'
                },
                {
                  src: 'assets/comp.jpg',
                  alt: 'Complan Royale Chocolate Packaging Reference',
                  title: 'Packaging & Product Reference Alignment',
                  desc: 'Visual reference alignment matching the iconic Complan Royale Chocolate branding, nutrition credentials, and retail packaging hierarchy.'
                }
              ],

              // I. Potential Applications
              potentialApplications: [
                'Character-led storytelling campaigns for FMCG, wellness, and family-oriented consumer brands.',
                'Episodic branded short-form content for Instagram Reels, YouTube Shorts, and digital entertainment channels.',
                'Original brand IP and mascot universe development for continuous brand recall and community engagement.',
                'Rapid speculative creative pitches enabling creative directors to visualize campaign concepts before greenlighting full production.'
              ]
            }
          ]
        },

        originalStories: {
          id: 'original-stories',
          title: 'Original AI Stories',
          subtitle: 'Original Characters, Stories & Animation',
          badge: 'COLLECTION B • ORIGINAL ANIMATION',
          desc: 'Original AI-assisted storytelling built around imaginative characters, entertaining moments, and narrative-driven animated videos.',
          stories: [
            {
              id: 'golu-story-01',
              title: 'Golu Story 01',
              episode: 'Story 01',
              series: 'Original AI Stories',
              format: 'Instagram Reel • Character Animation',
              reelId: 'DdgckROxhIJ',
              reelUrl: 'https://www.instagram.com/reel/DdgckROxhIJ/',
              embedUrl: 'https://www.instagram.com/reel/DdgckROxhIJ/embed/',
              shortSummary: 'Original character animation and AI storytelling short produced for Instagram Reels.',
              storyPremise: 'An original AI-assisted character animation short exploring visual narrative, expressive movement, and character-driven moments.',
              ctaText: 'Open on Instagram'
            },
            {
              id: 'golu-story-02',
              title: 'Golu Story 02',
              episode: 'Story 02',
              series: 'Original AI Stories',
              format: 'Instagram Reel • Character Animation',
              reelId: 'DdhB1piz8Gx',
              reelUrl: 'https://www.instagram.com/reel/DdhB1piz8Gx/',
              embedUrl: 'https://www.instagram.com/reel/DdhB1piz8Gx/embed/',
              shortSummary: 'Original character animation and AI storytelling short produced for Instagram Reels.',
              storyPremise: 'An original AI-assisted character animation short exploring visual narrative, expressive movement, and character-driven moments.',
              ctaText: 'Open on Instagram'
            },
            {
              id: 'golu-story-03',
              title: 'Golu Story 03',
              episode: 'Story 03',
              series: 'Original AI Stories',
              format: 'Instagram Reel • Character Animation',
              reelId: 'DdjZXBtT5hN',
              reelUrl: 'https://www.instagram.com/reel/DdjZXBtT5hN/',
              embedUrl: 'https://www.instagram.com/reel/DdjZXBtT5hN/embed/',
              shortSummary: 'Original character animation and AI storytelling short produced for Instagram Reels.',
              storyPremise: 'An original AI-assisted character animation short exploring visual narrative, expressive movement, and character-driven moments.',
              ctaText: 'Open on Instagram'
            },
            {
              id: 'golu-story-04',
              title: 'Golu Story 04',
              episode: 'Story 04',
              series: 'Original AI Stories',
              format: 'Instagram Reel • Character Animation',
              reelId: 'Ddjga9SoMi4',
              reelUrl: 'https://www.instagram.com/reel/Ddjga9SoMi4/',
              embedUrl: 'https://www.instagram.com/reel/Ddjga9SoMi4/embed/',
              shortSummary: 'Original character animation and AI storytelling short produced for Instagram Reels.',
              storyPremise: 'An original AI-assisted character animation short exploring visual narrative, expressive movement, and character-driven moments.',
              ctaText: 'Open on Instagram'
            },
            {
              id: 'golu-story-05',
              title: 'Golu Story 05',
              episode: 'Story 05',
              series: 'Original AI Stories',
              format: 'Instagram Reel • Character Animation',
              reelId: 'Ddk92AkRYOu',
              reelUrl: 'https://www.instagram.com/reel/Ddk92AkRYOu/',
              embedUrl: 'https://www.instagram.com/reel/Ddk92AkRYOu/embed/',
              shortSummary: 'Original character animation and AI storytelling short produced for Instagram Reels.',
              storyPremise: 'An original AI-assisted character animation short exploring visual narrative, expressive movement, and character-driven moments.',
              ctaText: 'Open on Instagram'
            },
            {
              id: 'golu-story-06',
              title: 'Golu Story 06',
              episode: 'Story 06',
              series: 'Original AI Stories',
              format: 'Instagram Reel • Character Animation',
              reelId: 'Ddk98ICRibc',
              reelUrl: 'https://www.instagram.com/reel/Ddk98ICRibc/',
              embedUrl: 'https://www.instagram.com/reel/Ddk98ICRibc/embed/',
              shortSummary: 'Original character animation and AI storytelling short produced for Instagram Reels.',
              storyPremise: 'An original AI-assisted character animation short exploring visual narrative, expressive movement, and character-driven moments.',
              ctaText: 'Open on Instagram'
            },
            {
              id: 'golu-story-07',
              title: 'Golu Story 07',
              episode: 'Story 07',
              series: 'Original AI Stories',
              format: 'Instagram Reel • Character Animation',
              reelId: 'Ddn3rY8xzL6',
              reelUrl: 'https://www.instagram.com/reel/Ddn3rY8xzL6/',
              embedUrl: 'https://www.instagram.com/reel/Ddn3rY8xzL6/embed/',
              shortSummary: 'Original character animation and AI storytelling short produced for Instagram Reels.',
              storyPremise: 'An original AI-assisted character animation short exploring visual narrative, expressive movement, and character-driven moments.',
              ctaText: 'Open on Instagram'
            },
            {
              id: 'golu-story-08',
              title: 'Golu Story 08',
              episode: 'Story 08',
              series: 'Original AI Stories',
              format: 'Instagram Reel • Character Animation',
              reelId: 'DdoDHmjxpF6',
              reelUrl: 'https://www.instagram.com/reel/DdoDHmjxpF6/',
              embedUrl: 'https://www.instagram.com/reel/DdoDHmjxpF6/embed/',
              shortSummary: 'Original character animation and AI storytelling short produced for Instagram Reels.',
              storyPremise: 'An original AI-assisted character animation short exploring visual narrative, expressive movement, and character-driven moments.',
              ctaText: 'Open on Instagram'
            }
          ]
        }
      },

      // Section 6: AI Tools Used in This Project Data
      toolsAndWorkflow: {
        title: 'AI Tools Used in This Project',
        intro: 'A confirmed creative production workflow integrating human storytelling, prompt architecture, visual design, and generative AI video creation.',

        tools: [
          {
            name: 'ChatGPT',
            role: 'Story Ideation, Scriptwriting & Narrative Structuring',
            desc: 'Utilized for brainstorming narrative arcs, dialogue structuring, scene-by-scene script pacing, and refining the emotional beat sequence.'
          },
          {
            name: 'Google Gemini',
            role: 'Creative Ideation, Concept Assistance & Refinement',
            desc: 'Employed for iterative creative ideation, concept exploration, character motivations, and refining family-centric themes.'
          },
          {
            name: 'Canva',
            role: 'Visual Design, Storyboards & Creative Presentation',
            desc: 'Applied for visual design composition, storyboard layout, reference image alignment, and presentation mockups.'
          },
          {
            name: 'Higgsfield AI',
            role: 'AI Visual & Video Creation',
            desc: 'Used for AI visual and video creation, character motion synthesis, and dynamic camera choreography.'
          },
          {
            name: 'Kling AI',
            role: 'Image-to-Video & Generative Video Creation',
            desc: 'Used for high-fidelity image-to-video generation, fluid character motion, and cinematic lighting continuity.'
          },
          {
            name: 'Google Flow / Veo',
            role: 'AI Filmmaking & Generative Video Creation',
            desc: 'Used for AI filmmaking, cinematic scene generation, and generative video creation experimentation.'
          }
        ],

        productionSequence: [
          {
            step: '01',
            phase: 'Creative Insight & Narrative Concept',
            detail: 'Identifying human emotional truths (effort, childhood self-image, motherly care) and forming the core premise.'
          },
          {
            step: '02',
            phase: 'Script & Scene Planning',
            detail: 'Drafting scene breakdowns, pacing beats, and visual staging using ChatGPT and Google Gemini.'
          },
          {
            step: '03',
            phase: 'Character & Visual Prototyping',
            detail: 'Establishing character facial consistency, color palette, lighting mood, and packaging reference alignment in Canva.'
          },
          {
            step: '04',
            phase: 'Generative Visual & Motion Synthesis',
            detail: 'Generating video sequences and shot alternatives with Higgsfield AI, Kling AI, and Google Flow / Veo for fluid motion and lighting.'
          },
          {
            step: '05',
            phase: 'Sequencing, Pacing & Audio Alignment',
            detail: 'Editing scene timings, cut transitions, and music sync to ensure seamless emotional storytelling.'
          },
          {
            step: '06',
            phase: 'Final Presentation & Review',
            detail: 'Integrating disclaimers, presentation formatting, and responsive video display within the digital portfolio.'
          }
        ]
      }
    },

    '03': {
      category: 'PROJECT 03 — AI MUSIC STUDIO',
      title: 'AI Music Studio',
      subtitle: 'Generative Audio, Music Concepts & Visualizers',
      leadText: 'AI-assisted music composition, generative soundscapes, lyrical prompt systems, and synchronized visual aesthetics showcasing published songs on the Ze-Wa Music YouTube channel.',
      isMusicStudio: true,
      channel: {
        name: 'Ze-Wa Music',
        handle: '@gwamusicUP',
        url: 'https://youtube.com/@gwamusicup',
        badge: 'OFFICIAL YOUTUBE CHANNEL',
        desc: 'Official music channel showcasing AI-generated music, soundscapes, and aesthetic video releases.'
      },
      videos: [
        {
          id: 'stay-with-me-tonight',
          videoId: 'JdY3cOjIFHg',
          title: 'Stay With Me Tonight (Official Music Video) | Ze-Wa Music',
          type: 'Official Music Video',
          genre: 'AI Music Composition & Pop Fusion',
          aspect: '16:9',
          videoUrl: 'https://youtu.be/JdY3cOjIFHg',
          embedUrl: 'https://www.youtube-nocookie.com/embed/JdY3cOjIFHg?rel=0',
          thumbnail: 'https://i.ytimg.com/vi/JdY3cOjIFHg/hqdefault.jpg',
          shortSummary: 'Original AI-composed music production blending melodic hooks, vocal phrasing, and rhythmic atmosphere.',
          overview: 'An exploration of AI-assisted music composition featuring lyrical prompt architecture, melodic motif generation, and synchronized visual presentation released on the official Ze-Wa Music channel.',
          ctaText: 'Watch on YouTube'
        },
        {
          id: 'ze-wa-slow',
          videoId: 'O5fYJf4lv0U',
          title: 'Ze-Wa - SLOW',
          type: 'Original Track Concept',
          genre: 'Downtempo Atmospheric Chill',
          aspect: '16:9',
          videoUrl: 'https://youtu.be/O5fYJf4lv0U',
          embedUrl: 'https://www.youtube-nocookie.com/embed/O5fYJf4lv0U?rel=0',
          thumbnail: 'https://i.ytimg.com/vi/O5fYJf4lv0U/hqdefault.jpg',
          shortSummary: 'Downtempo atmospheric music production exploring nuanced tempo modulation and chill aesthetic soundscapes.',
          overview: 'A relaxed, atmospheric composition demonstrating pacing control, mellow instrumental harmonies, and aesthetic sound layering released on Ze-Wa Music.',
          ctaText: 'Watch on YouTube'
        }
      ],
      workflow: [
        { step: '01', title: 'Concept', desc: 'Defining the emotional core, narrative theme, tempo, and instrumental palette for the musical piece.' },
        { step: '02', title: 'Mood & Style', desc: 'Establishing genre blends (ambient cinematic lofi, acoustic Indian classical fusion, meditative soundscapes).' },
        { step: '03', title: 'Lyrics & Prompts', desc: 'Structuring layered prompt descriptors controlling cadence, vocal timbre, harmonic texture, and reverberant space.' },
        { step: '04', title: 'AI Generation', desc: 'Iterating through generative audio passes to synthesize melodic motifs, rhythm stems, and foundational harmonies.' },
        { step: '05', title: 'Selection & Refinement', desc: 'Curating the most emotive audio sections, balancing frequency dynamics, and refining acoustic fidelity.' },
        { step: '06', title: 'Visual Presentation', desc: 'Generating synchronized cover artwork and aesthetic spectrum visualizers for a unified multi-sensory release.' }
      ]
    },

    '04': {
      category: 'PROJECT 04 — BHAKTI & DEVOTIONAL CONTENT',
      title: 'Bhakti & Devotional Content',
      subtitle: 'Spiritual Narratives, Sacred Visuals & YouTube Shorts',
      leadText: 'Devotional creative projects, spiritual visual concepts, sacred audio, and YouTube Shorts on the Maruti Mantra channel rooted in cultural authenticity, scriptural reverence, and meditative aesthetic design.',
      isBhaktiContent: true,
      channel: {
        name: 'Maruti Mantra',
        handle: '@maruti.mantra',
        url: 'https://youtube.com/@maruti.mantra',
        badge: 'OFFICIAL YOUTUBE CHANNEL',
        desc: 'Official devotional channel dedicated to sacred Hindu mantras, shlokas, spiritual visual concepts, and uplifting chants.'
      },
      videos: [
        {
          id: 'bajrangbali-ka-aashirwad',
          videoId: 'Fd29NFpJwcY',
          title: 'Bajrangbali Ka Aashirwad',
          type: 'Devotional Video',
          category: 'devotional-video',
          aspect: '16:9',
          videoUrl: 'https://youtu.be/Fd29NFpJwcY',
          embedUrl: 'https://www.youtube-nocookie.com/embed/Fd29NFpJwcY?rel=0',
          thumbnail: 'https://i.ytimg.com/vi/Fd29NFpJwcY/hqdefault.jpg',
          shortSummary: 'A devotional visual presentation paying homage to Lord Hanuman, combining sacred devotional aesthetics with ambient chants.',
          overview: 'Devotional creative exploration honoring Bajrangbali (Lord Hanuman), featuring traditional iconography, sacred saffron warmth, and reverent audio harmonization.',
          ctaText: 'Watch on YouTube'
        },
        {
          id: 'ram-ram-ram-short',
          videoId: 'pKV1FSSofuM',
          title: 'Ram Ram RamðŸ™ðŸ™ðŸ™',
          type: 'YouTube Short',
          category: 'short',
          aspect: '9:16',
          videoUrl: 'https://youtube.com/shorts/pKV1FSSofuM',
          embedUrl: 'https://www.youtube-nocookie.com/embed/pKV1FSSofuM?rel=0',
          thumbnail: 'https://i.ytimg.com/vi/pKV1FSSofuM/hqdefault.jpg',
          shortSummary: 'Short-form spiritual visual sequence celebrating the divine Ram Naam chant with meditative visual design.',
          overview: 'A vertical devotional short designed for mobile audiences, pairing the sacred recitation of Ram Naam with uplifting traditional art and lighting.',
          ctaText: 'Watch Short on YouTube'
        },
        {
          id: 'har-har-mahadev-short',
          videoId: 'hf1viGRAXhc',
          title: 'Har Har Mahadev likhe comments meinðŸ™',
          type: 'YouTube Short',
          category: 'short',
          aspect: '9:16',
          videoUrl: 'https://youtube.com/shorts/hf1viGRAXhc',
          embedUrl: 'https://www.youtube-nocookie.com/embed/hf1viGRAXhc?rel=0',
          thumbnail: 'https://i.ytimg.com/vi/hf1viGRAXhc/hqdefault.jpg',
          shortSummary: 'Short-form devotional sequence dedicated to Lord Shiva, featuring serene meditative aura visuals.',
          overview: 'A vertical devotional short invoking the grace of Mahadev, designed with atmospheric smoke, sacred ash textures, and resonant chants.',
          ctaText: 'Watch Short on YouTube'
        },
        {
          id: 'radhe-radhe-subscribe-short',
          videoId: 'xFxIefe2S_0',
          title: 'Radhe RadheðŸ™ subscribe kre aur comment mein radhe radhe jarrur likhe ðŸ™ðŸ˜„',
          type: 'YouTube Short',
          category: 'short',
          aspect: '9:16',
          videoUrl: 'https://youtube.com/shorts/xFxIefe2S_0',
          embedUrl: 'https://www.youtube-nocookie.com/embed/xFxIefe2S_0?rel=0',
          thumbnail: 'https://i.ytimg.com/vi/xFxIefe2S_0/hqdefault.jpg',
          shortSummary: 'Short-form devotional sequence celebrating Radha Krishna devotion with vibrant sacred colors.',
          overview: 'A devotional short celebrating Radha Rani and Krishna, centered around the beloved Radhe Radhe greeting and joyful spiritual presence.',
          ctaText: 'Watch Short on YouTube'
        },
        {
          id: 'subscribe-kre-radhe-radhe-short',
          videoId: '7NdNFz2MoBI',
          title: 'subscribe kre. Radhe RadheðŸ™',
          type: 'YouTube Short',
          category: 'short',
          aspect: '9:16',
          videoUrl: 'https://youtube.com/shorts/7NdNFz2MoBI',
          embedUrl: 'https://www.youtube-nocookie.com/embed/7NdNFz2MoBI?rel=0',
          thumbnail: 'https://i.ytimg.com/vi/7NdNFz2MoBI/hqdefault.jpg',
          shortSummary: 'Spiritual short featuring serene Radhe Radhe visual meditation and devotional reflection.',
          overview: 'A focused vertical short presenting serene sacred imagery, gentle chime accompaniment, and heartfelt devotional connection.',
          ctaText: 'Watch Short on YouTube'
        }
      ],
      culturalAuthenticity: 'This initiative prioritizes reverence and cultural depth over superficial tropes. Every concept is grounded in authentic traditional iconography, Vedic philosophy, and meditative sacred geometry, delivering peaceful and uplifted visual experiences.',
      workflow: [
        { step: '01', title: 'Scripture Study', desc: 'Researching Sanskrit texts, traditional symbolism, and philosophical context for authentic representation.' },
        { step: '02', title: 'Motif Selection', desc: 'Selecting sacred color palettes (saffron, golden sunlight, temple stone) and auspicious geometry.' },
        { step: '03', title: 'AI Prompt Engineering', desc: 'Synthesizing serene compositions with soft illumination and balanced devotional warmth.' },
        { step: '04', title: 'Audio Harmonization', desc: 'Pairing visual sequences with resonant ambient chants, temple bells, and acoustic flute melodies.' },
        { step: '05', title: 'Channel Curation', desc: 'Structuring episodic playlists and devotional collections tailored for dedicated spiritual audiences.' }
      ]
    },

'05': {
      category: 'PROJECT 05 — AI VISUAL LAB',
      title: 'AI Visual Lab',
      subtitle: 'Neural Image Direction, Cinematic Lighting & Prompt Architecture',
      leadText: 'A creative visual laboratory demonstrating AI-assisted image direction, lighting recalculation, and structured prompt engineering. Each project pairs a real-world source plate with its finished cinematic transformation, structured for clarity, reproducibility, and professional creative evaluation.',
      isVisualLab: true,

      brandConcept: {
        id: 'perfume-concept',
        title: 'Luxury Perfume — "Find Your Signature Scent"',
        label: 'Self-Initiated Concept Advertisement',
        category: 'AI Brand Concepts',
        badge: 'COLLECTION A • AI BRAND CONCEPTS',
        brandReference: 'Speculative Luxury Fragrance Campaign',
        coreDiscipline: 'Product Advertising & Commercial Visual Synthesis',
        headline: 'Find Your Signature Scent — 5 fragrances. 5 different moods.',
        cta: 'Shop the Collection',
        beforeImg: 'assets/perfume_before.jpg',
        afterImg: 'assets/perfume_after.jpg',
        beforeDims: '768 × 1024 (Original Flat-Lay Product Reference)',
        afterDims: '776 × 1024 (Finished Luxury Studio Advertisement)',
        aspectRatio: 'portrait',
        disclaimer: 'Self-Initiated Concept Advertisement: Independent creative exploration. Not affiliated with, commissioned by, or endorsed by any commercial fragrance brand.',
        creativeObjective: 'Demonstrate how a routine flat-lay product photograph can be converted into an aspirational e-commerce hero advertisement without booking a physical studio or studio lighting rig.',
        visualApproach: 'Staged five perfume bottles on tiered dark Italian marble pedestals, replacing tile flooring with a warm 3200K dual-strip rim lighting setup and amber caustics that illuminate liquid translucency.',
        promptingFramework: 'Product Advertising (Product + Creative Objective + Hero Placement + Lighting + Background + Material Detail + Visual Hierarchy + Headline + Call to Action)',
        examplePrompt: 'Luxury fragrance advertisement featuring five sleek glass perfume bottles arranged on stepped dark marble pedestals, golden backlighting creating internal amber luminescence in the glass, clean negative space for typography \'Find Your Signature Scent\', shot on 100mm macro f/4, crisp studio commercial quality.',
        whyItWorks: 'The stepped marble pedestals establish clean visual hierarchy, while calibrated rim lighting and negative space ensure typography and product packaging remain crisp and legible.',
        keyVariables: [
          { name: 'Refraction Index (IOR 1.52)', desc: 'Governs natural light transmission and glowing internal caustics through thick cosmetic glass.' },
          { name: 'Tiered Pedestal Hierarchy', desc: 'Arranges multi-SKU collections with clear visual priority and depth of field.' },
          { name: 'Dual Rim Strip Lighting', desc: 'Sharp white/gold edge kickers clearly outline dark bottles against deep charcoal backgrounds.' },
          { name: 'Compositional Negative Space', desc: 'Guarantees uncluttered zones for hero headlines, sub-copy, and commercial CTAs.' }
        ]
      },

      caseStudies: [
        {
          id: 'cinematic-portrait',
          num: '01',
          title: 'Cinematic Portrait Transformation',
          badge: 'CINEMATIC PORTRAIT & LIGHTING',
          tags: ['Portrait Enhancement', 'Directional Light', 'Chiaroscuro'],
          beforeImg: 'assets/portrait_cinematic_before.jpg',
          afterImg: 'assets/portrait_cinematic_after.png',
          beforeDims: '576 × 1024 (Original Casual Selfie)',
          afterDims: '1024 × 576 (Cinematic Editorial Master)',
          aspectRatio: 'cover',
          creativeObjective: 'Elevate an informal mobile selfie into a dramatic editorial studio headshot that commands presence while preserving the subject\'s authentic facial identity and expression.',
          visualApproach: 'Transitioned from flat ambient indoor lighting to high-contrast directional chiaroscuro. Synthesized a diagonal window frame shadow pattern cast across the eyes and cheekbone, replaced the casual shirt with a minimal matte black knit turtleneck, and isolated the subject against an uncluttered dark matte studio backdrop.',
          promptingFramework: 'Cinematic Portraits (Subject Identity + Key Light + Fill Light + Shadow Pattern + Skin Texture + Background Separation + Colour Grading)',
          examplePrompt: 'Editorial studio portrait of a young South Asian man with subtle beard and styled dark hair, wearing a black ribbed turtleneck, dramatic diagonal window light casting a geometric shadow across the face, warm golden key light hitting eyes and bridge of nose, deep matte charcoal background, natural skin pores, 85mm prime lens f/1.8, cinematic film still.',
          whyItWorks: 'The diagonal hard light creates an immediate focal point on the subject\'s eyes. The black turtleneck and dark background eliminate visual distractions, directing 100% of the viewer\'s attention to facial contouring and natural skin texture without artificial smoothing.',
          linkedFramework: 'Cinematic Portraits'
        },
        {
          id: 'moonlit-hero',
          num: '02',
          title: 'Armored Hero — Moonlit High-Altitude Scene',
          badge: 'SCI-FI CHARACTER INTEGRATION',
          tags: ['Character Integration', 'Thruster Volumetrics', 'Moonlit Sky'],
          beforeImg: 'assets/moonlit_hero_before.jpg',
          afterImg: 'assets/moonlit_hero_after.jpg',
          beforeDims: '1024 × 768 (Urban Rooftop / Night Sky)',
          afterDims: '576 × 1024 (Ascending Hero Master Plate)',
          aspectRatio: 'cover',
          creativeObjective: 'Transform a static urban night sky photograph into an action-driven superhero launch sequence, evoking scale and kinetic motion.',
          visualApproach: 'Shifted composition to a vertical frame to emphasize upward velocity. Introduced billowing cumulus cloud banks backlit by a crescent moon, and positioned glowing blue-orange propulsion plumes that serve as active practical light sources illuminating the armor and vapor.',
          promptingFramework: 'Character & Environment Integration (Character + Environment + Perspective Matching + Light Direction + Contact Shadows + Material Response + Atmospheric Integration)',
          examplePrompt: 'High-altitude nocturnal shot of a futuristic armored hero soaring vertically through turbulent clouds, dual glowing ion thrusters illuminating vapor beneath, brushed titanium armor catching cool lunar rim light, crescent moon in dark sky, cinematic comic book realism, 70mm anamorphic.',
          whyItWorks: 'Dual-color lighting (warm fiery thrusters contrasting against cold lunar rim light) creates volume and physical presence. The cloud layers provide depth cues that convey high altitude and dramatic movement.',
          linkedFramework: 'Character & Environment Integration'
        },
        {
          id: 'batman-gotham',
          num: '03',
          title: 'Rainy Gotham — Batman Cinematic Transformation',
          badge: 'NEO-NOIR LIGHTING & INTEGRATION',
          tags: ['Neo-Noir Lighting', 'Character Integration', 'Wet Reflections'],
          beforeImg: 'assets/batman_gotham_before.jpg',
          afterImg: 'assets/batman_gotham_after.jpg',
          beforeDims: '768 × 1024 (Original Wet Street Photo)',
          afterDims: '768 × 1024 (Cinematic Gotham Master Plate)',
          aspectRatio: 'portrait',
          creativeObjective: 'Seamlessly integrate Batman\'s brooding silhouette into an authentic, everyday wet street photograph without disrupting the real-world geometry of the parked car.',
          visualApproach: 'Matched camera height, lens focal length, and perspective. Synthesized continuous falling rain streaks, a cool cyan back-rim light to separate the cape from the darkness, and accurate puddles with liquid vehicle and street reflections.',
          promptingFramework: 'Neo-Noir Night Photography (Subject + Night Environment + Practical Lighting + Wet-Surface Reflections + Cool/Warm Contrast + Shadow Control + Composition)',
          examplePrompt: 'Cinematic neo-noir film frame of Batman standing beside a rain-slicked parked white car on a wet suburban street at night, heavy downpour with visible falling rain streaks, cold cyan ambient streetlight rimming cape and cowl, warm amber reflections on wet asphalt, 35mm anamorphic.',
          whyItWorks: 'Preserving the exact vehicle and street pavement grounds the character in tangible reality, while directional rim lighting and wet surface reflections unify the composite into a cohesive frame.',
          linkedFramework: 'Neo-Noir Night Photography'
        },
        {
          id: 'city-platform',
          num: '04',
          title: 'Golden Sunrise at the Misty City Platform',
          badge: 'ATMOSPHERIC LIGHTING',
          tags: ['Atmospheric Lighting', 'Landscape Transformation', 'Sunbeams & Haze'],
          beforeImg: 'assets/city_platform_before.jpg',
          afterImg: 'assets/city_platform_after.jpg',
          beforeDims: '1024 × 472 (Original Platform Snapshot)',
          afterDims: '1024 × 473 (Golden Sunrise Master Plate)',
          aspectRatio: 'panoramic',
          creativeObjective: 'Convert an overcast, mundane urban terrace snapshot into an emotionally uplifting golden-hour landscape.',
          visualApproach: 'Preserved the physical concrete railing and platform perspective while replacing the flat urban background with rolling mountain silhouettes draped in morning mist. Introduced low-angle 2800K solar rays streaming diagonally across the scene.',
          promptingFramework: 'Golden-Hour Photography (Subject + Sun Position + Light Direction + Colour Temperature + Shadows + Atmospheric Depth + Composition + Realism)',
          examplePrompt: 'Panoramic sunrise over an elevated city observation platform, low-angle golden sun cresting distant mountain ridges, warm 2800K light rays piercing through morning valley mist, volumetric god rays raking across concrete parapet, wide-angle landscape photograph.',
          whyItWorks: 'Raking cross-light introduces surface texture and elongated shadows along the platform, while atmospheric haze recedes into the distance to build genuine spatial depth.',
          linkedFramework: 'Golden-Hour Photography'
        },
        {
          id: 'fashion-portrait',
          num: '05',
          title: 'Mirrored Gallery Fashion Portrait',
          badge: 'FASHION EDITORIAL',
          tags: ['Fashion Editorial', 'Mirror Recursion', 'God Rays Lighting'],
          beforeImg: 'assets/fashion_portrait_before.jpg',
          afterImg: 'assets/fashion_portrait_after.jpg',
          beforeDims: '472 × 1024 (Original Casual Selfie)',
          afterDims: '768 × 1024 (High-Fashion Mirrored Hall Master)',
          aspectRatio: 'portrait',
          creativeObjective: 'Re-envision a casual mobile selfie as a high-fashion magazine editorial set in a contemporary architectural space.',
          visualApproach: 'Kept the subject\'s sunglasses and facial structure while outfitting him in a tailored navy double-breasted suit and relaxed trousers. Positioned freestanding floor-to-ceiling mirror panels to reflect multiple viewpoints simultaneously under vertical sunbeams.',
          promptingFramework: 'Fashion Editorial (Subject + Pose + Wardrobe + Camera Perspective + Lighting + Natural Texture + Background + Editorial Colour Grade)',
          examplePrompt: 'High-fashion editorial of a stylish man in sunglasses and tailored navy double-breasted suit standing inside a modern concrete gallery with tall freestanding vertical mirrors, multiple recursive reflections showing front and profile angles, warm sunbeams from skylights, editorial photography.',
          whyItWorks: 'The recursive mirror reflections provide geometric rhythm and showcase the outfit from multiple angles, while high-angle natural light shafts anchor the model in the center of the frame.',
          linkedFramework: 'Fashion Editorial'
        },
        {
          id: 'guardian-shadow',
          num: '06',
          title: 'Guardian Shadow Beneath the Moon',
          badge: 'MOONLIGHT & SILHOUETTE',
          tags: ['Moonlight & Silhouette', 'Devotional Iconography', 'Asphalt Reflection'],
          beforeImg: 'assets/guardian_shadow_before.jpg',
          afterImg: 'assets/guardian_shadow_after.jpg',
          beforeDims: '768 × 1024 (Nocturnal Street Calf Snapshot)',
          afterDims: '768 × 1024 (Divine Guardian Shadow Master Plate)',
          aspectRatio: 'portrait',
          creativeObjective: 'Merge authentic street photography with cultural and devotional storytelling by revealing an iconic symbolic shadow behind an innocent subject.',
          visualApproach: 'Retained the natural posture of the calf on the wet asphalt. Balanced cool overhead moonlight with a warm street lamp on the right, shaping the projected shadow on the road into the unmistakable silhouette of Lord Shiva with his trident and crescent moon.',
          promptingFramework: 'Moonlight & Cinematic Silhouettes (Subject + Scale + Pose + Moon Position + Rim Lighting + Cloud Structure + Atmospheric Perspective)',
          examplePrompt: 'A gentle calf standing peacefully on a wet asphalt street at night under a full moon, casting a dramatic elongated mythological shadow of Lord Shiva holding a trident with crescent moon crown, warm streetlight on the right contrasting cool lunar light, cinematic realism.',
          whyItWorks: 'The subtle dual-light balance ensures the street and animal remain believable and unexaggerated, allowing the sacred shadow silhouette to emerge organically on the reflective asphalt.',
          linkedFramework: 'Moonlight & Cinematic Silhouettes'
        }
      ],

      frameworks: [
        {
          id: 'golden-hour',
          num: '01',
          title: 'Golden-Hour Photography',
          category: 'NATURAL & ATMOSPHERIC LIGHTING',
          formula: 'Subject + Sun Position + Light Direction + Colour Temperature + Shadows + Atmospheric Depth + Composition + Realism',
          prompt: 'Panoramic sunrise over an elevated city observation platform, low-angle golden sun cresting distant mountain ridges, warm 2800K light rays piercing through morning valley mist, volumetric god rays raking across concrete parapet, wide-angle landscape photograph.',
          explanation: 'Balances low-angle solar rays (5Â°—12Â°) with warm Kelvin color grading (2800K—3200K). The formula uses atmospheric haze to scatter light rays and stretches shadows across the foreground to give flat architectural plates tactile depth.',
          linkedProject: 'Case Study 04: Golden Sunrise Platform',
          comparison: {
            title: 'Case Study 04: Golden Sunrise at Misty City Platform',
            beforeImg: 'assets/city_platform_before.jpg',
            afterImg: 'assets/city_platform_after.jpg',
            note: 'Transforms an overcast platform into a panoramic sunrise vista.'
          }
        },
        {
          id: 'volumetric-fog',
          num: '02',
          title: 'Volumetric Fog & Atmospheric Depth',
          category: 'ENVIRONMENTAL PARTICULATES & MIE SCATTERING',
          formula: 'Subject + Fog Density + Light Scattering + Atmospheric Layers + Depth Separation + Contrast + Mood',
          prompt: 'Nocturnal urban road enveloped in rolling volumetric fog, moisture-saturated air scattering ambient streetlamp glow, diffuse atmospheric layers, wet asphalt with soft specular sheen, cinematic depth of field, 50mm lens.',
          explanation: 'Controls aerosol particle density and Mie phase scattering around localized light sources. Creates gradual atmospheric extinction across distance, softening harsh backgrounds while keeping specular reflections on wet pavement sharp.',
          linkedProject: 'Atmospheric Environmental Modeling',
          comparison: {
            title: 'Atmospheric Environmental Modeling',
            beforeImg: 'assets/moonlit_hero_before.jpg',
            afterImg: 'assets/moonlit_hero_after.jpg',
            note: 'Generates volumetric clouds and mist around nocturnal light sources.'
          }
        },
        {
          id: 'neo-noir',
          num: '03',
          title: 'Neo-Noir Night Photography',
          category: 'HIGH-CONTRAST NOCTURNAL CINEMA',
          formula: 'Subject + Night Environment + Practical Lighting + Wet-Surface Reflections + Cool/Warm Contrast + Shadow Control + Composition',
          prompt: 'Cinematic neo-noir film frame of Batman standing beside a rain-slicked parked white car on a wet suburban street at night, heavy downpour with visible falling rain streaks, cold cyan ambient streetlight rimming cape and cowl, warm amber reflections on wet asphalt, 35mm anamorphic.',
          explanation: 'Maintains an 8:1 to 12:1 chiaroscuro contrast ratio between deep shadows and bright specular highlights. Contrasts cool cyan ambient streetlight against warm amber streetlamp puddles to create cinematic mood without muddy blacks.',
          linkedProject: 'Case Study 03: Rainy Gotham / Batman',
          comparison: {
            title: 'Case Study 03: Rainy Gotham / Batman',
            beforeImg: 'assets/batman_gotham_before.jpg',
            afterImg: 'assets/batman_gotham_after.jpg',
            note: 'Integrates character into authentic wet street plate with parked car.'
          }
        },
        {
          id: 'moonlight-silhouette',
          num: '04',
          title: 'Moonlight & Cinematic Silhouettes',
          category: 'NOCTURNAL SURREALISM & SYMBOLIC FORMS',
          formula: 'Subject + Scale + Pose + Moon Position + Rim Lighting + Cloud Structure + Atmospheric Perspective',
          prompt: 'A gentle calf standing peacefully on a wet asphalt street at night under a full moon, casting a dramatic elongated mythological shadow of Lord Shiva holding a trident with crescent moon crown, warm streetlight on the right contrasting cool lunar light, cinematic realism.',
          explanation: 'Uses a low nocturnal light source to stretch cast shadows into iconic symbolic silhouettes. Dual-source color temperature balancing (5600K moonlight vs 2200K street lamp) grounds the surreal shadow in realistic wet pavement physics.',
          linkedProject: 'Case Study 06: Guardian Shadow',
          comparison: {
            title: 'Case Study 06: Guardian Shadow Beneath the Moon',
            beforeImg: 'assets/guardian_shadow_before.jpg',
            afterImg: 'assets/guardian_shadow_after.jpg',
            note: 'Cast shadow of young street calf reveals the silhouette of Lord Shiva.'
          }
        },
        {
          id: 'cinematic-portraits',
          num: '05',
          title: 'Cinematic Portraits',
          category: 'EDITORIAL HEADSHOTS & DIRECTIONAL LIGHT',
          formula: 'Subject Identity + Key Light + Fill Light + Shadow Pattern + Skin Texture + Background Separation + Colour Grading',
          prompt: 'Editorial studio portrait of a young South Asian man with subtle beard and styled dark hair, wearing a black ribbed turtleneck, dramatic diagonal window light casting a geometric shadow across the face, warm golden key light hitting eyes and bridge of nose, deep matte charcoal background, natural skin pores, 85mm prime lens f/1.8, cinematic film still.',
          explanation: 'Directs light through diagonal window framing to cast intentional chiaroscuro geometry across facial contours. Uses a matte black wardrobe and dark studio backdrop to eliminate distractions and preserve authentic skin texture.',
          linkedProject: 'Case Study 01: Cinematic Portrait Transformation',
          comparison: {
            title: 'Case Study 01: Cinematic Portrait Transformation',
            beforeImg: 'assets/portrait_cinematic_before.jpg',
            afterImg: 'assets/portrait_cinematic_after.png',
            note: 'Elevates casual indoor selfie into dramatic chiaroscuro studio portrait.'
          }
        },
        {
          id: 'product-advertising',
          num: '06',
          title: 'Product Advertising',
          category: 'COMMERCIAL STILL LIFE & E-COMMERCE',
          formula: 'Product + Creative Objective + Hero Placement + Lighting + Background + Material Detail + Visual Hierarchy + Headline + Call to Action',
          prompt: 'Luxury fragrance advertisement featuring five sleek glass perfume bottles arranged on stepped dark marble pedestals, golden backlighting creating internal amber luminescence in the glass, clean negative space for typography \'Find Your Signature Scent\', shot on 100mm macro f/4, crisp studio commercial quality.',
          explanation: 'Structures multi-item commercial staging using tiered pedestals for natural visual reading flow. Directs refractive caustic lighting through cosmetic glass while reserving clean negative space for commercial copy and conversion buttons.',
          linkedProject: 'AI Brand Concepts: Perfume Commercial',
          comparison: {
            title: 'AI Brand Concepts: Perfume Commercial Advertisement',
            beforeImg: 'assets/perfume_before.jpg',
            afterImg: 'assets/perfume_after.jpg',
            note: 'Flat-lay perfume photo transformed into luxury marble studio advertisement.'
          }
        },
        {
          id: 'character-integration',
          num: '07',
          title: 'Character & Environment Integration',
          category: 'PERSPECTIVE MATCHING & COMPOSITING',
          formula: 'Character + Environment + Perspective Matching + Light Direction + Contact Shadows + Material Response + Atmospheric Integration',
          prompt: 'High-altitude nocturnal shot of a futuristic armored hero soaring vertically through turbulent clouds, dual glowing ion thrusters illuminating vapor beneath, brushed titanium armor catching cool lunar rim light, crescent moon in dark sky, cinematic comic book realism, 70mm anamorphic.',
          explanation: 'Aligns camera pitch and horizon vanishing points so injected characters match the background plate. Treats emissive elements (like thruster fire) as active light sources that illuminate surrounding clouds and ground shadows.',
          linkedProject: 'Case Study 02: Armored Hero & Case Study 03: Batman',
          comparison: {
            title: 'Case Study 02: Armored Hero Ascending Through Moonlit Clouds',
            beforeImg: 'assets/moonlit_hero_before.jpg',
            afterImg: 'assets/moonlit_hero_after.jpg',
            note: 'Injects ascending high-tech superhero with glowing thruster volumetrics.'
          }
        },
        {
          id: 'fashion-editorial',
          num: '08',
          title: 'Fashion Editorial',
          category: 'AVANT-GARDE EDITORIAL & RECURSIVE OPTICS',
          formula: 'Subject + Pose + Wardrobe + Camera Perspective + Lighting + Natural Texture + Background + Editorial Colour Grade',
          prompt: 'High-fashion editorial of a stylish man in sunglasses and tailored navy double-breasted suit standing inside a modern concrete gallery with tall freestanding vertical mirrors, multiple recursive reflections showing front and profile angles, warm sunbeams from skylights, editorial photography.',
          explanation: 'Combines identity preservation with high-end garment tailoring. Uses freestanding mirror panels to create recursive geometric reflections, illuminated by high-angle clerestory light rays that add editorial drama without overexposing skin tones.',
          linkedProject: 'Case Study 05: Mirrored Gallery Fashion Portrait',
          comparison: {
            title: 'Case Study 05: Mirrored Gallery Fashion Portrait',
            beforeImg: 'assets/fashion_portrait_before.jpg',
            afterImg: 'assets/fashion_portrait_after.jpg',
            note: 'Casual selfie reimagined into a recursive brutalist mirror hall campaign.'
          }
        },
        {
          id: 'street-photography',
          num: '09',
          title: 'Street Photography',
          category: 'DOCUMENTARY REALISM & CANDID TEXTURE',
          formula: 'Subject + Environment + Practical Lights + Texture + Atmospheric Effects + Exposure Balance + Documentary Realism',
          prompt: 'Documentary street photo of a calm suburban road at night under sodium streetlight, damp road texture with soft specular reflections, balanced dynamic range capturing shadow depth without digital noise, authentic 35mm candid perspective.',
          explanation: 'Prioritizes raw cultural authenticity, natural lens focal lengths (35mm), and balanced shadow pedestals. Captures candid street textures, wet asphalt sheens, and ambient practical light sources without exaggerated digital processing.',
          linkedProject: 'Case Study 03: Gotham Street Plate & Case Study 06: Nocturnal Street',
          comparison: {
            title: 'Authentic Street Environment Plates',
            beforeImg: 'assets/guardian_shadow_before.jpg',
            afterImg: 'assets/guardian_shadow_after.jpg',
            note: 'Real-world nocturnal street textures grounded in authentic documentary realism.'
          }
        }
      ],

      workflow: [
        { step: '01', title: 'Source Plate Evaluation', desc: 'Evaluating base image framing, optical perspective, camera horizon, and existing light angles.' },
        { step: '02', title: 'Lighting & Composition Thesis', desc: 'Determining the target visual direction (chiaroscuro, golden hour, moonlight, or studio staging).' },
        { step: '03', title: 'Prompt Architecture & Conditioning', desc: 'Structuring modular prompt components with precise positive tokens, negative constraints, and edge preservation.' },
        { step: '04', title: 'Subsurface & Texture Refinement', desc: 'Targeted inpainting for skin pores, specular catchlights, glass caustics, and fabric textures.' },
        { step: '05', title: 'Photometric & Color Grading', desc: 'Harmonizing shadow-to-highlight tonal curves, Kelvin color temperatures, and lens falloff.' },
        { step: '06', title: 'Master Asset Delivery & Archiving', desc: 'Exporting full-resolution master files, documenting the prompt formula, and verifying before/after alignment.' }
      ],

      comparativeNotice: 'Prompt Architecture Reference: Example prompts presented here represent modular, reusable prompting methods formulated for these visual studies. All source photographs and final plates are archived in the creative studio.'
    },

    '06': {
      category: 'PROJECT 06 — SALES & ACCOUNT MANAGEMENT',
      title: 'Sales & Account Management',
      subtitle: 'Sales & Customer Conversion, Seller Relationships & Advertising Account Management',
      leadText: 'Experience in sales and customer conversion at MyCaptain, alongside advertising account management for 110+ Flipkart sellers and 35+ Meta accounts. Combining client relationships, campaign understanding, performance analysis, and business growth.',
      isSalesAccount: true,

      commercialImpact: [
        {
          val: '₹70L+',
          lbl: 'Revenue Generated',
          ctx: 'MyCaptain • Sales & Conversion',
          desc: 'Direct sales revenue generated by qualifying marketing-generated leads, consultative conversations, and closing.'
        },
        {
          val: '110+ / mo',
          lbl: 'Monthly Seller Accounts',
          ctx: 'Accenture • Flipkart Ads',
          desc: 'Marketplace merchant portfolio managed monthly across advertising requirements, budget discussions, and campaign performance.'
        },
        {
          val: '35+',
          lbl: 'Client Accounts Managed',
          ctx: 'Accenture • Meta Ads',
          desc: 'Advertising accounts managed across Facebook and Instagram campaign support, performance reporting, and optimization.'
        },
        {
          val: 'Up to 2×',
          lbl: 'ROAS Improvement',
          ctx: 'Campaign Optimization',
          desc: 'Documented advertising efficiency gains achieved through search term harvesting, keyword bid tuning, and catalog optimization.'
        }
      ],

      scopeDistinctionNote: 'Professional Scope Note: Direct revenue generated at MyCaptain (₹70L+) represents closed sales revenue from marketing-generated leads. Figures at Accenture reflect portfolios managed in an advertising environment across Flipkart Ads (110+ sellers/month, ₹60L+/month documented advertising spend handled) and Meta Ads (35+ accounts). These represent distinct operational disciplines.',

      myCaptain: {
        role: 'Senior Inside Sales Executive',
        period: 'October 2022 – February 2024',
        employer: 'MyCaptain',
        headline: 'Connecting Marketing-Generated Leads with Customer Conversion & Revenue',
        synthesis: 'Marketing remains the primary focus of my portfolio, and my time at MyCaptain provided direct experience in connecting marketing-generated demand with consultative sales and customer conversion. Working with leads generated through digital marketing and paid acquisition (Google Ads, Meta Ads, and LinkedIn Ads), I qualified prospects, assessed their requirements, and communicated program value. Through consultative sales conversations, objection handling (addressing curriculum, scheduling, and financial considerations), and disciplined follow-ups, I guided prospective candidates to enrollment. Using Salesforce CRM to track leads and monitor sales activities, I ensured structured pipeline management—generating over ₹70 lakh in revenue during my tenure and consistently exceeding monthly performance goals.',
        highlights: [
          { val: '₹70 Lakh+', lbl: 'Revenue Generated', desc: 'Direct sales revenue delivered across professional and creative programs.' },
          { val: 'Marketing Leads', lbl: 'Paid Acquisition Flow', desc: 'Worked with inbound leads generated through Google Ads, Meta Ads, and LinkedIn Ads.' },
          { val: 'Salesforce CRM', lbl: 'Lead & Activity Tracking', desc: 'Structured pipeline hygiene, lead qualification, and activity governance.' },
          { val: '~12% Above Target', lbl: 'Average Quota Attainment', desc: 'Consistent monthly target achievement against assigned revenue baselines (₹9L–₹10L/mo).' }
        ],
        responsibilities: [
          {
            title: 'Working with Marketing-Generated Leads',
            desc: 'Engaged prospects generated through digital marketing and paid acquisition funnels across Google, Meta, and LinkedIn.'
          },
          {
            title: 'Lead Qualification & Requirement Discovery',
            desc: 'Qualified prospective candidates through consultative discovery, identifying career goals, suitability, and curriculum alignment.'
          },
          {
            title: 'Sales Conversations & Value Articulation',
            desc: 'Communicated curriculum value propositions and program outcomes tailored to individual student and professional goals.'
          },
          {
            title: 'Objection Handling & Follow-up Discipline',
            desc: 'Managed structured multi-touch follow-ups, proactively resolving financial, scheduling, and academic hesitations to convert leads into enrolled customers.'
          },
          {
            title: 'Salesforce CRM Management',
            desc: 'Tracked lead interactions, sales activities, conversation notes, and pipeline stages with strict CRM data integrity.'
          },
          {
            title: 'Revenue Generation & Quota Attainment',
            desc: 'Delivered ₹70 lakh+ in cumulative program revenue, consistently meeting and exceeding monthly commercial revenue quotas.'
          }
        ]
      },

      accentureFlipkart: {
        role: 'Operations & Seller Account Management Associate',
        period: 'December 2024 – Present',
        employer: 'Accenture',
        project: 'Flipkart Ads Account Stewardship',
        headline: 'Managing 110+ Seller Accounts/Month, ₹60L+/Month Ad Spend & Campaign Performance Support',
        synthesis: 'On the Flipkart Ads account at Accenture, my work centered on advertising account management combined with campaign performance support. Managing commercial relationships across an active monthly portfolio of 110+ marketplace sellers and guiding over ₹60 Lakh+ in monthly seller advertising investment, I served as their primary point of contact for advertising requirements within the Flipkart Ads portal. I communicated regularly with merchants to understand their product categories and growth goals, review campaign metrics (CTR, conversion rate, ACOS/DRR, ROAS), and identify relevant advertising opportunities. In strategic budget discussions, I helped sellers evaluate advertising investments against their product margins and search visibility needs. By connecting campaign performance insights with seller business objectives, structuring PLA/PCA optimizations, and resolving catalog bottlenecks, I helped sellers achieve marketplace visibility while maintaining trusted, long-term merchant relationships.',
        highlights: [
          { val: '110+ / mo', lbl: 'Monthly Seller Accounts Managed', desc: 'Active monthly marketplace merchant portfolio managed across consultation, onboarding, and growth.' },
          { val: '₹60 Lakh+ / mo', lbl: 'Monthly Ad Spend Handled', desc: 'Documented monthly seller advertising investment guided on the Flipkart Ads portal.' },
          { val: 'Up to 2×', lbl: 'ROAS Improvement', desc: 'Campaign efficiency lift achieved through keyword bid tuning, search harvesting, and catalog optimization.' }
        ],
        responsibilities: [
          {
            title: 'Seller Relationship Management (110+ Accounts / Month)',
            desc: 'Managed ongoing commercial relationships with 110+ active marketplace sellers per month, understanding inventory depth, category dynamics, and commercial goals.'
          },
          {
            title: 'Advertising Requirements & Seller Communication',
            desc: 'Maintained regular communication with sellers regarding advertising performance, platform updates, and catalog visibility opportunities.'
          },
          {
            title: 'Advertising Budget Discussions (₹60L+ / Month)',
            desc: 'Discussed advertising budgets with merchants, guiding ₹60 Lakh+ in monthly seller advertising investments within the Flipkart Ads portal based on unit margins and search demand.'
          },
          {
            title: 'Campaign Monitoring & Performance Analysis',
            desc: 'Monitored campaign delivery, analyzed key metrics (CTR, conversion rate, ACOS/DRR, ROAS), and identified performance bottlenecks.'
          },
          {
            title: 'Optimization Recommendations',
            desc: 'Provided actionable recommendations on keyword bidding, Product Listing Ads (PLA), Product Contextual Ads (PCA), and negative search pruning.'
          },
          {
            title: 'Connecting Insights with Business Objectives',
            desc: 'Translated advertising data into clear commercial takeaways, helping sellers achieve sales growth and sustaining long-term account retention.'
          }
        ]
      },

      accentureMeta: {
        role: 'Advertising Account Management & Campaign Optimization',
        period: 'December 2024 – Present',
        employer: 'Accenture',
        project: 'Meta Ads (Facebook & Instagram) Account Management',
        headline: 'Managing 35+ Client Accounts, Campaign Support & Performance Communication',
        synthesis: 'Managing 35+ accounts in the Meta Ads project at Accenture focused on advertising account management and ongoing campaign support across Facebook and Instagram. Working with client advertising accounts, I ensured campaigns were structured properly to meet full-funnel objectives—from awareness and engagement to lead generation and catalog conversions. I continuously monitored campaign delivery, tracking frequency, CPM, CTR, CPA, and ROAS to spot optimization opportunities and detect creative fatigue early. I maintained proactive client communication, providing structured performance updates, explaining metric trends, and sharing actionable optimization recommendations (such as audience refinement and budget reallocation). By combining campaign understanding with organized account management, I ensured campaigns operated smoothly while fostering responsive, transparent client relationships.',
        highlights: [
          { val: '35+', lbl: 'Accounts Managed', desc: 'Client advertising accounts managed across Facebook and Instagram platforms.' },
          { val: 'Facebook & Instagram', lbl: 'Paid Social Support', desc: 'Multi-format campaign support spanning feed, stories, reels, and catalog placements.' },
          { val: 'Proactive Reporting', lbl: 'Client Cadence', desc: 'Regular performance reporting, frequency monitoring, optimization recommendations, and account updates.' }
        ],
        responsibilities: [
          {
            title: 'Client Account Stewardship (35+ Accounts)',
            desc: 'Managed ongoing account relationships, communication, and operational requirements across 35+ Meta advertising accounts.'
          },
          {
            title: 'Facebook & Instagram Campaign Support',
            desc: 'Monitored active campaigns across Meta Ads Manager, ensuring accurate budget pacing, objective alignment, and delivery health.'
          },
          {
            title: 'Performance Monitoring & Anomaly Detection',
            desc: 'Tracked key metrics including CPM, CTR, cost-per-result (CPA), and frequency caps to identify optimization opportunities and prevent ad fatigue.'
          },
          {
            title: 'Optimization Recommendations',
            desc: 'Formulated and presented data-backed recommendations for creative refreshes, audience refinement, and budget reallocation toward top-performing ad sets.'
          },
          {
            title: 'Client Communication & Performance Insights',
            desc: 'Delivered transparent, metric-rich performance updates, translating complex advertising analytics into clear commercial summaries for clients.'
          },
          {
            title: 'Combining Campaign Understanding with Account Management',
            desc: 'Connected daily campaign performance observations with organized account follow-ups, sustaining strong client partnerships.'
          }
        ]
      },

      caseStudy: {
        title: 'Marketplace Advertising Performance — Whey Protein',
        category: 'DOCUMENTED FLIPKART ADS CAMPAIGN STUDY',
        badge: 'DOCUMENTED CAMPAIGN EXAMPLE',
        objective: 'Demonstrate marketplace advertising efficiency, media spend allocation, and attributed revenue generation within the competitive health and nutrition category on Flipkart.',
        metrics: [
          { val: '₹14,00,000', lbl: 'Advertising Spend', note: 'Media investment deployed' },
          { val: '₹60,00,000', lbl: 'Attributed Sales (GMV)', note: 'Gross merchandise value generated' },
          { val: '4.29×', lbl: 'Return on Ad Spend (ROAS)', note: '₹60L attributed sales / ₹14L ad spend' },
          { val: '23.3%', lbl: 'ACOS / DRR', note: '₹14L ad spend / ₹60L attributed sales' },
          { val: '₹3,500', lbl: 'Average Selling Price (ASP)', note: 'Average transaction value per unit' },
          { val: '~1,714', lbl: 'Total Orders Generated', note: '₹60L GMV / ₹3,500 ASP' },
          { val: '~₹817', lbl: 'Ad Cost per Order (CAC)', note: '₹14L spend / 1,714 orders' }
        ],
        metricExplanations: [
          {
            name: 'Return on Ad Spend (ROAS) — 4.29×',
            desc: 'Generated approximately ₹4.29 in attributed top-line marketplace sales for every ₹1 of advertising invested.'
          },
          {
            name: 'Advertising Cost of Sales (ACOS / DRR) — 23.3%',
            desc: 'Advertising expenditure represented approximately 23.3% of total attributed revenue, maintaining strong commercial efficiency.'
          },
          {
            name: 'Average Selling Price (ASP) — ₹3,500',
            desc: 'Premium SKU price point enabled healthy unit economics while accommodating marketplace advertising costs.'
          },
          {
            name: 'Advertising Cost per Order — ~₹817',
            desc: 'Calculated acquisition cost per customer conversion, demonstrating the relationship between media spend and transaction volume.'
          }
        ],
        interpretation: 'Commercial Interpretation: This documented campaign demonstrates how disciplined advertising budget allocation drives marketplace velocity. An ACOS of 23.3% paired with an average selling price of ₹3,500 kept the effective advertising cost per order (~₹817) well within typical consumer brand margin tolerances. The 4.29× ROAS provided clear commercial validation for sustained seller advertising participation.',
        disclaimer: 'Notice: Documented campaign performance study. ROAS measures gross attributed revenue relative to media spend and is not equivalent to net profit. Figures reflect documented campaign data.'
      },

      skills: [
        {
          group: 'Sales & Customer Conversion',
          items: [
            'Working with Marketing-Generated Leads',
            'Consultative Sales Conversations',
            'Prospect Qualification & Discovery',
            'Objection Handling & Follow-up Discipline',
            'Customer Conversion',
            'Salesforce CRM Management',
            '₹70L+ Revenue Attainment'
          ]
        },
        {
          group: 'Flipkart Seller Account Management',
          items: [
            '110+ Seller Accounts / Month',
            '₹60L+ Monthly Ad Spend Handled',
            'Seller Relationship Management',
            'Advertising Requirements Communication',
            'Advertising Budget Discussions',
            'Flipkart Ads Portal Navigation',
            'Account Reviews & Follow-ups',
            'Merchant Retention & Support'
          ]
        },
        {
          group: 'Meta Client Account Management',
          items: [
            '35+ Accounts Managed',
            'Client Communication & Updates',
            'Facebook & Instagram Campaigns',
            'Performance Insights & Reporting',
            'Anomaly & Fatigue Detection',
            'Optimization Recommendations',
            'Ongoing Account Stewardship'
          ]
        },
        {
          group: 'Campaign Performance & Optimization',
          items: [
            'Flipkart Ads (PLA & PCA)',
            'Meta Ads Manager',
            'Keyword Bid Tuning & Sculpting',
            'Search Term Harvesting',
            'ROAS & ACOS / DRR Analysis',
            'Unit Economics & CAC',
            'Up to 2× ROAS Optimization'
          ]
        }
      ],

      timeline: [
        {
          period: 'October 2022 – February 2024',
          org: 'MyCaptain',
          role: 'Senior Inside Sales Executive',
          focus: 'Sales & Customer Conversion Supporting Marketing',
          bullets: [
            'Worked with leads generated through digital marketing and paid acquisition funnels (Google, Meta, LinkedIn).',
            'Qualified prospective students, articulated curriculum value, and managed consultative sales conversations and follow-ups.',
            'Delivered ₹70 lakh+ in revenue with Salesforce CRM pipeline tracking, achieving ~12% above monthly quota targets.'
          ]
        },
        {
          period: 'December 2024 – Present',
          org: 'Accenture',
          role: 'Advertising Account Management — Flipkart Ads & Meta Ads',
          focus: '110+ Flipkart Seller Accounts/Month, 35+ Meta Accounts & Campaign Performance Support',
          bullets: [
            'Managed commercial relationships across 110+ Flipkart marketplace sellers monthly, discussing advertising budgets (₹60L+/month handled) and driving up to 2× ROAS improvement.',
            'Managed 35+ client accounts across Facebook and Instagram (Meta Ads), overseeing campaign monitoring, reporting, and optimization recommendations.',
            'Connected campaign performance analysis with ongoing seller and client communication to foster long-term partnerships.'
          ]
        }
      ],

      governanceNotice: 'Professional Governance: All figures reflect verified historical operational experience. Commercial revenues generated at MyCaptain (₹70L+) and monthly marketplace/paid social advertising budgets managed at Accenture (₹60L+/month on Flipkart Ads across 110+ sellers/month, 35+ Meta accounts) represent distinct responsibilities with separate scopes of operational accountability. Client and merchant confidentiality is strictly maintained.'
    },
};

  let currentGoluView = 'all';
  let currentGoluProjectId = null;
  let currentMusicView = 'all';
  let currentMusicTrackId = null;
  let currentBhaktiView = 'all';
  let currentBhaktiVideoId = null;
  let currentVisualLabView = 'all';
  let currentVisualLabItemId = null;
  let creativeVideoIndex = 0;
  let creativeAudioIndex = 0;
  let creativeVisualIndex = 0;
  let lightboxEl = null;

  function buildGoluUniverseHtml(data, activeView, activeProjectId) {
    const brandConcepts = data.collections?.brandConcepts?.projects || [];
    const originalStories = data.collections?.originalStories?.stories || [];
    const toolsAndWorkflow = data.toolsAndWorkflow || {};

    // ------------------------------------------------------------------------
    // CASE STUDY VIEW: COMPLAN BRAND CONCEPT
    // ------------------------------------------------------------------------
    if (activeView === 'complan-case-study') {
      const p = brandConcepts.find(item => item.id === (activeProjectId || 'complan-concept')) || brandConcepts[0];
      if (!p) return `<p>Project concept not found.</p>`;

      return `
        <div class="golu-case-study-view">
          <!-- Breadcrumb navigation bar -->
          <div class="golu-breadcrumb-bar">
            <button type="button" class="golu-back-btn" onclick="window.showGoluView('all')" aria-label="Back to Golu Universe Collections">
              <svg viewBox="0 0 16 16" fill="none" style="width:14px;height:14px"><path d="M10 13L5 8L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Back to Collections</span>
            </button>
            <div class="golu-breadcrumb-trail">
              <span>Golu Universe</span>
              <span class="sep">/</span>
              <span>AI Brand Concepts</span>
              <span class="sep">/</span>
              <span class="current">Complan Case Study</span>
            </div>
          </div>

          <!-- Header & Project Identity -->
          <div class="golu-case-study-header">
            <div class="golu-badge-group">
              <span class="modal-badge demo">SELF-INITIATED CONCEPT</span>
              <span class="modal-badge concept">AI BRAND CONCEPTS</span>
              <span class="modal-badge planned">CHARACTER-LED STORYTELLING</span>
            </div>
            <h3 class="golu-case-study-title">${p.title}</h3>
            <div class="golu-case-study-meta">
              <span class="golu-meta-pill"><strong>Brand Reference:</strong> ${p.brandReference}</span>
              <span class="golu-meta-pill"><strong>Project Type:</strong> ${p.projectType}</span>
              <span class="golu-meta-pill"><strong>Core Discipline:</strong> ${p.coreDiscipline}</span>
            </div>

            <div class="modal-disclaimer-box" style="margin:1rem 0 1.5rem">
              <svg class="modal-disclaimer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <div>
                <strong>Self-Initiated Concept Notice:</strong> ${p.disclaimer}
              </div>
            </div>
          </div>

          <!-- G. Final Video Presentation -->
          <div class="modal-section" style="margin-top:0">
            <div class="modal-section-title">Final Video Presentation</div>
            <div class="modal-video-box">
              <video controls preload="metadata" poster="${p.posterSrc}" style="width:100%;max-height:480px;display:block;background:#000;">
                <source src="${p.videoSrc}" type="video/mp4">
                Your browser does not support HTML5 video.
              </video>
            </div>
            <div style="font-size:0.8rem;color:var(--text-dim);text-align:center;margin-top:0.4rem">
              Final Video Presentation — Self-Initiated Brand Storytelling Concept (1080p, MP4)
            </div>
          </div>

          <!-- A. The Creative Insight & Premise -->
          <div class="modal-section">
            <div class="modal-section-title">Creative Insight &amp; Narrative Premise</div>
            <div class="golu-insight-card">
              <p style="font-size:0.92rem;line-height:1.65;color:#e2e8f0;margin:0 0 0.8rem">
                ${p.creativeInsight.content}
              </p>
              <div class="golu-insight-note">
                <svg viewBox="0 0 16 16" fill="currentColor" style="width:14px;height:14px;flex-shrink:0;color:var(--accent-cyan)"><circle cx="8" cy="8" r="4"/></svg>
                <span>Framed strictly as a narrative creative premise exploring childhood determination and supportive parenting, not as a medical or guaranteed growth claim.</span>
              </div>
            </div>
          </div>

          <!-- E. Intended Audience & Creative Objective -->
          <div class="modal-section">
            <div class="modal-section-title">Intended Audience &amp; Creative Objective</div>
            <div class="modal-platform-grid">
              <div class="modal-platform-card">
                <h4>
                  <svg viewBox="0 0 16 16" fill="currentColor" style="width:14px;height:14px;color:var(--accent-cyan)"><circle cx="8" cy="8" r="4"/></svg>
                  Intended Audience
                </h4>
                <p>${p.audienceAndObjective.intendedAudience}</p>
              </div>
              <div class="modal-platform-card">
                <h4>
                  <svg viewBox="0 0 16 16" fill="currentColor" style="width:14px;height:14px;color:var(--accent-cyan)"><circle cx="8" cy="8" r="4"/></svg>
                  Creative Objective
                </h4>
                <p>${p.audienceAndObjective.creativeObjective}</p>
              </div>
            </div>
            <div class="modal-disclaimer-box info" style="margin-top:1rem">
              <svg class="modal-disclaimer-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
              <div>
                <strong>Professional Context:</strong> ${p.audienceAndObjective.resultsNote}
              </div>
            </div>
          </div>

          <!-- B. Story Development & Narrative Sequence -->
          <div class="modal-section">
            <div class="modal-section-title">Story Development &amp; Narrative Sequence</div>
            <div class="modal-workflow-steps">
              ${p.storyDevelopment.steps.map(s => `
                <div class="modal-workflow-step">
                  <div class="modal-workflow-num">${s.step}</div>
                  <div class="modal-workflow-title">${s.title}</div>
                  <div class="modal-workflow-desc">${s.desc}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- C. The Creative Thought Process -->
          <div class="modal-section">
            <div class="modal-section-title">The Creative Thought Process</div>
            <div class="modal-platform-grid">
              ${p.thoughtProcess.reasons.map(r => `
                <div class="modal-platform-card">
                  <h4>
                    <svg viewBox="0 0 16 16" fill="currentColor" style="width:14px;height:14px;color:var(--accent-cyan)"><circle cx="8" cy="8" r="4"/></svg>
                    ${r.heading}
                  </h4>
                  <p>${r.desc}</p>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- H. Key Creative Decisions -->
          <div class="modal-section">
            <div class="modal-section-title">Key Creative Decisions</div>
            <p class="modal-subheading-desc" style="margin-bottom:0.8rem">Direct correlation between narrative choices and their creative rationale:</p>
            <div class="golu-decisions-grid">
              ${p.keyDecisions.map(d => `
                <div class="golu-decision-card">
                  <div class="golu-decision-header">
                    <span>${d.decision}</span>
                    <span class="golu-decision-arrow">→</span>
                  </div>
                  <div class="golu-decision-reason">${d.reason}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- D. Brand Integration & Compliance Guardrails -->
          <div class="modal-section">
            <div class="modal-section-title">Brand Integration &amp; Compliance Guardrails</div>
            <div class="modal-platform-grid">
              ${p.brandIntegration.guidelines.map(g => `
                <div class="modal-platform-card">
                  <h4>
                    <svg viewBox="0 0 16 16" fill="currentColor" style="width:14px;height:14px;color:#10b981"><path d="M13.485 1.431a1.473 1.473 0 0 1 2.104 2.062l-7.84 8a1.473 1.473 0 0 1-2.12.016L1.445 7.323a1.474 1.474 0 0 1 2.11-2.064l3.124 3.19 6.806-7.018z"/></svg>
                    ${g.label}
                  </h4>
                  <p>${g.detail}</p>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- F. Creative Direction Pillars -->
          <div class="modal-section">
            <div class="modal-section-title">Creative Direction Pillars</div>
            <div class="modal-workflow-steps">
              ${p.creativeDirectionPillars.map((cd, idx) => `
                <div class="modal-workflow-step">
                  <div class="modal-workflow-num">0${idx + 1}</div>
                  <div class="modal-workflow-title">${cd.title}</div>
                  <div class="modal-workflow-desc">${cd.desc}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Visual Development Assets -->
          <div class="modal-section">
            <div class="modal-section-title">Visual Development Assets</div>
            <div class="modal-gallery-grid">
              ${p.visualAssets.map(img => `
                <div class="modal-gallery-item">
                  <img src="${img.src}" alt="${img.alt}" loading="lazy">
                  <div class="modal-gallery-caption">
                    <strong>${img.title}</strong>
                    ${img.desc}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Section 6: AI Tools Used in This Project -->
          <div class="modal-section">
            <div class="modal-section-title">AI Tools Used in This Project</div>
            <p class="modal-subheading-desc" style="margin-bottom:1.2rem">${toolsAndWorkflow.intro || 'A confirmed creative production workflow integrating human storytelling, prompt architecture, visual design, and generative AI video creation.'}</p>

            <div class="golu-tools-grid">
              ${(toolsAndWorkflow.tools || []).map(t => `
                <div class="modal-platform-card golu-tool-card">
                  <div class="golu-tool-header">
                    <h4>
                      <svg viewBox="0 0 16 16" fill="currentColor" style="width:14px;height:14px;color:var(--accent-cyan);flex-shrink:0"><circle cx="8" cy="8" r="4"/></svg>
                      ${t.name}
                    </h4>
                  </div>
                  <div class="golu-tool-role">${t.role}</div>
                  <p>${t.desc}</p>
                </div>
              `).join('')}
            </div>

            <div class="golu-tools-group" style="margin-top:1.6rem">
              <div class="golu-tools-group-title">
                <span class="golu-status-dot cyan"></span>
                <span>Production Sequence (From Insight to Screen)</span>
              </div>
              <div class="modal-workflow-steps">
                ${(toolsAndWorkflow.productionSequence || []).map(s => `
                  <div class="modal-workflow-step">
                    <div class="modal-workflow-num">${s.step}</div>
                    <div class="modal-workflow-title">${s.phase}</div>
                    <div class="modal-workflow-desc">${s.detail}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- I. Potential Applications -->
          <div class="modal-section">
            <div class="modal-section-title">Potential Brand Applications</div>
            <p class="modal-subheading-desc" style="margin-bottom:0.8rem">Potential creative avenues where this character-led storytelling workflow can be deployed for future brand concepts:</p>
            <ul class="modal-list">
              ${p.potentialApplications.map(app => `<li>${app}</li>`).join('')}
            </ul>
          </div>

          <!-- Bottom Back Navigation -->
          <div style="margin-top:2rem;padding-top:1.2rem;border-top:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center">
            <button type="button" class="golu-back-btn" onclick="window.showGoluView('all')">
              <svg viewBox="0 0 16 16" fill="none" style="width:14px;height:14px"><path d="M10 13L5 8L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Back to Golu Universe Collections</span>
            </button>
          </div>
        </div>
      `;
    }

    // ------------------------------------------------------------------------
    // STORY DETAIL VIEW: ORIGINAL AI STORIES
    // ------------------------------------------------------------------------
    if (activeView === 'story-detail') {
      const s = originalStories.find(item => item.id === activeProjectId) || originalStories[0];
      if (!s) {
        return buildGoluUniverseHtml(data, 'original-stories', null);
      }

      return `
        <div class="golu-story-view">
          <!-- Breadcrumb navigation bar -->
          <div class="golu-breadcrumb-bar">
            <button type="button" class="golu-back-btn" onclick="window.showGoluView('original-stories')" aria-label="Back to Original Stories">
              <svg viewBox="0 0 16 16" fill="none" style="width:14px;height:14px"><path d="M10 13L5 8L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Back to Original Stories</span>
            </button>
            <div class="golu-breadcrumb-trail">
              <span>Golu Universe</span>
              <span class="sep">/</span>
              <span>Original AI Stories</span>
              <span class="sep">/</span>
              <span class="current">${s.title}</span>
            </div>
          </div>

          <!-- Header & Identity -->
          <div class="golu-case-study-header">
            <div class="golu-badge-group">
              <span class="modal-badge concept">ORIGINAL STORY</span>
              <span class="modal-badge planned">${s.episode || 'STORY'}</span>
              <span class="modal-badge verified">GOLU IP</span>
            </div>
            <h3 class="golu-case-study-title">${s.title}</h3>
            <div class="golu-case-study-meta">
              <span class="golu-meta-pill"><strong>Format:</strong> ${s.format || 'Instagram Reel • Character Animation'}</span>
              <span class="golu-meta-pill"><strong>Series:</strong> ${s.series || 'Original AI Stories'}</span>
            </div>
          </div>

          <!-- Video Reel Embed Player -->
          <div class="modal-section" style="margin-top:1.5rem">
            <div class="modal-section-title">Instagram Reel Player</div>
            <div class="golu-detail-embed-wrapper">
              <div class="golu-reel-embed-container prominent">
                <iframe
                  class="golu-reel-iframe"
                  src="${s.embedUrl}"
                  scrolling="no"
                  allowtransparency="true"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  loading="lazy"
                  title="${s.title}">
                </iframe>
              </div>
              <div class="golu-embed-fallback-box">
                <div class="golu-fallback-info">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;color:#c084fc;flex-shrink:0"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                  <span>If browser privacy settings, cookies, or content blockers prevent the preview from loading, you can open and watch this Reel directly on Instagram.</span>
                </div>
                <a href="${s.reelUrl}" target="_blank" rel="noopener noreferrer" class="golu-action-btn primary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                  <span>Open Reel on Instagram</span>
                  <svg viewBox="0 0 16 16" fill="none" style="width:11px;height:11px"><path d="M5 3H13M13 3V11M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </a>
              </div>
            </div>
          </div>

          <!-- Story Overview -->
          <div class="modal-section" style="margin-top:1.5rem">
            <div class="modal-section-title">Story Overview &amp; Character Narrative</div>
            <div class="golu-insight-card">
              <p style="font-size:0.92rem;line-height:1.65;color:#e2e8f0;margin:0">
                ${s.storyPremise || s.shortSummary}
              </p>
            </div>
          </div>

          <!-- Bottom Back & External Navigation -->
          <div style="margin-top:2rem;padding-top:1.2rem;border-top:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
            <button type="button" class="golu-back-btn" onclick="window.showGoluView('original-stories')">
              <svg viewBox="0 0 16 16" fill="none" style="width:14px;height:14px"><path d="M10 13L5 8L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Back to Original Stories</span>
            </button>
            <a href="${s.reelUrl}" target="_blank" rel="noopener noreferrer" class="golu-action-btn primary">
              <span>Watch on Instagram</span>
              <svg viewBox="0 0 16 16" fill="none"><path d="M5 3H13M13 3V11M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
          </div>
        </div>
      `;
    }

    // ------------------------------------------------------------------------
    // LANDING VIEW: COLLECTIONS OVERVIEW
    // ------------------------------------------------------------------------
    const isBrandActive = activeView === 'all' || activeView === 'brand-concepts';
    const isStoryActive = activeView === 'all' || activeView === 'original-stories';

    return `
      <div class="golu-landing-view">
        <!-- Hero Intro -->
        <div class="golu-hero-intro">
          <div class="golu-subtitle-tag">${data.subtitle}</div>
          <p class="modal-lead-text" style="margin-top:0.75rem;margin-bottom:0">
            ${data.leadText}
          </p>
        </div>

        <!-- Navigation Tabs -->
        <div class="golu-nav-tabs" role="tablist" aria-label="Golu Universe Collections">
          <button type="button" class="golu-nav-tab ${activeView === 'all' ? 'active' : ''}" onclick="window.showGoluView('all')" role="tab" aria-selected="${activeView === 'all'}">
            <span>All Collections</span>
            <span class="tab-count">${brandConcepts.length + originalStories.length}</span>
          </button>
          <button type="button" class="golu-nav-tab ${activeView === 'brand-concepts' ? 'active' : ''}" onclick="window.showGoluView('brand-concepts')" role="tab" aria-selected="${activeView === 'brand-concepts'}">
            <span>AI Brand Concepts</span>
            <span class="tab-count">${brandConcepts.length}</span>
          </button>
          <button type="button" class="golu-nav-tab ${activeView === 'original-stories' ? 'active' : ''}" onclick="window.showGoluView('original-stories')" role="tab" aria-selected="${activeView === 'original-stories'}">
            <span>Original AI Stories</span>
            <span class="tab-count">${originalStories.length > 0 ? originalStories.length : 'Coming Soon'}</span>
          </button>
        </div>

        <!-- COLLECTION A: AI Brand Concepts -->
        ${isBrandActive ? `
          <div class="golu-collection-section">
            <div class="golu-collection-header">
              <div class="golu-collection-badge">COLLECTION A • SPECULATIVE ADVERTISING</div>
              <h3 class="golu-collection-title">AI Brand Concepts</h3>
              <div class="golu-collection-subtitle">Speculative Advertising &amp; Brand Storytelling</div>
              <p class="golu-collection-desc">
                Self-initiated brand-inspired concepts exploring how AI-generated visuals, character-led narratives, and creative direction can bring product stories to life.
              </p>
            </div>

            <div class="golu-cards-grid">
              ${brandConcepts.map(p => `
                <div class="golu-card" tabindex="0" onclick="window.showGoluView('complan-case-study', '${p.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.showGoluView('complan-case-study','${p.id}');}">
                  <div class="golu-card-media">
                    <img src="${p.thumbnail}" alt="${p.title}" loading="lazy">
                    <div class="golu-card-overlay">
                      <span class="golu-tag-pill warning">${p.projectType.toUpperCase()}</span>
                      <span class="golu-play-badge" title="Explore Brand Concept Case Study">
                        <svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px"><path d="M8 5v14l11-7z"/></svg>
                      </span>
                    </div>
                  </div>
                  <div class="golu-card-body">
                    <div class="golu-card-meta">
                      <span class="golu-brand-ref">${p.brandReference}</span>
                      <span class="golu-discipline-ref">${p.coreDiscipline}</span>
                    </div>
                    <h4 class="golu-card-title">${p.title}</h4>
                    <p class="golu-card-summary">${p.shortSummary}</p>
                    <div class="golu-card-action">
                      <button type="button" class="golu-action-btn" onclick="event.stopPropagation(); window.showGoluView('complan-case-study', '${p.id}')">
                        <span>${p.ctaText || 'Explore Brand Case Study'}</span>
                        <svg viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- COLLECTION B: Original AI Stories -->
        ${isStoryActive ? `
          <div class="golu-collection-section">
            <div class="golu-collection-header">
              <div class="golu-collection-badge violet">COLLECTION B • ORIGINAL ANIMATION</div>
              <h3 class="golu-collection-title">Original AI Stories</h3>
              <div class="golu-collection-subtitle">Original Characters, Stories &amp; Animation</div>
              <p class="golu-collection-desc">
                Original AI-assisted storytelling built around imaginative characters, entertaining moments, and narrative-driven animated videos.
              </p>
            </div>

            ${originalStories.length > 0 ? `
              <div class="golu-cards-grid">
                ${originalStories.map(s => `
                  <div class="golu-card golu-reel-card">
                    <div class="golu-reel-embed-container">
                      <iframe
                        class="golu-reel-iframe"
                        src="${s.embedUrl}"
                        scrolling="no"
                        allowtransparency="true"
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                        loading="lazy"
                        title="${s.title}">
                      </iframe>
                    </div>
                    <div class="golu-embed-fallback-bar">
                      <span>Preview blocked?</span>
                      <a href="${s.reelUrl}" target="_blank" rel="noopener noreferrer" class="golu-fallback-link">
                        Watch Reel on Instagram
                        <svg viewBox="0 0 16 16" fill="none"><path d="M5 3H13M13 3V11M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </a>
                    </div>
                    <div class="golu-card-body">
                      <div class="golu-card-meta">
                        <span class="golu-brand-ref violet">${s.episode}</span>
                        <span class="golu-discipline-ref">${s.format}</span>
                      </div>
                      <h4 class="golu-card-title">${s.title}</h4>
                      <p class="golu-card-summary">${s.shortSummary}</p>
                      <div class="golu-card-actions-group">
                        <a href="${s.reelUrl}" target="_blank" rel="noopener noreferrer" class="golu-action-btn primary" title="Open and watch this Reel on Instagram">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                          <span>Open on Instagram</span>
                          <svg viewBox="0 0 16 16" fill="none" style="width:11px;height:11px"><path d="M5 3H13M13 3V11M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </a>
                        <button type="button" class="golu-action-btn secondary" onclick="window.showGoluView('story-detail', '${s.id}')">
                          <span>Story Details</span>
                          <svg viewBox="0 0 16 16" fill="none" style="width:11px;height:11px"><path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="golu-empty-state-card">
                <div class="golu-empty-icon violet">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                </div>
                <span class="golu-empty-badge violet">IN ACTIVE PRODUCTION</span>
                <h4 class="golu-empty-title">New Original Stories Coming Soon</h4>
                <p class="golu-empty-desc">
                  Original character adventures and comedy sketches are in active production and will be showcased here.
                </p>
                <div class="golu-empty-meta">
                  <span class="golu-meta-pill"><strong>Format:</strong> Original Character IP &amp; Episodic Shorts</span>
                  <span class="golu-meta-pill"><strong>Status:</strong> Active Character &amp; Scene Animation</span>
                </div>
              </div>
            `}
          </div>
        ` : ''}

        <!-- Section 6: AI Tools Used in This Project in Landing View -->
        <div class="modal-section" style="margin-top:2.5rem">
          <div class="modal-section-title">AI Tools Used in This Project</div>
          <p class="modal-subheading-desc" style="margin-bottom:1.4rem">
            ${toolsAndWorkflow.intro || 'A confirmed creative production workflow integrating human storytelling, prompt architecture, visual design, and generative AI video creation.'}
          </p>

          <div class="golu-tools-grid">
            ${(toolsAndWorkflow.tools || []).map(t => `
              <div class="modal-platform-card golu-tool-card">
                <div class="golu-tool-header">
                  <h4>
                    <svg viewBox="0 0 16 16" fill="currentColor" style="width:14px;height:14px;color:var(--accent-cyan);flex-shrink:0"><circle cx="8" cy="8" r="4"/></svg>
                    ${t.name}
                  </h4>
                </div>
                <div class="golu-tool-role">${t.role}</div>
                <p>${t.desc}</p>
              </div>
            `).join('')}
          </div>

          <div class="golu-tools-group" style="margin-top:1.6rem">
            <div class="golu-tools-group-title">
              <span class="golu-status-dot cyan"></span>
              <span>Creative Production Sequence (From Concept to Screen)</span>
            </div>
            <div class="modal-workflow-steps">
              ${(toolsAndWorkflow.productionSequence || []).map(s => `
                <div class="modal-workflow-step">
                  <div class="modal-workflow-num">${s.step}</div>
                  <div class="modal-workflow-title">${s.phase}</div>
                  <div class="modal-workflow-desc">${s.detail}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // BUILDER: PROJECT 03 — AI MUSIC STUDIO (ZE-WA MUSIC)
  // ==========================================================================
  function buildMusicStudioHtml(data, activeView, activeTrackId) {
    const videos = data.videos || [];
    const channel = data.channel || {};
    const workflow = data.workflow || [];

    // Track Detail View
    if (activeView === 'track-detail') {
      const t = videos.find(item => item.id === activeTrackId) || videos[0];
      if (!t) return buildMusicStudioHtml(data, 'all', null);

      return `
        <div class="golu-story-view">
          <div class="golu-breadcrumb-bar">
            <button type="button" class="golu-back-btn" onclick="window.showMusicView('all')" aria-label="Back to Music Studio Releases">
              <svg viewBox="0 0 16 16" fill="none" style="width:14px;height:14px"><path d="M10 13L5 8L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Back to All Releases</span>
            </button>
            <div class="golu-breadcrumb-trail">
              <span>AI Music Studio</span>
              <span class="sep">/</span>
              <span>Releases</span>
              <span class="sep">/</span>
              <span class="current">${t.title}</span>
            </div>
          </div>

          <div class="golu-case-study-header">
            <div class="golu-badge-group">
              <span class="modal-badge concept">ZE-WA MUSIC</span>
              <span class="modal-badge planned">${t.type.toUpperCase()}</span>
              <span class="modal-badge verified">16:9 HD</span>
            </div>
            <h3 class="golu-case-study-title">${t.title}</h3>
            <div class="golu-case-study-meta">
              <span class="golu-meta-pill"><strong>Genre:</strong> ${t.genre || 'AI Music'}</span>
              <span class="golu-meta-pill"><strong>Channel:</strong> ${channel.name}</span>
            </div>
          </div>

          <!-- Video Player Section -->
          <div class="modal-section" style="margin-top:1.5rem">
            <div class="modal-section-title">YouTube Video Player</div>
            <div class="golu-detail-embed-wrapper">
              <div class="yt-embed-container ratio-16-9 prominent-16-9" style="border-radius:12px;overflow:hidden;border:1px solid rgba(0,240,255,0.25);">
                <iframe
                  class="yt-embed-iframe"
                  src="${t.embedUrl}"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                  loading="lazy"
                  title="${t.title}">
                </iframe>
              </div>
              <div class="golu-embed-fallback-box" style="max-width:780px">
                <div class="golu-fallback-info">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;color:var(--accent-cyan);flex-shrink:0"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                  <span>If third-party cookies or content blockers prevent the embedded preview from playing, you can open and watch this release directly on YouTube.</span>
                </div>
                <a href="${t.videoUrl}" target="_blank" rel="noopener noreferrer" class="golu-action-btn youtube">
                  <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  <span>Watch on YouTube</span>
                  <svg viewBox="0 0 16 16" fill="none" style="width:11px;height:11px"><path d="M5 3H13M13 3V11M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </a>
              </div>
            </div>
          </div>

          <!-- Track Overview -->
          <div class="modal-section" style="margin-top:1.5rem">
            <div class="modal-section-title">Track Overview &amp; Production Context</div>
            <div class="golu-insight-card">
              <p style="font-size:0.92rem;line-height:1.65;color:#e2e8f0;margin:0">
                ${t.overview || t.shortSummary}
              </p>
            </div>
          </div>

          <div style="margin-top:2rem;padding-top:1.2rem;border-top:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
            <button type="button" class="golu-back-btn" onclick="window.showMusicView('all')">
              <svg viewBox="0 0 16 16" fill="none" style="width:14px;height:14px"><path d="M10 13L5 8L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Back to All Releases</span>
            </button>
            <a href="${t.videoUrl}" target="_blank" rel="noopener noreferrer" class="golu-action-btn youtube">
              <span>Watch on YouTube</span>
              <svg viewBox="0 0 16 16" fill="none"><path d="M5 3H13M13 3V11M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
          </div>
        </div>
      `;
    }

    // Landing / Main View
    return `
      <div class="golu-landing-view">
        <div class="golu-hero-intro">
          <div class="golu-subtitle-tag">${data.subtitle || 'GENERATIVE AUDIO &amp; VISUALS'}</div>
          <p class="modal-lead-text" style="margin-top:0.75rem;margin-bottom:0">
            ${data.leadText}
          </p>
        </div>

        <!-- Channel Banner -->
        <div class="project-channel-banner">
          <div class="channel-info-group">
            <div class="channel-avatar music">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:22px;height:22px"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
            </div>
            <div class="channel-text">
              <div class="channel-tag">${channel.badge || 'OFFICIAL YOUTUBE CHANNEL'}</div>
              <h4 class="channel-name">${channel.name}</h4>
              <p class="channel-handle">${channel.handle} • ${channel.desc || 'AI Music Production'}</p>
            </div>
          </div>
          <a href="${channel.url}" target="_blank" rel="noopener noreferrer" class="channel-visit-btn" title="Open ${channel.name} on YouTube">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            <span>Visit Channel</span>
            <svg viewBox="0 0 16 16" fill="none" style="width:12px;height:12px"><path d="M5 3H13M13 3V11M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
        </div>

        <!-- Navigation Tabs -->
        <div class="golu-nav-tabs" role="tablist" aria-label="Music Studio Collections">
          <button type="button" class="golu-nav-tab active" role="tab" aria-selected="true">
            <span>All Releases</span>
            <span class="tab-count">${videos.length}</span>
          </button>
        </div>

        <!-- Releases Grid Section -->
        <div class="golu-collection-section">
          <div class="golu-collection-header">
            <div class="golu-collection-badge">COLLECTION • OFFICIAL RELEASES</div>
            <h3 class="golu-collection-title">Published Music Releases</h3>
            <div class="golu-collection-subtitle">Original AI-Assisted Music Videos</div>
            <p class="golu-collection-desc">
              Original compositions released on the Ze-Wa Music channel, combining lyrical prompt architecture, melodic motif synthesis, and synchronized visual aesthetics.
            </p>
          </div>

          <div class="golu-cards-grid">
            ${videos.map(v => `
              <div class="golu-card golu-reel-card">
                <div class="yt-embed-container ratio-16-9">
                  <iframe
                    class="yt-embed-iframe"
                    src="${v.embedUrl}"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen
                    loading="lazy"
                    title="${v.title}">
                  </iframe>
                </div>
                <div class="golu-embed-fallback-bar">
                  <span>Preview blocked?</span>
                  <a href="${v.videoUrl}" target="_blank" rel="noopener noreferrer" class="golu-fallback-link">
                    Watch on YouTube
                    <svg viewBox="0 0 16 16" fill="none"><path d="M5 3H13M13 3V11M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </a>
                </div>
                <div class="golu-card-body">
                  <div class="golu-card-meta">
                    <span class="golu-brand-ref">${v.type}</span>
                    <span class="golu-discipline-ref">16:9 • Stereo Audio</span>
                  </div>
                  <h4 class="golu-card-title">${v.title}</h4>
                  <p class="golu-card-summary">${v.shortSummary}</p>
                  <div class="golu-card-actions-group">
                    <a href="${v.videoUrl}" target="_blank" rel="noopener noreferrer" class="golu-action-btn youtube" title="Watch on YouTube">
                      <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      <span>Watch on YouTube</span>
                      <svg viewBox="0 0 16 16" fill="none" style="width:11px;height:11px"><path d="M5 3H13M13 3V11M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </a>
                    <button type="button" class="golu-action-btn secondary" onclick="window.showMusicView('track-detail', '${v.id}')">
                      <span>Track Details</span>
                      <svg viewBox="0 0 16 16" fill="none" style="width:11px;height:11px"><path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Workflow Section -->
        <div class="modal-section" style="margin-top:2.5rem">
          <div class="modal-section-title">Music Production Workflow Sequence</div>
          <div class="modal-workflow-steps">
            ${workflow.map(w => `
              <div class="modal-workflow-step">
                <div class="modal-workflow-num">${w.step}</div>
                <div class="modal-workflow-title">${w.title}</div>
                <div class="modal-workflow-desc">${w.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // BUILDER: PROJECT 04 — BHAKTI & DEVOTIONAL CONTENT (MARUTI MANTRA)
  // ==========================================================================
  function buildBhaktiContentHtml(data, activeView, activeVideoId) {
    const videos = data.videos || [];
    const channel = data.channel || {};
    const workflow = data.workflow || [];
    const fullVideos = videos.filter(v => v.aspect === '16:9');
    const shorts = videos.filter(v => v.aspect === '9:16');

    // Video Detail View
    if (activeView === 'video-detail') {
      const v = videos.find(item => item.id === activeVideoId) || videos[0];
      if (!v) return buildBhaktiContentHtml(data, 'all', null);

      const isShort = v.aspect === '9:16';

      return `
        <div class="golu-story-view">
          <div class="golu-breadcrumb-bar">
            <button type="button" class="golu-back-btn" onclick="window.showBhaktiView('all')" aria-label="Back to Maruti Mantra Releases">
              <svg viewBox="0 0 16 16" fill="none" style="width:14px;height:14px"><path d="M10 13L5 8L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Back to All Releases</span>
            </button>
            <div class="golu-breadcrumb-trail">
              <span>Maruti Mantra</span>
              <span class="sep">/</span>
              <span>${v.type}</span>
              <span class="sep">/</span>
              <span class="current">${v.title}</span>
            </div>
          </div>

          <div class="golu-case-study-header">
            <div class="golu-badge-group">
              <span class="modal-badge warning">MARUTI MANTRA</span>
              <span class="modal-badge concept">${v.type.toUpperCase()}</span>
              <span class="modal-badge verified">${v.aspect === '16:9' ? '16:9 WIDESCREEN' : '9:16 VERTICAL SHORT'}</span>
            </div>
            <h3 class="golu-case-study-title">${v.title}</h3>
            <div class="golu-case-study-meta">
              <span class="golu-meta-pill"><strong>Format:</strong> ${v.type} (${v.aspect})</span>
              <span class="golu-meta-pill"><strong>Channel:</strong> ${channel.name}</span>
            </div>
          </div>

          <!-- Video Player Section -->
          <div class="modal-section" style="margin-top:1.5rem">
            <div class="modal-section-title">YouTube Video Player</div>
            <div class="golu-detail-embed-wrapper">
              <div class="yt-embed-container ${isShort ? 'ratio-9-16 prominent-9-16' : 'ratio-16-9 prominent-16-9'}" style="border-radius:12px;overflow:hidden;border:1px solid rgba(245,158,11,0.3);">
                <iframe
                  class="yt-embed-iframe"
                  src="${v.embedUrl}"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                  loading="lazy"
                  title="${v.title}">
                </iframe>
              </div>
              <div class="golu-embed-fallback-box" style="max-width:${isShort ? '420px' : '780px'}">
                <div class="golu-fallback-info">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;color:#fbbf24;flex-shrink:0"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                  <span>If third-party cookies or content blockers prevent the embedded preview from playing, you can open and watch this devotional release directly on YouTube.</span>
                </div>
                <a href="${v.videoUrl}" target="_blank" rel="noopener noreferrer" class="golu-action-btn youtube">
                  <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  <span>Watch on YouTube</span>
                  <svg viewBox="0 0 16 16" fill="none" style="width:11px;height:11px"><path d="M5 3H13M13 3V11M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </a>
              </div>
            </div>
          </div>

          <!-- Overview -->
          <div class="modal-section" style="margin-top:1.5rem">
            <div class="modal-section-title">Devotional Concept &amp; Visual Theme</div>
            <div class="golu-insight-card">
              <p style="font-size:0.92rem;line-height:1.65;color:#e2e8f0;margin:0">
                ${v.overview || v.shortSummary}
              </p>
            </div>
          </div>

          <div style="margin-top:2rem;padding-top:1.2rem;border-top:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
            <button type="button" class="golu-back-btn" onclick="window.showBhaktiView('all')">
              <svg viewBox="0 0 16 16" fill="none" style="width:14px;height:14px"><path d="M10 13L5 8L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Back to All Releases</span>
            </button>
            <a href="${v.videoUrl}" target="_blank" rel="noopener noreferrer" class="golu-action-btn youtube">
              <span>Watch on YouTube</span>
              <svg viewBox="0 0 16 16" fill="none"><path d="M5 3H13M13 3V11M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
          </div>
        </div>
      `;
    }

    // Main / Landing View
    const showFullVideos = activeView === 'all' || activeView === 'devotional-videos';
    const showShorts = activeView === 'all' || activeView === 'shorts';

    return `
      <div class="golu-landing-view">
        <div class="golu-hero-intro">
          <div class="golu-subtitle-tag" style="color:#fbbf24">${data.subtitle || 'SPIRITUAL CONCEPTS &amp; SACRED VISUALS'}</div>
          <p class="modal-lead-text" style="margin-top:0.75rem;margin-bottom:0">
            ${data.leadText}
          </p>
        </div>

        <!-- Channel Banner -->
        <div class="project-channel-banner bhakti-banner">
          <div class="channel-info-group">
            <div class="channel-avatar bhakti">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:22px;height:22px"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
            </div>
            <div class="channel-text">
              <div class="channel-tag">${channel.badge || 'OFFICIAL YOUTUBE CHANNEL'}</div>
              <h4 class="channel-name">${channel.name}</h4>
              <p class="channel-handle">${channel.handle} • ${channel.desc || 'Devotional Creative Concepts &amp; Sacred Visuals'}</p>
            </div>
          </div>
          <a href="${channel.url}" target="_blank" rel="noopener noreferrer" class="channel-visit-btn" title="Open ${channel.name} on YouTube">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            <span>Visit Channel</span>
            <svg viewBox="0 0 16 16" fill="none" style="width:12px;height:12px"><path d="M5 3H13M13 3V11M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
        </div>

        <!-- Navigation Tabs -->
        <div class="golu-nav-tabs" role="tablist" aria-label="Maruti Mantra Collections">
          <button type="button" class="golu-nav-tab ${activeView === 'all' ? 'active' : ''}" onclick="window.showBhaktiView('all')" role="tab" aria-selected="${activeView === 'all'}">
            <span>All Devotional Releases</span>
            <span class="tab-count">${videos.length}</span>
          </button>
          <button type="button" class="golu-nav-tab ${activeView === 'devotional-videos' ? 'active' : ''}" onclick="window.showBhaktiView('devotional-videos')" role="tab" aria-selected="${activeView === 'devotional-videos'}">
            <span>Devotional Videos (16:9)</span>
            <span class="tab-count">${fullVideos.length}</span>
          </button>
          <button type="button" class="golu-nav-tab ${activeView === 'shorts' ? 'active' : ''}" onclick="window.showBhaktiView('shorts')" role="tab" aria-selected="${activeView === 'shorts'}">
            <span>YouTube Shorts (9:16)</span>
            <span class="tab-count">${shorts.length}</span>
          </button>
        </div>

        <!-- Section 1: Devotional Videos (16:9) -->
        ${showFullVideos && fullVideos.length > 0 ? `
          <div class="golu-collection-section">
            <div class="golu-collection-header">
              <div class="golu-collection-badge saffron">FEATURED DEVOTIONAL VIDEO • 16:9 WIDESCREEN</div>
              <h3 class="golu-collection-title">Devotional Video Productions</h3>
              <div class="golu-collection-subtitle" style="color:#fbbf24">Full-Length Sacred Visual Concepts</div>
              <p class="golu-collection-desc">
                Extended sacred visual compositions and meditative hymns honoring sacred Hindu deities with traditional iconography and ambient chants.
              </p>
            </div>

            <div class="golu-cards-grid" style="grid-template-columns: 1fr;">
              ${fullVideos.map(v => `
                <div class="golu-card golu-reel-card">
                  <div class="yt-embed-container ratio-16-9">
                    <iframe
                      class="yt-embed-iframe"
                      src="${v.embedUrl}"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowfullscreen
                      loading="lazy"
                      title="${v.title}">
                    </iframe>
                  </div>
                  <div class="golu-embed-fallback-bar">
                    <span>Preview blocked?</span>
                    <a href="${v.videoUrl}" target="_blank" rel="noopener noreferrer" class="golu-fallback-link">
                      Watch on YouTube
                      <svg viewBox="0 0 16 16" fill="none"><path d="M5 3H13M13 3V11M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </a>
                  </div>
                  <div class="golu-card-body">
                    <div class="golu-card-meta">
                      <span class="golu-brand-ref saffron">${v.type}</span>
                      <span class="golu-discipline-ref">16:9 • High Definition</span>
                    </div>
                    <h4 class="golu-card-title">${v.title}</h4>
                    <p class="golu-card-summary">${v.shortSummary}</p>
                    <div class="golu-card-actions-group">
                      <a href="${v.videoUrl}" target="_blank" rel="noopener noreferrer" class="golu-action-btn youtube" title="Watch on YouTube">
                        <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                        <span>Watch on YouTube</span>
                        <svg viewBox="0 0 16 16" fill="none" style="width:11px;height:11px"><path d="M5 3H13M13 3V11M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </a>
                      <button type="button" class="golu-action-btn secondary" onclick="window.showBhaktiView('video-detail', '${v.id}')">
                        <span>Video Details</span>
                        <svg viewBox="0 0 16 16" fill="none" style="width:11px;height:11px"><path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Section 2: YouTube Shorts (9:16) -->
        ${showShorts && shorts.length > 0 ? `
          <div class="golu-collection-section">
            <div class="golu-collection-header">
              <div class="golu-collection-badge saffron">COLLECTION • 9:16 YOUTUBE SHORTS</div>
              <h3 class="golu-collection-title">Devotional YouTube Shorts</h3>
              <div class="golu-collection-subtitle" style="color:#fbbf24">Vertical Micro-Narratives &amp; Sacred Chants</div>
              <p class="golu-collection-desc">
                Engaging vertical shorts optimized for mobile audiences, featuring sacred Sanskrit shlokas, Radha-Krishna bhakti, and Mahadev meditative sequences.
              </p>
            </div>

            <div class="golu-cards-grid">
              ${shorts.map(v => `
                <div class="golu-card golu-reel-card">
                  <div class="yt-embed-container ratio-9-16">
                    <iframe
                      class="yt-embed-iframe"
                      src="${v.embedUrl}"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowfullscreen
                      loading="lazy"
                      title="${v.title}">
                    </iframe>
                  </div>
                  <div class="golu-embed-fallback-bar">
                    <span>Preview blocked?</span>
                    <a href="${v.videoUrl}" target="_blank" rel="noopener noreferrer" class="golu-fallback-link">
                      Watch Short on YouTube
                      <svg viewBox="0 0 16 16" fill="none"><path d="M5 3H13M13 3V11M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </a>
                  </div>
                  <div class="golu-card-body">
                    <div class="golu-card-meta">
                      <span class="golu-brand-ref saffron">${v.type}</span>
                      <span class="golu-discipline-ref">9:16 Vertical</span>
                    </div>
                    <h4 class="golu-card-title">${v.title}</h4>
                    <p class="golu-card-summary">${v.shortSummary}</p>
                    <div class="golu-card-actions-group">
                      <a href="${v.videoUrl}" target="_blank" rel="noopener noreferrer" class="golu-action-btn youtube" title="Watch on YouTube Shorts">
                        <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                        <span>Watch Short</span>
                        <svg viewBox="0 0 16 16" fill="none" style="width:11px;height:11px"><path d="M5 3H13M13 3V11M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </a>
                      <button type="button" class="golu-action-btn secondary" onclick="window.showBhaktiView('video-detail', '${v.id}')">
                        <span>Details</span>
                        <svg viewBox="0 0 16 16" fill="none" style="width:11px;height:11px"><path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Cultural Authenticity & Philosophy -->
        <div class="modal-section" style="margin-top:2.5rem">
          <div class="modal-section-title">Cultural Authenticity &amp; Design Philosophy</div>
          <div class="golu-insight-card" style="margin-bottom:1.5rem">
            <p style="font-size:0.92rem;line-height:1.65;color:#e2e8f0;margin:0">
              ${data.culturalAuthenticity}
            </p>
          </div>

          <div class="modal-section-title" style="margin-top:1.5rem">Creative Production Sequence</div>
          <div class="modal-workflow-steps">
            ${workflow.map(w => `
              <div class="modal-workflow-step">
                <div class="modal-workflow-num">${w.step}</div>
                <div class="modal-workflow-title">${w.title}</div>
                <div class="modal-workflow-desc">${w.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

// ==========================================================================
  // BUILDER: PROJECT 05 — AI VISUAL LAB
  // ==========================================================================

  // ==========================================================================
  // BUILDER: PROJECT 05 — AI VISUAL LAB (RECRUITER-FRIENDLY & EXPANDABLE)
  // ==========================================================================

  function renderVisualLabSlider(sliderId, beforeImg, afterImg, beforeLabel, afterLabel, isCoverMode) {
    var coverClass = isCoverMode ? 'cover-mode' : '';
    return `
      <div class="slider-wrapper">
        <div class="comparison-slider ${coverClass}" id="${sliderId}" style="--slider-pos: 50%;">
          <div class="slider-img-layer after-layer">
            <img src="${afterImg}" alt="${afterLabel}" loading="lazy">
            <span class="slider-badge after-badge">${afterLabel}</span>
          </div>
          <div class="slider-img-layer before-layer">
            <img src="${beforeImg}" alt="${beforeLabel}" loading="lazy">
            <span class="slider-badge before-badge">${beforeLabel}</span>
          </div>
          <div class="slider-divider"></div>
          <div class="slider-handle-pill" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px">
              <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value="50"
            class="slider-range-input"
            aria-label="Drag before and after comparison slider"
            oninput="const s=this.closest('.comparison-slider'); s.style.setProperty('--slider-pos', this.value + '%');"
          >
        </div>
        <div class="slider-controls-bar">
          <div class="slider-hint-text">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:var(--accent-cyan)"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8M8 12h8"></path></svg>
            <span>Drag slider handle or select a preset:</span>
          </div>
          <div class="slider-presets-group">
            <button type="button" class="slider-preset-btn" onclick="const s=this.closest('.slider-wrapper').querySelector('.comparison-slider'); s.style.setProperty('--slider-pos', '100%'); s.querySelector('.slider-range-input').value = 100;">100% Before</button>
            <button type="button" class="slider-preset-btn" onclick="const s=this.closest('.slider-wrapper').querySelector('.comparison-slider'); s.style.setProperty('--slider-pos', '50%'); s.querySelector('.slider-range-input').value = 50;">50 / 50 Split</button>
            <button type="button" class="slider-preset-btn" onclick="const s=this.closest('.slider-wrapper').querySelector('.comparison-slider'); s.style.setProperty('--slider-pos', '0%'); s.querySelector('.slider-range-input').value = 0;">100% After</button>
          </div>
        </div>
      </div>
    `;
  }

  function buildVisualLabHtml(data, activeView, activeItemId) {
    var brand = data.brandConcept || {};
    var caseStudies = data.caseStudies || [];
    var frameworks = data.frameworks || [];
    var workflow = data.workflow || [];

    // Helper: Render structured recruiter case study breakdown
    function renderRecruiterBreakdown(item, promptId) {
      return `
        <div class="case-study-narrative-box">
          <div class="narrative-col">
            <div class="narrative-col-title">
              <svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px;color:var(--accent-cyan)"><circle cx="8" cy="8" r="3.5"/></svg>
              Creative Objective
            </div>
            <p class="narrative-col-text">${item.creativeObjective || ''}</p>
          </div>
          <div class="narrative-col">
            <div class="narrative-col-title">
              <svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px;color:#a855f7"><circle cx="8" cy="8" r="3.5"/></svg>
              Visual Approach
            </div>
            <p class="narrative-col-text">${item.visualApproach || ''}</p>
          </div>
        </div>

        <div class="framework-formula-box">
          <div class="framework-formula-label">Prompting Framework:</div>
          <div class="framework-formula-content">${item.promptingFramework || ''}</div>
        </div>

        <div class="prompt-code-box">
          <div class="prompt-code-header">
            <span class="prompt-code-label">
              <svg viewBox="0 0 16 16" fill="currentColor" style="width:13px;height:13px;color:var(--accent-cyan)"><circle cx="8" cy="8" r="4"/></svg>
              Example Prompt (Reusable Architecture)
            </span>
            <button type="button" class="prompt-copy-btn" onclick="window.copyPromptFromElement(this, '${promptId}')">
              <svg viewBox="0 0 16 16" fill="none" style="width:13px;height:13px"><rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 11V3.5C3 2.67 3.67 2 4.5 2H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              <span>Copy Prompt</span>
            </button>
          </div>
          <pre id="${promptId}" class="prompt-code-text">${item.examplePrompt || ''}</pre>
        </div>

        <div class="case-study-why-works-box">
          <div class="why-works-title">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;color:#22c55e"><path d="M3 8.5L6.5 12L13 4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Why It Works
          </div>
          <p class="why-works-text">${item.whyItWorks || ''}</p>
        </div>
      `;
    }

    // Helper: Render Framework Card
    function renderFrameworkCard(fw, prefix) {
      var promptId = 'prompt-' + prefix + '-' + fw.id;
      return `
        <div class="prompt-framework-card" id="${prefix}-fw-${fw.id}">
          <div class="framework-header">
            <div class="framework-header-left">
              <span class="framework-num-pill">${fw.num}</span>
              <h4 class="framework-card-title">${fw.title}</h4>
            </div>
            <span class="modal-badge concept">${fw.category}</span>
          </div>

          <div class="framework-formula-box">
            <div class="framework-formula-label">Modular Syntactic Formula:</div>
            <div class="framework-formula-content">${fw.formula}</div>
          </div>

          <div class="prompt-code-box">
            <div class="prompt-code-header">
              <span class="prompt-code-label">
                <svg viewBox="0 0 16 16" fill="currentColor" style="width:13px;height:13px;color:var(--accent-cyan)"><circle cx="8" cy="8" r="4"/></svg>
                Production Master Prompt
              </span>
              <button type="button" class="prompt-copy-btn" onclick="window.copyPromptFromElement(this, '${promptId}')">
                <svg viewBox="0 0 16 16" fill="none" style="width:13px;height:13px"><rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 11V3.5C3 2.67 3.67 2 4.5 2H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                <span>Copy Prompt</span>
              </button>
            </div>
            <pre id="${promptId}" class="prompt-code-text">${fw.prompt}</pre>
          </div>

          <div class="framework-rationale-box">
            <div class="rationale-label">
              <svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px"><circle cx="8" cy="8" r="3.5"/></svg>
              Component Breakdown &amp; Rationale
            </div>
            <p class="rationale-text">${fw.explanation}</p>
          </div>

          <div class="framework-comparison-box">
            <div class="framework-comp-left">
              <div class="framework-thumb-pair">
                <img src="${fw.comparison.beforeImg}" alt="Before" class="framework-thumb" loading="lazy">
                <span class="framework-thumb-arrow">→</span>
                <img src="${fw.comparison.afterImg}" alt="After" class="framework-thumb" loading="lazy">
              </div>
              <div class="framework-comp-info">
                <span class="framework-comp-title">${fw.comparison.title}</span>
                <span class="framework-comp-linked"><strong>Connected Project:</strong> ${fw.linkedProject}</span>
                <span class="framework-comp-note">${fw.comparison.note}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // ------------------------------------------------------------------------
    // VIEW 1: DEDICATED CASE STUDY BREAKDOWN
    // ------------------------------------------------------------------------
    if (activeView === 'case-study-detail') {
      var cs = caseStudies.find(function(item) { return item.id === activeItemId; }) || caseStudies[0];
      if (!cs) return buildVisualLabHtml(data, 'all', null);

      var csIndex = caseStudies.findIndex(function(item) { return item.id === cs.id; });
      var prevCs = csIndex > 0 ? caseStudies[csIndex - 1] : null;
      var nextCs = csIndex < caseStudies.length - 1 ? caseStudies[csIndex + 1] : null;

      return `
        <div class="visual-lab-view">
          <div class="golu-breadcrumb-bar">
            <button type="button" class="golu-back-btn" onclick="window.showVisualLabView('case-studies')" aria-label="Back to All Case Studies">
              <svg viewBox="0 0 16 16" fill="none" style="width:14px;height:14px"><path d="M10 13L5 8L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Back to Case Studies</span>
            </button>
            <div class="golu-breadcrumb-trail">
              <span>AI Visual Lab</span>
              <span class="sep">/</span>
              <span>Case Studies</span>
              <span class="sep">/</span>
              <span class="current">${cs.title}</span>
            </div>
          </div>

          <div class="golu-case-study-header">
            <div class="golu-badge-group">
              <span class="modal-badge demo">CASE STUDY ${cs.num}</span>
              <span class="modal-badge concept">${cs.badge}</span>
              <span class="modal-badge verified">${cs.tags[0] || 'TRANSFORMATION'}</span>
            </div>
            <h3 class="golu-case-study-title">${cs.title}</h3>
            <div class="golu-case-study-meta">
              <span class="golu-meta-pill"><strong>Source Plate:</strong> ${cs.beforeDims}</span>
              <span class="golu-meta-pill"><strong>Master Plate:</strong> ${cs.afterDims}</span>
              <span class="golu-meta-pill"><strong>Framework:</strong> ${cs.linkedFramework}</span>
            </div>
          </div>

          <!-- Interactive Comparison Slider -->
          <div class="modal-section" style="margin-top:0">
            <div class="modal-section-title">Interactive Before-and-After Comparison Slider</div>
            ${renderVisualLabSlider('slider-detail-' + cs.id, cs.beforeImg, cs.afterImg, 'ORIGINAL CAPTURE (BEFORE)', 'AI SYNTHESIS (AFTER)', cs.aspectRatio === 'cover')}
          </div>

          <!-- Dual-Plate Uncropped Inspection -->
          <div class="modal-section">
            <div class="modal-section-title">Dual-Plate Uncropped Inspection</div>
            <div class="dual-plate-grid">
              <div class="dual-plate-card">
                <img src="${cs.beforeImg}" alt="Before Plate — ${cs.title}" loading="lazy">
                <div class="dual-plate-meta">
                  <span><strong>BEFORE:</strong> Original Capture</span>
                  <span>${cs.beforeDims}</span>
                </div>
              </div>
              <div class="dual-plate-card">
                <img src="${cs.afterImg}" alt="After Plate — ${cs.title}" loading="lazy">
                <div class="dual-plate-meta">
                  <span><strong>AFTER:</strong> AI Synthesized Master</span>
                  <span>${cs.afterDims}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Recruiter & Creative Director Structured Breakdown -->
          <div class="modal-section">
            <div class="modal-section-title">Creative Direction &amp; Prompt Architecture</div>
            ${renderRecruiterBreakdown(cs, 'prompt-detail-' + cs.id)}
          </div>

          <!-- Navigation Prev/Next -->
          <div class="modal-section" style="padding-top:1rem;border-top:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
            ${prevCs ? `
              <button type="button" class="golu-action-btn secondary" onclick="window.showVisualLabView('case-study-detail', '${prevCs.id}')">
                <svg viewBox="0 0 16 16" fill="none"><path d="M11 3L5 8L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>Previous: ${prevCs.title}</span>
              </button>
            ` : '<div></div>'}
            ${nextCs ? `
              <button type="button" class="golu-action-btn primary" onclick="window.showVisualLabView('case-study-detail', '${nextCs.id}')">
                <span>Next: ${nextCs.title}</span>
                <svg viewBox="0 0 16 16" fill="none"><path d="M5 3L11 8L5 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            ` : '<div></div>'}
          </div>
        </div>
      `;
    }

    // ------------------------------------------------------------------------
    // VIEW 2: AI BRAND CONCEPTS (PERFUME COMMERCIAL)
    // ------------------------------------------------------------------------
    if (activeView === 'brand-concepts') {
      return `
        <div class="visual-lab-view">
          <div class="golu-breadcrumb-bar">
            <button type="button" class="golu-back-btn" onclick="window.showVisualLabView('all')" aria-label="Back to All Visual Lab">
              <svg viewBox="0 0 16 16" fill="none" style="width:14px;height:14px"><path d="M10 13L5 8L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Back to Overview</span>
            </button>
            <div class="golu-breadcrumb-trail">
              <span>AI Visual Lab</span>
              <span class="sep">/</span>
              <span>AI Brand Concepts</span>
              <span class="sep">/</span>
              <span class="current">Perfume Commercial</span>
            </div>
          </div>

          <div class="golu-case-study-header">
            <div class="golu-badge-group">
              <span class="modal-badge demo">SELF-INITIATED CONCEPT ADVERTISEMENT</span>
              <span class="modal-badge concept">AI BRAND CONCEPTS</span>
              <span class="modal-badge verified">PRODUCT ADVERTISING</span>
            </div>
            <h3 class="golu-case-study-title">${brand.title}</h3>
            <div class="golu-case-study-meta">
              <span class="golu-meta-pill"><strong>Brand Reference:</strong> ${brand.brandReference}</span>
              <span class="golu-meta-pill"><strong>Core Discipline:</strong> ${brand.coreDiscipline}</span>
              <span class="golu-meta-pill"><strong>Headline:</strong> "${brand.headline}"</span>
            </div>
            <div class="modal-disclaimer-box" style="margin:1rem 0">
              <svg class="modal-disclaimer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              <div><strong>Notice:</strong> ${brand.disclaimer}</div>
            </div>
          </div>

          <!-- Interactive Comparison Slider -->
          <div class="modal-section" style="margin-top:0">
            <div class="modal-section-title">Interactive Before-and-After Comparison Slider</div>
            ${renderVisualLabSlider('slider-brand-perfume', brand.beforeImg, brand.afterImg, 'ORIGINAL PRODUCT PHOTO (BEFORE)', 'FINISHED ADVERTISEMENT (AFTER)', false)}
          </div>

          <!-- Dual-Plate Uncropped Inspection -->
          <div class="modal-section">
            <div class="modal-section-title">Dual-Plate Uncropped Comparison</div>
            <div class="dual-plate-grid">
              <div class="dual-plate-card">
                <img src="${brand.beforeImg}" alt="Before — Original Perfume Reference" loading="lazy">
                <div class="dual-plate-meta">
                  <span><strong>BEFORE:</strong> Flat-lay product snapshot</span>
                  <span>${brand.beforeDims}</span>
                </div>
              </div>
              <div class="dual-plate-card">
                <img src="${brand.afterImg}" alt="After — Finished Perfume Commercial" loading="lazy">
                <div class="dual-plate-meta">
                  <span><strong>AFTER:</strong> Finished luxury advertisement</span>
                  <span>${brand.afterDims}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Structured Recruiter Breakdown -->
          <div class="modal-section">
            <div class="modal-section-title">Commercial Strategy &amp; Prompt Architecture</div>
            ${renderRecruiterBreakdown(brand, 'prompt-brand-perfume')}
          </div>

          <!-- Key Variables Grid -->
          <div class="modal-section">
            <div class="modal-section-title">Key Photographic &amp; Prompt Variables</div>
            <div class="variables-grid">
              ${(brand.keyVariables || []).map(function(v) {
                return `
                  <div class="variable-card">
                    <div class="variable-name">
                      <svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px;color:var(--accent-cyan)"><circle cx="8" cy="8" r="3.5"/></svg>
                      ${v.name}
                    </div>
                    <p class="variable-desc">${v.desc}</p>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    }

    // ------------------------------------------------------------------------
    // VIEW 3: PROMPT ENGINEERING FRAMEWORKS ONLY
    // ------------------------------------------------------------------------
    if (activeView === 'frameworks') {
      return `
        <div class="visual-lab-view">
          <div class="golu-breadcrumb-bar">
            <button type="button" class="golu-back-btn" onclick="window.showVisualLabView('all')" aria-label="Back to Overview">
              <svg viewBox="0 0 16 16" fill="none" style="width:14px;height:14px"><path d="M10 13L5 8L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Back to Overview</span>
            </button>
            <div class="golu-breadcrumb-trail">
              <span>AI Visual Lab</span>
              <span class="sep">/</span>
              <span class="current">9 Prompt Engineering Frameworks</span>
            </div>
          </div>

          <div class="golu-case-study-header">
            <div class="golu-badge-group">
              <span class="modal-badge concept">PROMPT ARCHITECTURE</span>
              <span class="modal-badge verified">9 PRODUCTION DISCIPLINES</span>
              <span class="modal-badge demo">FORMULAS &amp; REAL-WORLD PROMPTS</span>
            </div>
            <h3 class="golu-case-study-title">Inside My AI Prompting Process</h3>
            <p style="color:#cbd5e1;font-size:0.92rem;line-height:1.65;margin:0 0 1.2rem">
              9 repeatable, formula-based prompt architectures demonstrating precise creative control across cinematic lighting, physical volumetrics, character integration, and commercial still life.
            </p>
          </div>

          <div class="frameworks-grid">
            ${frameworks.map(function(fw) {
              return renderFrameworkCard(fw, 'view');
            }).join('')}
          </div>
        </div>
      `;
    }

    // ------------------------------------------------------------------------
    // VIEW 4: ALL 6 CASE STUDIES ONLY
    // ------------------------------------------------------------------------
    if (activeView === 'case-studies') {
      return `
        <div class="visual-lab-view">
          <div class="golu-breadcrumb-bar">
            <button type="button" class="golu-back-btn" onclick="window.showVisualLabView('all')" aria-label="Back to Overview">
              <svg viewBox="0 0 16 16" fill="none" style="width:14px;height:14px"><path d="M10 13L5 8L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Back to Overview</span>
            </button>
            <div class="golu-breadcrumb-trail">
              <span>AI Visual Lab</span>
              <span class="sep">/</span>
              <span class="current">6 Before-and-After Case Studies</span>
            </div>
          </div>

          <div class="golu-case-study-header">
            <div class="golu-badge-group">
              <span class="modal-badge concept">TRANSFORMATIONS</span>
              <span class="modal-badge verified">6 CURATED STUDIES</span>
              <span class="modal-badge demo">INTERACTIVE COMPARISON SLIDERS</span>
            </div>
            <h3 class="golu-case-study-title">The Six Before-and-After Case Studies</h3>
            <p style="color:#cbd5e1;font-size:0.92rem;line-height:1.65;margin:0 0 1.2rem">
              Each transformation pairs an authentic captured source plate with an AI cinematic synthesis. Drag the interactive comparison handle or inspect uncropped source dimensions.
            </p>
          </div>

          <div class="case-studies-grid">
            ${caseStudies.map(function(cs) {
              return `
                <div class="case-study-card" id="cs-${cs.id}">
                  <div class="case-study-card-header">
                    <div>
                      <span class="modal-badge demo">STUDY ${cs.num}</span>
                      <h4 class="case-study-card-title">${cs.title}</h4>
                      <div class="case-study-meta-pills">
                        ${cs.tags.map(function(tag) { return `<span class="case-study-meta-pill">${tag}</span>`; }).join('')}
                      </div>
                    </div>
                    <button type="button" class="golu-action-btn secondary" onclick="window.showVisualLabView('case-study-detail', '${cs.id}')">
                      <span>Full Case Study</span>
                      <svg viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                  </div>

                  ${renderVisualLabSlider('slider-list-' + cs.id, cs.beforeImg, cs.afterImg, 'ORIGINAL CAPTURE (BEFORE)', 'AI SYNTHESIS (AFTER)', cs.aspectRatio === 'cover')}

                  <div class="dual-plate-container">
                    <div class="dual-plate-title">
                      <svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px;color:var(--accent-cyan)"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
                      Dual-Plate Uncropped Inspection
                    </div>
                    <div class="dual-plate-grid">
                      <div class="dual-plate-card">
                        <img src="${cs.beforeImg}" alt="Before — ${cs.title}" loading="lazy">
                        <div class="dual-plate-meta">
                          <span><strong>BEFORE:</strong> ${cs.beforeDims}</span>
                        </div>
                      </div>
                      <div class="dual-plate-card">
                        <img src="${cs.afterImg}" alt="After — ${cs.title}" loading="lazy">
                        <div class="dual-plate-meta">
                          <span><strong>AFTER:</strong> ${cs.afterDims}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  ${renderRecruiterBreakdown(cs, 'prompt-cs-' + cs.id)}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // ------------------------------------------------------------------------
    // DEFAULT VIEW: ALL OVERVIEW
    // ------------------------------------------------------------------------
    return `
      <div class="visual-lab-view">
        <!-- Overview Header & Lead -->
        <div class="golu-case-study-header">
          <div class="golu-badge-group">
            <span class="modal-badge concept">PROJECT 05</span>
            <span class="modal-badge verified">AI VISUAL LAB</span>
            <span class="modal-badge planned">CHROMA &amp; LIGHTING RESEARCH</span>
          </div>
          <h3 class="golu-case-study-title">${data.title}</h3>
          <div style="font-size:0.95rem;color:var(--accent-cyan);font-weight:700;margin-bottom:0.6rem;letter-spacing:0.04em">
            ${data.subtitle}
          </div>
          <p style="color:#cbd5e1;font-size:0.92rem;line-height:1.65;margin:0">
            ${data.leadText}
          </p>
        </div>

        <!-- Navigation Filter Pills -->
        <div class="visual-lab-nav-pills">
          <button type="button" class="visual-lab-pill active" onclick="window.showVisualLabView('all')">
            <span>★ All Overview</span>
          </button>
          <button type="button" class="visual-lab-pill" onclick="window.showVisualLabView('case-studies')">
            <span>🔄 6 Before &amp; After Case Studies</span>
          </button>
          <button type="button" class="visual-lab-pill" onclick="window.showVisualLabView('brand-concepts')">
            <span>💎 AI Brand Concepts (Perfume Ad)</span>
          </button>
          <button type="button" class="visual-lab-pill" onclick="window.showVisualLabView('frameworks')">
            <span>🧠 Inside My AI Prompting Process (9 Frameworks)</span>
          </button>
        </div>

        <!-- SECTION 1: AI Brand Concepts — Luxury Perfume Advertisement -->
        <div class="modal-section" style="margin-top:0">
          <div class="modal-section-title">
            <span>Collection A • AI Brand Concepts</span>
          </div>
          <div class="visual-brand-card">
            <div class="visual-brand-header">
              <div class="visual-brand-headline-badge">
                <svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px"><circle cx="8" cy="8" r="4"/></svg>
                ${brand.label}
              </div>
              <h4 class="visual-brand-title">${brand.title}</h4>
              <div class="visual-brand-meta">
                <span><strong>Brand Reference:</strong> ${brand.brandReference}</span>
                <span>•</span>
                <span><strong>Discipline:</strong> ${brand.coreDiscipline}</span>
                <span>•</span>
                <span><strong>Headline:</strong> "${brand.headline}"</span>
              </div>
            </div>

            ${renderVisualLabSlider('slider-overview-perfume', brand.beforeImg, brand.afterImg, 'ORIGINAL PRODUCT PHOTO (BEFORE)', 'FINISHED ADVERTISEMENT (AFTER)', false)}

            <div class="dual-plate-container">
              <div class="dual-plate-title">
                <svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px;color:#eab308"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
                Dual-Plate Uncropped Inspection
              </div>
              <div class="dual-plate-grid">
                <div class="dual-plate-card">
                  <img src="${brand.beforeImg}" alt="Before — Original Perfume Reference" loading="lazy">
                  <div class="dual-plate-meta">
                    <span><strong>BEFORE:</strong> ${brand.beforeDims}</span>
                  </div>
                </div>
                <div class="dual-plate-card">
                  <img src="${brand.afterImg}" alt="After — Finished Perfume Commercial" loading="lazy">
                  <div class="dual-plate-meta">
                    <span><strong>AFTER:</strong> ${brand.afterDims}</span>
                  </div>
                </div>
              </div>
            </div>

            ${renderRecruiterBreakdown(brand, 'prompt-ov-brand')}

            <div class="variables-grid" style="margin-top:1rem">
              ${(brand.keyVariables || []).map(function(v) {
                return `
                  <div class="variable-card">
                    <div class="variable-name">
                      <svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px;color:var(--accent-cyan)"><circle cx="8" cy="8" r="3.5"/></svg>
                      ${v.name}
                    </div>
                    <p class="variable-desc">${v.desc}</p>
                  </div>
                `;
              }).join('')}
            </div>

            <div style="margin-top:1.2rem;text-align:right">
              <button type="button" class="golu-action-btn primary" onclick="window.showVisualLabView('brand-concepts')">
                <span>Explore Full Brand Concept</span>
                <svg viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- SECTION 2: The Six Interactive Before-and-After Case Studies -->
        <div class="modal-section">
          <div class="modal-section-title">
            <span>Collection B • The Six Before-and-After Case Studies</span>
          </div>
          <p style="color:#cbd5e1;font-size:0.9rem;line-height:1.6;margin-bottom:1.5rem">
            Explore 6 real-world before-and-after transformations with interactive comparison sliders. Drag the slider handle horizontally or choose 100% Before, 50/50 Split, and 100% After presets.
          </p>

          <div class="case-studies-grid">
            ${caseStudies.map(function(cs) {
              return `
                <div class="case-study-card" id="cs-card-${cs.id}">
                  <div class="case-study-card-header">
                    <div>
                      <span class="modal-badge demo">CASE STUDY ${cs.num}</span>
                      <h4 class="case-study-card-title">${cs.title}</h4>
                      <div class="case-study-meta-pills">
                        ${cs.tags.map(function(tag) { return `<span class="case-study-meta-pill">${tag}</span>`; }).join('')}
                      </div>
                    </div>
                    <button type="button" class="golu-action-btn secondary" onclick="window.showVisualLabView('case-study-detail', '${cs.id}')">
                      <span>Full Case Study</span>
                      <svg viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                  </div>

                  ${renderVisualLabSlider('slider-ov-' + cs.id, cs.beforeImg, cs.afterImg, 'ORIGINAL CAPTURE (BEFORE)', 'AI SYNTHESIS (AFTER)', cs.aspectRatio === 'cover')}

                  <div class="dual-plate-container">
                    <div class="dual-plate-title">
                      <svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px;color:var(--accent-cyan)"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
                      Dual-Plate Uncropped Inspection
                    </div>
                    <div class="dual-plate-grid">
                      <div class="dual-plate-card">
                        <img src="${cs.beforeImg}" alt="Before — ${cs.title}" loading="lazy">
                        <div class="dual-plate-meta">
                          <span><strong>BEFORE:</strong> ${cs.beforeDims}</span>
                        </div>
                      </div>
                      <div class="dual-plate-card">
                        <img src="${cs.afterImg}" alt="After — ${cs.title}" loading="lazy">
                        <div class="dual-plate-meta">
                          <span><strong>AFTER:</strong> ${cs.afterDims}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  ${renderRecruiterBreakdown(cs, 'prompt-ov-' + cs.id)}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- SECTION 3: Expandable Section: Inside My AI Prompting Process -->
        <div class="modal-section">
          <div class="modal-section-title">
            <span>Prompt Architecture &amp; Engineering</span>
          </div>

          <div class="expandable-frameworks-wrapper" id="prompting-process-section">
            <div class="frameworks-expandable-header" onclick="window.toggleFrameworksSection()">
              <div class="expandable-header-left">
                <div class="expandable-header-badge">
                  <svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px;color:var(--accent-cyan)"><circle cx="8" cy="8" r="4"/></svg>
                  SYSTEMATIC PROMPT ARCHITECTURE
                </div>
                <h3 class="expandable-section-title">Inside My AI Prompting Process</h3>
                <p class="expandable-section-subtitle">
                  9 repeatable, formula-based prompt architectures demonstrating precise creative control across cinematic lighting, physical volumetrics, character integration, and commercial still life.
                </p>
              </div>
              <button type="button" class="framework-toggle-btn" id="frameworks-toggle-btn" aria-expanded="false" onclick="event.stopPropagation(); window.toggleFrameworksSection();">
                <span class="toggle-text">Explore 9 Frameworks</span>
                <svg class="toggle-icon" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
            <div class="frameworks-expandable-content" id="frameworks-expandable-content" style="display:none;">
              <div class="frameworks-grid">
                ${frameworks.map(function(fw) {
                  return renderFrameworkCard(fw, 'exp');
                }).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 4: Computational Process Sequence -->
        <div class="modal-section">
          <div class="modal-section-title">Computational Transformation Sequence</div>
          <div class="modal-workflow-steps">
            ${workflow.map(function(w) {
              return `
                <div class="modal-workflow-step">
                  <div class="modal-workflow-num">${w.step}</div>
                  <div class="modal-workflow-title">${w.title}</div>
                  <div class="modal-workflow-desc">${w.desc}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Professional Comparative Notice -->
        <div class="modal-disclaimer-box info" style="margin-top:1.5rem">
          <svg class="modal-disclaimer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <div>
            <strong>Professional Note:</strong> ${data.comparativeNotice}
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // BUILDER: PROJECT 06 — SALES & ACCOUNT MANAGEMENT
  // ==========================================================================

  function buildSalesAccountHtml(data) {
    var impact = data.commercialImpact || [];
    var myCaptain = data.myCaptain || {};
    var accentureFlipkart = data.accentureFlipkart || {};
    var accentureMeta = data.accentureMeta || {};
    var caseStudy = data.caseStudy || {};
    var skills = data.skills || [];
    var timeline = data.timeline || [];

    return `
      <div class="sales-account-view">
        <!-- Overview Header & Lead -->
        <div class="golu-case-study-header">
          <div class="golu-badge-group">
            <span class="modal-badge concept">PROJECT 06</span>
            <span class="modal-badge verified">SALES &amp; ACCOUNT MANAGEMENT</span>
            <span class="modal-badge demo">COMMERCIAL EXPERIENCE</span>
          </div>
          <h3 class="golu-case-study-title">${data.title}</h3>
          <div class="sales-subtitle">${data.subtitle}</div>
          <p class="sales-lead-text">${data.leadText}</p>
        </div>

        <!-- SECTION 1: Commercial Impact KPI Overview -->
        <div class="modal-section" style="margin-top:0">
          <div class="modal-section-title">Commercial Impact &amp; Multi-Account Overview</div>
          <div class="sales-kpi-grid">
            ${impact.map(function(kpi) {
              return `
                <div class="sales-kpi-card">
                  <div class="sales-kpi-val">${kpi.val}</div>
                  <div class="sales-kpi-lbl">${kpi.lbl}</div>
                  <div class="sales-kpi-ctx">${kpi.ctx}</div>
                  <p class="sales-kpi-desc">${kpi.desc}</p>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Scope Distinction Note -->
          <div class="sales-scope-banner">
            <svg class="modal-disclaimer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <div>${data.scopeDistinctionNote}</div>
          </div>
        </div>

        <!-- SECTION 2: Part 1 • Sales Experience Supporting Marketing — MyCaptain -->
        <div class="modal-section">
          <div class="modal-section-title">
            <span>Part 1 • Sales Experience Supporting Marketing — MyCaptain</span>
          </div>

          <div class="sales-experience-card">
            <div class="sales-experience-header">
              <div class="sales-exp-title-group">
                <span class="modal-badge demo">${myCaptain.period}</span>
                <span class="modal-badge concept">${myCaptain.employer}</span>
                <h4 class="sales-exp-org">${myCaptain.role}</h4>
              </div>
              <div class="sales-exp-headline">${myCaptain.headline}</div>
            </div>

            <div class="sales-narrative-box">
              <p class="sales-narrative-text">${myCaptain.synthesis}</p>
            </div>

            <div class="sales-highlights-grid">
              ${(myCaptain.highlights || []).map(function(h) {
                return `
                  <div class="sales-highlight-tile">
                    <div class="sales-hl-val">${h.val}</div>
                    <div class="sales-hl-lbl">${h.lbl}</div>
                    <p class="sales-hl-desc">${h.desc}</p>
                  </div>
                `;
              }).join('')}
            </div>

            <div class="sales-responsibilities-box">
              <div class="sales-sub-title">Sales Methodology &amp; Lead Conversion Responsibilities</div>
              <div class="sales-responsibilities-grid">
                ${(myCaptain.responsibilities || []).map(function(r) {
                  return `
                    <div class="sales-resp-card">
                      <div class="sales-resp-title">
                        <svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px;color:var(--accent-cyan)"><circle cx="8" cy="8" r="3.5"/></svg>
                        ${r.title}
                      </div>
                      <p class="sales-resp-desc">${r.desc}</p>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 3: Part 2 • Seller Account Management — Flipkart Ads (Accenture) -->
        <div class="modal-section">
          <div class="modal-section-title">
            <span>Part 2 • Seller Account Management — Flipkart Ads (Accenture)</span>
          </div>

          <div class="sales-experience-card">
            <div class="sales-experience-header">
              <div class="sales-exp-title-group">
                <span class="modal-badge verified">110+ SELLER ACCOUNTS / MO</span>
                <span class="modal-badge concept">FLIPKART ADS</span>
                <h4 class="sales-exp-org">${accentureFlipkart.role}</h4>
                <div class="sales-exp-role">${accentureFlipkart.project} — ${accentureFlipkart.employer}</div>
              </div>
              <div class="sales-exp-headline">${accentureFlipkart.headline}</div>
            </div>

            <div class="sales-narrative-box">
              <p class="sales-narrative-text">${accentureFlipkart.synthesis}</p>
            </div>

            <div class="sales-highlights-grid">
              ${(accentureFlipkart.highlights || []).map(function(h) {
                return `
                  <div class="sales-highlight-tile">
                    <div class="sales-hl-val">${h.val}</div>
                    <div class="sales-hl-lbl">${h.lbl}</div>
                    <p class="sales-hl-desc">${h.desc}</p>
                  </div>
                `;
              }).join('')}
            </div>

            <div class="sales-responsibilities-box">
              <div class="sales-sub-title">Seller Relationship Management &amp; Advertising Portal Support</div>
              <div class="sales-responsibilities-grid">
                ${(accentureFlipkart.responsibilities || []).map(function(r) {
                  return `
                    <div class="sales-resp-card">
                      <div class="sales-resp-title">
                        <svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px;color:#a855f7"><circle cx="8" cy="8" r="3.5"/></svg>
                        ${r.title}
                      </div>
                      <p class="sales-resp-desc">${r.desc}</p>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 4: Part 3 • Client & Account Management — Meta Ads (Accenture) -->
        <div class="modal-section">
          <div class="modal-section-title">
            <span>Part 3 • Client &amp; Account Management — Meta Ads (Accenture)</span>
          </div>

          <div class="sales-experience-card">
            <div class="sales-experience-header">
              <div class="sales-exp-title-group">
                <span class="modal-badge verified">35+ ACCOUNTS MANAGED</span>
                <span class="modal-badge concept">FACEBOOK &amp; INSTAGRAM</span>
                <h4 class="sales-exp-org">${accentureMeta.role}</h4>
                <div class="sales-exp-role">${accentureMeta.project} — ${accentureMeta.employer}</div>
              </div>
              <div class="sales-exp-headline">${accentureMeta.headline}</div>
            </div>

            <div class="sales-narrative-box" style="border-left-color:#38bdf8">
              <p class="sales-narrative-text">${accentureMeta.synthesis}</p>
            </div>

            <div class="sales-highlights-grid">
              ${(accentureMeta.highlights || []).map(function(h) {
                return `
                  <div class="sales-highlight-tile">
                    <div class="sales-hl-val">${h.val}</div>
                    <div class="sales-hl-lbl" style="color:#38bdf8">${h.lbl}</div>
                    <p class="sales-hl-desc">${h.desc}</p>
                  </div>
                `;
              }).join('')}
            </div>

            <div class="sales-responsibilities-box">
              <div class="sales-sub-title">Meta Ads Optimization, Reporting &amp; Client Account Management</div>
              <div class="sales-responsibilities-grid">
                ${(accentureMeta.responsibilities || []).map(function(r) {
                  return `
                    <div class="sales-resp-card">
                      <div class="sales-resp-title">
                        <svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px;color:#38bdf8"><circle cx="8" cy="8" r="3.5"/></svg>
                        ${r.title}
                      </div>
                      <p class="sales-resp-desc">${r.desc}</p>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 5: Part 4 • Campaign Performance Case Study (Whey Protein) -->
        <div class="modal-section">
          <div class="modal-section-title">
            <span>Part 4 • Marketplace Advertising Performance — Whey Protein</span>
          </div>

          <div class="sales-case-study-card">
            <div class="sales-case-study-header">
              <div class="sales-badge-row">
                <span class="modal-badge demo">${caseStudy.badge}</span>
                <span class="modal-badge concept">${caseStudy.category}</span>
              </div>
              <h4 class="sales-cs-title">${caseStudy.title}</h4>
              <p class="sales-cs-objective">${caseStudy.objective}</p>
            </div>

            <!-- Metrics Grid -->
            <div class="sales-metrics-table-grid">
              ${(caseStudy.metrics || []).map(function(m) {
                return `
                  <div class="sales-metric-tile">
                    <div class="sales-tile-val">${m.val}</div>
                    <div class="sales-tile-lbl">${m.lbl}</div>
                    <div class="sales-tile-note">${m.note}</div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Business Metric Definitions & Explanations -->
            <div class="sales-metric-explanations">
              <div class="sales-sub-title">Business Metric Definitions &amp; Methodology</div>
              <div class="sales-explanations-grid">
                ${(caseStudy.metricExplanations || []).map(function(e) {
                  return `
                    <div class="sales-explanation-item">
                      <div class="sales-explanation-name">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;color:var(--accent-cyan)"><polyline points="3 8 7 12 13 4"></polyline></svg>
                        ${e.name}
                      </div>
                      <p class="sales-explanation-desc">${e.desc}</p>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Interpretation Box -->
            <div class="sales-interpretation-box">
              <div class="sales-interp-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:#22c55e"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                Efficiency &amp; Media Investment Analysis
              </div>
              <p class="sales-interp-text">${caseStudy.interpretation}</p>
            </div>

            <!-- Notice -->
            <div class="modal-disclaimer-box" style="margin-top:1.1rem">
              <svg class="modal-disclaimer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              <div>${caseStudy.disclaimer}</div>
            </div>
          </div>
        </div>

        <!-- SECTION 6: Part 5 • Commercial & Account Management Capabilities -->
        <div class="modal-section">
          <div class="modal-section-title">Part 5 • Commercial &amp; Account Management Capabilities</div>
          <p style="color:#cbd5e1;font-size:0.9rem;line-height:1.6;margin-bottom:1.4rem">
            Commercial capabilities developed across customer conversion at MyCaptain, marketplace seller account stewardship on Flipkart Ads, and client account management on Meta Ads.
          </p>

          <div class="sales-skills-grid">
            ${skills.map(function(group) {
              return `
                <div class="sales-skill-group-card">
                  <div class="sales-skill-group-header">
                    <svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px;color:var(--accent-cyan)"><circle cx="8" cy="8" r="4"/></svg>
                    <h5>${group.group}</h5>
                  </div>
                  <ul class="sales-skill-tags-list">
                    ${group.items.map(function(skill) {
                      return `<li class="sales-skill-tag">${skill}</li>`;
                    }).join('')}
                  </ul>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- SECTION 7: Part 6 • Professional Experience Timeline -->
        <div class="modal-section">
          <div class="modal-section-title">Part 6 • Professional Experience Timeline</div>
          <div class="sales-timeline-container">
            ${timeline.map(function(t, idx) {
              var badgeClass = idx === 0 ? 'demo' : 'verified';
              return `
                <div class="sales-timeline-item">
                  <div class="sales-timeline-dot">
                    <span class="timeline-dot-inner"></span>
                  </div>
                  <div class="sales-timeline-content">
                    <div class="sales-timeline-badge-row">
                      <span class="modal-badge ${badgeClass}">${t.period}</span>
                      <span class="modal-badge concept">${t.org}</span>
                    </div>
                    <h4 class="sales-timeline-role">${t.role}</h4>
                    <div class="sales-timeline-focus"><strong>Core Focus:</strong> ${t.focus}</div>
                    <ul class="sales-timeline-bullets">
                      ${t.bullets.map(function(b) {
                        return `<li>${b}</li>`;
                      }).join('')}
                    </ul>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- SECTION 8: Professional Governance Notice -->
        <div class="modal-disclaimer-box info" style="margin-top:1.5rem">
          <svg class="modal-disclaimer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <div>
            <strong>Professional Note:</strong> ${data.governanceNotice}
          </div>
        </div>
      </div>
    `;
  }

  function buildProjectModalHtml(data) {
    if (data.isSalesAccount) {
      return buildSalesAccountHtml(data);
    }
    if (data.isGoluUniverse) {
      return buildGoluUniverseHtml(data, currentGoluView, currentGoluProjectId);
    }
    if (data.isMusicStudio) {
      return buildMusicStudioHtml(data, currentMusicView, currentMusicTrackId);
    }
    if (data.isBhaktiContent) {
      return buildBhaktiContentHtml(data, currentBhaktiView, currentBhaktiVideoId);
    }
    if (data.isVisualLab) {
      return buildVisualLabHtml(data, currentVisualLabView, currentVisualLabItemId);
    }

    let html = `<p class="modal-lead-text">${data.leadText}</p>`;

    // 0. In-Depth Notion Case Studies (Project 01)
    if (data.notionCaseStudies) {
      html += `
        <div class="modal-section">
          <div class="modal-section-title">In-Depth Notion Case Studies</div>
          <div class="modal-case-studies-grid">
            ${data.notionCaseStudies.map(cs => `
              <div class="modal-case-study-card">
                <div class="modal-case-study-header">
                  <span class="modal-badge verified">${cs.badge}</span>
                  <span class="modal-case-study-timeline">${cs.timeline}</span>
                </div>
                <h4 class="modal-case-study-title">${cs.title}</h4>
                <p class="modal-case-study-desc">${cs.desc}</p>
                
                <div class="modal-case-study-metrics">
                  ${cs.metrics.map(m => `
                    <div class="modal-cs-metric-pill">
                      <span class="modal-cs-metric-val">${m.val}</span>
                      <span class="modal-cs-metric-lbl">${m.lbl}</span>
                    </div>
                  `).join('')}
                </div>

                <div class="modal-cs-phases">
                  <div class="modal-cs-phases-title">Timeline &amp; Execution Breakdown</div>
                  <ul class="modal-list" style="margin:0;padding-left:1.1rem">
                    ${cs.phases.map(p => `<li><strong>${p.phase}:</strong> ${p.detail}</li>`).join('')}
                  </ul>
                </div>

                <div class="modal-case-study-cta">
                  <a href="${cs.url}" target="_blank" rel="noopener noreferrer" class="case-study-link-btn">
                    <span>View Full Case Study</span>
                    <svg viewBox="0 0 16 16" fill="none" style="width:14px;height:14px"><path d="M3 13L13 3M13 3H6M13 3V10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 1. Platform Expertise (Project 01)
    if (data.platforms) {
      html += `
        <div class="modal-section">
          <div class="modal-section-title">Platform Expertise</div>
          <div class="modal-platform-grid">
            ${data.platforms.map(p => `
              <div class="modal-platform-card">
                <h4>
                  <svg viewBox="0 0 16 16" fill="currentColor" style="width:14px;height:14px;color:var(--accent-cyan)"><circle cx="8" cy="8" r="4"/></svg>
                  ${p.name}
                </h4>
                <p>${p.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 2. AI-Assisted Workflows (Project 01)
    if (data.aiWorkflows) {
      html += `
        <div class="modal-section">
          <div class="modal-section-title">AI-Assisted Marketing Capabilities</div>
          <div class="modal-capabilities-grid">
            ${data.aiWorkflows.map(ai => `
              <div class="modal-platform-card">
                <h4>
                  <svg viewBox="0 0 16 16" fill="currentColor" style="width:14px;height:14px;color:var(--accent-cyan)"><circle cx="8" cy="8" r="4"/></svg>
                  ${ai.title}
                </h4>
                <p>${ai.desc}</p>
              </div>
            `).join('')}
          </div>

          ${data.aiCreativeExamples ? `
            <div class="modal-creative-examples-subsection">
              <div class="modal-subheading-group">
                <h5 class="modal-subheading">${data.aiCreativeExamples.heading}</h5>
                <p class="modal-subheading-desc">${data.aiCreativeExamples.description}</p>
              </div>
              <div class="modal-creative-examples-grid">
                ${data.aiCreativeExamples.items.map(item => {
                  if (item.type === 'video') {
                    const currentV = (item.videos && item.videos[0]) || item;
                    return `
                      <div class="modal-creative-example-card" id="${item.id}">
                        <div class="example-media-container video-container" id="ad-creative-video-container">
                          <video id="creative-video-player" controls playsinline webkit-playsinline preload="metadata" poster="${currentV.posterSrc}" class="example-media-video">
                            <source src="${currentV.videoSrc}" type="video/mp4">
                            ${currentV.fallbackSrc ? `<source src="${currentV.fallbackSrc}" type="video/mp4">` : ''}
                            Your browser does not support HTML5 video.
                          </video>
                          <span class="example-tag" id="creative-video-tag">${currentV.tag || item.tag}</span>
                        </div>
                        <div class="example-content">
                          <h6 class="example-title">${item.title}</h6>
                          <p class="example-oneliner" id="creative-video-desc">${item.oneLiner}</p>
                          <div class="example-switcher-row">
                            ${item.videos && item.videos.length > 1 ? `
                              <button type="button" class="example-cycle-btn" onclick="window.cycleCreativeVideo(event)">
                                <svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-7.068 2H.534a.25.25 0 0 1-.192-.41l1.966-2.36a.25.25 0 0 1 .384 0l1.966 2.36a.25.25 0 0 1-.192.41z"/></svg>
                                <span id="creative-video-cycle-label">Next Video (1 of ${item.videos.length}) ↻</span>
                              </button>
                            ` : `
                              <button type="button" class="example-cycle-btn inline-play-btn" onclick="window.cycleCreativeVideo(event)">
                                <svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px;color:var(--accent-cyan)"><polygon points="4,2 14,8 4,14"/></svg>
                                <span id="creative-video-cycle-label">Play Complan Spec Ad (0:30)</span>
                              </button>
                            `}
                          </div>
                          <div class="example-ad-application">
                            <strong>Advertising Application:</strong> ${item.adApplication}
                          </div>
                          ${item.disclaimer ? `
                            <div class="example-disclaimer">
                              <svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px;flex-shrink:0"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 2.5a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8zm1 8.5H7V7h2v5z"/></svg>
                              <span>${item.disclaimer}</span>
                            </div>
                          ` : ''}
                        </div>
                      </div>
                    `;
                  }

                  if (item.type === 'audio') {
                    const trackCount = (item.tracks && item.tracks.length) || 0;
                    const curIdx = trackCount > 0 ? (creativeAudioIndex % trackCount) : 0;
                    const currentT = trackCount > 0 ? item.tracks[curIdx] : {};
                    const nextIdx = trackCount > 0 ? ((curIdx + 1) % trackCount) : 0;
                    const nextT = trackCount > 0 ? item.tracks[nextIdx] : currentT;
                    return `
                      <div class="modal-creative-example-card" id="${item.id}">
                        <div class="example-media-container audio-embed-container" id="ad-creative-audio-container">
                          <iframe id="creative-audio-iframe" 
                            class="example-media-iframe" 
                            src="${currentT.embedUrl || 'https://www.youtube-nocookie.com/embed/JdY3cOjIFHg?rel=0'}" 
                            title="${currentT.title || 'Ze-Wa Music'}" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                          </iframe>
                          <span class="example-tag" id="creative-audio-tag">${currentT.tag || item.tag}</span>
                        </div>
                        <div class="example-content">
                          <h6 class="example-title">${item.title}</h6>
                          <p class="example-oneliner" id="creative-audio-desc">
                            <strong id="creative-audio-current-title" style="color:var(--text-white);display:block;margin-bottom:0.25rem">
                              ${currentT.title || 'Stay With Me Tonight (Official Music Video)'}
                            </strong>
                            ${item.oneLiner}
                          </p>
                          <div class="example-switcher-row">
                            <button type="button" class="example-cycle-btn" onclick="window.cycleCreativeAudioTrack(event)" title="Cycle to next music track within card">
                              <svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-7.068 2H.534a.25.25 0 0 1-.192-.41l1.966-2.36a.25.25 0 0 1 .384 0l1.966 2.36a.25.25 0 0 1-.192.41z"/></svg>
                              <span id="creative-audio-cycle-label">Next Track: ${nextT.title || 'Ze-Wa - SLOW'} ↻</span>
                            </button>
                          </div>
                          <div class="example-ad-application">
                            <strong>Advertising Application:</strong> ${item.adApplication}
                          </div>
                        </div>
                      </div>
                    `;
                  }

                  if (item.type === 'visual') {
                    const imgCount = (item.images && item.images.length) || 0;
                    const curImgIdx = imgCount > 0 ? (creativeVisualIndex % imgCount) : 0;
                    const currentImg = imgCount > 0 ? item.images[curImgIdx] : { src: item.imageSrc, alt: item.alt, caption: 'Directional Lighting Experiment', desc: item.oneLiner };
                    return `
                      <div class="modal-creative-example-card" id="${item.id}">
                        <div class="example-media-container visual-container" id="ad-creative-visual-container" onclick="window.openCreativeVisualLightbox(event)" title="Click to view full-size portrait in fullscreen overlay">
                          <img id="creative-visual-img" 
                            src="${currentImg.src}" 
                            alt="${currentImg.alt || currentImg.caption}" 
                            class="example-media-img" loading="lazy">
                          <button type="button" class="example-zoom-hint" onclick="window.openCreativeVisualLightbox(event)" title="Enlarge image to full screen" aria-label="Enlarge image to full screen">
                            <svg viewBox="0 0 16 16" fill="currentColor" style="width:11px;height:11px"><path d="M1.5 1a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0v-2.5h2.5a.5.5 0 0 0 0-1h-3zm13 0a.5.5 0 0 0-.5.5v2.5a.5.5 0 0 0 1 0v-3a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0 0 1h2.5zm-13 14a.5.5 0 0 0 .5-.5v-2.5a.5.5 0 0 0-1 0v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 0-1h-2.5zm13 0a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-1 0v2.5h-2.5a.5.5 0 0 0 0 1h3z"/></svg>
                            <span>Enlarge</span>
                          </button>
                          <span class="example-tag interactive-tag" id="creative-visual-tag">
                            ${imgCount > 0 ? `${curImgIdx + 1} / ${imgCount} • ${currentImg.tag || 'PORTRAIT STUDY'}` : item.tag}
                          </span>
                        </div>
                        <div class="example-content">
                          <h6 class="example-title">${item.title}</h6>
                          <p class="example-oneliner" id="creative-visual-desc">
                            <strong id="creative-visual-caption" style="color:var(--text-white);display:block;margin-bottom:0.25rem">
                              ${currentImg.caption}
                            </strong>
                            <span id="creative-visual-detail">${currentImg.desc}</span>
                          </p>
                          <div class="example-switcher-row">
                            <button type="button" class="example-cycle-btn" onclick="window.cycleCreativeVisualImage(event)" title="Cycle to next portrait transformation">
                              <svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-7.068 2H.534a.25.25 0 0 1-.192-.41l1.966-2.36a.25.25 0 0 1 .384 0l1.966 2.36a.25.25 0 0 1-.192.41z"/></svg>
                              <span id="creative-visual-cycle-label">Cycle Image (${imgCount > 0 ? curImgIdx + 1 : 1} of ${imgCount || 8}) ↻</span>
                            </button>
                            <button type="button" class="example-cycle-btn example-enlarge-btn" onclick="window.openCreativeVisualLightbox(event)" title="Enlarge currently displayed portrait to full screen">
                              <svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px"><path d="M1.5 1a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0v-2.5h2.5a.5.5 0 0 0 0-1h-3zm13 0a.5.5 0 0 0-.5.5v2.5a.5.5 0 0 0 1 0v-3a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0 0 1h2.5zm-13 14a.5.5 0 0 0 .5-.5v-2.5a.5.5 0 0 0-1 0v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 0-1h-2.5zm13 0a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-1 0v2.5h-2.5a.5.5 0 0 0 0 1h3z"/></svg>
                              <span>Enlarge ⛶</span>
                            </button>
                          </div>
                          <div class="example-ad-application">
                            <strong>Advertising Application:</strong> ${item.adApplication}
                          </div>
                        </div>
                      </div>
                    `;
                  }

                  return '';
                }).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    // 3. Verified Career Background (Projects 01, 06)
    if (data.experience) {
      html += `
        <div class="modal-section">
          <div class="modal-section-title">Professional Background &amp; Experience</div>
          <div class="modal-experience-cards">
            ${data.experience.map(exp => `
              <div class="modal-experience-card">
                <div class="modal-exp-header">
                  <div class="modal-workflow-num">${exp.org}</div>
                  ${exp.dates ? `
                    <div class="modal-exp-meta">
                      <span class="modal-exp-dates">${exp.dates}</span>
                      ${exp.location ? `<span class="modal-exp-loc">${exp.location}</span>` : ''}
                    </div>
                  ` : ''}
                </div>
                <div class="modal-workflow-title">${exp.role}</div>
                <div class="modal-workflow-desc">${exp.desc}</div>
                ${exp.bullets ? `<ul class="modal-list" style="margin-top:0.6rem">${exp.bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 4. Campaign / Sales / Creative Workflow (Projects 01, 03, 04, 05, 06)
    if (data.workflow) {
      html += `
        <div class="modal-section">
          <div class="modal-section-title">Workflow &amp; Strategic Sequence</div>
          <div class="modal-workflow-steps">
            ${data.workflow.map(w => `
              <div class="modal-workflow-step">
                <div class="modal-workflow-num">${w.step}</div>
                <div class="modal-workflow-title">${w.title}</div>
                <div class="modal-workflow-desc">${w.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 5. Core Competencies (Project 06)
    if (data.competencies) {
      html += `
        <div class="modal-section">
          <div class="modal-section-title">Sales &amp; Account Management Competencies</div>
          <div class="modal-platform-grid">
            ${data.competencies.map(c => `
              <div class="modal-platform-card">
                <h4>
                  <svg viewBox="0 0 16 16" fill="currentColor" style="width:14px;height:14px;color:var(--accent-cyan)"><circle cx="8" cy="8" r="4"/></svg>
                  ${c.title}
                </h4>
                <p>${c.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 9. Case Study (Projects 01, 06)
    if (data.caseStudy) {
      html += `
        <div class="modal-section">
          <span class="modal-badge demo">${data.caseStudy.badge}</span>
          <div class="modal-section-title" style="margin-top:0.4rem">${data.caseStudy.title}</div>
          <p style="color:#cbd5e1;font-size:0.9rem;line-height:1.6;margin-bottom:1.2rem">${data.caseStudy.desc}</p>
          <div class="modal-gallery-item" style="margin-bottom:0.5rem">
            <img src="${data.caseStudy.image}" alt="${data.caseStudy.alt}" loading="lazy" style="height:auto;max-height:280px;object-fit:contain;padding:1rem;background:#05070a">
            <div class="modal-gallery-caption">
              ${data.caseStudy.caption}
            </div>
          </div>
        </div>
      `;
    }

    // 10. Metric Definitions (Project 01)
    if (data.metrics) {
      html += `
        <div class="modal-section">
          <div class="modal-section-title">Key Performance &amp; Unit Economics Metrics</div>
          <div class="modal-metrics-grid">
            ${data.metrics.map(m => `
              <div class="modal-metric-card">
                <div class="modal-metric-header">
                  <span class="modal-metric-code">${m.code}</span>
                  <span class="modal-metric-name">${m.name}</span>
                </div>
                <p class="modal-metric-desc">${m.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 11. Track Gallery (Project 03)
    if (data.trackGallery) {
      html += `
        <div class="modal-section">
          <div class="modal-section-title">Generative Audio Track Concepts</div>
          <div class="modal-platform-grid">
            ${data.trackGallery.map(t => `
              <div class="modal-platform-card">
                <span class="modal-badge ${t.statusClass}" style="margin-bottom:0.4rem">${t.status}</span>
                <h4 style="margin-top:0.3rem">${t.title}</h4>
                <div style="font-size:0.75rem;color:var(--accent-cyan);letter-spacing:0.05em;margin-bottom:0.4rem">${t.genre}</div>
                <p>${t.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 12. Devotional Concepts & Cultural Authenticity (Project 04)
    if (data.culturalAuthenticity) {
      html += `
        <div class="modal-section">
          <div class="modal-section-title">Cultural Authenticity &amp; Design Philosophy</div>
          <p style="color:#e2e8f0;font-size:0.92rem;line-height:1.65;margin-bottom:1.2rem">${data.culturalAuthenticity}</p>
          <div class="modal-platform-grid">
            ${data.concepts.map(c => `
              <div class="modal-platform-card">
                <div style="font-size:0.75rem;color:var(--accent-cyan);font-weight:700;margin-bottom:0.3rem">${c.type}</div>
                <h4>${c.title}</h4>
                <p>${c.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 13. Artwork (Projects 03, 04)
    if (data.artwork) {
      html += `
        <div class="modal-section">
          <div class="modal-section-title">Visual Identity &amp; Spectrum Art</div>
          <div class="modal-gallery-item">
            <img src="${data.artwork.src}" alt="${data.artwork.alt}" loading="lazy" style="height:auto;max-height:260px;object-fit:contain;padding:1rem;background:#05070a">
            <div class="modal-gallery-caption">
              ${data.artwork.caption}
            </div>
          </div>
        </div>
      `;
    }

    // 14. Visual Gallery (Project 05)
    if (data.gallery) {
      html += `
        <div class="modal-section">
          <div class="modal-section-title">Visual Gallery &amp; Computational Studies</div>
          <div class="modal-gallery-grid">
            ${data.gallery.map(item => `
              <div class="modal-gallery-item">
                <img src="${item.src}" alt="${item.alt}" loading="lazy" style="height:260px;object-fit:cover">
                <div class="modal-gallery-caption">
                  <strong>${item.title}</strong>
                  ${item.caption}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 15. Process Sequence (Project 05)
    if (data.process) {
      html += `
        <div class="modal-section">
          <div class="modal-section-title">Computational Portraiture Process</div>
          <div class="modal-workflow-steps">
            ${data.process.map(p => `
              <div class="modal-workflow-step">
                <div class="modal-workflow-num">${p.step}</div>
                <div class="modal-workflow-title">${p.title}</div>
                <div class="modal-workflow-desc">${p.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 16. Placeholder Notice (Project 02)
    if (data.placeholderNotice) {
      html += `
        <div class="modal-placeholder-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <div>${data.placeholderNotice}</div>
        </div>
      `;
    }

    // 17. Notices (NDA, Comparative, Publication, Channel, CRM)
    const noticeText = data.ndaNotice || data.crmNotice || data.comparativeNotice || data.publicationNotice || data.channelNotice;
    if (noticeText) {
      html += `
        <div class="modal-disclaimer-box info">
          <svg class="modal-disclaimer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <div>
            <strong>Professional Note:</strong> ${noticeText}
          </div>
        </div>
      `;
    }

    return html;
  }

  function setupModals() {
    const modal = document.getElementById('project-modal');
    const closeBtn = document.getElementById('close-project-modal');
    const categoryEl = document.getElementById('modal-project-category');
    const titleEl = document.getElementById('modal-project-title');
    const bodyEl = document.getElementById('modal-project-body');
    let lastFocusedElement = null;

    function openProject(id) {
      const data = PROJECT_DETAILS[id];
      if (!data || !modal) return;

      if (id === '01') {
        const audioItem = data.aiCreativeExamples?.items?.find(it => it.type === 'audio');
        if (audioItem && audioItem.tracks && audioItem.tracks.length > 1) {
          creativeAudioIndex = Math.floor(Math.random() * audioItem.tracks.length);
        } else {
          creativeAudioIndex = 0;
        }
        creativeVisualIndex = 0;

        const visualItem = data.aiCreativeExamples?.items?.find(it => it.type === 'visual');
        if (visualItem && visualItem.images) {
          visualItem.images.forEach(img => {
            const pre = new Image();
            pre.src = img.src;
          });
        }
      } else if (id === '02') {
        currentGoluView = 'all';
        currentGoluProjectId = null;
      } else if (id === '03') {
        currentMusicView = 'all';
        currentMusicTrackId = null;
      } else if (id === '04') {
        currentBhaktiView = 'all';
        currentBhaktiVideoId = null;
      } else if (id === '05') {
        currentVisualLabView = 'all';
        currentVisualLabItemId = null;
      }

      lastFocusedElement = document.activeElement;

      if (categoryEl) categoryEl.textContent = data.category;
      if (titleEl) titleEl.textContent = data.title;
      if (bodyEl) {
        bodyEl.innerHTML = buildProjectModalHtml(data);
      }

      if (id === '01') {
        const vPlayer = document.getElementById('creative-video-player');
        if (vPlayer) {
          vPlayer.addEventListener('play', () => {
            const lbl = document.getElementById('creative-video-cycle-label');
            if (lbl) lbl.textContent = 'Pause Complan Spec Ad';
          });
          vPlayer.addEventListener('pause', () => {
            const lbl = document.getElementById('creative-video-cycle-label');
            if (lbl) lbl.textContent = 'Play Complan Spec Ad (0:30)';
          });
        }
      }

      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      const dialog = modal.querySelector('.modal-dialog');
      if (dialog) {
        dialog.scrollTop = 0;
      }

      // Focus close button for accessibility
      if (closeBtn) {
        setTimeout(() => closeBtn.focus(), 50);
      }
    }

    window.openProjectModal = openProject;

    window.showGoluView = function(view, projectId = null) {
      currentGoluView = view || 'all';
      currentGoluProjectId = projectId || null;
      const data = PROJECT_DETAILS['02'];
      if (!data || !modal || !bodyEl) return;

      if (categoryEl) {
        if (view === 'complan-case-study') {
          categoryEl.textContent = 'PROJECT 02 — AI BRAND CONCEPTS';
        } else if (view === 'story-detail') {
          categoryEl.textContent = 'PROJECT 02 — ORIGINAL AI STORIES';
        } else {
          categoryEl.textContent = data.category;
        }
      }
      if (titleEl) {
        if (view === 'complan-case-study') {
          titleEl.textContent = 'Complan — AI Brand Concept';
        } else if (view === 'story-detail') {
          const s = (data.collections?.originalStories?.stories || []).find(item => item.id === projectId);
          titleEl.textContent = s ? s.title : 'Original AI Stories';
        } else {
          titleEl.textContent = data.title;
        }
      }

      // Pause any active videos before switching views
      const videos = modal.querySelectorAll('video');
      videos.forEach(v => {
        try { v.pause(); } catch(e) {}
      });
      const iframes = modal.querySelectorAll('iframe');
      iframes.forEach(f => {
        try {
          const src = f.src;
          f.src = '';
          f.src = src;
        } catch(e) {}
      });

      bodyEl.innerHTML = buildProjectModalHtml(data);

      const dialog = modal.querySelector('.modal-dialog');
      if (dialog) {
        dialog.scrollTop = 0;
      }
    };

    window.showMusicView = function(view, trackId = null) {
      currentMusicView = view || 'all';
      currentMusicTrackId = trackId || null;
      const data = PROJECT_DETAILS['03'];
      if (!data || !modal || !bodyEl) return;

      if (categoryEl) {
        if (view === 'track-detail') {
          categoryEl.textContent = 'PROJECT 03 — TRACK DETAILS';
        } else {
          categoryEl.textContent = data.category;
        }
      }
      if (titleEl) {
        if (view === 'track-detail') {
          const t = (data.videos || []).find(item => item.id === trackId);
          titleEl.textContent = t ? t.title : 'Track Details';
        } else {
          titleEl.textContent = data.title;
        }
      }

      // Stop any existing iframe / video playback
      const iframes = modal.querySelectorAll('iframe');
      iframes.forEach(f => {
        try {
          const src = f.src;
          f.src = '';
          f.src = src;
        } catch(e) {}
      });
      const videos = modal.querySelectorAll('video');
      videos.forEach(v => {
        try { v.pause(); } catch(e) {}
      });

      bodyEl.innerHTML = buildProjectModalHtml(data);

      const dialog = modal.querySelector('.modal-dialog');
      if (dialog) dialog.scrollTop = 0;
    };

    window.showBhaktiView = function(view, videoId = null) {
      currentBhaktiView = view || 'all';
      currentBhaktiVideoId = videoId || null;
      const data = PROJECT_DETAILS['04'];
      if (!data || !modal || !bodyEl) return;

      if (categoryEl) {
        if (view === 'video-detail') {
          categoryEl.textContent = 'PROJECT 04 — VIDEO DETAILS';
        } else {
          categoryEl.textContent = data.category;
        }
      }
      if (titleEl) {
        if (view === 'video-detail') {
          const v = (data.videos || []).find(item => item.id === videoId);
          titleEl.textContent = v ? v.title : 'Video Details';
        } else {
          titleEl.textContent = data.title;
        }
      }

      // Stop any existing iframe / video playback
      const iframes = modal.querySelectorAll('iframe');
      iframes.forEach(f => {
        try {
          const src = f.src;
          f.src = '';
          f.src = src;
        } catch(e) {}
      });
      const videos = modal.querySelectorAll('video');
      videos.forEach(v => {
        try { v.pause(); } catch(e) {}
      });

      bodyEl.innerHTML = buildProjectModalHtml(data);

      const dialog = modal.querySelector('.modal-dialog');
      if (dialog) dialog.scrollTop = 0;
    };

    window.showVisualLabView = function(view, itemId = null) {
      currentVisualLabView = view || 'all';
      currentVisualLabItemId = itemId || null;
      const data = PROJECT_DETAILS['05'];
      if (!data || !modal || !bodyEl) return;

      if (categoryEl) {
        if (view === 'case-study-detail') {
          categoryEl.textContent = 'PROJECT 05 — CASE STUDY';
        } else if (view === 'brand-concepts') {
          categoryEl.textContent = 'PROJECT 05 — AI BRAND CONCEPTS';
        } else if (view === 'frameworks') {
          categoryEl.textContent = 'PROJECT 05 — PROMPT FRAMEWORKS';
        } else if (view === 'case-studies') {
          categoryEl.textContent = 'PROJECT 05 — TRANSFORMATIONS';
        } else {
          categoryEl.textContent = data.category;
        }
      }
      if (titleEl) {
        if (view === 'case-study-detail') {
          const cs = (data.caseStudies || []).find(item => item.id === itemId);
          titleEl.textContent = cs ? cs.title : 'Transformation Case Study';
        } else if (view === 'brand-concepts') {
          titleEl.textContent = 'AI Brand Concepts — Perfume Commercial';
        } else if (view === 'frameworks') {
          titleEl.textContent = 'Prompt Engineering Frameworks';
        } else if (view === 'case-studies') {
          titleEl.textContent = 'The Six Before-and-After Case Studies';
        } else {
          titleEl.textContent = data.title;
        }
      }

      bodyEl.innerHTML = buildProjectModalHtml(data);
      const dialog = modal.querySelector('.modal-dialog');
      if (dialog) dialog.scrollTop = 0;
    };

    function closeModal() {
      if (!modal) return;

      // Pause any active videos and stop iframes inside modal
      const videos = modal.querySelectorAll('video');
      videos.forEach(v => {
        try { v.pause(); } catch(e) {}
      });
      const iframes = modal.querySelectorAll('iframe');
      iframes.forEach(f => {
        try {
          const src = f.src;
          f.src = '';
          f.src = src;
        } catch(e) {}
      });

      currentGoluView = 'all';
      currentGoluProjectId = null;
      currentMusicView = 'all';
      currentMusicTrackId = null;
      currentBhaktiView = 'all';
      currentBhaktiVideoId = null;
      currentVisualLabView = 'all';
      currentVisualLabItemId = null;

      if (typeof closeCreativeVisualLightbox === 'function') {
        closeCreativeVisualLightbox();
      }

      const vLabel = document.getElementById('creative-video-cycle-label');
      if (vLabel) vLabel.textContent = 'Play Complan Spec Ad (0:30)';

      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
    }

    // Creative Examples Interactive Controls & Lightbox
    function ensureCreativeLightbox() {
      if (lightboxEl) return lightboxEl;
      lightboxEl = document.getElementById('creative-visual-lightbox');
      if (lightboxEl) return lightboxEl;

      lightboxEl = document.createElement('div');
      lightboxEl.id = 'creative-visual-lightbox';
      lightboxEl.className = 'creative-visual-lightbox';
      lightboxEl.setAttribute('role', 'dialog');
      lightboxEl.setAttribute('aria-modal', 'true');
      lightboxEl.setAttribute('aria-label', 'Full-screen portrait lighting study view');
      lightboxEl.innerHTML = `
        <button type="button" class="lightbox-close-btn" id="lightbox-close-btn" aria-label="Close full-screen image view" title="Close (Esc)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
            <path d="M3 3l10 10M13 3L3 13" stroke-linecap="round"/>
          </svg>
        </button>
        <button type="button" class="lightbox-nav-btn prev" id="lightbox-prev-btn" aria-label="Previous portrait" title="Previous (←)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px">
            <path d="M10 13L5 8l5-5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button type="button" class="lightbox-nav-btn next" id="lightbox-next-btn" aria-label="Next portrait" title="Next (→)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px">
            <path d="M6 3l5 5-5 5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="lightbox-content-wrap" id="lightbox-content-wrap">
          <div class="lightbox-img-frame">
            <img id="lightbox-target-img" src="" alt="Full-screen portrait study">
            <span class="example-tag" id="lightbox-tag">1 / 8 • PORTRAIT STUDY</span>
          </div>
          <div class="lightbox-caption-bar">
            <h4 class="lightbox-title" id="lightbox-title"></h4>
            <p class="lightbox-desc" id="lightbox-desc"></p>
          </div>
        </div>
      `;
      document.body.appendChild(lightboxEl);

      const closeBtn = lightboxEl.querySelector('#lightbox-close-btn');
      if (closeBtn) closeBtn.addEventListener('click', closeCreativeVisualLightbox);

      lightboxEl.addEventListener('click', function(e) {
        const frame = lightboxEl.querySelector('.lightbox-img-frame');
        const caption = lightboxEl.querySelector('.lightbox-caption-bar');
        const prev = lightboxEl.querySelector('#lightbox-prev-btn');
        const next = lightboxEl.querySelector('#lightbox-next-btn');

        if (frame && frame.contains(e.target)) return;
        if (caption && caption.contains(e.target)) return;
        if (prev && prev.contains(e.target)) return;
        if (next && next.contains(e.target)) return;

        closeCreativeVisualLightbox();
      });

      const prevBtn = lightboxEl.querySelector('#lightbox-prev-btn');
      if (prevBtn) {
        prevBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          const p01 = PROJECT_DETAILS['01'];
          const visualItem = p01?.aiCreativeExamples?.items?.find(it => it.type === 'visual');
          if (!visualItem || !visualItem.images || visualItem.images.length === 0) return;
          creativeVisualIndex = (creativeVisualIndex - 1 + visualItem.images.length) % visualItem.images.length;
          syncVisualUI(visualItem);
        });
      }

      const nextBtn = lightboxEl.querySelector('#lightbox-next-btn');
      if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          window.cycleCreativeVisualImage(e);
        });
      }

      return lightboxEl;
    }

    function updateLightboxContent(curImg, index, total) {
      if (!lightboxEl) return;
      const targetImg = lightboxEl.querySelector('#lightbox-target-img');
      const title = lightboxEl.querySelector('#lightbox-title');
      const desc = lightboxEl.querySelector('#lightbox-desc');
      const tag = lightboxEl.querySelector('#lightbox-tag');

      if (targetImg && curImg) {
        targetImg.src = curImg.src;
        targetImg.alt = curImg.alt || curImg.caption || 'Computational Portraiture Study';
      }
      if (title && curImg) title.textContent = curImg.caption || '';
      if (desc && curImg) desc.textContent = curImg.desc || '';
      if (tag && curImg) tag.textContent = (index + 1) + ' / ' + total + ' • ' + (curImg.tag || 'PORTRAIT STUDY');
    }

    function syncVisualUI(visualItem) {
      const total = visualItem.images.length;
      const curImg = visualItem.images[creativeVisualIndex];

      const imgEl = document.getElementById('creative-visual-img');
      if (imgEl && curImg.src) {
        imgEl.src = curImg.src;
        imgEl.alt = curImg.alt || curImg.caption || 'Computational Portraiture';
      }

      const captionEl = document.getElementById('creative-visual-caption');
      if (captionEl) {
        captionEl.textContent = curImg.caption || '';
      }

      const detailEl = document.getElementById('creative-visual-detail');
      if (detailEl) {
        detailEl.textContent = curImg.desc || '';
      }

      const tagEl = document.getElementById('creative-visual-tag');
      if (tagEl) {
        tagEl.textContent = (creativeVisualIndex + 1) + ' / ' + total + ' • ' + (curImg.tag || 'PORTRAIT STUDY');
      }

      const cycleLabel = document.getElementById('creative-visual-cycle-label');
      if (cycleLabel) {
        cycleLabel.textContent = 'Cycle Image (' + (creativeVisualIndex + 1) + ' of ' + total + ') ↻';
      }

      if (lightboxEl && lightboxEl.classList.contains('is-open')) {
        updateLightboxContent(curImg, creativeVisualIndex, total);
      }
    }

    window.openCreativeVisualLightbox = function(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const lb = ensureCreativeLightbox();
      const p01 = PROJECT_DETAILS['01'];
      const visualItem = p01?.aiCreativeExamples?.items?.find(it => it.type === 'visual');
      if (!visualItem || !visualItem.images || visualItem.images.length === 0) return;
      const total = visualItem.images.length;

      // Ensure the opened image strictly matches the current card image
      const displayedImg = document.getElementById('creative-visual-img');
      if (displayedImg && displayedImg.src) {
        const foundIdx = visualItem.images.findIndex(function(im) {
          return displayedImg.src.indexOf(im.src) !== -1;
        });
        if (foundIdx >= 0) {
          creativeVisualIndex = foundIdx;
        }
      }

      const curImg = visualItem.images[creativeVisualIndex] || visualItem.images[0];
      updateLightboxContent(curImg, creativeVisualIndex, total);
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    function closeCreativeVisualLightbox() {
      if (!lightboxEl) return;
      lightboxEl.classList.remove('is-open');
      lightboxEl.setAttribute('aria-hidden', 'true');
      const modal = document.getElementById('project-modal');
      if (!modal || !modal.classList.contains('open')) {
        document.body.style.overflow = '';
      }
    }
    window.closeCreativeVisualLightbox = closeCreativeVisualLightbox;

    window.cycleCreativeVisualImage = function(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const data = PROJECT_DETAILS['01'];
      const visualItem = data?.aiCreativeExamples?.items?.find(it => it.type === 'visual');
      if (!visualItem || !visualItem.images || visualItem.images.length === 0) return;

      creativeVisualIndex = (creativeVisualIndex + 1) % visualItem.images.length;
      syncVisualUI(visualItem);
    };

    window.cycleCreativeAudioTrack = function(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const data = PROJECT_DETAILS['01'];
      const audioItem = data?.aiCreativeExamples?.items?.find(it => it.type === 'audio');
      if (!audioItem || !audioItem.tracks || audioItem.tracks.length === 0) return;

      creativeAudioIndex = (creativeAudioIndex + 1) % audioItem.tracks.length;
      const curTrack = audioItem.tracks[creativeAudioIndex];
      const nextTrack = audioItem.tracks[(creativeAudioIndex + 1) % audioItem.tracks.length];

      const iframe = document.getElementById('creative-audio-iframe');
      if (iframe && curTrack.embedUrl) {
        const sep = curTrack.embedUrl.indexOf('?') >= 0 ? '&' : '?';
        iframe.src = curTrack.embedUrl + sep + 'autoplay=1';
        iframe.title = curTrack.title || 'Ze-Wa Music';
      }

      const titleEl = document.getElementById('creative-audio-current-title');
      if (titleEl) {
        titleEl.textContent = curTrack.title || '';
      }

      const tagEl = document.getElementById('creative-audio-tag');
      if (tagEl) {
        tagEl.textContent = curTrack.tag || ('TRACK ' + (creativeAudioIndex + 1) + ' OF ' + audioItem.tracks.length);
      }

      const cycleLabel = document.getElementById('creative-audio-cycle-label');
      if (cycleLabel) {
        cycleLabel.textContent = 'Next Track: ' + (nextTrack.title || 'Ze-Wa - SLOW') + ' ↻';
      }
    };

    window.cycleCreativeVideo = function(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const p01 = PROJECT_DETAILS['01'];
      const videoItem = p01?.aiCreativeExamples?.items?.find(it => it.type === 'video');
      const video = document.getElementById('creative-video-player');
      const label = document.getElementById('creative-video-cycle-label');
      if (!video) return;

      if (videoItem && videoItem.videos && videoItem.videos.length > 1) {
        creativeVideoIndex = (creativeVideoIndex + 1) % videoItem.videos.length;
        const curV = videoItem.videos[creativeVideoIndex];
        video.src = curV.videoSrc;
        if (curV.posterSrc) video.poster = curV.posterSrc;
        video.load();
        video.play().catch(() => {});
        if (label) label.textContent = 'Next Video (' + (creativeVideoIndex + 1) + ' of ' + videoItem.videos.length + ') ↻';
        const tag = document.getElementById('creative-video-tag');
        if (tag) tag.textContent = curV.tag || 'VIDEO AD CONCEPT';
      } else {
        if (video.paused) {
          video.play().then(() => {
            if (label) label.textContent = 'Pause Complan Spec Ad';
          }).catch(err => {
            console.warn('Video play prevented or paused:', err);
          });
        } else {
          video.pause();
          if (label) label.textContent = 'Play Complan Spec Ad (0:30)';
        }
      }
    };

    // Attach listeners to explore buttons and card click
    document.querySelectorAll('.explore-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-project');
        openProject(id);
      });
    });

    document.querySelectorAll('.project-card').forEach((card, idx) => {
      card.addEventListener('click', () => {
        const id = String(idx + 1).padStart(2, '0');
        openProject(id);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const id = String(idx + 1).padStart(2, '0');
          openProject(id);
        }
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (lightboxEl && lightboxEl.classList.contains('is-open')) {
          closeCreativeVisualLightbox();
          return;
        }
        if (modal && modal.classList.contains('open')) {
          closeModal();
        }
      } else if (lightboxEl && lightboxEl.classList.contains('is-open')) {
        if (e.key === 'ArrowRight') {
          window.cycleCreativeVisualImage();
        } else if (e.key === 'ArrowLeft') {
          const p01 = PROJECT_DETAILS['01'];
          const visualItem = p01?.aiCreativeExamples?.items?.find(it => it.type === 'visual');
          if (visualItem && visualItem.images && visualItem.images.length > 0) {
            creativeVisualIndex = (creativeVisualIndex - 1 + visualItem.images.length) % visualItem.images.length;
            syncVisualUI(visualItem);
          }
        }
      }
    });
  }

  /* ==========================================================================
     5. GENERAL INTERACTIVITY & UI CONTROLS
     ========================================================================== */
  function setupUIInteractions() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        themeToggle.classList.toggle('active');
        const isActive = themeToggle.classList.contains('active');
        if (canvas) {
          canvas.style.filter = isActive ? 'none' : 'contrast(1.15) brightness(1.05)';
        }
      });
    }

    // Mobile Navigation Menu Toggle
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');
    if (mobileBtn && navMenu) {
      mobileBtn.addEventListener('click', () => {
        navMenu.classList.toggle('open');
      });

      navMenu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          navMenu.classList.remove('open');
        });
      });
    }

    // Smooth Anchor Scrolling with Scroll-Track Awareness
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href').replace('#', '');
        const targetEl = document.getElementById(targetId);

        if (targetId === 'home') {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        if (targetEl) {
          e.preventDefault();
          const navOffset = 80;
          const elementPosition = targetEl.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - navOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // Contact Form Submission Handler with Real Email Delivery Integration
  let isSubmittingContact = false;

  window.handleContactSubmit = async function() {
    if (isSubmittingContact) return;

    const form = document.getElementById('portfolio-contact-form');
    const feedback = document.getElementById('form-feedback');
    const submitBtn = document.getElementById('contact-submit-btn');
    if (!form || !feedback) return;

    const nameInput = document.getElementById('contact-name');
    const emailInput = document.getElementById('contact-email');
    const intentInput = document.getElementById('contact-intent');
    const messageInput = document.getElementById('contact-message');
    const hpInput = document.getElementById('contact-hp');

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const intent = intentInput ? intentInput.value : 'job';
    const message = messageInput ? messageInput.value.trim() : '';
    const _hp = hpInput ? hpInput.value.trim() : '';

    // 1. Client-side input validation
    if (!name || name.length < 2) {
      feedback.className = 'form-feedback error';
      feedback.textContent = 'Please enter your name (at least 2 characters).';
      if (nameInput) nameInput.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      feedback.className = 'form-feedback error';
      feedback.textContent = 'Please enter a valid email address.';
      if (emailInput) emailInput.focus();
      return;
    }

    if (!message || message.length < 5) {
      feedback.className = 'form-feedback error';
      feedback.textContent = 'Please enter a message (at least 5 characters).';
      if (messageInput) messageInput.focus();
      return;
    }

    // 2. Set UI loading state & prevent duplicate clicks
    isSubmittingContact = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
      const btnText = submitBtn.querySelector('.btn-text');
      if (btnText) btnText.textContent = 'Sending Message...';
    }

    feedback.className = 'form-feedback loading';
    feedback.textContent = 'Connecting to email service and sending your inquiry...';

    // 3. Dispatch POST to serverless / local /api/contact endpoint
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          intent,
          message,
          _hp
        })
      });

      const result = await response.json().catch(() => null);

      if (response.ok && result && result.success) {
        feedback.className = 'form-feedback success';
        feedback.textContent = `Thank you, ${name}! Your inquiry has been sent to Tushar Pandey's inbox. You will receive a response shortly.`;
        form.reset();
      } else {
        feedback.className = 'form-feedback error';
        if (result && result.code === 'CONFIG_MISSING') {
          feedback.textContent = 'Email delivery service is currently awaiting configuration (RESEND_API_KEY). In the meantime, please connect directly with Tushar on LinkedIn.';
        } else if (result && result.error) {
          feedback.textContent = result.error;
        } else {
          feedback.textContent = 'Unable to send message right now. Please try again later or reach out via LinkedIn.';
        }
      }
    } catch (err) {
      feedback.className = 'form-feedback error';
      feedback.textContent = 'Network connection issue. Please check your connection or connect directly on LinkedIn.';
    } finally {
      isSubmittingContact = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        const btnText = submitBtn.querySelector('.btn-text');
        if (btnText) btnText.textContent = 'Send Message';
      }
    }
  };

  // Recommendation card expand/collapse toggle interaction
  window.toggleRecExpand = function(btn) {
    if (!btn) return;
    const card = btn.closest('.rec-card');
    if (!card) return;
    const bodyWrapper = card.querySelector('.rec-body-wrapper');
    if (!bodyWrapper) return;

    const isCollapsed = bodyWrapper.classList.contains('collapsed');
    if (isCollapsed) {
      bodyWrapper.classList.remove('collapsed');
      bodyWrapper.classList.add('expanded');
      btn.setAttribute('aria-expanded', 'true');
      const textSpan = btn.querySelector('.rec-btn-text');
      if (textSpan) textSpan.textContent = 'Show less';
    } else {
      bodyWrapper.classList.add('collapsed');
      bodyWrapper.classList.remove('expanded');
      btn.setAttribute('aria-expanded', 'false');
      const textSpan = btn.querySelector('.rec-btn-text');
      if (textSpan) textSpan.textContent = 'Read more';
    }
  };

  /* ==========================================================================
     LUXURY MOTION & INTERACTION ENGINES
     ========================================================================== */

  /**
   * 1. Signature Click Effect — Elegant Particle Burst
   * Small, refined burst of 8–12 tiny particles in cyan, soft white, and restrained violet
   * Completes in ~380–520ms, non-blocking, GPU-accelerated, auto-cleaned.
   */
  function initParticleBurstSystem() {
    let container = document.getElementById('fx-particle-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'fx-particle-container';
      document.body.appendChild(container);
    }

    const COLORS = ['#00e5ff', '#ffffff', '#a855f7', '#c4b5fd', '#67e8f9'];
    let lastBurstTime = 0;
    let lastBurstX = -999;
    let lastBurstY = -999;

    function triggerBurst(clientX, clientY) {
      if (!container) return;
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      // Subtle localized micro-ripple
      const ripple = document.createElement('div');
      ripple.className = 'fx-ripple';
      ripple.style.left = `${clientX}px`;
      ripple.style.top = `${clientY}px`;
      ripple.style.width = '22px';
      ripple.style.height = '22px';
      container.appendChild(ripple);

      if (typeof ripple.animate === 'function') {
        const rAnim = ripple.animate([
          { transform: 'translate(-50%, -50%) scale(0.3)', opacity: 0.85 },
          { transform: 'translate(-50%, -50%) scale(2.2)', opacity: 0 }
        ], {
          duration: 360,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });
        rAnim.onfinish = () => ripple.remove();
      } else {
        setTimeout(() => ripple.remove(), 400);
      }

      // Small burst of 8–11 tiny light particles
      const particleCount = 8 + Math.floor(Math.random() * 4);
      for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('span');
        p.className = 'fx-particle';

        const size = 2.2 + Math.random() * 1.8;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() * 0.35 - 0.17);
        const distance = 20 + Math.random() * 22;
        const destX = Math.cos(angle) * distance;
        const destY = Math.sin(angle) * distance;

        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.backgroundColor = color;
        p.style.color = color;
        p.style.left = `${clientX}px`;
        p.style.top = `${clientY}px`;
        container.appendChild(p);

        if (typeof p.animate === 'function') {
          const pAnim = p.animate([
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            { transform: `translate(calc(-50% + ${destX}px), calc(-50% + ${destY}px)) scale(0.25)`, opacity: 0 }
          ], {
            duration: 380 + Math.random() * 140,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
          });
          pAnim.onfinish = () => p.remove();
        } else {
          setTimeout(() => p.remove(), 550);
        }
      }
    }

    window.triggerParticleBurst = triggerBurst;

    const INTERACTIVE_SELECTOR = 'button, .btn, .project-card, .cert-card, .account-card, .nav-link, .brand-logo, .toggle-switch, .explore-btn, .cert-verify-link, .account-link-btn, .rec-toggle-btn, .modal-close-btn, .gallery-filter-btn, .visual-subtab-btn, .view-switch-btn, .prompt-copy-btn, .framework-toggle-btn, [role="button"]';

    document.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      const target = e.target.closest(INTERACTIVE_SELECTOR);
      if (!target) return;

      const now = Date.now();
      if (now - lastBurstTime < 80 && Math.hypot(e.clientX - lastBurstX, e.clientY - lastBurstY) < 25) {
        return;
      }
      lastBurstTime = now;
      lastBurstX = e.clientX;
      lastBurstY = e.clientY;

      triggerBurst(e.clientX, e.clientY);
    }, { passive: true });
  }

  /**
   * 2. Luxury Card Spotlight Pointer Interaction
   * Sets --mouse-x and --mouse-y CSS properties throttled with requestAnimationFrame
   */
  function initCardSpotlight() {
    if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return;
    }

    const cards = document.querySelectorAll('.project-card, .cert-card, .account-card');
    cards.forEach(card => {
      let isScheduled = false;
      let lastX = 0;
      let lastY = 0;

      card.addEventListener('pointermove', (e) => {
        lastX = e.clientX;
        lastY = e.clientY;

        if (!isScheduled) {
          isScheduled = true;
          requestAnimationFrame(() => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${lastX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${lastY - rect.top}px`);
            isScheduled = false;
          });
        }
      }, { passive: true });
    });
  }

  /**
   * 3. Scroll-Triggered Viewport Reveals
   * Staggered, smooth entrance for cards and section headers using IntersectionObserver
   */
  function initScrollRevealSystem() {
    const isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const revealTargets = document.querySelectorAll(
      '.section-header, .project-card, .cert-card, .about-feature-card, .about-narrative, .account-card, .contact-card'
    );

    if (isReducedMotion || !('IntersectionObserver' in window)) {
      revealTargets.forEach(el => el.classList.add('revealed'));
      return;
    }

    // Add stagger indices to grid children
    const grids = document.querySelectorAll('.projects-grid, .certifications-grid, .social-accounts-grid, .about-features-grid');
    grids.forEach(grid => {
      const items = grid.children;
      for (let i = 0; i < items.length; i++) {
        items[i].setAttribute('data-stagger', (i % 3) + 1);
      }
    });

    revealTargets.forEach(el => {
      el.classList.add('reveal-init');
    });

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });

    revealTargets.forEach(el => observer.observe(el));
  }

  /* ==========================================================================
     6. INITIALIZATION
     ========================================================================== */
  function init() {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    resizeCanvas();
    updateScrollProgress();
    preloadImages();
    renderSocialAccounts();
    setupModals();
    setupUIInteractions();
    initParticleBurstSystem();
    initCardSpotlight();
    initScrollRevealSystem();

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('wheel', updateScrollProgress, { passive: true });
    window.addEventListener('touchmove', updateScrollProgress, { passive: true });

    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Global Prompt Copy Helper for Visual Lab Frameworks
  window.copyPromptFromElement = function(btn, elId) {
    var el = document.getElementById(elId);
    if (!el || !navigator.clipboard) return;
    var text = el.innerText || el.textContent;
    navigator.clipboard.writeText(text).then(function() {
      var orig = btn.innerHTML;
      btn.innerHTML = `<svg viewBox="0 0 16 16" fill="none" style="width:13px;height:13px"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Copied!</span>`;
      btn.classList.add('copied');
      setTimeout(function() {
        btn.innerHTML = orig;
        btn.classList.remove('copied');
      }, 2000);
    }).catch(function(err) {
      console.error('Prompt copy error', err);
    });
  };

  // Expandable Section Toggle Helper for Visual Lab Frameworks
  window.toggleFrameworksSection = function() {
    var content = document.getElementById('frameworks-expandable-content');
    var btn = document.getElementById('frameworks-toggle-btn');
    if (!content) return;
    var isExpanded = content.style.display !== 'none';
    if (isExpanded) {
      content.style.display = 'none';
      if (btn) {
        btn.setAttribute('aria-expanded', 'false');
        btn.classList.remove('is-open');
        var t = btn.querySelector('.toggle-text');
        if (t) t.textContent = 'Explore 9 Frameworks';
      }
    } else {
      content.style.display = 'block';
      if (btn) {
        btn.setAttribute('aria-expanded', 'true');
        btn.classList.add('is-open');
        var t = btn.querySelector('.toggle-text');
        if (t) t.textContent = 'Collapse Frameworks';
      }
    }
  };

})();
