import { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckOutlined, RocketOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './LandingPage.css';

const Navbar = memo(function Navbar() {
  const navigate = useNavigate();
  const { t } = useTranslation('landing');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NAV_LINKS = useMemo(() => [
    { label: t('nav.features'), href: '#features' },
    { label: t('nav.pricing'), href: '#pricing' },
    { label: t('nav.docs'), href: '#docs' },
    { label: t('nav.about'), href: '#about' },
  ], [t]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <nav className={`landing-navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="landing-nav-left">
        <a className="landing-nav-logo" onClick={() => navigate('/')}>
          <RocketOutlined className="landing-nav-logo-icon" />
          <span className="landing-nav-logo-text">MyAgent</span>
        </a>
        <div className="landing-nav-links">
          {NAV_LINKS.map((link) => (
            <a key={link.href} className="landing-nav-link" href={link.href} onClick={(e) => handleNavClick(e, link.href)}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <div className="landing-nav-actions">
        <button className="landing-nav-btn" onClick={() => navigate('/auth')}>
          {t('nav.login')}
        </button>
        <button className="landing-nav-btn primary" onClick={() => navigate('/auth')}>
          {t('nav.register')}
        </button>
        <button className="landing-nav-mobile-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  );
});

const Hero = memo(function Hero() {
  const navigate = useNavigate();
  const { t } = useTranslation('landing');

  const particles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      style: {
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 15}s`,
        animationDuration: `${12 + Math.random() * 8}s`,
      },
    }));
  }, []);

  const scrollToFeatures = useCallback(() => {
    document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <section className="landing-hero">
      <div className="landing-particles">
        {particles.map((p) => (
          <div key={p.id} className="landing-particle" style={p.style} />
        ))}
      </div>
      <div className="landing-hero-orbs">
        <div className="landing-orb landing-orb-1" />
        <div className="landing-orb landing-orb-2" />
        <div className="landing-orb landing-orb-3" />
      </div>
      <div className="landing-hero-content">
        <div className="landing-hero-badge">
          <span className="landing-hero-badge-dot" />
          {t('hero.badge')}
        </div>
        <h1 className="landing-hero-title">
          {t('hero.title1')}
          <br />
          <span className="landing-hero-title-gradient">{t('hero.title2')}</span>
        </h1>
        <p className="landing-hero-subtitle">
          {t('hero.subtitle1')}
          <br />
          {t('hero.subtitle2')}
        </p>
        <div className="landing-hero-ctas">
          <button className="landing-cta-primary" onClick={() => navigate('/auth')}>
            <span>{t('hero.cta')}</span>
            <ArrowRightOutlined />
          </button>
          <button className="landing-cta-secondary" onClick={scrollToFeatures}>
            {t('hero.learnMore')}
          </button>
        </div>
      </div>
    </section>
  );
});

const Features = memo(function Features() {
  const { t } = useTranslation('landing');

  const FEATURES = useMemo(() => [
    { icon: '⚡', title: t('features.smartEval'), desc: t('features.smartEvalDesc') },
    { icon: '📊', title: t('features.dataAnalysis'), desc: t('features.dataAnalysisDesc') },
    { icon: '🔄', title: t('features.batchExec'), desc: t('features.batchExecDesc') },
    { icon: '🔒', title: t('features.security'), desc: t('features.securityDesc') },
    { icon: '🤖', title: t('features.multiModel'), desc: t('features.multiModelDesc') },
    { icon: '⚙️', title: t('features.flexConfig'), desc: t('features.flexConfigDesc') },
  ], [t]);

  return (
    <section id="features" className="landing-features">
      <div className="landing-section">
        <div className="landing-section-header">
          <span className="landing-section-badge">{t('features.badge')}</span>
          <h2 className="landing-section-title">{t('features.title')}</h2>
          <p className="landing-section-desc">{t('features.desc')}</p>
        </div>
        <div className="landing-feature-grid">
          {FEATURES.map((feature, index) => (
            <div key={index} className="landing-feature-card">
              <div className="landing-feature-icon">{feature.icon}</div>
              <h3 className="landing-feature-title">{feature.title}</h3>
              <p className="landing-feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

const Stats = memo(function Stats() {
  const { t } = useTranslation('landing');
  const [animated, setAnimated] = useState(false);

  const STATS = useMemo(() => [
    { value: '1000', label: t('stats.tasks') },
    { value: '50000', label: t('stats.executions') },
    { value: '20', label: t('stats.agents') },
    { value: '100', label: t('stats.enterprises') },
  ], [t]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated) {
          setAnimated(true);
        }
      },
      { threshold: 0.5 }
    );
    const element = document.querySelector('.landing-stats');
    if (element) observer.observe(element);
    return () => observer.disconnect();
  }, [animated]);

  return (
    <section className="landing-stats">
      <div className="landing-stats-grid">
        {STATS.map((stat, index) => (
          <div key={index} className="landing-stat-item">
            <div className="landing-stat-value">
              {animated ? stat.value : '0'}
              <span className="landing-stat-plus">+</span>
            </div>
            <div className="landing-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
});

const DemoShowcase = memo(function DemoShowcase() {
  const { t } = useTranslation('landing');

  const DEMO_FEATURES = useMemo(() => [
    t('demo.feature1'),
    t('demo.feature2'),
    t('demo.feature3'),
  ], [t]);

  return (
    <section className="landing-demo">
      <div className="landing-section">
        <div className="landing-demo-content">
          <div className="landing-demo-text">
            <h2 className="landing-demo-title">
              {t('demo.title1')}
              <br />
              {t('demo.title2')}
            </h2>
            <p className="landing-demo-desc">{t('demo.desc')}</p>
            <div className="landing-demo-features">
              {DEMO_FEATURES.map((feature, index) => (
                <div key={index} className="landing-demo-feature">
                  <span className="landing-demo-feature-icon">
                    <CheckOutlined />
                  </span>
                  {feature}
                </div>
              ))}
            </div>
          </div>
          <div className="landing-demo-preview">
            <div className="landing-demo-frame">
              <div className="landing-demo-placeholder">
                <div className="landing-demo-placeholder-icon">📊</div>
                <div className="landing-demo-placeholder-text">{t('demo.preview')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

const CTA = memo(function CTA() {
  const navigate = useNavigate();
  const { t } = useTranslation('landing');

  return (
    <section className="landing-cta">
      <div className="landing-cta-bg" />
      <div className="landing-cta-content">
        <h2 className="landing-cta-title">{t('cta.title')}</h2>
        <p className="landing-cta-desc">{t('cta.desc')}</p>
        <button className="landing-cta-primary" onClick={() => navigate('/auth')}>
          <span>{t('cta.button')}</span>
          <ArrowRightOutlined />
        </button>
      </div>
    </section>
  );
});

const Footer = memo(function Footer() {
  const { t } = useTranslation('landing');

  const FOOTER_LINKS = useMemo(() => [
    { label: t('footer.product'), href: '#' },
    { label: t('footer.docs'), href: '#' },
    { label: t('footer.blog'), href: '#' },
    { label: t('footer.aboutUs'), href: '#' },
    { label: t('footer.contactUs'), href: '#' },
  ], [t]);

  return (
    <footer className="landing-footer">
      <div className="landing-footer-logo">
        <RocketOutlined className="landing-nav-logo-icon" />
        <span className="landing-footer-logo-text">MyAgent</span>
      </div>
      <div className="landing-footer-links">
        {FOOTER_LINKS.map((link) => (
          <a key={link.label} className="landing-footer-link" href={link.href}>
            {link.label}
          </a>
        ))}
      </div>
      <div className="landing-footer-copyright">
        © 2026 MyAgent. All rights reserved.
      </div>
    </footer>
  );
});

const LandingPage = memo(function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />
      <Hero />
      <Features />
      <Stats />
      <DemoShowcase />
      <CTA />
      <Footer />
    </div>
  );
});

export default LandingPage;
