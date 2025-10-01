import React, { useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { useAuthStore } from './auth-store';
import { SystemAPI } from '../utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  ArrowLeft,
  Trophy,
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
  Crown,
  Award,
  Gift,
  Smile,
  Angry,
  Lightbulb,
  BookOpen,
  Music,
  Gamepad2,
  Infinity,
  Target,
  Medal,
  Zap
} from 'lucide-react';

interface UserProfileProps {
  targetUser: string;
  onBackToOwnProfile: () => void;
  onNavigateToProfile?: (username: string) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ targetUser, onBackToOwnProfile, onNavigateToProfile }) => {
  const { user: currentUser } = useAuth();
  const { getLeaderboard, pointRecords } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Load target user data using /users endpoint
  useEffect(() => {
    const loadUser = async () => {
      if (targetUser && currentUser) {
        setIsLoading(true);
        try {
          const response = await SystemAPI.getUsers();
          if (response.success && response.users) {
            const foundUser = response.users.find(u => u.username === targetUser);
            if (foundUser) {
              setUser(foundUser);
            } else {
              console.error('Usuário não encontrado na lista');
            }
          }
        } catch (error) {
          console.error('Erro ao carregar usuário:', error);
        } finally {
          setIsLoading(false);
        }
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
      {
        id: '1',
        name: 'Primeiro Ponto',
        description: 'Registre seu primeiro ponto no sistema',
        icon: Target,
        condition: () => userRecords.length >= 1
      },
      {
        id: '2',
        name: 'Iniciante',
        description: 'Acumule 10 pontos',
        icon: Medal,
        condition: () => totalPoints >= 10
      },
      {
        id: '3',
        name: 'Entusiasta',
        description: 'Acumule 100 pontos',
        icon: Zap,
        condition: () => totalPoints >= 100
      },
      {
        id: '4',
        name: 'Veterano',
        description: 'Acumule 500 pontos',
        icon: Star,
        condition: () => totalPoints >= 500
      },
      {
        id: '5',
        name: 'Dedicado',
        description: 'Registre pontos por 7 dias consecutivos',
        icon: Heart,
        condition: () => {
          if (userRecords.length < 7) return false;
          
          const sortedRecords = userRecords
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          
          let consecutiveDays = 1;
          let maxConsecutive = 1;
          
          for (let i = 1; i < sortedRecords.length; i++) {
            const currentDate = new Date(sortedRecords[i].timestamp);
            const previousDate = new Date(sortedRecords[i - 1].timestamp);
            
            const dayDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (dayDiff === 1) {
              consecutiveDays++;
              maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
            } else if (dayDiff > 1) {
              consecutiveDays = 1;
            }
          }
          
          return maxConsecutive >= 7;
        }
      },
      {
        id: '6',
        name: 'Cafeínado',
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
      {
        id: '7',
        name: 'Destruidor',
        description: 'Registre pontos relacionados a "xingar" 50 vezes',
        icon: Skull,
        condition: () => {
          const angerRecords = userRecords.filter(r => 
            r?.reason?.toLowerCase().includes('xingar') || 
            r?.reason?.toLowerCase().includes('brigar')
          );
          return angerRecords.length >= 50;
        }
      },
      {
        id: '8',
        name: 'Gênio',
        description: 'Registre pontos relacionados a estudos ou conhecimento 30 vezes',
        icon: Brain,
        condition: () => {
          const studyRecords = userRecords.filter(r => 
            r?.reason?.toLowerCase().includes('estudar') || 
            r?.reason?.toLowerCase().includes('aprender') ||
            r?.reason?.toLowerCase().includes('total') ||
            r?.reason?.toLowerCase().includes('avaliação')
          );
          return studyRecords.length >= 30;
        }
      },
      {
        id: '9',
        name: 'Explorador Espacial',
        description: 'Acumule 1000 pontos',
        icon: Rocket,
        condition: () => totalPoints >= 1000
      },
      {
        id: '10',
        name: 'Guardião',
        description: 'Ajude outros usuários registrando pontos relacionados a ajuda 15 vezes',
        icon: Shield,
        condition: () => {
          const helpRecords = userRecords.filter(r => 
            r?.reason?.toLowerCase().includes('ajudar') || 
            r?.reason?.toLowerCase().includes('auxiliar') ||
            r?.reason?.toLowerCase().includes('suporte')
          );
          return helpRecords.length >= 15;
        }
      },
      {
        id: '11',
        name: 'Guerreiro',
        description: 'Supere desafios registrando pontos relacionados a vitórias 25 vezes',
        icon: Sword,
        condition: () => {
          const victoryRecords = userRecords.filter(r => 
            r?.reason?.toLowerCase().includes('vencer') || 
            r?.reason?.toLowerCase().includes('ganhar') ||
            r?.reason?.toLowerCase().includes('vitória') ||
            r?.reason?.toLowerCase().includes('sucesso')
          );
          return victoryRecords.length >= 25;
        }
      },
      {
        id: '12',
        name: 'Diamante',
        description: 'Acumule 2500 pontos',
        icon: Diamond,
        condition: () => totalPoints >= 2500
      },
      {
        id: '13',
        name: 'Noturno',
        description: 'Registre pontos durante a madrugada (00h às 06h) 10 vezes',
        icon: Moon,
        condition: () => {
          const nightRecords = userRecords.filter(r => {
            const hour = new Date(r.timestamp).getHours();
            return hour >= 0 && hour < 6;
          });
          return nightRecords.length >= 10;
        }
      },
      {
        id: '14',
        name: 'Matinal',
        description: 'Registre pontos de manhã cedo (05h às 08h) 15 vezes',
        icon: Sun,
        condition: () => {
          const morningRecords = userRecords.filter(r => {
            const hour = new Date(r.timestamp).getHours();
            return hour >= 5 && hour < 8;
          });
          return morningRecords.length >= 15;
        }
      },
      {
        id: '15',
        name: 'Montanhista',
        description: 'Alcance o top 5 do leaderboard',
        icon: Mountain,
        condition: () => userRank > 0 && userRank <= 5
      },
      {
        id: '16',
        name: 'Em Chamas',
        description: 'Registre mais de 50 pontos em um único dia',
        icon: Flame,
        condition: () => {
          const recordsByDate = {};
          userRecords.forEach(record => {
            const date = new Date(record.timestamp).toDateString();
            recordsByDate[date] = (recordsByDate[date] || 0) + (record.points || 1);
          });
          
          return Object.values(recordsByDate).some(points => points > 50);
        }
      },
      {
        id: '17',
        name: 'Colecionador de Gemas',
        description: 'Acumule 5000 pontos',
        icon: Gem,
        condition: () => totalPoints >= 5000
      },
      {
        id: '18',
        name: 'Brilhante',
        description: 'Mantenha uma média de mais de 10 pontos por registro',
        icon: Sparkles,
        condition: () => {
          if (userRecords.length === 0) return false;
          const totalRecordPoints = userRecords.reduce((sum, record) => sum + (record.points || 1), 0);
          return (totalRecordPoints / userRecords.length) > 10;
        }
      },
      {
        id: '19',
        name: 'Raio',
        description: 'Registre 5 pontos em menos de 1 hora',
        icon: Bolt,
        condition: () => {
          const sortedRecords = userRecords
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          
          for (let i = 0; i <= sortedRecords.length - 5; i++) {
            const firstTime = new Date(sortedRecords[i].timestamp).getTime();
            const fifthTime = new Date(sortedRecords[i + 4].timestamp).getTime();
            
            if ((fifthTime - firstTime) < 3600000) { // 1 hora em ms
              return true;
            }
          }
          return false;
        }
      },
      {
        id: '20',
        name: 'Majestade',
        description: 'Alcance o 1º lugar no leaderboard',
        icon: Crown,
        condition: () => userRank === 1
      },
      {
        id: '21',
        name: 'Mestre dos Pontos',
        description: 'Acumule 10000 pontos',
        icon: Award,
        condition: () => totalPoints >= 10000
      },
      {
        id: '22',
        name: 'Presenteador',
        description: 'Registre pontos relacionados a dar presentes ou ajudar 20 vezes',
        icon: Gift,
        condition: () => {
          const giftRecords = userRecords.filter(r => 
            r?.reason?.toLowerCase().includes('presente') || 
            r?.reason?.toLowerCase().includes('dar') ||
            r?.reason?.toLowerCase().includes('ajudar')
          );
          return giftRecords.length >= 20;
        }
      },
      {
        id: '23',
        name: 'Sempre Feliz',
        description: 'Registre pontos relacionados a felicidade ou alegria 30 vezes',
        icon: Smile,
        condition: () => {
          const happyRecords = userRecords.filter(r => 
            r?.reason?.toLowerCase().includes('feliz') || 
            r?.reason?.toLowerCase().includes('alegre') ||
            r?.reason?.toLowerCase().includes('sorriso') ||
            r?.reason?.toLowerCase().includes('diversão')
          );
          return happyRecords.length >= 30;
        }
      },
      {
        id: '24',
        name: 'Temperamental',
        description: 'Registre pontos relacionados a raiva ou frustração 40 vezes',
        icon: Angry,
        condition: () => {
          const angryRecords = userRecords.filter(r => 
            r?.reason?.toLowerCase().includes('raiva') || 
            r?.reason?.toLowerCase().includes('irritado') ||
            r?.reason?.toLowerCase().includes('frustrado') ||
            r?.reason?.toLowerCase().includes('bravo')
          );
          return angryRecords.length >= 40;
        }
      },
      {
        id: '25',
        name: 'Centurião',
        description: 'Faça 100 registros de pontos',
        icon: Target,
        condition: () => userRecords.length >= 100
      },
      {
        id: '26',
        name: 'Conquistador Universal',
        description: 'Desbloqueie 20 conquistas diferentes',
        icon: Trophy,
        condition: () => false // Will be calculated after processing other achievements
      },
      {
        id: '27',
        name: 'Imortal',
        description: 'Mantenha uma sequência de 30 dias registrando pontos',
        icon: Infinity,
        condition: () => {
          if (userRecords.length < 30) return false;
          
          const sortedRecords = userRecords
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          
          let consecutiveDays = 1;
          let maxConsecutive = 1;
          
          for (let i = 1; i < sortedRecords.length; i++) {
            const currentDate = new Date(sortedRecords[i].timestamp);
            const previousDate = new Date(sortedRecords[i - 1].timestamp);
            
            const dayDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (dayDiff === 1) {
              consecutiveDays++;
              maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
            } else if (dayDiff > 1) {
              consecutiveDays = 1;
            }
          }
          
          return maxConsecutive >= 30;
        }
      },
      {
        id: '28',
        name: 'Estudioso',
        description: 'Registre pontos relacionados a leitura ou estudo 25 vezes',
        icon: BookOpen,
        condition: () => {
          const studyRecords = userRecords.filter(r => 
            r?.reason?.toLowerCase().includes('ler') || 
            r?.reason?.toLowerCase().includes('livro') ||
            r?.reason?.toLowerCase().includes('estudar') ||
            r?.reason?.toLowerCase().includes('pesquisar')
          );
          return studyRecords.length >= 25;
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
            r?.reason?.toLowerCase().includes('cantar') ||
            r?.reason?.toLowerCase().includes('tocar') ||
            r?.reason?.toLowerCase().includes('som')
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
        name: 'Gamer',
        description: 'Registre pontos relacionados a jogos 35 vezes',
        icon: Gamepad2,
        condition: () => {
          const gameRecords = userRecords.filter(r => 
            r?.reason?.toLowerCase().includes('jogo') || 
            r?.reason?.toLowerCase().includes('game') ||
            r?.reason?.toLowerCase().includes('jogar') ||
            r?.reason?.toLowerCase().includes('gaming')
          );
          return gameRecords.length >= 35;
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
        description: 'Seja #1 no leaderboard por um período significativo',
        icon: Trophy,
        condition: () => {
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

    // Update "Conquistador Universal" achievement
    const conquistadorUniversal = processedAchievements.find(a => a.id === '26');
    if (conquistadorUniversal) {
      const unlockedCount = processedAchievements.filter(a => a.unlocked && a.id !== '26').length;
      conquistadorUniversal.unlocked = unlockedCount >= 20;
    }

    return processedAchievements;
  };

  const achievements = calculateAchievements();

  // Calculate user title based on achievements
  const getUserTitle = () => {
    const unlockedAchievements = achievements.filter(a => a.unlocked).length;
    const totalPoints = user?.points || 0;

    if (unlockedAchievements >= 30 || totalPoints >= 15000) {
      return { title: '🏆 Lendário', color: 'bg-gradient-to-r from-yellow-400 to-orange-500' };
    } else if (unlockedAchievements >= 25 || totalPoints >= 10000) {
      return { title: '💎 Mestre', color: 'bg-gradient-to-r from-purple-500 to-pink-500' };
    } else if (unlockedAchievements >= 20 || totalPoints >= 5000) {
      return { title: '👑 Épico', color: 'bg-gradient-to-r from-blue-500 to-purple-500' };
    } else if (unlockedAchievements >= 15 || totalPoints >= 2500) {
      return { title: '⭐ Avançado', color: 'bg-gradient-to-r from-green-500 to-blue-500' };
    } else if (unlockedAchievements >= 10 || totalPoints >= 1000) {
      return { title: '🔥 Experiente', color: 'bg-gradient-to-r from-orange-500 to-red-500' };
    } else if (unlockedAchievements >= 5 || totalPoints >= 100) {
      return { title: '🚀 Intermediário', color: 'bg-gradient-to-r from-cyan-500 to-blue-500' };
    } else {
      return { title: '🌱 Iniciante', color: 'bg-gradient-to-r from-green-400 to-green-600' };
    }
  };

  const userTitle = getUserTitle();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={onBackToOwnProfile} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao meu perfil
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Usuário não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Perfil de {user.username}</h1>
        <p className="text-muted-foreground">Visualizando perfil de outro usuário</p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button onClick={onBackToOwnProfile} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao meu perfil
        </Button>
      </div>

      {/* User Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback className="text-lg">
                {user.username?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle>{user.username || 'Usuário'}</CardTitle>
              <div className="my-2">
                <Badge className={`${userTitle.color} text-white font-semibold text-sm px-3 py-1 shadow-lg`}>
                  {userTitle.title}
                </Badge>
              </div>
              <CardDescription>
                {user.createdAt 
                  ? `Usuário desde ${new Date(user.createdAt).toLocaleDateString('pt-BR')}` 
                  : 'Novo usuário'
                }
              </CardDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge>{user.points || 0} pontos atuais</Badge>
                <Badge variant="outline">#{user.rank || '-'} no ranking</Badge>
                <Badge variant="secondary">
                  {achievements.filter(a => a.unlocked).length}/{achievements.length} conquistas
                </Badge>
              </div>
              {user.totalPoints !== user.points && (
                <div className="text-sm text-muted-foreground mt-1">
                  {user.totalPoints || 0} pontos históricos
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {user.bio && (
            <div className="space-y-2">
              <h4>Sobre</h4>
              <p className="text-muted-foreground">{user.bio}</p>
            </div>
          )}
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold">{user.points || 0}</div>
              <div className="text-sm text-muted-foreground">Pontos</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">#{user.rank || '-'}</div>
              <div className="text-sm text-muted-foreground">Ranking</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{achievements.filter(a => a.unlocked).length}</div>
              <div className="text-sm text-muted-foreground">Conquistas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Conquistas ({achievements.filter(a => a.unlocked).length}/{achievements.length})
          </CardTitle>
          <CardDescription>
            Conquistas desbloqueadas por este usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements
              .filter(achievement => achievement.unlocked)
              .sort((a, b) => {
                if (!a.date && !b.date) return 0;
                if (!a.date) return 1;
                if (!b.date) return -1;
                return new Date(b.date).getTime() - new Date(a.date).getTime();
              })
              .map((achievement) => {
                const IconComponent = achievement.icon;
                return (
                  <div 
                    key={achievement.id} 
                    className="flex items-start gap-3 p-3 rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <IconComponent className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{achievement.name}</h4>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      {achievement.date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Desbloqueada em {achievement.date}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
          
          {achievements.filter(a => a.unlocked).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma conquista desbloqueada ainda</p>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
};