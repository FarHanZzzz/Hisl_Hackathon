import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { LampContainer } from '@/components/ui/lamp';
import { FeatureSteps } from '@/components/ui/feature-section';
import { Feature } from '@/components/ui/feature';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { cn } from "@/lib/utils";
import { ArrowRight, PlayCircle, Video, Activity, BrainCircuit, Upload, Cpu, BarChart, FileText, Activity as ActivityIcon, Crosshair, Timer, FileVideo, ShieldCheck } from 'lucide-react';

const statsCards = [
  {
    id: 1,
    className: "col-span-1",
    icon: <Crosshair size={40} strokeWidth={1.5} />,
    title: "33",
    subtitle: "Landmarks Tracked",
    content: "Our AI model precisely identifies and tracks 33 critical skeletal points across the body to provide highly accurate kinematic and joint angle data.",
  },
  {
    id: 2,
    className: "col-span-1",
    icon: <Timer size={40} strokeWidth={1.5} />,
    title: "< 2 min",
    subtitle: "Processing Time",
    content: "Rapid data turnaround. Patient videos are fully processed and analyzed in under two minutes to fit seamlessly into fast-paced clinical workflows.",
  },
  {
    id: 3,
    className: "col-span-1",
    icon: <FileVideo size={40} strokeWidth={1.5} />,
    title: "H.264",
    subtitle: "Video Support",
    content: "Broad compatibility with standard H.264 video files, meaning you can record screening footage on almost any smartphone, tablet, or clinical webcam.",
  },
  {
    id: 4,
    className: "col-span-1",
    icon: <ShieldCheck size={40} strokeWidth={1.5} />,
    title: "HIPAA",
    subtitle: "Compliant Ready",
    content: "Enterprise-grade security architecture designed from the ground up to keep patient health information protected and completely private.",
  },
];

const howItWorksFeatures = [
  { 
    step: 'Step 1', 
    title: 'Upload Video',
    content: 'Securely upload patient footage via our HIPAA-compliant portal. Supports standard formats.', 
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1000&auto=format&fit=crop' 
  },
  { 
    step: 'Step 2',
    title: 'AI Processing',
    content: 'Our engine identifies 33 skeletal landmarks and tracks movement frame-by-frame.',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop'
  },
  { 
    step: 'Step 3',
    title: 'Get Results',
    content: 'View interactive biomechanical charts and replay video with overlay skeletons.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1000'
  },
  { 
    step: 'Step 4',
    title: 'AI Explanation',
    content: 'Receive an automatically generated textual summary highlighting abnormalities.',
    image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=1000'
  },
];

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
          <section id="stats" style={{ padding:'64px 0', borderTop:'1px solid rgba(6,182,212,0.1)', borderBottom:'1px solid rgba(6,182,212,0.1)', background:'rgba(0,0,0,0.2)' }}>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <h2 style={{ fontSize:'clamp(1.5rem, 3vw, 2.5rem)', fontWeight:700, color:'#f8fafc' }}>System Capabilities</h2>
              <p style={{ color:'#94a3b8', marginTop:8 }}>Hover over the features to see them glow in real-time.</p>
            </div>
            
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
              {statsCards.map((card) => (
                <li key={card.id} className="list-none min-h-[16rem]">
                  <div className="relative h-full rounded-[1.25rem] border-[1px] border-cyan-500/20 p-2 md:rounded-[1.5rem] md:p-3 transition-transform hover:-translate-y-1 duration-300">
                    <GlowingEffect
                      spread={40}
                      glow={true}
                      disabled={false}
                      proximity={64}
                      inactiveZone={0.01}
                      borderWidth={3}
                    />
                    <div className="relative flex h-full flex-col justify-center items-center gap-6 overflow-hidden rounded-xl border-[1px] border-cyan-500/10 bg-slate-900/60 p-6 md:p-8 backdrop-blur-md text-center">
                      <div className="text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                        {card.icon}
                      </div>
                      <div className="space-y-2 flex flex-col items-center">
                        <h3 className="text-3xl font-bold font-sans tracking-tight text-slate-50">
                          {card.title}
                        </h3>
                        <h2 className="font-sans text-sm md:text-base text-cyan-400 font-semibold tracking-wide uppercase">
                          {card.subtitle}
                        </h2>
                        <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-[250px]">
                          {card.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* ===== FEATURES SECTION ===== */}
          <section id="features" style={{ position: 'relative' }}>
            <Feature />
          </section>

          {/* ===== HOW IT WORKS ===== */}
          <section id="how-it-works" style={{ background:'linear-gradient(to bottom, transparent, rgba(0,0,0,0.4))' }}>
            <FeatureSteps 
              features={howItWorksFeatures}
              title="How It Works"
              autoPlayInterval={4000}
              imageHeight="h-[400px]"
            />
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
