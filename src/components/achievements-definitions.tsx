import { 
  Target, 
  Medal, 
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
  Trophy 
} from 'lucide-react';

// Interface para registros de ponto
interface PointRecord {
  id?: string;
  userId: string;
  reason: string;
  points: number;
  timestamp: string;
}

// Interface para definição de conquista
export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: any;
  condition: (userRecords: PointRecord[], totalPoints: number, userRank: number) => boolean;
}

// Definições unificadas de conquistas
export const getAchievementDefinitions = (): AchievementDefinition[] => [
  {
    id: '1',
    name: 'Primeiro Ponto',
    description: 'Registre seu primeiro ponto no sistema',
    icon: Target,
    condition: (userRecords) => userRecords.length >= 1
  },
  {
    id: '2',
    name: 'Iniciante',
    description: 'Acumule 10 pontos',
    icon: Medal,
    condition: (userRecords, totalPoints) => totalPoints >= 10
  },
  {
    id: '3',
    name: 'Entusiasta',
    description: 'Acumule 100 pontos',
    icon: Zap,
    condition: (userRecords, totalPoints) => totalPoints >= 100
  },
  {
    id: '4',
    name: 'Veterano',
    description: 'Acumule 500 pontos',
    icon: Star,
    condition: (userRecords, totalPoints) => totalPoints >= 500
  },
  {
    id: '5',
    name: 'Dedicado',
    description: 'Registre pontos por 7 dias consecutivos',
    icon: Heart,
    condition: (userRecords) => {
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
    condition: (userRecords) => {
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
    condition: (userRecords) => {
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
    condition: (userRecords) => {
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
    condition: (userRecords, totalPoints) => totalPoints >= 1000
  },
  {
    id: '10',
    name: 'Guardião',
    description: 'Ajude outros usuários registrando pontos relacionados a ajuda 15 vezes',
    icon: Shield,
    condition: (userRecords) => {
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
    condition: (userRecords) => {
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
    condition: (userRecords, totalPoints) => totalPoints >= 2500
  },
  {
    id: '13',
    name: 'Noturno',
    description: 'Registre pontos durante a madrugada (00h às 06h) 10 vezes',
    icon: Moon,
    condition: (userRecords) => {
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
    condition: (userRecords) => {
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
    condition: (userRecords, totalPoints, userRank) => userRank > 0 && userRank <= 5
  },
  {
    id: '16',
    name: 'Em Chamas',
    description: 'Registre mais de 50 pontos em um único dia',
    icon: Flame,
    condition: (userRecords) => {
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
    condition: (userRecords, totalPoints) => totalPoints >= 5000
  },
  {
    id: '18',
    name: 'Brilhante',
    description: 'Mantenha uma média de mais de 10 pontos por registro',
    icon: Sparkles,
    condition: (userRecords) => {
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
    condition: (userRecords) => {
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
    condition: (userRecords, totalPoints, userRank) => userRank === 1
  },
  {
    id: '21',
    name: 'Mestre dos Pontos',
    description: 'Acumule 10000 pontos',
    icon: Award,
    condition: (userRecords, totalPoints) => totalPoints >= 10000
  },
  {
    id: '22',
    name: 'Presenteador',
    description: 'Registre pontos relacionados a dar presentes ou ajudar 20 vezes',
    icon: Gift,
    condition: (userRecords) => {
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
    condition: (userRecords) => {
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
    condition: (userRecords) => {
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
    condition: (userRecords) => userRecords.length >= 100
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
    condition: (userRecords) => {
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
    condition: (userRecords) => {
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
    condition: (userRecords) => {
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
    condition: (userRecords) => {
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
    condition: (userRecords) => {
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
    condition: (userRecords) => {
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
    condition: (userRecords) => {
      const uniqueReasons = new Set(userRecords.map(r => r?.reason?.toLowerCase()).filter(Boolean));
      return uniqueReasons.size >= 20;
    }
  },
  {
    id: '34',
    name: 'Campeão Supremo',
    description: 'Seja #1 no leaderboard por um período significativo',
    icon: Trophy,
    condition: (userRecords, totalPoints, userRank) => {
      return userRank === 1 && totalPoints >= 3000;
    }
  },
  {
    id: '35',
    name: 'Lendário',
    description: 'Acumule 20000 pontos totais (você transcendeu)',
    icon: Gem,
    condition: (userRecords, totalPoints) => totalPoints >= 20000
  }
];

// Função para calcular conquistas
export const calculateAchievements = (userRecords: PointRecord[], totalPoints: number, userRank: number) => {
  const achievementDefinitions = getAchievementDefinitions();
  
  const processedAchievements = achievementDefinitions.map(achievement => {
    const unlocked = achievement.condition(userRecords, totalPoints, userRank);
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

// Sistema unificado de títulos
export interface TitleInfo {
  id: string;
  title: string;
  requirement: number;
  color: string;
  description: string;
}

export const getAllTitles = (): TitleInfo[] => [
  { id: 'supremo', title: '🌟 Deus Supremo', requirement: 30, color: 'bg-gradient-to-r from-yellow-400 to-orange-500', description: 'Desbloqueou 30+ conquistas' },
  { id: 'transcendente', title: '⚡ Transcendente', requirement: 25, color: 'bg-gradient-to-r from-purple-600 to-pink-600', description: 'Desbloqueou 25+ conquistas' },
  { id: 'lendario', title: '🔥 Lendário', requirement: 20, color: 'bg-gradient-to-r from-red-500 to-orange-600', description: 'Desbloqueou 20+ conquistas' },
  { id: 'imortal', title: '💎 Imortal', requirement: 15, color: 'bg-gradient-to-r from-blue-600 to-purple-600', description: 'Desbloqueou 15+ conquistas' },
  { id: 'conquistador', title: '⚔️ Conquistador', requirement: 12, color: 'bg-gradient-to-r from-gray-700 to-gray-900', description: 'Desbloqueou 12+ conquistas' },
  { id: 'mestre', title: '🏆 Mestre', requirement: 10, color: 'bg-gradient-to-r from-yellow-600 to-yellow-500', description: 'Desbloqueou 10+ conquistas' },
  { id: 'nobre', title: '👑 Nobre', requirement: 8, color: 'bg-gradient-to-r from-purple-500 to-purple-700', description: 'Desbloqueou 8+ conquistas' },
  { id: 'veterano', title: '⭐ Veterano', requirement: 6, color: 'bg-gradient-to-r from-green-500 to-green-700', description: 'Desbloqueou 6+ conquistas' },
  { id: 'onipotente', title: '🧠 Onipotente', requirement: 5, color: 'bg-gradient-to-r from-pink-500 to-red-500', description: 'Desbloqueou 5+ conquistas' },
  { id: 'expert', title: '🚀 Expert', requirement: 4, color: 'bg-gradient-to-r from-blue-500 to-blue-700', description: 'Desbloqueou 4+ conquistas' },
  { id: 'cranio', title: '💀 Crânio', requirement: 3, color: 'bg-gradient-to-r from-gray-600 to-gray-800', description: 'Desbloqueou 3+ conquistas' },
  { id: 'sabido', title: '🤓 Sabido', requirement: 2, color: 'bg-gradient-to-r from-green-400 to-blue-500', description: 'Desbloqueou 2+ conquistas' },
  { id: 'noob', title: '🐣 Noob', requirement: 1, color: 'bg-gradient-to-r from-yellow-300 to-orange-400', description: 'Desbloqueou sua primeira conquista' },
  { id: 'iniciante', title: '👶 Iniciante', requirement: 0, color: 'bg-gray-200 text-gray-700', description: 'Bem-vindo ao sistema!' }
];

export const getUserTitle = (achievements: any[], selectedTitleId?: string, isOwnProfile: boolean = false): { title: string; color: string } => {
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const allTitles = getAllTitles();
  const earnedTitles = allTitles.filter(titleInfo => unlockedCount >= titleInfo.requirement);
  
  // Se o usuário selecionou um título e ele ainda é válido (conquistado), usar o selecionado
  if (selectedTitleId && isOwnProfile) {
    const selectedTitle = earnedTitles.find(t => t.id === selectedTitleId);
    if (selectedTitle) {
      return { title: selectedTitle.title, color: selectedTitle.color };
    }
  }
  
  // Caso contrário, usar o título mais alto conquistado
  for (const titleInfo of allTitles) {
    if (unlockedCount >= titleInfo.requirement) {
      return { title: titleInfo.title, color: titleInfo.color };
    }
  }
  
  return { title: '👶 Iniciante', color: 'bg-gray-200 text-gray-700' };
};

export const calculateEarnedTitles = (achievements: any[]): TitleInfo[] => {
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const allTitles = getAllTitles();
  
  return allTitles.filter(titleInfo => unlockedCount >= titleInfo.requirement);
};