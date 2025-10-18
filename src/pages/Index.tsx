import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Cross, Users, BarChart3, CreditCard, UserCheck, FileText, Shield, QrCode, TrendingUp, Calendar, UsersRound } from 'lucide-react';
import fjkHeroImage from '@/assets/fjkm-hero-banner.jpg';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col overflow-x-hidden">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center relative px-4 py-8 md:py-12">
        <div className="absolute inset-0">
          <img 
            src={fjkHeroImage} 
            alt="FJKM Vatomandry" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        <div className="relative z-10 text-center text-white w-full max-w-7xl mx-auto">
          <Cross className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 mx-auto mb-4 md:mb-6 text-secondary animate-scale-in" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 animate-fade-in px-2">
            FJKM Vatomandry
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 opacity-90 animate-slide-up px-4 max-w-3xl mx-auto">
            Plateforme moderne pour la gestion complète des adhérents, finances, et activités paroissiales
          </p>
          
          <div className="flex justify-center mb-8 md:mb-12">
            <Button 
              onClick={() => navigate('/auth')}
              size="lg"
              className="bg-gradient-primary hover:shadow-glow transition-bounce text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto max-w-xs"
            >
              Accéder à l'application
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mt-8 md:mt-12 lg:mt-16 px-2">
            <div className="text-center animate-fade-in backdrop-blur-sm bg-white/5 p-4 sm:p-5 md:p-6 rounded-lg hover:bg-white/10 transition-all border border-white/10" style={{ animationDelay: '0.2s' }}>
              <UserCheck className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-secondary" />
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">Recensement Digital</h3>
              <p className="text-sm sm:text-base text-white/80">Gestion complète des adhérents avec cartes QR code</p>
            </div>
            
            <div className="text-center animate-fade-in backdrop-blur-sm bg-white/5 p-4 sm:p-5 md:p-6 rounded-lg hover:bg-white/10 transition-all border border-white/10" style={{ animationDelay: '0.3s' }}>
              <CreditCard className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-secondary" />
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">Gestion Financière</h3>
              <p className="text-sm sm:text-base text-white/80">Dîmes, offrandes, dons et Adidy avec suivi détaillé</p>
            </div>
            
            <div className="text-center animate-fade-in backdrop-blur-sm bg-white/5 p-4 sm:p-5 md:p-6 rounded-lg hover:bg-white/10 transition-all border border-white/10" style={{ animationDelay: '0.4s' }}>
              <QrCode className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-secondary" />
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">Scan QR Code</h3>
              <p className="text-sm sm:text-base text-white/80">Paiement rapide avec scanner QR intégré</p>
            </div>
            
            <div className="text-center animate-fade-in backdrop-blur-sm bg-white/5 p-4 sm:p-5 md:p-6 rounded-lg hover:bg-white/10 transition-all border border-white/10" style={{ animationDelay: '0.5s' }}>
              <Calendar className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-secondary" />
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">Suivi Adidy Mpandray</h3>
              <p className="text-sm sm:text-base text-white/80">Gestion mensuelle avec paiements anticipés</p>
            </div>
            
            <div className="text-center animate-fade-in backdrop-blur-sm bg-white/5 p-4 sm:p-5 md:p-6 rounded-lg hover:bg-white/10 transition-all border border-white/10" style={{ animationDelay: '0.6s' }}>
              <Users className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-secondary" />
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">Groupes & Sampana</h3>
              <p className="text-sm sm:text-base text-white/80">Organisation des groupes et faritra</p>
            </div>
            
            <div className="text-center animate-fade-in backdrop-blur-sm bg-white/5 p-4 sm:p-5 md:p-6 rounded-lg hover:bg-white/10 transition-all border border-white/10" style={{ animationDelay: '0.7s' }}>
              <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-secondary" />
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">Statistiques Détaillées</h3>
              <p className="text-sm sm:text-base text-white/80">Graphiques et rapports automatisés en temps réel</p>
            </div>
            
            <div className="text-center animate-fade-in backdrop-blur-sm bg-white/5 p-4 sm:p-5 md:p-6 rounded-lg hover:bg-white/10 transition-all border border-white/10" style={{ animationDelay: '0.8s' }}>
              <FileText className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-secondary" />
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">Export PDF/Excel</h3>
              <p className="text-sm sm:text-base text-white/80">Cartes membres et rapports exportables</p>
            </div>
            
            <div className="text-center animate-fade-in backdrop-blur-sm bg-white/5 p-4 sm:p-5 md:p-6 rounded-lg hover:bg-white/10 transition-all border border-white/10" style={{ animationDelay: '0.9s' }}>
              <Shield className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-secondary" />
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">Gestion par Rôles</h3>
              <p className="text-sm sm:text-base text-white/80">Admin, Responsable, Secrétaire, Trésorier et Membre</p>
            </div>
          </div>
          
          {/* Key Features */}
          <div className="mt-8 md:mt-12 lg:mt-16 p-4 sm:p-6 md:p-8 backdrop-blur-sm bg-white/5 rounded-xl animate-fade-in mx-2 border border-white/10" style={{ animationDelay: '1s' }}>
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-center">Fonctionnalités Avancées</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 text-left">
              <ul className="space-y-2 md:space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-0.5 md:mt-1 flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base">Cartes d'adhérents avec QR code personnalisé</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-0.5 md:mt-1 flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base">Suivi des contributions financières par adhérent</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-0.5 md:mt-1 flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base">Top contributeurs et analyses financières</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-0.5 md:mt-1 flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base">Paiement anticipé d'Adidy avec distribution automatique</span>
                </li>
              </ul>
              <ul className="space-y-2 md:space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-0.5 md:mt-1 flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base">Rapports mensuels et annuels automatisés</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-0.5 md:mt-1 flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base">Espace membre pour consulter ses contributions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-0.5 md:mt-1 flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base">Dashboard personnalisé selon le rôle utilisateur</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-0.5 md:mt-1 flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base">Scan QR pour identification et paiement rapide</span>
                </li>
              </ul>
              <ul className="space-y-2 md:space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-0.5 md:mt-1 flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base">Organisation par Faritra et Sampana</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-0.5 md:mt-1 flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base">Statistiques par quartier et groupe</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-0.5 md:mt-1 flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base">Export de cartes membres en PDF</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-0.5 md:mt-1 flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base">Gestion sécurisée avec authentification</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Additional Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-8 md:mt-12 px-2">
            <div className="text-center animate-fade-in backdrop-blur-sm bg-gradient-primary/20 p-4 sm:p-6 rounded-lg border border-white/10" style={{ animationDelay: '1.1s' }}>
              <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-3 text-secondary" />
              <h4 className="text-base sm:text-lg font-semibold mb-2">Rapports en Temps Réel</h4>
              <p className="text-xs sm:text-sm text-white/80">Visualisez les statistiques financières et de participation instantanément</p>
            </div>
            
            <div className="text-center animate-fade-in backdrop-blur-sm bg-gradient-primary/20 p-4 sm:p-6 rounded-lg border border-white/10" style={{ animationDelay: '1.2s' }}>
              <UsersRound className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-3 text-secondary" />
              <h4 className="text-base sm:text-lg font-semibold mb-2">Multi-utilisateurs</h4>
              <p className="text-xs sm:text-sm text-white/80">Plusieurs rôles avec permissions adaptées pour chaque fonction</p>
            </div>
            
            <div className="text-center animate-fade-in backdrop-blur-sm bg-gradient-primary/20 p-4 sm:p-6 rounded-lg border border-white/10" style={{ animationDelay: '1.3s' }}>
              <QrCode className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-3 text-secondary" />
              <h4 className="text-base sm:text-lg font-semibold mb-2">Technologie QR</h4>
              <p className="text-xs sm:text-sm text-white/80">Chaque adhérent dispose d'une carte digitale avec QR code unique</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm py-4 md:py-6 mt-8">
        <div className="container mx-auto text-center text-white/70 px-4">
          <p className="text-sm sm:text-base">&copy; 2024 FJKM Vatomandry - Système de gestion paroissiale</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
