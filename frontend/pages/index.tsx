import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function LandingPage() {
  const router = useRouter();

  const goToDashboard = () => router.push('/dashboard');

  return (
    <>
      <Head>
        <title>Pedi-Growth — AI-Powered Pediatric Gait Screening</title>
        <meta name="description" content="Transform walking videos into clinical-grade biomechanical analysis. MediaPipe-powered gait screening for children." />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        .landing-page {
          --primary: #3c83f6;
          --accent: #06b6d4;
          --bg-dark: #0a0a1a;
          --surface: #121226;
          font-family: 'Space Grotesk', sans-serif;
          background: var(--bg-dark);
          color: #e2e8f0;
          overflow-x: hidden;
        }

        /* Glass Card */
        .glass-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 4px 30px rgba(0,0,0,0.1);
        }

        /* Grid Background */
        .grid-bg {
          background-size: 50px 50px;
          background-image:
            linear-gradient(to right, rgba(60,131,246,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(60,131,246,0.05) 1px, transparent 1px);
        }

        /* Neon Text Glow */
        .neon-text {
          text-shadow: 0 0 10px rgba(60,131,246,0.5), 0 0 20px rgba(60,131,246,0.3);
        }

        /* Float Animation */
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }

        /* Pulse Glow */
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .animate-pulse-glow { animation: pulse-glow 3s cubic-bezier(0.4,0,0.6,1) infinite; }

        /* Gradient text */
        .gradient-text {
          background: linear-gradient(to right, #60a5fa, #3c83f6, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Button glow */
        .btn-glow {
          box-shadow: 0 0 20px rgba(60,131,246,0.4);
          transition: all 0.3s;
        }
        .btn-glow:hover {
          box-shadow: 0 0 30px rgba(60,131,246,0.6);
        }

        .btn-header-glow {
          box-shadow: 0 0 15px rgba(60,131,246,0.5);
        }
        .btn-header-glow:hover {
          box-shadow: 0 0 25px rgba(60,131,246,0.7);
        }

        /* Feature card hover */
        .feature-card {
          transition: all 0.3s;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .feature-card:hover {
          transform: translateY(-8px);
        }
        .feature-card.blue:hover { border-color: rgba(60,131,246,0.5); }
        .feature-card.cyan:hover { border-color: rgba(6,182,212,0.5); }
        .feature-card.purple:hover { border-color: rgba(168,85,247,0.5); }

        /* Step circle */
        .step-circle {
          transition: all 0.3s;
          position: relative;
        }
        .step-circle::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1px solid transparent;
          transition: all 0.5s;
          transform: scale(1.1);
          opacity: 0;
        }
        .step-group:hover .step-circle::after {
          transform: scale(1.25);
          opacity: 1;
        }
        .step-group.blue:hover .step-circle { border-color: var(--primary); }
        .step-group.blue:hover .step-circle::after { border-color: rgba(60,131,246,0.2); }
        .step-group.blue:hover .step-num { color: var(--primary); }
        .step-group.cyan:hover .step-circle { border-color: var(--accent); }
        .step-group.cyan:hover .step-circle::after { border-color: rgba(6,182,212,0.2); }
        .step-group.cyan:hover .step-num { color: var(--accent); }
        .step-group.purple:hover .step-circle { border-color: #a855f7; }
        .step-group.purple:hover .step-circle::after { border-color: rgba(168,85,247,0.2); }
        .step-group.purple:hover .step-num { color: #a855f7; }
        .step-group.green:hover .step-circle { border-color: #22c55e; }
        .step-group.green:hover .step-circle::after { border-color: rgba(34,197,94,0.2); }
        .step-group.green:hover .step-num { color: #22c55e; }

        /* Stat cards */
        .stat-card {
          transition: all 0.3s;
        }
        .stat-card:hover .stat-value { text-shadow: 0 0 10px rgba(60,131,246,0.5), 0 0 20px rgba(60,131,246,0.3); }

        /* Icon hover scale */
        .icon-hover { transition: transform 0.3s; }
        .feature-card:hover .icon-hover { transform: scale(1.1); }

        /* Step card border accents */
        .step-card-blue { border-top: 4px solid rgba(60,131,246,0.5); }
        .step-card-cyan { border-top: 4px solid rgba(6,182,212,0.5); }
        .step-card-purple { border-top: 4px solid rgba(168,85,247,0.5); }
        .step-card-green { border-top: 4px solid rgba(34,197,94,0.5); }
      `}</style>

      <div className="landing-page">
        {/* Background Effects */}
        <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
          <div className="grid-bg" style={{ position:'absolute', inset:0, opacity:0.3 }} />
          <div style={{ position:'absolute', top:'-20%', left:'-10%', width:'50%', height:'50%', borderRadius:'50%', background:'rgba(60,131,246,0.15)', filter:'blur(120px)' }} />
          <div style={{ position:'absolute', bottom:'-10%', right:'-5%', width:'40%', height:'40%', borderRadius:'50%', background:'rgba(6,182,212,0.15)', filter:'blur(100px)' }} />
        </div>

        {/* Navigation */}
        <header style={{ position:'fixed', top:0, left:0, right:0, zIndex:50, borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(10,10,26,0.8)', backdropFilter:'blur(12px)' }}>
          <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px', height:80, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, background:'linear-gradient(135deg, #3c83f6, #06b6d4)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 15px rgba(60,131,246,0.2)' }}>
                <span className="material-symbols-outlined" style={{ color:'white', fontSize:24 }}>accessibility_new</span>
              </div>
              <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.025em' }}>Pedi-Growth</h1>
            </div>
            <nav style={{ display:'flex', alignItems:'center', gap:32, fontSize:14, fontWeight:500, color:'#94a3b8' }}>
              <a href="#features" style={{ color:'inherit', textDecoration:'none', transition:'color 0.3s' }}>Platform</a>
              <a href="#how-it-works" style={{ color:'inherit', textDecoration:'none', transition:'color 0.3s' }}>Technology</a>
              <a href="#stats" style={{ color:'inherit', textDecoration:'none', transition:'color 0.3s' }}>Research</a>
            </nav>
            <button
              onClick={goToDashboard}
              className="btn-header-glow"
              style={{ height:40, padding:'0 24px', borderRadius:8, background:'#3c83f6', color:'white', fontSize:14, fontWeight:700, border:'none', cursor:'pointer', transition:'all 0.3s' }}
            >
              Dashboard Login
            </button>
          </div>
        </header>

        <main style={{ position:'relative', zIndex:10, paddingTop:80 }}>
          {/* ===== HERO SECTION ===== */}
          <section style={{ position:'relative', minHeight:'90vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 24px', overflow:'hidden' }}>
            <div style={{ maxWidth:1280, width:'100%', display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'center' }}>
              {/* Hero Content */}
              <div style={{ display:'flex', flexDirection:'column', gap:24, position:'relative', zIndex:20 }}>
                <div className="glass-card" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'4px 12px', borderRadius:999, width:'fit-content', borderColor:'rgba(60,131,246,0.3)' }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:'#06b6d4', animation:'pulse-glow 2s infinite' }} />
                  <span style={{ fontSize:11, fontWeight:600, color:'#06b6d4', textTransform:'uppercase', letterSpacing:'0.1em' }}>v2.0 MediaPipe Engine Live</span>
                </div>

                <h1 style={{ fontSize:'clamp(2.5rem, 5vw, 4.5rem)', fontWeight:700, lineHeight:1.1, letterSpacing:'-0.025em' }}>
                  <span className="gradient-text">AI-Powered</span><br/>
                  Pediatric Gait Screening
                </h1>

                <p style={{ fontSize:18, color:'#94a3b8', maxWidth:560, lineHeight:1.7 }}>
                  Transform video into precise clinical biomechanics. Next-generation MediaPipe analysis providing knee flexion, stride length, and posture data in seconds.
                </p>

                <div style={{ display:'flex', gap:16, paddingTop:16, flexWrap:'wrap' }}>
                  <button
                    onClick={goToDashboard}
                    className="btn-glow"
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', height:56, padding:'0 32px', borderRadius:12, background:'linear-gradient(to right, #3c83f6, #2563eb)', color:'white', fontWeight:700, fontSize:18, border:'none', cursor:'pointer', gap:8 }}
                  >
                    Start Analysis
                    <span className="material-symbols-outlined" style={{ fontSize:20 }}>arrow_forward</span>
                  </button>
                  <button
                    className="glass-card"
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', height:56, padding:'0 32px', borderRadius:12, color:'white', fontWeight:500, border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', background:'transparent', gap:8 }}
                  >
                    <span className="material-symbols-outlined">play_circle</span>
                    View Demo
                  </button>
                </div>

                {/* Trust Badges */}
                <div style={{ paddingTop:32, display:'flex', gap:24, opacity:0.5, filter:'grayscale(1)', transition:'all 0.5s' }}>
                  {['CLINIC A', 'MEDTECH', 'HEALTHAI'].map(name => (
                    <div key={name} style={{ height:32, width:96, background:'rgba(255,255,255,0.1)', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>{name}</div>
                  ))}
                </div>
              </div>

              {/* Hero Visual — 3D Skeleton */}
              <div style={{ position:'relative', height:500, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle, rgba(60,131,246,0.1), transparent)', opacity:0.5 }} />
                <div className="animate-float" style={{ position:'relative', width:'100%', height:'100%', maxWidth:400, margin:'0 auto' }}>
                  <div style={{ position:'absolute', inset:0, borderRadius:24, border:'1px solid rgba(60,131,246,0.2)', background:'linear-gradient(to bottom, rgba(60,131,246,0.05), transparent)', backdropFilter:'blur(4px)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <img
                      alt="Holographic wireframe of human anatomy for gait analysis"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuB__HF1uc0hZDtOmto4JYnERcb1O1nQJXCtTu6KrqOiEwYKVyyNCXN_otOd-4k7hzaE4AAu0jjN02VjrY6DieOBDdxJG5GG_NZ3dvFX-89TwUFy0MyGf-yaSbxFsqVuxuLlQ1zqBl4xRNSVqihY_Rx7t_Cm-qhK0BVOqUHOMTCb7wbMS2LMossNrB23dhXyd2J8g9_cAXrUVavvnP_1l_xPmD5qcDwUnumciJ8WIZ8J_lZKHQSoxVqM7ZBNfMgnDStEp3Jxi00VulS0"
                      style={{ objectFit:'cover', opacity:0.6, mixBlendMode:'screen', height:'80%', width:'auto', filter:'contrast(1.5) brightness(1.5) hue-rotate(180deg)' }}
                    />
                    {/* Glowing joints */}
                    <div style={{ position:'absolute', top:'25%', left:'25%', width:12, height:12, background:'#06b6d4', borderRadius:'50%', boxShadow:'0 0 15px #06b6d4', animation:'pulse-glow 2s infinite' }} />
                    <div style={{ position:'absolute', top:'25%', right:'25%', width:12, height:12, background:'#06b6d4', borderRadius:'50%', boxShadow:'0 0 15px #06b6d4', animation:'pulse-glow 2s 0.3s infinite' }} />
                    <div style={{ position:'absolute', bottom:'33%', left:'33%', width:12, height:12, background:'#3c83f6', borderRadius:'50%', boxShadow:'0 0 15px #3c83f6', animation:'pulse-glow 2s 0.6s infinite' }} />
                    <div style={{ position:'absolute', bottom:'33%', right:'33%', width:12, height:12, background:'#3c83f6', borderRadius:'50%', boxShadow:'0 0 15px #3c83f6', animation:'pulse-glow 2s 0.9s infinite' }} />
                    {/* Connecting Lines */}
                    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', stroke:'rgba(6,182,212,0.4)', strokeWidth:1 }}>
                      <line x1="25%" y1="25%" x2="75%" y2="25%" />
                      <line x1="25%" y1="25%" x2="33%" y2="66%" />
                      <line x1="75%" y1="25%" x2="66%" y2="66%" />
                    </svg>
                    {/* Floating data tags */}
                    <div className="glass-card" style={{ position:'absolute', top:'20%', right:'10%', padding:'4px 12px', borderRadius:4, fontSize:12, color:'#06b6d4', fontFamily:'monospace', borderLeft:'2px solid #06b6d4' }}>
                      Flexion: 45°
                    </div>
                    <div className="glass-card" style={{ position:'absolute', bottom:'30%', left:'10%', padding:'4px 12px', borderRadius:4, fontSize:12, color:'#3c83f6', fontFamily:'monospace', borderLeft:'2px solid #3c83f6' }}>
                      Stride: 0.8m
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== STATS SECTION ===== */}
          <section id="stats" style={{ padding:'40px 0', borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(0,0,0,0.2)' }}>
            <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:24 }}>
                {[
                  { value: '33', label: 'Landmarks Tracked' },
                  { value: '< 2 min', label: 'Processing Time' },
                  { value: 'H.264', label: 'Video Support' },
                  { value: 'HIPAA', label: 'Compliant Ready' },
                ].map(stat => (
                  <div key={stat.label} className="glass-card stat-card" style={{ padding:24, borderRadius:12, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', gap:8 }}>
                    <span className="stat-value" style={{ fontSize:30, fontWeight:700, color:'white', transition:'all 0.3s' }}>{stat.value}</span>
                    <span style={{ fontSize:14, color:'#94a3b8', fontWeight:500 }}>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ===== FEATURES SECTION ===== */}
          <section id="features" style={{ padding:'96px 24px', position:'relative' }}>
            <div style={{ maxWidth:1280, margin:'0 auto' }}>
              <div style={{ textAlign:'center', marginBottom:64 }}>
                <h2 style={{ fontSize:'clamp(1.75rem, 4vw, 3rem)', fontWeight:700, marginBottom:16 }}>Advanced Clinical Features</h2>
                <p style={{ color:'#94a3b8', maxWidth:640, margin:'0 auto', fontSize:18 }}>Leverage state-of-the-art computer vision to automate gait analysis without the need for wearable sensors.</p>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:32 }}>
                {/* Feature 1 */}
                <div className="glass-card feature-card blue" style={{ padding:32, borderRadius:16 }}>
                  <div style={{ width:56, height:56, borderRadius:12, background:'rgba(60,131,246,0.1)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24 }}>
                    <span className="material-symbols-outlined icon-hover" style={{ color:'#3c83f6', fontSize:30 }}>videocam</span>
                  </div>
                  <h3 style={{ fontSize:20, fontWeight:700, color:'white', marginBottom:12 }}>AI Video Analysis</h3>
                  <p style={{ color:'#94a3b8', lineHeight:1.7 }}>Automated joint tracking using computer vision. Upload standard video from any device and get mocap-quality data instantly.</p>
                </div>
                {/* Feature 2 */}
                <div className="glass-card feature-card cyan" style={{ padding:32, borderRadius:16, position:'relative' }}>
                  <div style={{ width:56, height:56, borderRadius:12, background:'rgba(6,182,212,0.1)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24 }}>
                    <span className="material-symbols-outlined icon-hover" style={{ color:'#06b6d4', fontSize:30 }}>monitoring</span>
                  </div>
                  <h3 style={{ fontSize:20, fontWeight:700, color:'white', marginBottom:12 }}>Clinical Metrics</h3>
                  <p style={{ color:'#94a3b8', lineHeight:1.7 }}>Detailed knee flexion, cadence, & stride length data visualized in interactive charts for immediate clinical assessment.</p>
                </div>
                {/* Feature 3 */}
                <div className="glass-card feature-card purple" style={{ padding:32, borderRadius:16 }}>
                  <div style={{ width:56, height:56, borderRadius:12, background:'rgba(168,85,247,0.1)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24 }}>
                    <span className="material-symbols-outlined icon-hover" style={{ color:'#a78bfa', fontSize:30 }}>neurology</span>
                  </div>
                  <h3 style={{ fontSize:20, fontWeight:700, color:'white', marginBottom:12 }}>AI Clinical Summary</h3>
                  <p style={{ color:'#94a3b8', lineHeight:1.7 }}>LLM-generated patient reports and insights. Our models synthesize data into readable summaries for patient records.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ===== HOW IT WORKS ===== */}
          <section id="how-it-works" style={{ padding:'96px 24px', background:'linear-gradient(to bottom, transparent, rgba(0,0,0,0.4))' }}>
            <div style={{ maxWidth:1280, margin:'0 auto' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:64, gap:24, flexWrap:'wrap' }}>
                <div>
                  <h2 style={{ fontSize:'clamp(1.75rem, 4vw, 3rem)', fontWeight:700, marginBottom:16 }}>How It Works</h2>
                  <p style={{ color:'#94a3b8' }}>From upload to insight in four simple steps.</p>
                </div>
              </div>

              <div style={{ position:'relative' }}>
                {/* Connecting Line */}
                <div style={{ display:'none', position:'absolute', top:32, left:0, right:0, height:2, background:'linear-gradient(to right, #1e293b, #3c83f6, #1e293b)' }} className="step-line" />
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:48, position:'relative', zIndex:10 }}>
                  {[
                    { num: '01', icon: 'upload_file', title: 'Upload Video', desc: 'Securely upload patient footage via our HIPAA-compliant portal. Supports standard formats.', color: 'blue', iconColor: '#3c83f6', cardClass: 'step-card-blue' },
                    { num: '02', icon: 'memory', title: 'AI Processing', desc: 'Our engine identifies 33 skeletal landmarks and tracks movement frame-by-frame.', color: 'cyan', iconColor: '#06b6d4', cardClass: 'step-card-cyan' },
                    { num: '03', icon: 'analytics', title: 'Get Results', desc: 'View interactive biomechanical charts and replay video with overlay skeletons.', color: 'purple', iconColor: '#a78bfa', cardClass: 'step-card-purple' },
                    { num: '04', icon: 'description', title: 'AI Explanation', desc: 'Receive an automatically generated textual summary highlighting abnormalities.', color: 'green', iconColor: '#4ade80', cardClass: 'step-card-green' },
                  ].map(step => (
                    <div key={step.num} className={`step-group ${step.color}`} style={{ display:'flex', flexDirection:'column', gap:24 }}>
                      <div className="step-circle" style={{ width:64, height:64, borderRadius:'50%', background:'var(--surface)', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 0 15px rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <span className="step-num" style={{ fontSize:20, fontWeight:700, color:'#64748b', transition:'color 0.3s' }}>{step.num}</span>
                      </div>
                      <div className={`glass-card ${step.cardClass}`} style={{ padding:24, borderRadius:12, transition:'background 0.3s' }}>
                        <span className="material-symbols-outlined" style={{ color: step.iconColor, fontSize:30, marginBottom:12, display:'block' }}>{step.icon}</span>
                        <h3 style={{ fontSize:18, fontWeight:700, color:'white', marginBottom:8 }}>{step.title}</h3>
                        <p style={{ fontSize:14, color:'#94a3b8' }}>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ===== CTA SECTION ===== */}
          <section style={{ padding:'80px 24px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, background:'rgba(60,131,246,0.03)' }} />
            <div style={{ position:'absolute', top:'-50%', left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:800, height:500, background:'rgba(60,131,246,0.15)', filter:'blur(150px)', borderRadius:'50%' }} />
            <div className="glass-card" style={{ maxWidth:896, margin:'0 auto', textAlign:'center', position:'relative', zIndex:10, padding:48, borderRadius:24, border:'1px solid rgba(255,255,255,0.1)', boxShadow:'0 25px 50px rgba(60,131,246,0.1)' }}>
              <h2 style={{ fontSize:'clamp(1.75rem, 4vw, 3rem)', fontWeight:700, marginBottom:24, color:'white' }}>Ready to modernize your pediatric analysis?</h2>
              <p style={{ fontSize:20, color:'#cbd5e1', marginBottom:32, maxWidth:640, margin:'0 auto 32px' }}>Join the leading clinics using Pedi-Growth for faster, more accurate gait assessments.</p>
              <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
                <button
                  onClick={goToDashboard}
                  style={{ height:56, padding:'0 32px', borderRadius:12, background:'#3c83f6', color:'white', fontWeight:700, fontSize:18, border:'none', cursor:'pointer', boxShadow:'0 0 20px rgba(60,131,246,0.4)', transition:'all 0.3s' }}
                >
                  Get Started Now
                </button>
                <button style={{ height:56, padding:'0 32px', borderRadius:12, background:'transparent', border:'1px solid rgba(255,255,255,0.2)', color:'white', fontWeight:500, cursor:'pointer', transition:'all 0.3s' }}>
                  Schedule Demo
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* ===== FOOTER ===== */}
        <footer style={{ borderTop:'1px solid rgba(255,255,255,0.05)', background:'var(--bg-dark)', padding:'48px 24px', position:'relative', zIndex:10 }}>
          <div style={{ maxWidth:1280, margin:'0 auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:24, marginBottom:32, flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:32, height:32, background:'linear-gradient(135deg, #3c83f6, #06b6d4)', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span className="material-symbols-outlined" style={{ color:'white', fontSize:18 }}>accessibility_new</span>
                </div>
                <span style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.025em', color:'white' }}>Pedi-Growth</span>
              </div>
              <div style={{ display:'flex', gap:32, fontSize:14, color:'#94a3b8' }}>
                <a href="#" style={{ color:'inherit', textDecoration:'none' }}>Privacy Policy</a>
                <a href="#" style={{ color:'inherit', textDecoration:'none' }}>Terms of Service</a>
                <a href="#" style={{ color:'inherit', textDecoration:'none' }}>HIPAA Compliance</a>
                <a href="#" style={{ color:'inherit', textDecoration:'none' }}>Contact Support</a>
              </div>
            </div>
            <div style={{ fontSize:12, color:'#475569' }}>
              © {new Date().getFullYear()} Pedi-Growth Inc. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
