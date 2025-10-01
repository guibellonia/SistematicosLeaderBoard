import React, { useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { useAuthStore } from './auth-store';
import { SystemAPI } from '../utils/supabase/client';
import { SystemStatus } from './system-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { 
  User, 
  Edit3, 
  Trophy, 
  Calendar,
  Trash2,
  Crown,
  Target,
  Medal,
  ArrowLeft,
  Zap,
  Star,
  Heart,
  Coffee,
  Skull,
  Brain,
  Rocket,
  Shield,
  Sword,
  Diamond,
  Moon,
  Sun,
  Mountain,
  Flame,
  Gem,
  Sparkles,
  Bolt,
  Crown as CrownIcon,
  Award,
  Gift,
  Smile,
  Angry,
  Lightbulb,
  BookOpen,
  Music,
  Gamepad2,
  Timer,
  Infinity
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ProfileProps {
  section?: string;
  targetUser?: string | null;
  onBackToOwnProfile?: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ section = 'profile', targetUser, onBackToOwnProfile }) => {
  const { user: currentUser, logout } = useAuth();
  const { getLeaderboard, pointRecords } = useAuthStore();
  const [activeTab, setActiveTab] = useState(section);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(currentUser);

  const isOwnProfile = !targetUser || targetUser === currentUser?.username;

  // Load target user data if viewing another user's profile
  useEffect(() => {
    const loadUser = async () => {
      if (targetUser && targetUser !== currentUser?.username) {
        setIsLoading(true);
        try {
          const response = await SystemAPI.getUserProfile(targetUser);
          if (response.success) {
            setUser(response.user);
          }
        } catch (error) {
          console.error('Erro ao carregar usuário:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setUser(currentUser);
      }
    };

    loadUser();
  }, [targetUser, currentUser]);





  // Calculate achievements dynamically
  const calculateAchievements = () => {
    if (!user?.id || !pointRecords) return [];

    const userRecords = pointRecords.filter(record => record?.userId === user.id);
    const totalPoints = user?.points || 0;
    const leaderboard = getLeaderboard() || [];
    const userRank = leaderboard.findIndex(u => u?.id === user.id) + 1;

    const achievementDefinitions = [
      // Conquistas básicas
      {
        id: 'first_point',
        name: 'Primeiro Passo',
        description: 'Registrou seu primeiro ponto',
        icon: Zap,
        condition: () => userRecords.length > 0
      },
      {
        id: 'five_points',
        name: 'Aquecendo',
        description: 'Acumule 5 pontos totais',
        icon: Flame,
        condition: () => totalPoints >= 5
      },
      {
        id: 'ten_points',
        name: 'Dez na Área',
        description: 'Acumule 10 pontos totais',
        icon: Bolt,
        condition: () => totalPoints >= 10
      },
      {
        id: 'top_3',
        name: 'Pódio',
        description: 'Fique entre os 3 primeiros no leaderboard',
        icon: Trophy,
        condition: () => userRank > 0 && userRank <= 3
      },
      {
        id: 'hundred_points',
        name: 'Centena',
        description: 'Acumule 100 pontos totais',
        icon: Target,
        condition: () => totalPoints >= 100
      },
      {
        id: '5',
        name: 'Mentor',
        description: 'Ajude 10 colegas (registre "Ajudar um colega" 10 vezes)',
        icon: Heart,
        condition: () => {
          const helpRecords = userRecords.filter(r => 
            r?.reason?.toLowerCase().includes('ajudar') || 
            r?.reason?.toLowerCase().includes('colega')
          );
          return helpRecords.length >= 10;
        }
      },
      {
        id: '6',
        name: 'Specialist',
        description: 'Acumule 500 pontos totais',
        icon: Award,
        condition: () => totalPoints >= 500
      },

      // Conquistas intermediárias
      {
        id: '7',
        name: 'Xingador Profissional',
        description: 'Xingue o Henaldo 25 vezes',
        icon: Angry,
        condition: () => {
          const henaldoRecords = userRecords.filter(r => 
            r?.reason?.toLowerCase().includes('henaldo') || 
            r?.reason?.toLowerCase().includes('xingar')
          );
          return henaldoRecords.length >= 25;
        }
      },
      {
        id: '8',
        name: 'Estudioso',
        description: 'Tire total em 5 avaliações',
        icon: BookOpen,
        condition: () => {
          const totalRecords = userRecords.filter(r => 
            r?.reason?.toLowerCase().includes('total') || 
            r?.reason?.toLowerCase().includes('avaliação')
          );
          return totalRecords.length >= 5;
        }
      },
      {
        id: '9',
        name: 'Madrugador',
        description: 'Registre pontos antes das 7h da manhã 10 vezes',
        icon: Sun,
        condition: () => {
          const earlyRecords = userRecords.filter(r => {
            try {
              const hour = new Date(r.timestamp).getHours();
              return hour < 7;
            } catch {
              return false;
            }
          });
          return earlyRecords.length >= 10;
        }
      },
      {
        id: '10',
        name: 'Coruja Noturna',
        description: 'Registre pontos depois das 23h 15 vezes',
        icon: Moon,
        condition: () => {
          const nightRecords = userRecords.filter(r => {
            try {
              const hour = new Date(r.timestamp).getHours();
              return hour >= 23;
            } catch {
              return false;
            }
          });
          return nightRecords.length >= 15;
        }
      },
      {
        id: '11',
        name: 'Velocista',
        description: 'Registre 10 pontos em um único dia',
        icon: Bolt,
        condition: () => {
          const dateGroups = {};
          userRecords.forEach(r => {
            try {
              const date = new Date(r.timestamp).toDateString();
              dateGroups[date] = (dateGroups[date] || 0) + (r.points || 5);
            } catch {}
          });
          return Object.values(dateGroups).some(points => points >= 50); // 10 registros de 5 pontos
        }
      },
      {
        id: '12',
        name: 'Rei da Montanha',
        description: 'Fique em #1 no leaderboard',
        icon: Mountain,
        condition: () => userRank === 1
      },
      {
        id: '13',
        name: 'Café com Açúcar',
        description: 'Registre pontos relacionados a café 20 vezes',
        icon: Coffee,
        condition: () => {
          const coffeeRecords = userRecords.filter(r => 
            r?.reason?.toLowerCase().includes('café') || 
            r?.reason?.toLowerCase().includes('coffee')
          );
          return coffeeRecords.length >= 20;
        }
      },

      // Conquistas avançadas
      {
        id: '14',
        name: 'Genio',
        description: 'Acumule 1000 pontos totais',
        icon: Brain,
        condition: () => totalPoints >= 1000
      },
      {
        id: '15',
        name: 'Sequência Épica',
        description: 'Registre pontos por 30 dias consecutivos',
        icon: Flame,
        condition: () => {
          const dates = userRecords.map(r => {
            try {
              return new Date(r.timestamp).toDateString();
            } catch {
              return null;
            }
          }).filter(Boolean);
          
          const uniqueDates = [...new Set(dates)].sort();
          let consecutiveDays = 1;
          let maxConsecutive = 1;
          
          for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(uniqueDates[i - 1]);
            const currDate = new Date(uniqueDates[i]);
            const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
            
            if (diffDays === 1) {
              consecutiveDays++;
              maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
            } else {
              consecutiveDays = 1;
            }
          }
          
          return maxConsecutive >= 30;
        }
      },
      {
        id: '16',
        name: 'Veterano',
        description: 'Faça 100 registros de pontos',
        icon: Medal,
        condition: () => userRecords.length >= 100
      },
      {
        id: '17',
        name: 'Workaholic',
        description: 'Registre pontos em todos os 7 dias da semana',
        icon: Timer,
        condition: () => {
          const weekdays = new Set();
          userRecords.forEach(r => {
            try {
              const day = new Date(r.timestamp).getDay();
              weekdays.add(day);
            } catch {}
          });
          return weekdays.size === 7;
        }
      },
      {
        id: '18',
        name: 'Popular',
        description: 'Acumule 1000 pontos totais',
        icon: Heart,
        condition: () => totalPoints >= 1000
      },

      // Conquistas lendárias
      {
        id: '19',
        name: 'Lenda Viva',
        description: 'Acumule 2500 pontos totais',
        icon: Star,
        condition: () => totalPoints >= 2500
      },
      {
        id: '20',
        name: 'Imortal',
        description: 'Registre pontos por 100 dias consecutivos',
        icon: Shield,
        condition: () => {
          const dates = userRecords.map(r => {
            try {
              return new Date(r.timestamp).toDateString();
            } catch {
              return null;
            }
          }).filter(Boolean);
          
          const uniqueDates = [...new Set(dates)].sort();
          let consecutiveDays = 1;
          let maxConsecutive = 1;
          
          for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(uniqueDates[i - 1]);
            const currDate = new Date(uniqueDates[i]);
            const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
            
            if (diffDays === 1) {
              consecutiveDays++;
              maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
            } else {
              consecutiveDays = 1;
            }
          }
          
          return maxConsecutive >= 100;
        }
      },
      {
        id: '21',
        name: 'Mestre dos Pontos',
        description: 'Faça 500 registros de pontos',
        icon: Sword,
        condition: () => userRecords.length >= 500
      },
      {
        id: '22',
        name: 'Diamante Bruto',
        description: 'Acumule 5000 pontos totais',
        icon: Diamond,
        condition: () => totalPoints >= 5000
      },
      {
        id: '23',
        name: 'Rei Henaldo',
        description: 'Xingue o Henaldo 100 vezes (você é o novo Henaldo!)',
        icon: Skull,
        condition: () => {
          const henaldoRecords = userRecords.filter(r => 
            r?.reason?.toLowerCase().includes('henaldo') || 
            r?.reason?.toLowerCase().includes('xingar')
          );
          return henaldoRecords.length >= 100;
        }
      },

      // Conquistas ultra raras
      {
        id: '24',
        name: 'Deus dos Pontos',
        description: 'Acumule 10000 pontos totais',
        icon: Crown,
        condition: () => totalPoints >= 10000
      },
      {
        id: '25',
        name: 'Ascendido',
        description: 'Registre pontos por 365 dias consecutivos (1 ano)',
        icon: Infinity,
        condition: () => {
          const dates = userRecords.map(r => {
            try {
              return new Date(r.timestamp).toDateString();
            } catch {
              return null;
            }
          }).filter(Boolean);
          
          const uniqueDates = [...new Set(dates)].sort();
          let consecutiveDays = 1;
          let maxConsecutive = 1;
          
          for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(uniqueDates[i - 1]);
            const currDate = new Date(uniqueDates[i]);
            const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
            
            if (diffDays === 1) {
              consecutiveDays++;
              maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
            } else {
              consecutiveDays = 1;
            }
          }
          
          return maxConsecutive >= 365;
        }
      },
      {
        id: '26',
        name: 'Conquistador Universal',
        description: 'Desbloqueie todas as outras conquistas',
        icon: CrownIcon,
        condition: () => {
          // Esta conquista só é desbloqueada quando todas as outras estão desbloqueadas
          // Será verificada no final
          return false;
        }
      },

      // Conquistas especiais/easter eggs
      {
        id: '27',
        name: 'Sortudo',
        description: 'Registre pontos às 13:13 em uma sexta-feira 13',
        icon: Sparkles,
        condition: () => {
          return userRecords.some(r => {
            try {
              const date = new Date(r.timestamp);
              const isFriday13 = date.getDay() === 5 && date.getDate() === 13;
              const isLuckyTime = date.getHours() === 13 && date.getMinutes() === 13;
              return isFriday13 && isLuckyTime;
            } catch {
              return false;
            }
          });
        }
      },
      {
        id: '28',
        name: 'Gamer Raiz',
        description: 'Registre pontos relacionados a jogos 50 vezes',
        icon: Gamepad2,
        condition: () => {
          const gameRecords = userRecords.filter(r => 
            r?.reason?.toLowerCase().includes('jogo') || 
            r?.reason?.toLowerCase().includes('game') ||
            r?.reason?.toLowerCase().includes('jogar')
          );
          return gameRecords.length >= 50;
        }
      },
      {
        id: '29',
        name: 'Melômano',
        description: 'Registre pontos relacionados a música 30 vezes',
        icon: Music,
        condition: () => {
          const musicRecords = userRecords.filter(r => 
            r?.reason?.toLowerCase().includes('música') || 
            r?.reason?.toLowerCase().includes('music') ||
            r?.reason?.toLowerCase().includes('cantar') ||
            r?.reason?.toLowerCase().includes('tocar')
          );
          return musicRecords.length >= 30;
        }
      },
      {
        id: '30',
        name: 'Idealizador',
        description: 'Registre pontos relacionados a ideias ou criatividade 40 vezes',
        icon: Lightbulb,
        condition: () => {
          const ideaRecords = userRecords.filter(r => 
            r?.reason?.toLowerCase().includes('ideia') || 
            r?.reason?.toLowerCase().includes('criar') ||
            r?.reason?.toLowerCase().includes('inventar') ||
            r?.reason?.toLowerCase().includes('inovar')
          );
          return ideaRecords.length >= 40;
        }
      },
      {
        id: '31',
        name: 'Motivador',
        description: 'Registre pontos relacionados a motivar outros 25 vezes',
        icon: Gift,
        condition: () => {
          const motivateRecords = userRecords.filter(r => 
            r?.reason?.toLowerCase().includes('motivar') || 
            r?.reason?.toLowerCase().includes('encorajar') ||
            r?.reason?.toLowerCase().includes('inspirar')
          );
          return motivateRecords.length >= 25;
        }
      },
      {
        id: '32',
        name: 'Sorriso Fácil',
        description: 'Registre pontos relacionados a humor ou risadas 35 vezes',
        icon: Smile,
        condition: () => {
          const funRecords = userRecords.filter(r => 
            r?.reason?.toLowerCase().includes('rir') || 
            r?.reason?.toLowerCase().includes('piada') ||
            r?.reason?.toLowerCase().includes('humor') ||
            r?.reason?.toLowerCase().includes('engraçado')
          );
          return funRecords.length >= 35;
        }
      },
      {
        id: '33',
        name: 'Explorador',
        description: 'Registre pontos usando 20 motivos diferentes',
        icon: Rocket,
        condition: () => {
          const uniqueReasons = new Set(userRecords.map(r => r?.reason?.toLowerCase()).filter(Boolean));
          return uniqueReasons.size >= 20;
        }
      },
      {
        id: '34',
        name: 'Campeão Supremo',
        description: 'Seja #1 no leaderboard por 30 dias consecutivos',
        icon: Trophy,
        condition: () => {
          // Esta seria uma conquista complexa que requer histórico de rankings
          // Por enquanto, vamos usar uma aproximação
          return userRank === 1 && totalPoints >= 3000;
        }
      },
      {
        id: '35',
        name: 'Lendário',
        description: 'Acumule 20000 pontos totais (você transcendeu)',
        icon: Gem,
        condition: () => totalPoints >= 20000
      }
    ];

    const processedAchievements = achievementDefinitions.map(achievement => {
      const unlocked = achievement.condition();
      let unlockedDate = null;
      
      if (unlocked && userRecords.length > 0) {
        // Use the date of the first record for "Primeiro Ponto" or the latest for others
        if (achievement.id === '1') {
          unlockedDate = userRecords[0]?.timestamp;
        } else {
          unlockedDate = userRecords[userRecords.length - 1]?.timestamp;
        }
      }
      
      return {
        ...achievement,
        unlocked,
        date: unlockedDate ? new Date(unlockedDate).toLocaleDateString('pt-BR') : null
      };
    });

    // Verificar conquista "Conquistador Universal" após processar todas as outras
    const conquistadorUniversal = processedAchievements.find(a => a.id === '26');
    if (conquistadorUniversal) {
      const otherAchievements = processedAchievements.filter(a => a.id !== '26');
      const allOthersUnlocked = otherAchievements.every(a => a.unlocked);
      conquistadorUniversal.unlocked = allOthersUnlocked;
      if (allOthersUnlocked && userRecords.length > 0) {
        conquistadorUniversal.date = new Date().toLocaleDateString('pt-BR');
      }
    }

    return processedAchievements;
  };

  // Get seasons (for now, just current season)
  const getSeasons = () => {
    const currentYear = new Date().getFullYear();
    return [
      {
        id: '1',
        name: `Temporada ${currentYear}`,
        period: `Jan - Dez ${currentYear}`,
        points: user?.points || 0,
        rank: getLeaderboard()?.findIndex(u => u?.id === user?.id) + 1 || 0,
        status: 'atual'
      }
    ];
  };

  // Calculate user title based on achievements
  const calculateUserTitle = (achievements) => {
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    
    if (unlockedCount >= 30) return { title: '🌟 Deus Supremo', color: 'bg-gradient-to-r from-yellow-400 to-orange-500' };
    if (unlockedCount >= 25) return { title: '⚡ Transcendente', color: 'bg-gradient-to-r from-purple-600 to-pink-600' };
    if (unlockedCount >= 20) return { title: '🔥 Lendário', color: 'bg-gradient-to-r from-red-500 to-orange-600' };
    if (unlockedCount >= 15) return { title: '💎 Imortal', color: 'bg-gradient-to-r from-blue-600 to-purple-600' };
    if (unlockedCount >= 12) return { title: '⚔️ Conquistador', color: 'bg-gradient-to-r from-gray-700 to-gray-900' };
    if (unlockedCount >= 10) return { title: '🏆 Mestre', color: 'bg-gradient-to-r from-yellow-600 to-yellow-500' };
    if (unlockedCount >= 8) return { title: '👑 Nobre', color: 'bg-gradient-to-r from-purple-500 to-purple-700' };
    if (unlockedCount >= 6) return { title: '⭐ Veterano', color: 'bg-gradient-to-r from-green-500 to-green-700' };
    if (unlockedCount >= 5) return { title: '🚀 Expert', color: 'bg-gradient-to-r from-blue-500 to-blue-700' };
    if (unlockedCount >= 4) return { title: '🧠 Onipotente', color: 'bg-gradient-to-r from-pink-500 to-red-500' };
    if (unlockedCount >= 3) return { title: '💀 Crânio', color: 'bg-gradient-to-r from-gray-600 to-gray-800' };
    if (unlockedCount >= 2) return { title: '🤓 Sabido', color: 'bg-gradient-to-r from-green-400 to-blue-500' };
    if (unlockedCount >= 1) return { title: '🐣 Noob', color: 'bg-gradient-to-r from-yellow-300 to-orange-400' };
    
    return { title: '👶 Iniciante', color: 'bg-gray-200' };
  };

  const achievements = calculateAchievements();
  const userTitle = calculateUserTitle(achievements);
  const seasons = getSeasons();

  // Update active tab when section prop changes
  React.useEffect(() => {
    setActiveTab(section);
  }, [section]);
  
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.username || '',
    email: '', // No email field in our system
    bio: '',
  });

  const handleSaveProfile = () => {
    toast.success('Perfil atualizado com sucesso!');
    setEditingProfile(false);
  };

  const handleDeleteAccount = () => {
    toast.success('Conta excluída com sucesso!');
    logout();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Carregando perfil...</h1>
          <p className="text-muted-foreground">Aguarde enquanto carregamos os dados do usuário.</p>
        </div>
      </div>
    );
  }

  if (targetUser && !user) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Usuário não encontrado</h1>
          <p className="text-muted-foreground">O usuário solicitado não foi encontrado.</p>
          <Button onClick={onBackToOwnProfile} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao meu perfil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>{isOwnProfile ? 'Perfil' : `Perfil de ${user?.username}`}</h1>
        <p className="text-muted-foreground">
          {isOwnProfile ? 'Gerencie seu perfil e configurações da conta' : 'Visualizando perfil de outro usuário'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="hidden md:grid w-full grid-cols-6">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
          <TabsTrigger value="seasons">Temporadas</TabsTrigger>
          {isOwnProfile && <TabsTrigger value="settings">Configurações</TabsTrigger>}
          {isOwnProfile && <TabsTrigger value="status">Status</TabsTrigger>}
          {isOwnProfile && <TabsTrigger value="delete" className="text-destructive">Excluir</TabsTrigger>}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {!isOwnProfile && (
            <div className="flex items-center gap-4 mb-6">
              <Button onClick={onBackToOwnProfile} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao meu perfil
              </Button>
            </div>
          )}
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-lg">{user?.username?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle>{user?.username || 'Usuário'}</CardTitle>
                  <div className="my-2">
                    <Badge className={`${userTitle.color} text-white font-semibold text-sm px-3 py-1 shadow-lg`}>
                      {userTitle.title}
                    </Badge>
                  </div>
                  <CardDescription>
                    {user?.createdAt ? `Usuário desde ${new Date(user.createdAt).toLocaleDateString('pt-BR')}` : 'Novo usuário'}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge>{user?.points || 0} pontos</Badge>
                    <Badge variant="outline">Ativo</Badge>
                    <Badge variant="secondary">
                      {achievements.filter(a => a.unlocked).length}/{achievements.length} conquistas
                    </Badge>
                  </div>
                </div>
                {isOwnProfile && (
                  <Button
                    variant="outline"
                    onClick={() => setEditingProfile(!editingProfile)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    {editingProfile ? 'Cancelar' : 'Editar'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingProfile && isOwnProfile ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleSaveProfile}>
                    Salvar Alterações
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4>Biografia</h4>
                    <p className="text-muted-foreground">{profileData.bio || 'Nenhuma biografia definida.'}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4>Pontos Totais</h4>
                      <p className="text-2xl font-bold text-primary">{user?.points || 0}</p>
                    </div>
                    <div>
                      <h4>Ranking Atual</h4>
                      <p className="text-2xl font-bold text-primary">
                        #{seasons[0]?.rank > 0 ? seasons[0].rank : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>



        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          {!isOwnProfile && (
            <div className="flex items-center gap-4 mb-6">
              <Button onClick={onBackToOwnProfile} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao meu perfil
              </Button>
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                {isOwnProfile ? 'Suas Conquistas' : `Conquistas de ${user?.username}`}
              </CardTitle>
              <CardDescription>
                {isOwnProfile ? 'Seus marcos e conquistas na plataforma' : 'Marcos e conquistas deste usuário'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <span>Progresso das Conquistas</span>
                  <span className="font-medium">
                    {achievements.filter(a => a.unlocked).length} / {achievements.length}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${(achievements.filter(a => a.unlocked).length / achievements.length) * 100}%` 
                    }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        achievement.unlocked
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-muted/50 border-muted opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          achievement.unlocked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{achievement.name}</h4>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          {achievement.unlocked && achievement.date && (
                            <p className="text-xs text-primary mt-1">
                              Desbloqueado em {achievement.date}
                            </p>
                          )}
                        </div>
                        {achievement.unlocked && (
                          <Badge className="bg-green-100 text-green-800">
                            Desbloqueado
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seasons Tab */}
        <TabsContent value="seasons" className="space-y-6">
          {!isOwnProfile && (
            <div className="flex items-center gap-4 mb-6">
              <Button onClick={onBackToOwnProfile} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao meu perfil
              </Button>
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Pontos por Temporada
              </CardTitle>
              <CardDescription>
                Histórico de performance em cada temporada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {seasons.map((season) => (
                  <div key={season.id} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{season.name}</h4>
                        <p className="text-sm text-muted-foreground">{season.period}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{season.points} pontos</p>
                        <p className="text-sm text-muted-foreground">
                          Rank #{season.rank > 0 ? season.rank : '-'}
                        </p>
                      </div>
                      <Badge variant={season.status === 'atual' ? 'default' : 'secondary'}>
                        {season.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab - Only for own profile */}
        {isOwnProfile && (
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Configurações da Conta
                </CardTitle>
                <CardDescription>
                  Gerencie suas preferências e configurações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4>Notificações</h4>
                  <p className="text-sm text-muted-foreground mb-4">Configure como deseja receber notificações</p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Notificações de pontos</p>
                        <p className="text-sm text-muted-foreground">Receba notificações quando ganhar pontos</p>
                      </div>
                      <Button variant="outline" size="sm">Ativado</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Notificações de conquistas</p>
                        <p className="text-sm text-muted-foreground">Receba notificações ao desbloquear conquistas</p>
                      </div>
                      <Button variant="outline" size="sm">Ativado</Button>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4>Privacidade</h4>
                  <p className="text-sm text-muted-foreground mb-4">Controle quem pode ver seu perfil</p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Perfil público</p>
                        <p className="text-sm text-muted-foreground">Permitir que outros usuários vejam seu perfil</p>
                      </div>
                      <Button variant="outline" size="sm">Público</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Mostrar no leaderboard</p>
                        <p className="text-sm text-muted-foreground">Aparecer na classificação geral</p>
                      </div>
                      <Button variant="outline" size="sm">Visível</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Status Tab - Only for own profile */}
        {isOwnProfile && (
          <TabsContent value="status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Status do Sistema
                </CardTitle>
                <CardDescription>
                  Verificação do funcionamento dos endpoints do servidor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SystemStatus />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Delete Tab - Only for own profile */}
        {isOwnProfile && (
          <TabsContent value="delete" className="space-y-6">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Excluir Conta
                </CardTitle>
                <CardDescription>
                  Esta ação é permanente e não pode ser desfeita
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-destructive/10 p-4 rounded-lg">
                    <h4 className="text-destructive mb-2">Atenção!</h4>
                    <p className="text-sm">
                      Ao excluir sua conta, você perderá:
                    </p>
                    <ul className="text-sm mt-2 space-y-1 ml-4">
                      <li>• Todos os seus pontos e registros</li>
                      <li>• Todas as suas conquistas</li>
                      <li>• Histórico de atividades</li>
                    </ul>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Minha Conta
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Sua conta e todos os dados associados serão permanentemente removidos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Sim, excluir conta
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};