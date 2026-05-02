import React from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  UserPlus, 
  Edit3, 
  ArrowRight, 
  Phone, 
  Camera, 
  Calendar, 
  CheckCircle, 
  FileText,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { useActivities } from '@/hooks/useActivities';
import type { ActivityType } from '@/types';

interface TabTimelineProps {
  opportunityId: string;
}

const activityIcons: Record<ActivityType, React.ElementType> = {
  CREATED: UserPlus,
  UPDATED: Edit3,
  STAGE_CHANGED: ArrowRight,
  CONTACT_ADDED: Phone,
  PHOTO_UPLOADED: Camera,
  VISIT_SCHEDULED: Calendar,
  VISIT_COMPLETED: CheckCircle,
  NOTE_ADDED: MessageSquare,
  NEGOTIATION: FileText,
  CONVERTED: CheckCircle,
  LOST: AlertCircle,
};

const activityLabels: Record<ActivityType, string> = {
  CREATED: 'Oportunidade criada',
  UPDATED: 'Dados atualizados',
  STAGE_CHANGED: 'Fase alterada',
  CONTACT_ADDED: 'Contato adicionado',
  PHOTO_UPLOADED: 'Foto adicionada',
  VISIT_SCHEDULED: 'Visita agendada',
  VISIT_COMPLETED: 'Visita concluída',
  NOTE_ADDED: 'Nota adicionada',
  NEGOTIATION: 'Negociação',
  CONVERTED: 'Convertido em negócio',
  LOST: 'Oportunidade perdida',
};

const activityColors: Record<ActivityType, string> = {
  CREATED: 'bg-primary-100 text-primary-600',
  UPDATED: 'bg-gray-100 text-gray-600',
  STAGE_CHANGED: 'bg-blue-100 text-blue-600',
  CONTACT_ADDED: 'bg-green-100 text-green-600',
  PHOTO_UPLOADED: 'bg-purple-100 text-purple-600',
  VISIT_SCHEDULED: 'bg-yellow-100 text-yellow-600',
  VISIT_COMPLETED: 'bg-success-100 text-success-600',
  NOTE_ADDED: 'bg-indigo-100 text-indigo-600',
  NEGOTIATION: 'bg-orange-100 text-orange-600',
  CONVERTED: 'bg-success-100 text-success-600',
  LOST: 'bg-danger-100 text-danger-600',
};

export const TabTimeline: React.FC<TabTimelineProps> = ({ opportunityId }) => {
  const { data: activities, isLoading } = useActivities({ opportunityId });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Histórico de Atividades</h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-6">
          {activities?.map((activity) => {
            const Icon = activityIcons[activity.type];
            return (
              <div key={activity.id} className="relative flex gap-4">
                {/* Icon */}
                <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${activityColors[activity.type]}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {activityLabels[activity.type]}
                      </p>
                      <p className="text-gray-600 mt-1">{activity.description}</p>
                      
                      {activity.oldStage && activity.newStage && (
                        <p className="text-sm text-gray-500 mt-2">
                          De <span className="font-medium">{activity.oldStage}</span> para{' '}
                          <span className="font-medium">{activity.newStage}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {format(parseISO(activity.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                      {activity.user && (
                        <p className="text-xs text-gray-400 mt-1">
                          por {activity.user.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {activities?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Nenhuma atividade registrada
        </div>
      )}
    </div>
  );
};
