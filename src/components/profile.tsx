import React, { useState } from 'react';
import { useAuth } from './auth-context';
import { useAuthStore } from './auth-store';
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
  Users, 
  Trophy, 
  Calendar,
  Trash2,
  UserPlus,
  Crown,
  Target,
  Medal
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';



interface ProfileProps {
  section?: string;
}

export const Profile: React.FC<ProfileProps> = ({ section = 'profile' }) => {
  const { user, logout } = useAuth();
  const { pointRecords, getLeaderboard } = useAuthStore();
  const [activeTab, setActiveTab] = useState(section);

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
        description: 'Registre seu primeiro ponto',
        icon: Target,
        condition: () => userRecords.length > 0
      },
      {
        id: '2',
        name: 'Sequência de 5',
        description: 'Registre pontos por 5 dias consecutivos',
        icon: Crown,
        condition: () => {
          // Verificar se há registros em 5 dias consecutivos
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
          
          return maxConsecutive >= 5;
        }
      },
      {
        id: '3',
        name: 'Top 3',
        description: 'Fique entre os 3 primeiros no leaderboard',
        icon: Medal,
        condition: () => userRank > 0 && userRank <= 3
      },
      {
        id: '4',
        name: '100 Pontos',
        description: 'Acumule 100 pontos totais',
        icon: Trophy,
        condition: () => totalPoints >= 100
      },
      {
        id: '5',
        name: 'Mentor',
        description: 'Ajude 10 colegas (registre "Ajudar um colega" 10 vezes)',
        icon: Users,
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
        icon: Crown,
        condition: () => totalPoints >= 500
      },
    ];

    return achievementDefinitions.map(achievement => {
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
  };

  // Get other real users as "friends" (users in the same system)
  const getFriends = () => {
    const allUsers = getLeaderboard() || [];
    return allUsers
      .filter(u => u?.id !== user?.id) // Exclude current user
      .map(u => ({
        id: u?.id || '',
        name: u?.username || 'Usuário',
        points: u?.points || 0,
        status: 'offline', // No real online status
        mutualFriends: 0 // No mutual friends concept
      }));
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

  const achievements = calculateAchievements();
  const friends = getFriends();
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

  return (
    <div className="space-y-6">
      <div>
        <h1>Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie seu perfil e configurações da conta
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="hidden md:grid w-full grid-cols-6">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="friends">Amizades</TabsTrigger>
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
          <TabsTrigger value="seasons">Temporadas</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="delete" className="text-destructive">Excluir</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-lg">{user?.username?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle>{user?.username || 'Usuário'}</CardTitle>
                  <CardDescription>
                    {user?.createdAt ? `Usuário desde ${new Date(user.createdAt).toLocaleDateString('pt-BR')}` : 'Novo usuário'}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge>{user?.points || 0} pontos</Badge>
                    <Badge variant="outline">Ativo</Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setEditingProfile(!editingProfile)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  {editingProfile ? 'Cancelar' : 'Editar'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {editingProfile ? (
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
                    <p className="text-muted-foreground">{profileData.bio}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4>Pontos Totais</h4>
                      <p className="text-2xl font-bold text-primary">{user?.points}</p>
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

        {/* Friends Tab */}
        <TabsContent value="friends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Amizades
              </CardTitle>
              <CardDescription>
                Conecte-se com outros usuários da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Amigo
                </Button>
                
                <Separator />
                
                <div className="space-y-3">
                  {friends.length > 0 ? (
                    friends.map((friend) => (
                      <div key={friend.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <Avatar>
                          <AvatarFallback>{friend.name.charAt(0)?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{friend.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {friend.points} pontos
                          </p>
                        </div>
                        <Badge variant="secondary">usuário</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum outro usuário registrado ainda.</p>
                      <p className="text-sm">Compartilhe o sistema com seus amigos!</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Conquistas
              </CardTitle>
              <CardDescription>
                Seus marcos e conquistas na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
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

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>
                Personalize sua experiência na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Notificações por email</Label>
                <div className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Receber notificações sobre novos pontos</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Privacidade</Label>
                <div className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Aparecer no leaderboard público</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Tema</Label>
                <select className="w-full p-2 border rounded">
                  <option>Claro</option>
                  <option>Escuro</option>
                  <option>Sistema</option>
                </select>
              </div>
              
              <Button>Salvar Configurações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delete Tab */}
        <TabsContent value="delete" className="space-y-6">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Excluir Conta
              </CardTitle>
              <CardDescription>
                Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-destructive/10 rounded-lg">
                  <h4 className="font-medium text-destructive mb-2">Dados que serão excluídos:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Perfil e informações pessoais</li>
                    <li>• Histórico de pontos e registros</li>
                    <li>• Conquistas e progresso</li>
                    <li>• Lista de amigos</li>
                    <li>• Configurações da conta</li>
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
                        Esta ação não pode ser desfeita. Sua conta e todos os dados associados serão permanentemente excluídos dos nossos servidores.
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
      </Tabs>
    </div>
  );
};