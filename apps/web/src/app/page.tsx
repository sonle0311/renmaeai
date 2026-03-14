import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { DashboardMockup } from "@/components/landing/dashboard-mockup";
import { PipelineSection } from "@/components/landing/pipeline-section";
import { PillarsSection } from "@/components/landing/pillars-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { CtaFooter } from "@/components/landing/cta-footer";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-background text-slate-300 font-sans selection:bg-cyan-500/30 overflow-hidden relative">

            {/* Premium Tech Background */}
            <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -z-10 h-[600px] w-[800px] rounded-full bg-gradient-to-b from-cyan-900/20 to-transparent blur-[120px] pointer-events-none" />
            <div className="absolute right-0 top-[20%] -z-10 h-[400px] w-[400px] rounded-full bg-blue-900/10 blur-[100px] pointer-events-none" />
            <div className="absolute left-0 bottom-0 -z-10 h-[500px] w-[500px] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none" />

            <Navbar />

            <main className="pt-32 pb-24 px-6 max-w-[1400px] mx-auto relative z-10 flex flex-col gap-24">
                <HeroSection />
                <DashboardMockup />
                <PipelineSection />
                <PillarsSection />
                <PricingSection />
                <CtaFooter />
            </main>

            <Footer />
        </div>
    );
}

