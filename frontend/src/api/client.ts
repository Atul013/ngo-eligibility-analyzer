import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export interface Beneficiary {
  id: number
  applicant_name: string
  age: number
  family_income: number
  family_members: number
  employment_status: string
  education_level: string
  disability_status: string
  eligibility_status: string
  created_at: string | null
}

export interface BeneficiaryCreate {
  applicant_name: string
  age: number
  family_income: number
  family_members: number
  employment_status: string
  education_level: string
  disability_status: string
  eligibility_status: string
}

export interface PredictRequest {
  age: number
  family_income: number
  family_members: number
  employment_status: string
  education_level: string
  disability_status: string
  algorithm: 'decision_tree' | 'random_forest'
}

export interface PredictResponse {
  prediction: string
  confidence: number
  algorithm_used: string
}

export interface TrainResult {
  algorithm?: string
  accuracy: number
  precision: number
  recall: number
  confusion_matrix: number[][]
  class_distribution: Record<string, number>
  train_samples: number
  test_samples: number
  classification_report: Record<string, unknown>
  decision_tree?: TrainResult
  random_forest?: TrainResult
  best_model?: string
}

export interface Analytics {
  total_applicants: number
  eligible_count: number
  not_eligible_count: number
  average_income: number
  average_age: number
  average_family_members: number
  employment_breakdown: Record<string, number>
  education_breakdown: Record<string, number>
  disability_breakdown: Record<string, number>
}

// Beneficiaries
export const getBeneficiaries = (params?: { search?: string; eligibility?: string; skip?: number; limit?: number }) =>
  api.get<Beneficiary[]>('/beneficiaries', { params }).then(r => r.data)

export const getBeneficiary = (id: number) =>
  api.get<Beneficiary>(`/beneficiaries/${id}`).then(r => r.data)

export const createBeneficiary = (data: BeneficiaryCreate) =>
  api.post<Beneficiary>('/beneficiaries', data).then(r => r.data)

export const updateBeneficiary = (id: number, data: Partial<BeneficiaryCreate>) =>
  api.put<Beneficiary>(`/beneficiaries/${id}`, data).then(r => r.data)

export const deleteBeneficiary = (id: number) =>
  api.delete(`/beneficiaries/${id}`)

// ML
export const trainModel = (algorithm: 'decision_tree' | 'random_forest' | 'both') =>
  api.post<TrainResult>('/train', { algorithm }).then(r => r.data)

export const predictEligibility = (data: PredictRequest) =>
  api.post<PredictResponse>('/predict', data).then(r => r.data)

export const compareModels = () =>
  api.get<Record<string, { trained: boolean }>>('/models/compare').then(r => r.data)

// Analytics
export const getAnalytics = () =>
  api.get<Analytics>('/analytics').then(r => r.data)

export const getIncomeDistribution = () =>
  api.get<Record<string, Record<string, number>>>('/analytics/income-distribution').then(r => r.data)

export const getEducationDistribution = () =>
  api.get<Record<string, Record<string, number>>>('/analytics/education-distribution').then(r => r.data)

// Upload
export const uploadCSV = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
}

export const EMPLOYMENT_STATUSES = ['Unemployed', 'Part-time', 'Self-employed', 'Employed']
export const EDUCATION_LEVELS = ['No Formal Education', 'Primary', 'Secondary', 'Undergraduate', 'Postgraduate']
export const DISABILITY_VALUES = ['Yes', 'No']
export const ELIGIBILITY_VALUES = ['Eligible', 'Not Eligible']
