export interface StatusOption {
  value: string;
  label: string;
  description: string;
  iconName: string;
  iconColor: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'cps',
    label: 'Étudiant au CPS',
    description: 'Actuellement en préparation au CPS de Dakar',
    iconName: 'MapPin',
    iconColor: 'text-blue-500'
  },
  {
    value: 'esigelec',
    label: 'Étudiant à l\'ESIGELEC',
    description: 'Actuellement étudiant à l\'ESIGELEC en France',
    iconName: 'GraduationCap',
    iconColor: 'text-green-500'
  },
  {
    value: 'alumni',
    label: 'Alumni',
    description: 'Ancien étudiant de l\'ESIGELEC',
    iconName: 'User',
    iconColor: 'text-purple-500'
  },
  {
    value: 'other',
    label: 'Autre',
    description: 'Autre statut',
    iconName: 'User',
    iconColor: 'text-gray-500'
  }
];

export const getStatusLabel = (status: string | undefined): string => {
  if (!status) return 'Non défini';
  const option = STATUS_OPTIONS.find(opt => opt.value === status);
  return option ? option.label : 'Non défini';
};
