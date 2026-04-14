import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
      <!-- Nav -->
      <nav class="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div class="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span class="text-xl font-bold">G</span>
            </div>
            <span class="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">GravidPOS</span>
          </div>
          
          <div class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" class="hover:text-white transition-colors">Características</a>
            <a href="#pricing" class="hover:text-white transition-colors">Precios</a>
            <a href="#about" class="hover:text-white transition-colors">Nosotros</a>
          </div>

          <button (click)="goToSetup()" class="px-6 py-2.5 bg-white text-slate-950 rounded-full font-semibold hover:bg-slate-200 transition-all active:scale-95 shadow-xl shadow-white/10">
            Comenzar Gratis
          </button>
        </div>
      </nav>

      <!-- Hero -->
      <section class="relative pt-40 pb-20 overflow-hidden">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent -z-10"></div>
        
        <div class="max-w-7xl mx-auto px-4 text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-indigo-400 mb-8 animate-fade-in">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Nueva versión 2026 disponible
          </div>
          
          <h1 class="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500 leading-[1.1]">
            El sistema operativo para <br/> tu restaurante moderno.
          </h1>
          
          <p class="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-12 leading-relaxed">
            Gestiona pedidos, inventario, facturación y personal desde una única plataforma inteligente. Diseñado para alta velocidad y máximo control.
          </p>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button (click)="goToSetup()" class="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 group">
              Crear mi cuenta
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button class="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 text-slate-300 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
              Ver Demo
            </button>
          </div>

          <!-- Mockup Display -->
          <div class="mt-20 relative px-4">
            <div class="relative max-w-5xl mx-auto p-2 bg-slate-800/50 rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-sm">
              <div class="rounded-[1.5rem] overflow-hidden bg-slate-950 aspect-[16/9] border border-white/5 relative">
                 <!-- Mockup Content placeholder -->
                 <div class="absolute inset-0 flex items-center justify-center">
                    <div class="text-center">
                        <div class="text-slate-700 font-bold text-6xl opacity-20 italic underline decoration-indigo-500">POS PERFORMANCE</div>
                    </div>
                 </div>
                 <!-- Decorative elements -->
                 <div class="absolute top-4 left-4 flex gap-1.5">
                    <div class="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                    <div class="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                    <div class="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
                 </div>
              </div>
            </div>
            
            <!-- Glow effect -->
            <div class="absolute -top-20 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/20 blur-[120px] -z-10"></div>
          </div>
        </div>
      </section>

      <!-- Stats -->
      <section class="py-20 border-y border-slate-900 bg-slate-950/50">
        <div class="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div class="text-center">
            <div class="text-4xl font-bold text-white mb-2">500+</div>
            <div class="text-slate-500 text-sm font-medium uppercase tracking-widest">Restaurantes</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-bold text-white mb-2">2M+</div>
            <div class="text-slate-500 text-sm font-medium uppercase tracking-widest">Órdenes/Mes</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-bold text-white mb-2">99.9%</div>
            <div class="text-slate-500 text-sm font-medium uppercase tracking-widest">Disponibilidad</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-bold text-white mb-2">24/7</div>
            <div class="text-slate-500 text-sm font-medium uppercase tracking-widest">Soporte Pro</div>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section id="features" class="py-32 relative">
        <div class="max-w-7xl mx-auto px-4">
            <div class="text-center mb-20">
                <h2 class="text-indigo-400 font-semibold mb-4 text-lg">Potencia sin límites</h2>
                <div class="text-4xl md:text-5xl font-bold text-white mb-6">Todo lo que necesitas para escalar.</div>
                <p class="text-slate-400 max-w-2xl mx-auto">Una solución integral que elimina la fricción operativa y maximiza tus márgenes de beneficio.</p>
            </div>

            <div class="grid md:grid-cols-3 gap-6">
                <!-- Feature Card -->
                <div class="p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/50 transition-all group">
                    <div class="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 text-indigo-500 group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-3">POS de Alta Velocidad</h3>
                    <p class="text-slate-400 leading-relaxed text-sm">Gestiona mesas y pedidos en milisegundos. Integrado con cocina en tiempo real.</p>
                </div>

                <div class="p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/50 transition-all group">
                    <div class="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 text-purple-500 group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-3">Analítica Avanzada</h3>
                    <p class="text-slate-400 leading-relaxed text-sm">Dashboard inteligente con predicción de ventas y control de costos de producción.</p>
                </div>

                <div class="p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/50 transition-all group">
                    <div class="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-500 group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-3">Factura Electrónica</h3>
                    <p class="text-slate-400 leading-relaxed text-sm">Cumplimiento total con normativas DTE. Envío automático por correo a clientes.</p>
                </div>
            </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="py-12 border-t border-slate-900">
        <div class="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
            <div class="text-slate-500 text-sm">© 2026 GravidPOS SaaS. Todos los derechos reservados.</div>
            <div class="flex items-center gap-6 text-slate-400 text-sm">
                <a href="#" class="hover:text-white transition-colors">Términos</a>
                <a href="#" class="hover:text-white transition-colors">Privacidad</a>
                <a href="#" class="hover:text-white transition-colors">Soporte</a>
            </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fade-in 0.8s ease-out forwards;
    }
  `]
})
export class LandingComponent {
  router = inject(Router);

  goToSetup() {
    this.router.navigate(['/setup']);
  }
}
