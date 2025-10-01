import React, { useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { useAuthStore } from './auth-store';
import { useTheme } from './theme-context';
import { SystemAPI } from '../utils/supabase/client';
import { SystemStatus } from './system-status';
import { SeasonWinnersModal } from './season-winners-modal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { 
  User, 
  Edit3, 
  Trophy, 
  Calendar,
  Trash2,
  Crown,
  ArrowLeft,
  Timer,
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
  Award,
  Gift,
  Smile,
  Angry,
  Lightbulb,
  BookOpen,
  Music,
  Gamepad2,
  Infinity,
  Moon,
  Sun
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { calculateAchievements, getUserTitle, calculateEarnedTitles, getAllTitles } from './achievements-definitions';

interface ProfileProps {
  section?: string;
  targetUser?: string | null;
  onBackToOwnProfile?: () => void;
  onNavigateToProfile?: (username: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ section = 'profile', targetUser, onBackToOwnProfile, onNavigateToProfile }) => {
  const { user: currentUser, logout } = useAuth();
  const { getLeaderboard, pointRecords } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState(section);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(currentUser);
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<any | null>(null);
  const [seasonModalOpen, setSeasonModalOpen] = useState(false);

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




  // Load selected title from localStorage
  useEffect(() => {
    if (isOwnProfile && user?.id) {
      const savedTitleId = localStorage.getItem(`selectedTitle_${user.id}`);
      setSelectedTitleId(savedTitleId);
    }
  }, [isOwnProfile, user?.id]);

  // Save selected title to localStorage
  const handleTitleSelect = (titleId: string) => {
    if (isOwnProfile && user?.id) {
      setSelectedTitleId(titleId);
      localStorage.setItem(`selectedTitle_${user.id}`, titleId);
      toast.success('Título selecionado com sucesso!');
    }
  };

  // Calculate achievements using unified definitions
  const getUserAchievements = () => {
    if (!user?.id || !pointRecords) return [];

    const userRecords = pointRecords.filter(record => record?.userId === user.id);
    const totalPoints = user?.points || 0;
    const leaderboard = getLeaderboard() || [];
    const userRank = leaderboard.findIndex(u => u?.id === user.id) + 1;

    return calculateAchievements(userRecords, totalPoints, userRank);
  };

  // Load seasons data
  useEffect(() => {
    const loadSeasonsData = async () => {
      try {
        const [finishedSeasonsResponse, currentSeasonResponse, userSeasonsResponse] = await Promise.all([
          SystemAPI.getFinishedSeasons(),
          SystemAPI.getCurrentSeason(),
          user?.username ? SystemAPI.getSeasonHistory(user.username) : Promise.resolve({ success: true, seasons: [] })
        ]);

        const allSeasons = [];

        // Add current season
        if (currentSeasonResponse.success && currentSeasonResponse.season) {
          const currentRank = getLeaderboard()?.findIndex(u => u?.username === user?.username) + 1 || 0;
          allSeasons.push({
            id: `current-${currentSeasonResponse.season.number}`,
            number: currentSeasonResponse.season.number,
            year: currentSeasonResponse.season.year,
            name: currentSeasonResponse.season.title || `Temporada ${currentSeasonResponse.season.number} ${currentSeasonResponse.season.year}`,
            period: `${new Date(currentSeasonResponse.season.startDate).toLocaleDateString('pt-BR')} - Atual`,
            points: user?.points || 0,
            rank: currentRank,
            status: 'atual',
            startDate: currentSeasonResponse.season.startDate,
            isFinished: false
          });
        }

        // Add finished seasons with user data
        if (finishedSeasonsResponse.success && finishedSeasonsResponse.seasons) {
          for (const finishedSeason of finishedSeasonsResponse.seasons) {
            // Find user's data for this season
            const userSeasonData = userSeasonsResponse.success 
              ? userSeasonsResponse.seasons.find((s: any) => s.season === finishedSeason.number && s.year === finishedSeason.year)
              : null;

            allSeasons.push({
              id: `finished-${finishedSeason.number}-${finishedSeason.year}`,
              number: finishedSeason.number,
              year: finishedSeason.year,
              name: finishedSeason.title || `Temporada ${finishedSeason.number} ${finishedSeason.year}`,
              period: `${new Date(finishedSeason.startDate).toLocaleDateString('pt-BR')} - ${new Date(finishedSeason.endDate).toLocaleDateString('pt-BR')}`,
              points: userSeasonData?.points || 0,
              rank: userSeasonData?.rank || 0,
              status: 'finalizada',
              startDate: finishedSeason.startDate,
              endDate: finishedSeason.endDate,
              isFinished: true,
              seasonData: finishedSeason // Include full season data for modal
            });
          }
        }

        // Sort seasons by number (most recent first)
        allSeasons.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.number - a.number;
        });

        setSeasons(allSeasons);
      } catch (error) {
        console.error('Erro ao carregar temporadas:', error);
        // Fallback to current season only
        const currentYear = new Date().getFullYear();
        setSeasons([
          {
            id: 'fallback-1',
            number: 1,
            year: currentYear,
            name: `Temporada ${currentYear}`,
            period: `Jan - Dez ${currentYear}`,
            points: user?.points || 0,
            rank: getLeaderboard()?.findIndex(u => u?.username === user?.username) + 1 || 0,
            status: 'atual',
            isFinished: false
          }
        ]);
      }
    };

    if (user?.username) {
      loadSeasonsData();
    }
  }, [user?.username, isOwnProfile, targetUser]);

  // Handle season click
  const handleSeasonClick = async (season: any) => {
    if (season.isFinished && season.seasonData) {
      setSelectedSeason(season.seasonData);
      setSeasonModalOpen(true);
    }
  };

  const achievements = getUserAchievements();
  const userTitle = getUserTitle(achievements, selectedTitleId, isOwnProfile);
  const earnedTitles = calculateEarnedTitles(achievements);

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
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-lg">{user?.username?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{user?.username || 'Usuário'}</CardTitle>
                    <div className="my-2">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-white font-medium text-sm shadow-lg title-badge badge-glow ${userTitle.color}`}>
                        <span className="drop-shadow-sm">{userTitle.title}</span>
                      </div>
                    </div>
                    <CardDescription className="text-sm">
                      {user?.createdAt ? `Usuário desde ${new Date(user.createdAt).toLocaleDateString('pt-BR')}` : 'Novo usuário'}
                    </CardDescription>
                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 mt-3">
                      <Badge className="text-xs w-fit">{user?.points || 0} pontos</Badge>
                      <Badge variant="outline" className="text-xs w-fit">#{getLeaderboard()?.findIndex(u => u?.username === user?.username) + 1 || '?'} no ranking</Badge>
                      <Badge variant="secondary" className="text-xs w-fit">
                        {achievements.filter(a => a.unlocked).length}/{achievements.length} conquistas
                      </Badge>
                    </div>
                  </div>
                </div>
                {isOwnProfile && (
                  <Button
                    variant="outline"
                    onClick={() => setEditingProfile(!editingProfile)}
                    className="w-full sm:w-auto sm:self-start"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    {editingProfile ? 'Cancelar Edição' : 'Editar Perfil'}
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

          {/* Seção de Títulos Conquistados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Títulos Conquistados
              </CardTitle>
              <CardDescription>
                {isOwnProfile ? 'Clique em um título para selecioná-lo como seu título principal' : `Todos os títulos que ${user?.username} desbloqueou`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {earnedTitles.map((titleInfo) => (
                  <div
                    key={titleInfo.id}
                    onClick={() => isOwnProfile && handleTitleSelect(titleInfo.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 title-badge ${
                      isOwnProfile ? 'cursor-pointer hover:scale-102 hover:shadow-xl' : ''
                    } ${titleInfo.color} text-white shadow-lg ${
                      selectedTitleId === titleInfo.id ? 'ring-2 ring-white/50 scale-105 badge-glow' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{titleInfo.title}</h4>
                        <p className="text-sm opacity-90">{titleInfo.description}</p>
                        {isOwnProfile && (
                          <div className="mt-2 text-xs opacity-75">
                            {selectedTitleId === titleInfo.id ? '✓ Título ativo' : 'Clique para selecionar'}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        {selectedTitleId === titleInfo.id && isOwnProfile && (
                          <Badge className="bg-white/20 text-white border-white/20 text-xs">
                            Selecionado
                          </Badge>
                        )}
                        {!selectedTitleId && titleInfo.title === userTitle.title && (
                          <Badge className="bg-white/20 text-white border-white/20 text-xs">
                            Atual
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {earnedTitles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Crown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum título conquistado ainda.</p>
                  <p className="text-sm">Complete conquistas para desbloquear títulos!</p>
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
                {seasons.length > 0 ? (
                  seasons.map((season) => (
                    <div 
                      key={season.id} 
                      className={`p-4 rounded-lg border transition-all duration-200 ${
                        season.isFinished 
                          ? 'cursor-pointer hover:bg-muted/50 hover:border-primary/30 hover:shadow-md' 
                          : ''
                      }`}
                      onClick={() => handleSeasonClick(season)}
                      title={season.isFinished ? 'Clique para ver os vencedores desta temporada' : ''}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{season.name}</h4>
                            {season.isFinished && (
                              <Trophy className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{season.period}</p>
                        </div>
                        <div className="text-right mr-4">
                          <p className="font-medium">{season.points} pontos</p>
                          <p className="text-sm text-muted-foreground">
                            Rank #{season.rank > 0 ? season.rank : '-'}
                          </p>
                        </div>
                        <Badge variant={season.status === 'atual' ? 'default' : 'secondary'}>
                          {season.status}
                        </Badge>
                      </div>
                      {season.isFinished && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          💡 Clique para ver os vencedores
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Carregando temporadas...</p>
                  </div>
                )}
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
                  <h4>Aparência</h4>
                  <p className="text-sm text-muted-foreground mb-4">Escolha entre tema claro ou escuro</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {theme === 'light' ? (
                        <Sun className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <Moon className="h-5 w-5 text-blue-500" />
                      )}
                      <div>
                        <p>{theme === 'light' ? 'Modo Claro' : 'Modo Escuro'}</p>
                        <p className="text-sm text-muted-foreground">
                          {theme === 'light' ? 'Interface clara e minimalista' : 'Interface escura para os olhos'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={theme === 'dark'}
                      onCheckedChange={toggleTheme}
                      aria-label="Alternar modo escuro"
                    />
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

      {/* Season Winners Modal */}
      <SeasonWinnersModal
        season={selectedSeason}
        isOpen={seasonModalOpen}
        onClose={() => setSeasonModalOpen(false)}
        onNavigateToProfile={(username) => {
          setSeasonModalOpen(false);
          onNavigateToProfile?.(username);
        }}
      />
    </div>
  );
};