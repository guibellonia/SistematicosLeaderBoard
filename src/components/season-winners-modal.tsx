import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Crown, Medal, Trophy } from 'lucide-react';

interface Season {
  number: number;
  year: number;
  title?: string;
  endDate: string;
  winners: {
    first: { username: string; points: number } | null;
    second: { username: string; points: number } | null;
    third: { username: string; points: number } | null;
    totalParticipants: number;
  };
  totalUsers: number;
}

interface SeasonWinnersModalProps {
  season: Season | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToProfile?: (username: string) => void;
}

export const SeasonWinnersModal: React.FC<SeasonWinnersModalProps> = ({
  season,
  isOpen,
  onClose,
  onNavigateToProfile
}) => {
  if (!season) return null;

  const winners = season.winners;

  const getPodiumHeight = (position: number) => {
    switch (position) {
      case 1: return 'h-24';
      case 2: return 'h-20';
      case 3: return 'h-16';
      default: return 'h-16';
    }
  };

  const getPodiumColor = (position: number) => {
    switch (position) {
      case 1: return 'from-yellow-400 to-yellow-600';
      case 2: return 'from-gray-300 to-gray-500';
      case 3: return 'from-orange-400 to-orange-600';
      default: return 'from-gray-200 to-gray-400';
    }
  };

  const getPodiumIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="h-6 w-6 text-white" />;
      case 2: return <span className="text-white font-bold">2º</span>;
      case 3: return <span className="text-white font-bold">3º</span>;
      default: return null;
    }
  };

  const getAvatarSize = (position: number) => {
    switch (position) {
      case 1: return 'w-14 h-14 -mt-7';
      case 2: return 'w-12 h-12 -mt-6';
      case 3: return 'w-10 h-10 -mt-5';
      default: return 'w-10 h-10 -mt-5';
    }
  };

  const winnersArray = [
    { position: 1, data: winners.first },
    { position: 2, data: winners.second },
    { position: 3, data: winners.third }
  ].filter(w => w.data !== null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            {season.title || `Temporada ${season.number} ${season.year}`}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Finalizada em {new Date(season.endDate).toLocaleDateString('pt-BR')} • {season.totalUsers} participantes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pb-2">
          {/* Pódio Visual */}
          <Card>
            <CardContent className="p-4 md:p-6">
              <h4 className="text-center mb-4 md:mb-6 font-semibold text-sm md:text-base">🏆 Pódio da Temporada</h4>
              
              {winnersArray.length >= 3 ? (
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  {/* 2º Lugar */}
                  <div className="text-center order-1">
                    <div className="relative">
                      <div className={`w-12 md:w-16 h-16 md:h-20 bg-gradient-to-r ${getPodiumColor(2)} rounded-t-lg mx-auto mb-2 flex items-end justify-center pb-2`}>
                        <span className="text-white font-bold text-xs md:text-sm">2º</span>
                      </div>
                      <Avatar className={`w-8 h-8 md:w-12 md:h-12 mx-auto -mt-4 md:-mt-6 border-2 border-background`}>
                        <AvatarFallback className="text-xs md:text-sm">{winners.second?.username?.charAt(0)?.toUpperCase() || '2'}</AvatarFallback>
                      </Avatar>
                    </div>
                    <p className="font-medium mt-2 text-xs md:text-sm truncate px-1">{winners.second?.username || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">{winners.second?.points || 0} pts</p>
                    <Badge className="mt-1 bg-gray-100 text-gray-800 text-xs py-0">2º</Badge>
                  </div>

                  {/* 1º Lugar */}
                  <div className="text-center order-2">
                    <div className="relative">
                      <div className={`w-12 md:w-16 h-20 md:h-24 bg-gradient-to-r ${getPodiumColor(1)} rounded-t-lg mx-auto mb-2 flex items-end justify-center pb-2`}>
                        <Crown className="h-4 w-4 md:h-6 md:w-6 text-white" />
                      </div>
                      <Avatar className={`w-10 h-10 md:w-14 md:h-14 mx-auto -mt-5 md:-mt-7 border-2 border-background`}>
                        <AvatarFallback className="text-xs md:text-sm">{winners.first?.username?.charAt(0)?.toUpperCase() || '1'}</AvatarFallback>
                      </Avatar>
                    </div>
                    <p className="font-medium mt-2 text-xs md:text-sm truncate px-1">{winners.first?.username || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">{winners.first?.points || 0} pts</p>
                    <Badge className="mt-1 bg-yellow-100 text-yellow-800 text-xs py-0">🥇</Badge>
                  </div>

                  {/* 3º Lugar */}
                  <div className="text-center order-3">
                    <div className="relative">
                      <div className={`w-12 md:w-16 h-12 md:h-16 bg-gradient-to-r ${getPodiumColor(3)} rounded-t-lg mx-auto mb-2 flex items-end justify-center pb-2`}>
                        <span className="text-white font-bold text-xs md:text-sm">3º</span>
                      </div>
                      <Avatar className={`w-8 h-8 md:w-10 md:h-10 mx-auto -mt-4 md:-mt-5 border-2 border-background`}>
                        <AvatarFallback className="text-xs md:text-sm">{winners.third?.username?.charAt(0)?.toUpperCase() || '3'}</AvatarFallback>
                      </Avatar>
                    </div>
                    <p className="font-medium mt-2 text-xs md:text-sm truncate px-1">{winners.third?.username || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">{winners.third?.points || 0} pts</p>
                    <Badge className="mt-1 bg-orange-100 text-orange-800 text-xs py-0">3º</Badge>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-end gap-2 md:gap-4">
                  {winnersArray.map((winner) => (
                    <div key={winner.position} className="text-center">
                      <div className="relative">
                        <div className={`w-12 md:w-16 ${getPodiumHeight(winner.position)} bg-gradient-to-r ${getPodiumColor(winner.position)} rounded-t-lg mx-auto mb-2 flex items-end justify-center pb-2`}>
                          {winner.position === 1 ? (
                            <Crown className="h-4 w-4 md:h-6 md:w-6 text-white" />
                          ) : (
                            <span className="text-white font-bold text-xs md:text-sm">{winner.position}º</span>
                          )}
                        </div>
                        <Avatar className={`${winner.position === 1 ? 'w-10 h-10 md:w-14 md:h-14 -mt-5 md:-mt-7' : winner.position === 2 ? 'w-8 h-8 md:w-12 md:h-12 -mt-4 md:-mt-6' : 'w-8 h-8 md:w-10 md:h-10 -mt-4 md:-mt-5'} mx-auto border-2 border-background`}>
                          <AvatarFallback className="text-xs md:text-sm">{winner.data?.username?.charAt(0)?.toUpperCase() || winner.position}</AvatarFallback>
                        </Avatar>
                      </div>
                      <p className="font-medium mt-2 text-xs md:text-sm truncate px-1">{winner.data?.username || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">{winner.data?.points || 0} pts</p>
                      {winner.position === 1 && <Badge className="mt-1 bg-yellow-100 text-yellow-800 text-xs py-0">🥇</Badge>}
                      {winner.position === 2 && <Badge className="mt-1 bg-gray-100 text-gray-800 text-xs py-0">🥈</Badge>}
                      {winner.position === 3 && <Badge className="mt-1 bg-orange-100 text-orange-800 text-xs py-0">🥉</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detalhes dos Vencedores */}
          <Card>
            <CardContent className="p-4 md:p-6">
              <h4 className="mb-3 md:mb-4 font-semibold text-sm md:text-base">📊 Detalhes dos Vencedores</h4>
              <div className="space-y-2 md:space-y-3">
                {winnersArray.map((winner) => (
                  <div
                    key={winner.position}
                    className="flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onNavigateToProfile?.(winner.data?.username || '')}
                  >
                    <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center ${
                      winner.position === 1 ? 'bg-yellow-100 text-yellow-800' :
                      winner.position === 2 ? 'bg-gray-100 text-gray-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      <span className="font-bold text-xs md:text-sm">{winner.position}</span>
                    </div>
                    
                    <Avatar className="w-8 h-8 md:w-10 md:h-10">
                      <AvatarFallback className="text-xs md:text-sm">{winner.data?.username?.charAt(0)?.toUpperCase() || winner.position}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base truncate">{winner.data?.username || 'N/A'}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">{winner.data?.points || 0} pts conquistados</p>
                    </div>
                    
                    <Badge variant="outline" className="text-xs">
                      {winner.position === 1 ? '🥇' : winner.position === 2 ? '🥈' : '🥉'}
                    </Badge>
                  </div>
                ))}
              </div>
              
              {winnersArray.length === 0 && (
                <div className="text-center py-6 md:py-8 text-muted-foreground">
                  <Trophy className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 md:mb-4 opacity-50" />
                  <p className="text-sm md:text-base">Nenhum vencedor registrado para esta temporada.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};