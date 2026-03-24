"use client";

import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { motion } from "framer-motion";

function Feature() {
  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid border border-cyan-500/20 bg-slate-900/40 backdrop-blur-md rounded-xl p-8 grid-cols-1 gap-8 items-center lg:grid-cols-2 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="flex gap-10 flex-col">
            <div className="flex gap-4 flex-col">
              <div>
                <Badge variant="outline" className="text-cyan-400 border-cyan-500/30">Clinical Tech</Badge>
              </div>
              <div className="flex gap-2 flex-col">
                <h2 className="text-3xl lg:text-5xl tracking-tighter max-w-xl text-left font-bold text-slate-50">
                  Advanced Clinical Features
                </h2>
                <p className="text-lg leading-relaxed tracking-tight text-slate-400 max-w-xl text-left">
                  Leverage state-of-the-art computer vision to automate gait analysis without the need for wearable sensors.
                </p>
              </div>
            </div>
            <div className="grid lg:pl-6 grid-cols-1 sm:grid-cols-3 items-start lg:grid-cols-1 gap-6">
              <div className="flex flex-row gap-6 items-start">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-slate-50 font-semibold text-lg">AI Video Analysis</p>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Automated joint tracking using computer vision. Upload standard video from any device and get mocap-quality data instantly.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-slate-50 font-semibold text-lg">Clinical Metrics</p>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Detailed knee flexion, cadence, & stride length data visualized in interactive charts for immediate clinical assessment.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-slate-50 font-semibold text-lg">AI Clinical Summary</p>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    LLM-generated patient reports and insights. Our models synthesize data into readable summaries for patient records.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="bg-slate-900/40 rounded-xl overflow-hidden aspect-[4/3] lg:aspect-square relative border border-cyan-500/20"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="w-full h-full relative"
            >
              <Image 
                src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=1000"
                alt="Advanced Clinical Features Analytics"
                className="object-cover w-full h-full opacity-80"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export { Feature };
