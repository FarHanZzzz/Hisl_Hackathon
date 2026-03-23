import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { LampContainer } from '@/components/ui/lamp';
import { ArrowRight, PlayCircle, Video, Activity, BrainCircuit, Upload, Cpu, BarChart, FileText, Activity as ActivityIcon } from 'lucide-react';

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
          --lp-primary: #06b6d4;
          --lp-accent: #22d3ee;
          font-family: 'Space Grotesk', sans-serif;
          background: #020617; /* slate-950 */
          color: #f8fafc; /* slate-50 */
          overflow-x: hidden;
        }

        /* Glass Card */
        .glass-card {
          background: rgba(15, 23, 42, 0.4); /* slate-900 */
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(6, 182, 212, 0.2); /* cyan-500 */
          box-shadow: 0 4px 30px rgba(0,0,0,0.5);
        }

        /* Grid Background (Dark Mode Optimized) */
        .grid-bg {
          background-size: 50px 50px;
          background-image:
            linear-gradient(to right, rgba(6, 182, 212, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6, 182, 212, 0.05) 1px, transparent 1px);
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
          background: linear-gradient(to right, #67e8f9, #06b6d4, #0891b2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Button glow */
        .btn-glow {
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.4);
          transition: all 0.3s;
        }
        .btn-glow:hover {
          box-shadow: 0 0 30px rgba(6, 182, 212, 0.6);
        }

        /* Feature card hover */
        .feature-card {
          transition: all 0.3s;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .feature-card:hover {
          transform: translateY(-8px);
        }
        .feature-card.blue:hover { border-color: rgba(6, 182, 212, 0.5); }
        .feature-card.cyan:hover { border-color: rgba(34, 211, 238, 0.5); }
        .feature-card.purple:hover { border-color: rgba(8, 145, 178, 0.5); }

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
        .step-group .step-circle { border-color: rgba(6, 182, 212, 0.3); }
        .step-group:hover .step-circle { border-color: var(--lp-primary); }
        .step-group:hover .step-circle::after { border-color: rgba(6, 182, 212, 0.2); }
        .step-group:hover .step-num { color: var(--lp-primary); }

        /* Stat cards */
        .stat-card {
          transition: all 0.3s;
          background: rgba(2, 6, 23, 0.6);
          border: 1px solid rgba(6, 182, 212, 0.1);
        }
        .stat-card:hover {
           border-color: rgba(6, 182, 212, 0.4);
        }
        .stat-card:hover .stat-value { text-shadow: 0 0 10px rgba(6, 182, 212, 0.5), 0 0 20px rgba(6, 182, 212, 0.3); }

        /* Icon hover scale */
        .icon-hover { transition: transform 0.3s; }
        .feature-card:hover .icon-hover { transform: scale(1.1); }

        /* Step card border accents */
        .step-card { border-top: 4px solid rgba(6, 182, 212, 0.3); }
        .step-group:hover .step-card { border-top-color: rgba(6, 182, 212, 0.8); }
      `}</style>

      <div className="landing-page">
        {/* Background Effects */}
        <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
          <div className="grid-bg" style={{ position:'absolute', inset:0, opacity:0.1 }} />
        </div>

        <main style={{ position:'relative', zIndex:10 }}>
          {/* ===== HERO SECTION ===== */}
          <LampContainer>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginTop: '-10vh' }}>
              <div className="glass-card" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'4px 12px', borderRadius:999, width:'fit-content', borderColor:'rgba(6,182,212,0.3)', marginBottom: '2rem' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#06b6d4', animation:'pulse-glow 2s infinite' }} />
                <span style={{ fontSize:11, fontWeight:600, color:'#06b6d4', textTransform:'uppercase', letterSpacing:'0.1em' }}>v2.0 AI Engine Live</span>
              </div>

              <motion.h1
                initial={{ opacity: 0.5, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.3,
                  duration: 0.8,
                  ease: "easeInOut",
                }}
                className="bg-gradient-to-br from-slate-200 to-slate-400 py-4 bg-clip-text text-center text-5xl font-bold tracking-tight text-transparent md:text-7xl"
              >
                AI-Powered <br /> Pediatric Gait Screening
              </motion.h1>

              <motion.p
                initial={{ opacity: 0.5, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                style={{ fontSize: 18, color: '#94a3b8', maxWidth: 640, textAlign: 'center', marginTop: 16, lineHeight: 1.7 }}
              >
                Transform video into precise clinical biomechanics. Next-generation MediaPipe analysis providing knee flexion, stride length, and posture data in seconds.
              </motion.p>

              <motion.div
                initial={{ opacity: 0.5, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}
              >
                <button
                  onClick={goToDashboard}
                  className="btn-glow"
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', height:56, padding:'0 32px', borderRadius:12, background:'linear-gradient(to right, #0891b2, #06b6d4)', color:'white', fontWeight:700, fontSize:18, border:'none', cursor:'pointer', gap:8 }}
                >
                  Start Analysis
                  <ArrowRight size={20} />
                </button>
                <button
                  className="glass-card"
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', height:56, padding:'0 32px', borderRadius:12, color:'#f8fafc', fontWeight:500, border:'1px solid rgba(6,182,212,0.3)', cursor:'pointer', background:'transparent', gap:8 }}
                >
                  <PlayCircle size={20} />
                  View Demo
                </button>
              </motion.div>
            </div>
          </LampContainer>

          {/* ===== STATS SECTION ===== */}
          <section id="stats" style={{ padding:'40px 0', borderTop:'1px solid rgba(6,182,212,0.1)', borderBottom:'1px solid rgba(6,182,212,0.1)', background:'rgba(0,0,0,0.2)' }}>
            <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:24 }}>
                {[
                  { value: '33', label: 'Landmarks Tracked' },
                  { value: '< 2 min', label: 'Processing Time' },
                  { value: 'H.264', label: 'Video Support' },
                  { value: 'HIPAA', label: 'Compliant Ready' },
                ].map(stat => (
                  <div key={stat.label} className="glass-card stat-card" style={{ padding:24, borderRadius:12, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', gap:8 }}>
                    <span className="stat-value" style={{ fontSize:30, fontWeight:700, color:'#f8fafc', transition:'all 0.3s' }}>{stat.value}</span>
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
                  <div style={{ width:56, height:56, borderRadius:12, background:'rgba(6,182,212,0.1)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24 }}>
                    <Video className="icon-hover" color="#06b6d4" size={30} />
                  </div>
                  <h3 style={{ fontSize:20, fontWeight:700, color:'#f8fafc', marginBottom:12 }}>AI Video Analysis</h3>
                  <p style={{ color:'#94a3b8', lineHeight:1.7 }}>Automated joint tracking using computer vision. Upload standard video from any device and get mocap-quality data instantly.</p>
                </div>
                {/* Feature 2 */}
                <div className="glass-card feature-card cyan" style={{ padding:32, borderRadius:16, position:'relative' }}>
                  <div style={{ width:56, height:56, borderRadius:12, background:'rgba(34,211,238,0.1)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24 }}>
                    <Activity className="icon-hover" color="#22d3ee" size={30} />
                  </div>
                  <h3 style={{ fontSize:20, fontWeight:700, color:'#f8fafc', marginBottom:12 }}>Clinical Metrics</h3>
                  <p style={{ color:'#94a3b8', lineHeight:1.7 }}>Detailed knee flexion, cadence, & stride length data visualized in interactive charts for immediate clinical assessment.</p>
                </div>
                {/* Feature 3 */}
                <div className="glass-card feature-card purple" style={{ padding:32, borderRadius:16 }}>
                  <div style={{ width:56, height:56, borderRadius:12, background:'rgba(8,145,178,0.1)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24 }}>
                    <BrainCircuit className="icon-hover" color="#0891b2" size={30} />
                  </div>
                  <h3 style={{ fontSize:20, fontWeight:700, color:'#f8fafc', marginBottom:12 }}>AI Clinical Summary</h3>
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
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:48, position:'relative', zIndex:10 }}>
                  {[
                    { num: '01', icon: <Upload color="#06b6d4" size={30} />, title: 'Upload Video', desc: 'Securely upload patient footage via our HIPAA-compliant portal. Supports standard formats.', img: 'https://images.unsplash.com/photo-1576091160550-2173d1000b2e?auto=format&fit=crop&q=80&w=300' },
                    { num: '02', icon: <Cpu color="#22d3ee" size={30} />, title: 'AI Processing', desc: 'Our engine identifies 33 skeletal landmarks and tracks movement frame-by-frame.', img: 'https://images.unsplash.com/photo-1551076805-e1869043e560?auto=format&fit=crop&q=80&w=300' },
                    { num: '03', icon: <BarChart color="#0891b2" size={30} />, title: 'Get Results', desc: 'View interactive biomechanical charts and replay video with overlay skeletons.', img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=300' },
                    { num: '04', icon: <FileText color="#06b6d4" size={30} />, title: 'AI Explanation', desc: 'Receive an automatically generated textual summary highlighting abnormalities.', img: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=300' },
                  ].map(step => (
                    <div key={step.num} className="step-group" style={{ display:'flex', flexDirection:'column', gap:24 }}>
                      <div className="step-circle" style={{ width:64, height:64, borderRadius:'50%', background:'#020617', border:'1px solid rgba(6,182,212,0.2)', boxShadow:'0 0 15px rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <span className="step-num" style={{ fontSize:20, fontWeight:700, color:'#64748b', transition:'color 0.3s' }}>{step.num}</span>
                      </div>
                      <div className="glass-card step-card" style={{ padding:24, borderRadius:12, transition:'background 0.3s' }}>
                        <div style={{ marginBottom: 16, height: 120, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(6,182,212,0.1)' }}>
                          <img src={step.img} alt={step.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                        </div>
                        <div style={{ marginBottom:12, display:'block' }}>{step.icon}</div>
                        <h3 style={{ fontSize:18, fontWeight:700, color:'#f8fafc', marginBottom:8 }}>{step.title}</h3>
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
            <div style={{ position:'absolute', inset:0, background:'rgba(6,182,212,0.03)' }} />
            <div style={{ position:'absolute', top:'-50%', left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:800, height:500, background:'rgba(6,182,212,0.15)', filter:'blur(150px)', borderRadius:'50%' }} />
            <div className="glass-card" style={{ maxWidth:896, margin:'0 auto', textAlign:'center', position:'relative', zIndex:10, padding:48, borderRadius:24, border:'1px solid rgba(6,182,212,0.3)', boxShadow:'0 25px 50px rgba(6,182,212,0.1)' }}>
              <h2 style={{ fontSize:'clamp(1.75rem, 4vw, 3rem)', fontWeight:700, marginBottom:24, color:'#f8fafc' }}>Ready to modernize your pediatric analysis?</h2>
              <p style={{ fontSize:20, color:'#94a3b8', marginBottom:32, maxWidth:640, margin:'0 auto 32px' }}>Join the leading clinics using Pedi-Growth for faster, more accurate gait assessments.</p>
              <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
                <button
                  onClick={goToDashboard}
                  className="btn-glow"
                  style={{ height:56, padding:'0 32px', borderRadius:12, background:'linear-gradient(to right, #0891b2, #06b6d4)', color:'white', fontWeight:700, fontSize:18, border:'none', cursor:'pointer', transition:'all 0.3s' }}
                >
                  Get Started Now
                </button>
                <button style={{ height:56, padding:'0 32px', borderRadius:12, background:'transparent', border:'1px solid rgba(6,182,212,0.4)', color:'#f8fafc', fontWeight:500, cursor:'pointer', transition:'all 0.3s' }}>
                  Schedule Demo
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* ===== FOOTER ===== */}
        <footer style={{ borderTop:'1px solid rgba(6,182,212,0.1)', background:'#020617', padding:'48px 24px', position:'relative', zIndex:10 }}>
          <div style={{ maxWidth:1280, margin:'0 auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:24, marginBottom:32, flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:32, height:32, background:'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <ActivityIcon color="white" size={18} />
                </div>
                <span style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.025em', color:'#f8fafc' }}>Pedi-Growth</span>
              </div>
              <div style={{ display:'flex', gap:32, fontSize:14, color:'#94a3b8' }}>
                <a href="#" style={{ color:'inherit', textDecoration:'none' }}>Privacy Policy</a>
                <a href="#" style={{ color:'inherit', textDecoration:'none' }}>Terms of Service</a>
                <a href="#" style={{ color:'inherit', textDecoration:'none' }}>HIPAA Compliance</a>
                <a href="#" style={{ color:'inherit', textDecoration:'none' }}>Contact Support</a>
              </div>
            </div>
            <div style={{ fontSize:12, color:'#94a3b8', opacity:0.8 }}>
              © {new Date().getFullYear()} Pedi-Growth Inc. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
