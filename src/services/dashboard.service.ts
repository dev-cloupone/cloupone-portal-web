import { api } from './api';
import type { DashboardData, ManagerDashboardData, ConsultantDashboardData } from '../types/dashboard.types';

export async function getDashboard(): Promise<DashboardData> {
  return api<DashboardData>('/users/dashboard');
}

export async function getManagerDashboard(): Promise<ManagerDashboardData> {
  return api<ManagerDashboardData>('/dashboard/manager');
}

export async function getConsultantDashboard(): Promise<ConsultantDashboardData> {
  return api<ConsultantDashboardData>('/dashboard/consultant');
}
