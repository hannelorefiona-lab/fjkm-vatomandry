import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Cross, Users, ChevronRight } from 'lucide-react';
import fjkmHeroImage from '@/assets/fjkm-hero-banner.jpg';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    
    if (!error) {
      navigate('/dashboard');
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('signup-email') as string;
    const password = formData.get('signup-password') as string;
    const username = formData.get('username') as string;

    const { error } = await signUp(email, password, username);
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex">
      {/* Left side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0 bg-black/20"></div>
        <img 
          src={fjkmHeroImage} 
          alt="FJKM Vatomandry" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12">
          <Cross className="h-16 w-16 mb-6 text-secondary" />
          <h1 className="text-5xl font-bold mb-4 text-center">FJKM Vatomandry</h1>
          <p className="text-xl text-center max-w-md opacity-90">
            Système de gestion des adhérents et groupes paroissiaux
          </p>
          <div className="flex items-center mt-8 text-secondary">
            <Users className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Communauté unie dans la foi</span>
          </div>
        </div>
      </div>

      {/* Right side - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden">
            <Cross className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-foreground">FJKM Vatomandry</h2>
            <p className="text-muted-foreground mt-2">Gestion des adhérents</p>
          </div>

          <Card className="card-elegant">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Accès à l'application</CardTitle>
              <CardDescription className="text-center">
                Connectez-vous ou créez votre compte pour accéder au système
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Connexion</TabsTrigger>
                  <TabsTrigger value="signup">Inscription</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-4">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Adresse email</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        placeholder="votre.email@example.com"
                        required 
                        className="transition-smooth"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input 
                        id="password" 
                        name="password" 
                        type="password" 
                        placeholder="Votre mot de passe"
                        required 
                        className="transition-smooth"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-primary hover:shadow-glow transition-bounce"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        'Connexion...'
                      ) : (
                        <>
                          Se connecter
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Nom d'utilisateur</Label>
                      <Input 
                        id="username" 
                        name="username" 
                        type="text" 
                        placeholder="Votre nom d'utilisateur"
                        required 
                        className="transition-smooth"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Adresse email</Label>
                      <Input 
                        id="signup-email" 
                        name="signup-email" 
                        type="email" 
                        placeholder="votre.email@example.com"
                        required 
                        className="transition-smooth"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Mot de passe</Label>
                      <Input 
                        id="signup-password" 
                        name="signup-password" 
                        type="password" 
                        placeholder="Choisissez un mot de passe"
                        required 
                        className="transition-smooth"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      variant="secondary" 
                      className="w-full transition-bounce"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        'Création du compte...'
                      ) : (
                        'Créer un compte'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            En vous connectant, vous acceptez les conditions d'utilisation de l'application FJKM.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;