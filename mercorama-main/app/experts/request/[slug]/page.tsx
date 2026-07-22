'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Send, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';
import type { ExpertProfile } from '@/lib/experts';

export default function RequestConsultationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const preType = searchParams.get('type') === 'project' ? 'project_based' : '';

  const [expert, setExpert] = useState<ExpertProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const [form, setForm] = useState({
    description: '',
    target_market: '',
    engagement_type: preType || 'not_sure',
    timeline: '',
    budget_range: '',
    contact_email: '',
  });

  useEffect(() => {
    fetch(`/api/experts/${slug}`)
      .then((r) => r.json())
      .then(setExpert)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || !form.contact_email) {
      setError('Please describe your requirement and provide your email.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/experts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, expert_slug: slug }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error ?? 'Failed to submit request.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", background: '#fff', color: '#0B1F3A' }}>

      {/* ── NAV ── */}
      <style>{`
        :root {
          --navy:#0B1F3A;--navy-mid:#152d52;--teal:#009CA6;--teal-dark:#007D87;
          --teal-light:#E6F7F8;--bg:#FFFFFF;--light-bg:#F0F4F8;
          --text:#0B1F3A;--muted:#5A6A7A;--border:#DDE3EA;--wide:1200px;
          --font-head:'Plus Jakarta Sans',sans-serif;--font-body:'Inter',sans-serif;
          --transition:180ms cubic-bezier(0.16,1,0.3,1);
        }
        .req-nav{position:sticky;top:0;z-index:100;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);}
        .req-nav-inner{max-width:var(--wide);margin:0 auto;padding:0 2rem;height:80px;display:flex;align-items:center;justify-content:space-between;gap:2rem;}
        .req-nav-logo img{height:clamp(48px,6vw,80px);width:auto;display:block;}
        .req-nav-links{display:flex;gap:2rem;list-style:none;}
        .req-nav-links a{font-size:0.9rem;font-weight:500;color:var(--muted);text-decoration:none;transition:color var(--transition);}
        .req-nav-links a:hover{color:var(--navy);}
        .req-btn-demo{display:inline-flex;align-items:center;gap:6px;padding:0.5rem 1.25rem;border-radius:6px;font-family:var(--font-head);font-size:0.875rem;font-weight:700;background:var(--teal);color:white;border:2px solid var(--teal);text-decoration:none;transition:all var(--transition);}
        .req-btn-demo:hover{background:var(--teal-dark);border-color:var(--teal-dark);}
        .req-hamburger{display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:4px;}
        .req-hamburger span{display:block;width:24px;height:2px;background:var(--navy);border-radius:2px;}
        .req-mobile-menu{display:none;flex-direction:column;background:#fff;border-top:1px solid var(--border);padding:1rem 2rem 1.5rem;}
        .req-mobile-menu.open{display:flex;}
        .req-mobile-menu a{font-size:1rem;font-weight:500;padding:0.75rem 0;border-bottom:1px solid var(--border);color:var(--text);text-decoration:none;}
        .req-mobile-menu a:hover{color:var(--teal);}

        .req-has-drop{position:relative;}
        .req-drop-trigger{display:flex;align-items:center;gap:4px;font-size:0.9rem;font-weight:500;color:var(--muted);cursor:default;background:none;border:none;font-family:inherit;}
        .req-drop-trigger:hover{color:var(--navy);}
        .req-drop-trigger .chev{width:14px;height:14px;transition:transform var(--transition);}
        .req-has-drop:hover .req-drop-trigger .chev{transform:rotate(180deg);}
        .req-dropdown{position:absolute;top:calc(100% + 2px);left:50%;transform:translateX(-50%) translateY(-4px);background:white;border:1px solid var(--border);border-radius:10px;box-shadow:0 8px 32px rgba(11,31,58,0.12);padding:0.375rem;min-width:220px;opacity:0;visibility:hidden;pointer-events:none;transition:opacity var(--transition),transform var(--transition);}
        .req-dropdown::before{content:'';position:absolute;top:-10px;left:0;right:0;height:10px;}
        .req-has-drop:hover .req-dropdown{opacity:1;visibility:visible;pointer-events:all;transform:translateX(-50%) translateY(0);}
        .req-drop-item{display:flex;align-items:center;gap:0.875rem;padding:0.7rem 0.875rem;border-radius:8px;transition:background var(--transition);color:var(--text);text-decoration:none;}
        .req-drop-item:hover{background:var(--light-bg);}
        .req-drop-icon{width:36px;height:36px;border-radius:8px;flex-shrink:0;background:var(--teal-light);border:1px solid rgba(0,156,166,0.2);display:flex;align-items:center;justify-content:center;color:var(--teal);}
        .req-drop-title{font-size:0.875rem;font-weight:600;color:var(--navy);line-height:1.3;}
        .req-drop-sub{font-size:0.72rem;color:var(--muted);margin-top:2px;}

        /* ── PAGE ── */
        .req-page{flex:1;background:var(--light-bg);padding:3rem 2rem;}
        .req-page-inner{max-width:900px;margin:0 auto;}
        .req-back{display:inline-flex;align-items:center;gap:6px;font-size:0.875rem;color:var(--muted);text-decoration:none;margin-bottom:2rem;transition:color var(--transition);}
        .req-back:hover{color:var(--navy);}
        .req-grid{display:grid;grid-template-columns:1fr 300px;gap:2.5rem;align-items:start;}
        .req-form-card{background:white;border:1px solid var(--border);border-radius:16px;padding:2rem;}
        .req-form-title{font-family:var(--font-head);font-size:1.5rem;font-weight:800;color:var(--navy);margin-bottom:0.5rem;}
        .req-form-sub{font-size:0.875rem;color:var(--muted);margin-bottom:1.75rem;line-height:1.6;}
        .req-field{display:flex;flex-direction:column;gap:0.375rem;margin-bottom:1.25rem;}
        .req-label{font-size:0.875rem;font-weight:600;color:var(--navy);}
        .req-input,.req-textarea,.req-select{width:100%;border:1px solid var(--border);border-radius:8px;padding:0.65rem 0.875rem;font-family:var(--font-body);font-size:0.875rem;color:var(--text);background:white;transition:border-color var(--transition);outline:none;}
        .req-input:focus,.req-textarea:focus,.req-select:focus{border-color:var(--teal);}
        .req-textarea{min-height:120px;resize:vertical;}
        .req-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}
        .req-ack{display:flex;align-items:flex-start;gap:0.75rem;background:var(--light-bg);border:1px solid var(--border);border-radius:8px;padding:1rem;margin-bottom:1.25rem;}
        .req-ack input{margin-top:2px;accent-color:var(--teal);flex-shrink:0;}
        .req-ack label{font-size:0.75rem;color:var(--muted);line-height:1.55;cursor:pointer;}
        .req-ack label a{color:var(--teal);}
        .req-submit{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:0.8rem 1.5rem;border-radius:8px;font-family:var(--font-head);font-size:0.95rem;font-weight:700;background:var(--navy);color:white;border:none;cursor:pointer;transition:background var(--transition);}
        .req-submit:hover:not(:disabled){background:var(--navy-mid);}
        .req-submit:disabled{opacity:0.6;cursor:not-allowed;}
        .req-note{font-size:0.7rem;color:var(--muted);text-align:center;margin-top:0.75rem;}
        .req-error{font-size:0.875rem;color:#dc2626;margin-bottom:1rem;}

        .req-sidebar-card{background:white;border:1px solid var(--border);border-radius:16px;padding:1.5rem;position:sticky;top:100px;}
        .req-expert-head{display:flex;align-items:center;gap:0.875rem;margin-bottom:1rem;}
        .req-avatar{width:48px;height:48px;border-radius:50%;background:var(--light-bg);overflow:hidden;flex-shrink:0;border:2px solid var(--border);}
        .req-expert-name{font-family:var(--font-head);font-size:0.9rem;font-weight:700;color:var(--navy);}
        .req-expert-loc{font-size:0.75rem;color:var(--muted);}
        .req-tags{display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:1rem;}
        .req-tag{font-size:0.65rem;font-weight:700;background:var(--teal-light);color:var(--teal-dark);border-radius:4px;padding:0.2rem 0.5rem;}
        .req-next{border-top:1px solid var(--border);padding-top:1rem;font-size:0.8rem;color:var(--muted);display:flex;flex-direction:column;gap:0.4rem;}
        .req-next strong{color:var(--navy);display:block;margin-bottom:0.25rem;font-size:0.8rem;}

        /* success */
        .req-success{flex:1;display:flex;align-items:center;justify-content:center;padding:4rem 2rem;}
        .req-success-inner{max-width:480px;text-align:center;}
        .req-success-icon{width:64px;height:64px;border-radius:50%;background:#dcfce7;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;}
        .req-success h1{font-family:var(--font-head);font-size:1.75rem;font-weight:800;color:var(--navy);margin-bottom:0.75rem;}
        .req-success p{font-size:0.9rem;color:var(--muted);line-height:1.7;margin-bottom:0.5rem;}
        .req-success-btn{display:inline-flex;align-items:center;padding:0.65rem 1.5rem;border-radius:8px;font-family:var(--font-head);font-size:0.875rem;font-weight:700;background:var(--navy);color:white;text-decoration:none;margin-top:1.5rem;transition:background var(--transition);}
        .req-success-btn:hover{background:var(--navy-mid);}

        /* ── FOOTER ── */
        .req-footer{background:var(--light-bg);padding:3rem 2rem 0;}
        .req-footer-inner{max-width:var(--wide);margin:0 auto;display:grid;grid-template-columns:200px 1fr 1fr 1fr;gap:2rem;padding-bottom:2.5rem;}
        .req-footer-brand{display:flex;flex-direction:column;gap:0.5rem;}
        .req-footer-brand img{height:56px;width:auto;max-width:200px;display:block;}
        .req-footer-tagline{font-size:0.8rem;color:var(--muted);line-height:1.55;max-width:26ch;}
        .req-footer-social{display:flex;gap:0.75rem;margin-top:0.25rem;}
        .req-footer-si{width:36px;height:36px;border-radius:50%;border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--navy);transition:all var(--transition);text-decoration:none;}
        .req-footer-si:hover{background:var(--navy);color:white;border-color:var(--navy);}
        .req-footer-col-head{font-family:var(--font-head);font-size:0.75rem;font-weight:700;color:var(--navy);margin-bottom:0.875rem;}
        .req-footer-links{display:flex;flex-direction:column;gap:0.6rem;}
        .req-footer-link{font-size:0.8rem;color:#4A5568;text-decoration:none;}
        .req-footer-link:hover{color:var(--navy);}
        .req-footer-bottom{background:var(--navy);margin:0 -2rem;padding:1.1rem 2rem;}
        .req-footer-bottom-inner{max-width:var(--wide);margin:0 auto;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:1rem;font-size:0.75rem;color:rgba(255,255,255,0.85);}
        .req-footer-bottom a{color:rgba(255,255,255,0.85);text-decoration:none;}
        .req-footer-bottom a:hover{color:white;}
        .req-footer-bottom-center{color:white;font-weight:500;white-space:nowrap;}
        .req-footer-bottom-right{display:flex;align-items:center;justify-content:flex-end;gap:1rem;}
        .req-footer-divider{color:rgba(255,255,255,0.3);}

        @media(max-width:768px){
          .req-nav-links,.req-nav-cta{display:none;}
          .req-hamburger{display:flex;}
          .req-grid{grid-template-columns:1fr;}
          .req-sidebar-card{position:static;}
          .req-footer-inner{grid-template-columns:1fr 1fr;gap:1.5rem;}
          .req-footer-bottom-inner{grid-template-columns:1fr;text-align:center;gap:0.5rem;}
          .req-footer-bottom-right{justify-content:center;}
        }
        @media(max-width:540px){
          .req-row{grid-template-columns:1fr;}
          .req-footer-inner{grid-template-columns:1fr;}
          .req-footer{padding:2rem 1rem 0;}
          .req-footer-bottom{margin:0 -1rem;padding:1rem;}
        }
      `}</style>

      <nav className="req-nav">
        <div className="req-nav-inner">
          <a href="/" className="req-nav-logo">
            <img src="/mercorama-logo-footer.png" alt="Mercorama" />
          </a>
          <ul className="req-nav-links">
            <li><a href="/">Home</a></li>
            <li className="req-has-drop">
              <button className="req-drop-trigger">Solutions <ChevronDown className="chev" /></button>
              <div className="req-dropdown">
                <a href="/solutions/foodbeverage.html" className="req-drop-item">
                  <div className="req-drop-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></div>
                  <div><div className="req-drop-title">Food &amp; Beverage</div><div className="req-drop-sub">CPG export intelligence</div></div>
                </a>
                <a href="/solutions/seafood.html" className="req-drop-item">
                  <div className="req-drop-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6z"/><path d="M18 12v.5"/><path d="M16 17.93a9.77 9.77 0 0 1 0-11.86"/><path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 3.5-.08 6.48 2.38 8.56"/><path d="M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4"/><path d="m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H8a24.83 24.83 0 0 0 5.3-5.2"/></svg></div>
                  <div><div className="req-drop-title">Seafood &amp; Ocean Products</div><div className="req-drop-sub">Atlantic Canada export intelligence</div></div>
                </a>
              </div>
            </li>
            <li className="req-has-drop">
              <button className="req-drop-trigger">Experts <ChevronDown className="chev" /></button>
              <div className="req-dropdown">
                <a href="/experts.html#why-experts" className="req-drop-item">
                  <div className="req-drop-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg></div>
                  <div><div className="req-drop-title">Why Experts?</div><div className="req-drop-sub">The case for human guidance</div></div>
                </a>
                <a href="/experts/search.html" className="req-drop-item">
                  <div className="req-drop-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
                  <div><div className="req-drop-title">Find Experts</div><div className="req-drop-sub">Browse by country or industry</div></div>
                </a>
                <a href="/experts/join.html" className="req-drop-item">
                  <div className="req-drop-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg></div>
                  <div><div className="req-drop-title">Join as Expert</div><div className="req-drop-sub">Apply to the network</div></div>
                </a>
              </div>
            </li>
            <li className="req-has-drop">
              <button className="req-drop-trigger">About <ChevronDown className="chev" /></button>
              <div className="req-dropdown">
                <a href="/about.html" className="req-drop-item">
                  <div className="req-drop-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg></div>
                  <div><div className="req-drop-title">Mission &amp; Story</div><div className="req-drop-sub">Our story and values</div></div>
                </a>
                <a href="/data-sources.html" className="req-drop-item">
                  <div className="req-drop-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg></div>
                  <div><div className="req-drop-title">Data Sources</div><div className="req-drop-sub">Where our intelligence comes from</div></div>
                </a>
                <a href="/data-retention.html" className="req-drop-item">
                  <div className="req-drop-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
                  <div><div className="req-drop-title">Data Retention</div><div className="req-drop-sub">How we handle your data</div></div>
                </a>
              </div>
            </li>
            <li><a href="/contact.html">Contact</a></li>
          </ul>
          <div className="req-nav-cta">
            <a href="/early-access.html" className="req-btn-demo">Book a Demo</a>
          </div>
          <button className="req-hamburger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Open menu">
            <span /><span /><span />
          </button>
        </div>
        <div className={`req-mobile-menu${mobileOpen ? ' open' : ''}`}>
          <a href="/">Home</a>
          <a href="/solutions/foodbeverage.html">Food &amp; Beverage</a>
          <a href="/solutions/seafood.html">Seafood &amp; Ocean Products</a>
          <a href="/experts.html">Why Experts?</a>
          <a href="/experts/search.html">Find Experts</a>
          <a href="/experts/join.html">Join as Expert</a>
          <a href="/about.html">About</a>
          <a href="/contact.html">Contact</a>
          <div style={{ marginTop: '1rem' }}>
            <a href="/early-access.html" className="req-btn-demo" style={{ width: '100%', justifyContent: 'center' }}>Book a Demo</a>
          </div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 style={{ width: 32, height: 32, animation: 'spin 1s linear infinite', color: '#5A6A7A' }} />
        </div>
      ) : submitted ? (
        <div className="req-success">
          <div className="req-success-inner">
            <div className="req-success-icon">
              <CheckCircle2 style={{ width: 32, height: 32, color: '#16a34a' }} />
            </div>
            <h1>Request Submitted</h1>
            <p>Your consultation request has been sent to {expert?.headline.split('—')[0].trim() ?? 'the expert'}. They&apos;ll review your requirements and respond with a proposal — typically within 1–2 business days.</p>
            <p>We&apos;ll notify you at <strong style={{ color: '#0B1F3A' }}>{form.contact_email}</strong> when they respond.</p>
            <a href="/experts/search.html" className="req-success-btn">Browse More Experts</a>
          </div>
        </div>
      ) : (
        <div className="req-page">
          <div className="req-page-inner">
            <a href={`/experts/${slug}.html`} className="req-back">
              <ArrowLeft style={{ width: 15, height: 15 }} /> Back to profile
            </a>
            <div className="req-grid">
              {/* Form */}
              <div className="req-form-card">
                <div className="req-form-title">Request a Consultation</div>
                <div className="req-form-sub">Describe what you need help with. The expert will review your request and respond with a tailored proposal.</div>
                <form onSubmit={handleSubmit}>
                  <div className="req-field">
                    <label className="req-label">What do you need help with? *</label>
                    <textarea
                      className="req-textarea"
                      value={form.description}
                      onChange={(e) => update('description', e.target.value)}
                      placeholder="E.g., We're a Nova Scotia seafood exporter looking to enter the EU market under CETA. Need help with market sizing, regulatory requirements, and identifying potential distributors..."
                      required
                    />
                  </div>
                  <div className="req-field">
                    <label className="req-label">Target market</label>
                    <input
                      className="req-input"
                      value={form.target_market}
                      onChange={(e) => update('target_market', e.target.value)}
                      placeholder="E.g., European Union, Germany, Japan, Southeast Asia..."
                    />
                  </div>
                  <div className="req-field">
                    <label className="req-label">Type of engagement</label>
                    <select
                      className="req-select"
                      value={form.engagement_type}
                      onChange={(e) => update('engagement_type', e.target.value)}
                    >
                      <option value="not_sure">Not sure yet</option>
                      <option value="advisory_call">Advisory Call</option>
                      <option value="project_based">Project-Based Engagement</option>
                    </select>
                  </div>
                  <div className="req-row req-field">
                    <div>
                      <label className="req-label">Timeline (optional)</label>
                      <input
                        className="req-input"
                        value={form.timeline}
                        onChange={(e) => update('timeline', e.target.value)}
                        placeholder="E.g., Within 2 weeks, Q3 2026..."
                      />
                    </div>
                    <div>
                      <label className="req-label">Budget range (optional)</label>
                      <input
                        className="req-input"
                        value={form.budget_range}
                        onChange={(e) => update('budget_range', e.target.value)}
                        placeholder="E.g., $500–$2,000 CAD"
                      />
                    </div>
                  </div>
                  <div className="req-field">
                    <label className="req-label">Your email *</label>
                    <input
                      className="req-input"
                      type="email"
                      value={form.contact_email}
                      onChange={(e) => update('contact_email', e.target.value)}
                      placeholder="you@company.com"
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: '#5A6A7A', marginTop: '0.25rem' }}>We&apos;ll notify you when the expert responds.</span>
                  </div>
                  <div className="req-ack">
                    <input id="ack" type="checkbox" required />
                    <label htmlFor="ack">
                      I acknowledge that any advice provided through Mercorama is for informational purposes only, used at my own discretion and risk, and does not constitute legal, financial, or regulatory advice.{' '}
                      <a href="/terms.html" target="_blank" rel="noopener noreferrer">Terms of Service</a>
                    </label>
                  </div>
                  {error && <p className="req-error">{error}</p>}
                  <button type="submit" className="req-submit" disabled={submitting}>
                    {submitting ? <Loader2 style={{ width: 16, height: 16 }} /> : <Send style={{ width: 16, height: 16 }} />}
                    Submit Request
                  </button>
                  <p className="req-note">Mercorama facilitates discovery only. No fees until you accept a proposal.</p>
                </form>
              </div>

              {/* Sidebar */}
              {expert && (
                <div className="req-sidebar-card">
                  <div className="req-expert-head">
                    <div className="req-avatar">
                      {expert.avatar_url && (
                        <Image src={expert.avatar_url} alt="" width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                    <div>
                      <div className="req-expert-name">{expert.headline.split('—')[0].trim()}</div>
                      <div className="req-expert-loc">{expert.location}</div>
                    </div>
                  </div>
                  {(expert.types ?? []).length > 0 && (
                    <div className="req-tags">
                      {(expert.types ?? []).map((t: { id: string; name: string }) => (
                        <span key={t.id} className="req-tag">{t.name}</span>
                      ))}
                    </div>
                  )}
                  {(expert.tags ?? []).length > 0 && (
                    <div className="req-tags" style={{ marginBottom: '1rem' }}>
                      {(expert.tags ?? []).slice(0, 6).map((t: { id: string; name: string }) => (
                        <span key={t.id} style={{ fontSize: '0.7rem', background: '#F0F4F8', color: '#5A6A7A', borderRadius: 4, padding: '0.2rem 0.5rem' }}>{t.name}</span>
                      ))}
                    </div>
                  )}
                  <div className="req-next">
                    <strong>What happens next?</strong>
                    <span>1. Expert reviews your request</span>
                    <span>2. Sends a tailored proposal with scope and pricing</span>
                    <span>3. You decide whether to proceed</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="req-footer">
        <div className="req-footer-inner">
          <div className="req-footer-brand">
            <img src="/mercorama-logo-footer.png" alt="Mercorama" />
            <p className="req-footer-tagline">AI-powered trade intelligence for Canadian exporters.</p>
            <div className="req-footer-social">
              <a href="https://linkedin.com/company/mercorama" className="req-footer-si" aria-label="LinkedIn" target="_blank" rel="noopener">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
              <a href="mailto:hello@mercorama.com" className="req-footer-si" aria-label="Email">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </a>
            </div>
          </div>
          <div>
            <div className="req-footer-col-head">Solutions</div>
            <div className="req-footer-links">
              <a className="req-footer-link" href="/solutions/foodbeverage.html">Food &amp; Beverage</a>
              <a className="req-footer-link" href="/solutions/seafood.html">Seafood &amp; Ocean Products</a>
              <a className="req-footer-link" href="/early-access.html">Early Access</a>
            </div>
          </div>
          <div>
            <div className="req-footer-col-head">Experts</div>
            <div className="req-footer-links">
              <a className="req-footer-link" href="/experts.html">Why Experts?</a>
              <a className="req-footer-link" href="/experts/search.html">Find Experts</a>
              <a className="req-footer-link" href="/experts/join.html">Join as Expert</a>
            </div>
          </div>
          <div>
            <div className="req-footer-col-head">Company</div>
            <div className="req-footer-links">
              <a className="req-footer-link" href="/about.html">About</a>
              <a className="req-footer-link" href="/data-sources.html">Data Sources</a>
              <a className="req-footer-link" href="/data-retention.html">Data Retention</a>
              <a className="req-footer-link" href="/contact.html">Contact Us</a>
              <a className="req-footer-link" href="/early-access.html">Book a Demo</a>
            </div>
          </div>
        </div>
        <div className="req-footer-bottom">
          <div className="req-footer-bottom-inner">
            <div>© 2026 Mercorama. All rights reserved. · Powered by <a href="https://mightyiq.ca" target="_blank" rel="noopener" style={{ fontWeight: 600 }}>MightyIQ Inc.</a></div>
            <div className="req-footer-bottom-center">Halifax, Nova Scotia, Canada 🍁</div>
            <div className="req-footer-bottom-right">
              <a href="/privacy.html">Privacy Policy</a>
              <span className="req-footer-divider">|</span>
              <a href="/terms.html">Terms of Use</a>
              <span className="req-footer-divider">|</span>
              <a href="/data-retention.html">Data Retention</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
