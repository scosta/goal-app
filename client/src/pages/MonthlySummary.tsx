import { useState } from 'react';
import { useYearlySummary, useMonthlyData } from '../api/summary';

export default function MonthlySummary() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());

  // Note: API currently filters by userId, so without auth we'll see test-user's summaries
  // Once auth is implemented, this will work automatically
  const { data: yearlySummary, isLoading: isLoadingSummary, isError: isErrorSummary, error: summaryError } = 
    useYearlySummary({ year: selectedYear });
  const { isLoading: isLoadingMonthly, isError: isErrorMonthly, error: monthlyError } = 
    useMonthlyData(selectedYear);

  const isLoading = isLoadingSummary || isLoadingMonthly;
  const isError = isErrorSummary || isErrorMonthly;
  const error = summaryError || monthlyError;

  if (isLoading) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px' }}>
        <h2>Monthly Summary</h2>
        <p>Loading summary data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px' }}>
        <h2>Monthly Summary</h2>
        <p style={{ color: 'red' }}>
          Error loading summary: {error?.message || 'Unknown error'}
        </p>
      </div>
    );
  }

  const overallStats = yearlySummary?.overallStats;
  const monthlyProgress = yearlySummary?.monthlyData || [];

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Monthly Summary</h2>
        <div>
          <label htmlFor="year-select" style={{ marginRight: '8px', fontSize: '14px' }}>
            Year:
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
          >
            {Array.from({ length: 5 }, (_, i) => currentYear - i).map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {overallStats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          marginBottom: '32px' 
        }}>
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Minutes Spent</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>
              {overallStats.totalMinutesSpent.toLocaleString()}
            </div>
          </div>
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Average Success Rate</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
              {overallStats.averageSuccessRate.toFixed(1)}%
            </div>
          </div>
          {overallStats.bestMonth && overallStats.bestMonth.month && (
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#f8f9fa',
            }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Best Month</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
                {new Date(overallStats.bestMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                {overallStats.bestMonth.successRate?.toFixed(1) || '0.0'}% success
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <h3>Monthly Breakdown</h3>
      </div>

      {monthlyProgress.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          border: '1px dashed #ccc', 
          borderRadius: '4px',
          color: '#666'
        }}>
          <p>No progress data available for {selectedYear}.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {monthlyProgress.map((month) => (
            <div
              key={month.month}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                    {new Date(month.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h4>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#555' }}>
                    <span>
                      <strong>Success Rate:</strong> {month.successRate.toFixed(1)}%
                    </span>
                    <span>
                      <strong>Minutes Spent:</strong> {month.totalMinutesSpent.toLocaleString()}
                    </span>
                    <span>
                      <strong>Goals Tracked:</strong> {month.goalsTracked}
                    </span>
                  </div>
                </div>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: month.successRate >= 80 ? '#28a745' : month.successRate >= 50 ? '#ffc107' : '#dc3545',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '14px',
                }}>
                  {month.successRate.toFixed(0)}%
                </div>
              </div>
              {month.bestPerformingGoal && (
                <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '14px' }}>
                  <strong>Best Goal:</strong> {month.bestPerformingGoal.goalTitle} 
                  {' '}({month.bestPerformingGoal.successRate?.toFixed(1) || '0.0'}% success)
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


