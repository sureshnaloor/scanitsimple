export type NonUserCategory = 'Visitor' | 'Rental Employee' | 'Client' | 'Contractor' | 'Other';

export interface NonUser {
  _id?: string;
  fullName: string;
  nationalId?: string;
  serialNumber?: string;
  passportNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  category?: NonUserCategory | string;
  active?: 'Y' | 'N';
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface NonUserFormData {
  fullName: string;
  nationalId: string;
  serialNumber: string;
  passportNumber: string;
  address: string;
  phone: string;
  email: string;
  category: NonUserCategory | string;
  active: 'Y' | 'N';
}
