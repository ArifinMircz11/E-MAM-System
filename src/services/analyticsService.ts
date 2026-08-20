import axios from 'axios';

export interface ClassPerformanceData {
  className: string;
  percentage: number;
  totalRecords: number;
}

export const getClassPerformance = async (
  startDate?: string,
  endDate?: string,
): Promise<ClassPerformanceData[]> => {
  try {
    const response = await axios.get('/api/analytics/class-performance', {
      params: { startDate, endDate },
    });

    if (response.data.success) {
      return response.data.data;
    }
    return [];
  } catch (error: any) {
    console.error('Error fetching class performance:', error);
    return [];
  }
};
